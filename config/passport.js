const LocalStrategy = require('passport-local').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = mongoose.model('users');
const Build = mongoose.model('builds');
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

  // passport.use(
  //   new BearerStrategy((token, done) => {
  //     try {
  //       const { email } = jwt.decode(token, SECRET);

  //       User.findOne({
  //         email: email
  //       }).then(user => {
  //         if (user) {
  //           done(null, user)
  //         } else {
  //           done(null, false)
  //         }
  //       })
  //     } catch (err) {
  //       done(null, false);
  //     }
  //   })
  // );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
  })
}