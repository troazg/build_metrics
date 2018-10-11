const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

router.get('/', (req, res) => {
  res.redirect('/dashboard');
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.send("Dashboard");
});

module.exports = router;