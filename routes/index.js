var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require("multer");
var request = require("request");

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./public/uploads/userImg");
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
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
      console.log(req.body);
      req.flash("error", "Please select captcha");
      return res.redirect("/register");
    }
    // secret key
    var secretKey = process.env.CAPTCHA;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req
      .connection.remoteAddress}`;
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
      // if not successful
      if (body.success !== undefined && !body.success) {
        req.flash("error", "Captcha Failed");
        return res.redirect("/register");
      }

      var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        bio: req.body.bio,
        loggedIn: false
      });
      newUser.avatar = "/uploads/userImg/no-image.png";
      
      if (req.body.adminCode === process.env.ADMINCODE) {
        newUser.isAdmin = true;
      }

      User.register(newUser, req.body.password, function(err, user) {
        if (err) {
          console.log(err.message);
          return res.render("register", { error: err.message });
        }
        passport.authenticate("local")(req, res, function() {
          req.flash("success", "Welcome to Let's Camp " + user.username);
          res.redirect("/campgrounds");
        });
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
        successReturnToOrRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res) {
});

// logout logic
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged You Out");
    res.redirect("/campgrounds");
    User.loggedIn = false;
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

router.get("/admin", middleware.isAdmin, function(req, res) {
    User.find({}).populate('campgrounds').exec(function(err, foundUsers){
        if(err || !foundUsers){
            req.flash("error", "Something went wrong");
            res.redirect("/campgrounds");
        } else {
            res.render("acp", {users: foundUsers});
       }
   });
});

module.exports = router;