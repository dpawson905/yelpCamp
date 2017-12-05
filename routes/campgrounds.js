var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
// var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'campcloud', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});




// this sets access to /campgrounds
router.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                res.redirect("back");
            } else {
                if(allCampgrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again.";
                } 
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
            } 
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
            } 
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    //Local Variables 
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image ? req.body.image : "/images/temp.png";
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var price = req.body.cost;
    //Location Code - Geocode Package
    geocoder.geocode(req.body.location, function (err,data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        //Zarko Maslaric And Ian SchHelped Impliment the Image Upload 
        cloudinary.uploader.upload(req.file.path, function(result) {
            
            // add cloudinary url for the image to the campground object under image property
            
            //image variable needs to be here so the image can be stored and uploaded to cloudinary
            image = result.secure_url;
            //Captures All Objects And Stores Them
            var newCampground = {name: name, image: image, description: desc, author:author, cost: cost, location: location, lat: lat, lng: lng};
            // Create a new campground and save to DB by using the create method
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    //Logs Error
                    req.flash('error', err.message);
                    return res.redirect('back');
                } else {
                    //redirect back to campgrounds page
                    //Logs Error
                    console.log(newlyCreated);
                    //Redirects Back To Featured Campgrounds Page
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});



// this is the form page for adding a new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new"); 
});

// SHOW - show more info about one campground
router.get("/:id", function(req, res) {
    // find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        } else {
            // render show template to that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err,foundCampground){
        if(err){
            res.redirect("back");
        } else {
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});
   

// UPDATE CAMPGROUND ROUTE

router.put("/:id",  middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.campground.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.campground.name, image: req.body.campground.image, description: req.body.campground.description, cost: req.body.campground.cost, location: location, lat: lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership,  function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;