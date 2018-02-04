var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var request = require("request");

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
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;
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


//handling login logic
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campgrounds';
      delete req.session.redirectTo;
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

// logout logic
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged You Out");
    res.redirect("/campgrounds");
    User.loggedIn = false;
});

module.exports = router;