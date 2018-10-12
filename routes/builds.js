const express = require('express');
const mongoose = require('mongoose');
const uiRouter = express.Router();
const apiRouter = express.Router();

// Load Build model
require('../models/Build');
require('../models/BuildResult');

const Build = mongoose.model('builds');
const BuildResult = mongoose.model('buildResults');

// Routes for web UI
uiRouter.get('/', (req, res) => {
  Build.find()
    .sort({name:'desc'})
    .then(builds => {
      res.render('builds/index', {
        builds: builds
      });
    });
});

uiRouter.get('/:id', (req, res) => {
  BuildResult.find({ build: req.params.id })
  .populate('build').then(buildResults => {
    res.render('builds/show', {
      results: buildResults
    });
  }).catch(err => { res.send("No results found")});
})


// Routes for API
apiRouter.post('/', (req, res) => {
  const newBuild = { name: req.body.name };

  // Create Build
  new Build(newBuild)
    .save()
    .then(story => {
      res.send(story);
    });
});

apiRouter.post('/:id/result', (req, res) => {
  Build.findOne({
    _id: req.params.id
  }).then(build => {
    const newBuildResult = {
      passed: req.body.passed,
      time: req.body.time,
      build: build._id,
      jenkinsLink: req.body.jenkinsLink
    }

    new BuildResult(newBuildResult)
      .save()
      .then(result => {
        res.send(result)
      })
  })
})

module.exports = {
  ui: uiRouter,
  api: apiRouter
}