var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("../models/user");
const Campground = require('./campground');
const Comment = require('./comment');

var UserSchema = new mongoose.Schema({
  username: {
    type: String, 
    unique: true, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 10,
  },
   
  avatar: String,
   
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 15
  },
   
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 15
  },
   
  email: {type: String, unique: true, required: true},
  bio: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: { type: Boolean, default: false },
   
  campgrounds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campground"
    }
  ]
});

// pre-hook middleware to delete all user's posts and comments from db when user is deleted
UserSchema.pre('remove', async function(next) {
  try {
      await Campground.remove({ 'author.id': this._id });
      await Comment.remove({ 'author.id': this._id });
      next();
  } catch (err) {
      console.log(err);
  }
});



UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);