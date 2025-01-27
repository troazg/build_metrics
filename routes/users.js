const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const base32 = require('thirty-two');
const keys = require('../config/keys');
const router = express.Router();
const { adminOnly, ensureGuest, ensureAuthenticated, ensure2fa } = require('../helpers/auth');

// Load User model
require('../models/User');
require('../models/G2FA');
const User = mongoose.model('users');
const G2FA = mongoose.model('G2FA');

// /users/logout
router.get('/logout', (req, res) => {
 req.logout();
 req.session.secondFactor = undefined;
 req.flash('success_msg', 'You have been logged out.');
 res.redirect('/users/login');
});

// /users/login
router.get('/login', ensureGuest, (req, res) => {
  res.render('users/login');
});

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
  }), (req, res) => {
    G2FA.findOne({'username': req.user.username}).then(token => {
      if (token)
        res.redirect('/users/2faCheck')
      else
        res.redirect('/users/setup2fa')
    })
  }
);


// /users/register
router.get('/register', adminOnly, ensure2fa, (req, res) => {
  res.render('users/register');
});

router.post('/register', adminOnly, ensure2fa, (req, res) => {

  let errors = [];

  if(req.body.isAdmin){
    isAdmin = true;
  } else {
    isAdmin = false;
  }

  if (req.body.password != req.body.password2) {
    errors.push({ text: 'Passwords do not match' });
  }

  if (errors.length > 0) {
    res.render('users/register', {
      errors: errors,
      username: req.body.username,
      email: req.body.email
    })
  } else {
    User.findOne({ email: req.body.email })
    .then(user => {
      if(user) {
        errors.push( {text: 'Email already in use'} );
        res.render('users/register', {
          errors: errors
        });
      } else {
        const newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          isAdmin: isAdmin
        });

        newUser.save()
        .then(user => {
          res.redirect('/');
        })
        .catch(err => {
          console.log(err);
          return;
        });
      }
    });
  }
});

router.get('/forgot', (req, res) => {
  res.render('users/forgot', {
    user: req.user
  });
})

router.post('/forgot', (req, res, next) => {
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
          return res.redirect('/users/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var options = {
        auth: {
          api_user: keys.sendGridUsername,
          api_key: keys.sendGridPassword
        }
      }

      var client = nodemailer.createTransport(sgTransport(options));

      var email = {
        to: user.email,
        from: 'passwordreset@build-metrics-web.herokuapp.com',
        subject: 'Build Metrics Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      }

      client.sendMail(email, function(err, info) {
        if (err)
          console.log(err)
        else {
          req.flash('success_msg', 'An email has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        }

      })
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
  .then(user => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired');
      return res.redirect('/users/forgot');
    }
    res.render('users/reset', {
      user: req.user
    })
  })
})

router.post('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
  .then(user => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      res.redirect('back');
    } else {
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      user.save(err => {
        req.logIn(user, err => {
          if (err) console.log(err)
        });
        res.redirect('/')
      })
    }
  })
});

router.get('/2faCheck', ensureAuthenticated, (req, res) => {
  res.render('users/check2fa')
})

router.get('/setup2FA', ensureAuthenticated, (req,res) => {
  req.session.secondFactor = 'skip';
  res.render('users/setup2fa');
});

router.get('/setupG2FA', ensureAuthenticated, (req,res) => {
  G2FA.findOne({'username': req.user.username}, (err,user) => {
    if (err) {
      res.status(400).send(err);
    } else {
      var secret;
      if (user !== null) {
        secret = user.secret;
      } else {
        //generate random key
        secret = crypto.randomBytes(16);
        var newToken = new G2FA({username: req.user.username, secret: secret});
        newToken.save(function(err,tok){

        });
      }
      var encodedKey = base32.encode(secret);
      var otpUrl = 'otpauth://totp/2FADemo:' + req.user.username + '?secret=' + encodedKey + '&period=30&issuer=2FADemo';
      var qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);
      res.send(qrImage);
    }
  });
});

router.post('/loginG2FA', ensureAuthenticated, passport.authenticate('totp'), function(req, res){
  req.session.secondFactor = 'g2fa';
  res.send();
});

module.exports = router;