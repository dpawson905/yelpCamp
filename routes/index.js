var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");


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
        
    if(req.body.adminCode === process.env.ADMINCODE) {
        
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Let's Camp " + user.username);
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

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'darrells.webdesign@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'darrells.webdesign@gmail.com',
        subject: "Let's Password Reset",
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user || err) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user || err) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'darrells.webdesign@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'darrells.webdesign@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
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

// Edit Route
router.get("/users/:id/edit", function(req, res) {
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
router.put("/users/:id", function(req, res) {
  var newData = {
    firstName: req.body.user.firstName,
    lastName: req.body.user.lastName,
    email: req.body.user.email,
    avatar: req.body.user.avatar,
    bio: req.body.user.bio
    };
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

// contact form
router.get("/contact", function(req, res) {
   res.render("contact");
});

router.post("/contact/send", function(req, res) {
    var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'darrells.webdesign@gmail.com',
          pass: process.env.GMAILPW1
        }
    });
     
    var mailOptions = {
        from: 'Darrell Pawson <darrells.webdesign@gmail.com',
        to: 'darrells.webdesign@gmail.com',
        subject: 'Website Submission',
        text: 'You have a submission with the following details... Name: '+ req.body.name + ' Phone: ' + req.body.phone + ' Email: ' + req.body.email + ' Message: ' + req.body.message,
        html: '<p>You have a submission with the following details...</p><ul><li>Name: ' + req.body.name + ' </li><li>Phone: ' + req.body.phone + ' </li><li>Email: ' + req.body.email + ' </li><li>Message: ' + req.body.message + ' </li></ul>'
    };
    
    smtpTransport.sendMail(mailOptions, function(err, info){
      if(err) {
        req.flash("error", "Something went wrong");
        console.log(err);
        res.redirect("/contact");
      } else {
        req.flash("success", "Your email has been sent, we will respond within 24 hours.");
        console.log("Message sent " + info.response);
        res.redirect("/campgrounds");
        
      }
    });
    
});

module.exports = router;