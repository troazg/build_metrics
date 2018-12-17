const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  isAdmin:{
    type: Boolean,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err)

    bcrypt.hash(user.password, salt, function (err, hash) {
      if(err) return next(err);

      user.password = hash;
      next();
    });
  });
});

mongoose.model('users', UserSchema);
