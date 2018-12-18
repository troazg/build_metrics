const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = mongoose.model('users');
const Build = mongoose.model('builds');
const G2FA = mongoose.model('G2FA');
const bcrypt = require('bcryptjs');

const SECRET = require('./keys').jwtSecret;

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = SECRET;

module.exports = function(passport) {

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
    }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email
      }).then(user => {
        if(!user){
          return done(null, false, {message: 'Invalid username or password'});
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if(err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: 'Invalid username or password'});
          }
        })
      })
    }));

  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    Build.findById( jwt_payload.build_id, (err, build) => {
      if (err)
        return done(err, false);
      if (build) {
        return done(null, build);
      } else {
        return done(null, false);
      }
    });
  }));

  passport.use(new TotpStrategy((user, done) => {
    G2FA.findOne({'username': user.username}, (err, user) => {
      if (err) {
        return done(err)
      }
      return done(null, user.secret, 30)
    })
  }))


  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
  })
}