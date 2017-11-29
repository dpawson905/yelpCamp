var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");


// root Route
router.get("/", function(req, res){
    res.render("landing");
});


// show register form
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

// handle signup logic
router.post("/register", function(req, res) {
    var newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: req.body.avatar,
            bio: req.body.bio
        });
        
    if(req.body.adminCode === "hodor") {
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds"); 
        }); 
    });
});

// Login Form Route
router.get("/login", function(req, res) {
   res.render("login", {page: "login"}); 
});

// handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res) {
});

// logout logic
router.get("/logout", function(req, res) {
   req.logout();
   req.flash("success", "Logged You Out");
   res.redirect("/campgrounds");
});

// User profiles

router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser){
       if(err || !foundUser){
           req.flash("error", "Something went wrong");
           res.redirect("/campgrounds");
       } else {
           Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
              if(err || !foundUser){
                req.flash("error", "Something went wrong");
                res.redirect("/campgrounds"); 
              }
               res.render("users/show", {user: foundUser, campgrounds: campgrounds});
           });
       }
   });
});

module.exports = router;