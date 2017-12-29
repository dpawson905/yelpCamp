var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    cookieParser   = require("cookie-parser"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    User           = require("./models/user"),
    helmet         = require("helmet"),
    session        = require("express-session");
    //seedDB         = require("./seeds");

// config dotenv
require("dotenv").load();

// Requiring routes    
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    authRoutes       = require("./routes/index"),
    contactRoutes    = require("./routes/contact"),
    forgotRoutes     = require("./routes/forgot"),
    adminRoutes      = require("./routes/admin"),
    userRoutes       = require("./routes/user");


var url = process.env.DATABASEURL || "mongodb://localhost/new_db";
// "mongodb://localhost/lets_camp"
mongoose.connect(url, {useMongoClient: true});

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());

// use this to remove .ejs from res.render()
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(cookieParser());
app.locals.moment = require('moment');
// seedDB(); // seed the database for testing purposes.

// Passport config
app.use(session({
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
app.use("/contact", contactRoutes);
app.use(forgotRoutes);
app.use(adminRoutes);
app.use(userRoutes);

// this is required for the server to init
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("YelpCamp has started!");
});