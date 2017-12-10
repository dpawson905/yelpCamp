var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");
var multer = require("multer");

var storage =   multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, './public/uploads/userImg');
  },
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var upload = multer({ storage : storage}).single('avatar');

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
  upload(req, res, function(err) {
    if(err){
      console.log(err.message);
      req.flash("error", err.message);
      return res.redirect("/register");
    }
    var newUser = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      bio: req.body.bio
    });
    
    if(typeof req.file !== "undefined") {
      newUser.avatar = '/uploads/userImg/' + req.file.filename;
    } else {
      newUser.avatar = '/uploads/userImg/no-image.png';
    }
    console.log(newUser);
    if(req.body.adminCode === process.env.ADMINCODE) {
      newUser.isAdmin = true;
    }
    
    if(req.body.answer !== process.env.SECRET){
      req.flash("error", "answer the question");
      return res.redirect("back");
    } else {
      User.register(newUser, req.body.password, function(err, user){
        if(err){
          console.log(err.message);
          return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
          req.flash("success", "Welcome to Let's Camp " + user.username);
          res.redirect("/campgrounds"); 
        }); 
      });
    }
  });
});


// Login Form Route
router.get("/login", function(req, res) {
   res.render("login", {page: "login"}); 
});

// handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successReturnToOrRedirect: "/campgrounds",
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

router.get("/users/:id", middleware.checkProfileOwnership, function(req, res) {
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

// Edit Route
router.get("/users/:id/edit", middleware.checkProfileOwnership, function(req, res) {
   User.findById(req.params.id, function(err, foundUser) {
     if(err || !foundUser) {
       req.flash("error", "That user doesnt exist");
       res.redirect("back");
     } else {
       res.render("users/edit", {user: foundUser});
     }
   }); 
});

// update ROUTE
router.put("/users/:id", middleware.checkProfileOwnership, function(req, res) {
  upload(req, res, function(err) {
    if(err){
      req.flash("error", err.message);
      return res.redirect("back");
    } 
  var newData = {
    firstName: req.body.user.firstName,
    lastName: req.body.user.lastName,
    email: req.body.user.email,
    bio: req.body.user.bio
    };
    if(req.body.user.removeImage) {
            newData.avatar = "/uploads/userImg/no-image.png";
        } else if(req.file) {
             newData.avatar = '/uploads/userImg/' + req.file.filename;
        }
        console.log(newData);
    User.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, user){
      if(err || !user) {
        req.flash("error", "Invalid User");
        res.redirect("back");
      } else {
        req.flash("success", "Profile updated");
        res.redirect("/users/" + user._id);
      }
    });
  });
});


module.exports = router;