var express = require("express");
var router = express.Router();
var User = require("../models/user");
var middleware = require("../middleware");

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

// update USER to ADMIN
router.put("/user/:id", middleware.isAdmin, function(req, res) {
   if(req.body.makeAdmin) {
            User.isAdmin = true;
        } else {
             User.isAdmin = false;
        }
     User.findByIdAndUpdate(req.params.id, function(err, user){
        if(err || !user) {
            req.flash("error", "Invalid User");
            res.redirect("/admin");
        } else {
            req.flash("success", "User is now admin");
            res.redirect("/admin");
        }
    });
});
    

// DESTROY USER
router.delete("/user/:id", middleware.isAdmin,  function(req, res){
    User.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/admin");
        } else {
            res.redirect("/admin");
        }
    });
});

module.exports = router;