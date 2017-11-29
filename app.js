var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    cookieParser   = require("cookie-parser"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    Campground     = require("./models/campground"),
    Comment        = require("./models/comment"),
    User           = require("./models/user"),
    session        = require("express-session"),
    seedDB         = require("./seeds");

// config dotenv
require("dotenv").load();

// Requiring routes    
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    authRoutes       = require("./routes/index");

var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
mongoose.connect(url, {useMongoClient: true});

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({extended: true}));
// use this to remove .ejs from res.render()
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
// seedDB(); // seed the database for testing purposes.

// Passport config
app.use(require("express-session")({
    secret: "I like Ch33s3c@ke F@ct0rY It is the BEst!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", authRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

// this is required for the server to init
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("YelpCamp has started!");
});