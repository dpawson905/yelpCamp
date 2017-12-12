var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
   username: {
      type: String, 
      unique: true, 
      required: true,
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 10,
      lowercase: true
   },
   
   avatar: String,
   firstName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 15
   },
   
   lastName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 15
   },
   
   email: {type: String, unique: true, required: true},
   bio: String,
   resetPasswordToken: String,
   resetPasswordExpires: Date,
   isAdmin: { type: Boolean, default: false }
});

// const options = ({
//    attemptsField: 5,
//    limitAttempts: true
   
// });
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);