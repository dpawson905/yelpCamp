var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

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
   isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);