const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { adminOnly, ensureGuest } = require('../helpers/auth');

// Load User model
require('../models/User');
const User = mongoose.model('users');

// /users/logout
router.get('/logout', (req, res) => {
 req.logout();
 req.flash('success_msg', 'You have been logged out.');
 res.redirect('/users/login');
});

// /users/login
router.get('/login', ensureGuest, (req, res) => {
  res.render('users/login');
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })
);


// /users/register
router.get('/register', adminOnly, (req, res) => {
  res.render('users/register');
});

router.post('/register', adminOnly, (req, res) => {

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

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) throw err;
            newUser.password = hash;
            newUser.save()
            .then(user => {
              res.redirect('/');
            })
            .catch(err => {
              console.log(err);
              return;
            })
          })
        });
      }
    });
  }
});

module.exports = router;