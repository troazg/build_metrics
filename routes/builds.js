const express = require('express');
const mongoose = require('mongoose');
const testsRouter = require('./tests')
const path = require('path');
const uiRouter = express.Router();
const apiRouter = express.Router();

// Load Build model
require('../models/Build');
require('../models/BuildResult');
require('../models/Test');

const Build = mongoose.model('builds');
const BuildResult = mongoose.model('buildResults');
const Test = mongoose.model('tests');

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

uiRouter.get('/:buildId', (req, res) => {

  getResults = BuildResult.find({ build: req.params.buildId })
  .sort('-timestamp')
  .limit(200)
  .populate('build').then(buildResults => {
    return buildResults;
  }).catch(err => { return 'err' });

  getTests = Test.find({
    build: req.params.buildId
  }).populate('build').then(tests => {
    return tests;
  }).catch(err => { return 'err' });

  Promise.all([getResults, getTests]).then((data) => {
    res.render('builds/show', {
      results: encodeURIComponent(JSON.stringify(data[0])),
      tests: data[1],
      base_url: req.originalUrl,
      build_name: data[0][0].build.name
    })
  })
})


// Routes for API
apiRouter.post('/', (req, res) => {
  const newBuild = { name: req.body.name };

  // Create Build
  new Build(newBuild)
    .save()
    .then(build => {
      res.send(build);
    });
});

apiRouter.post('/:buildId/result', (req, res) => {
  Build.findOne({
    _id: req.params.buildId
  }).then(build => {
    const newBuildResult = {
      passed: req.body.passed,
      time: req.body.time,
      build: build._id,
      link: req.body.link
    }

    new BuildResult(newBuildResult)
      .save()
      .then(result => {
        res.send(result)
      }).catch(err => {res.send(err)})
  }).catch(err => {res.send(err)})
})

apiRouter.use('/:buildId/tests', testsRouter.api)
uiRouter.use('/:buildId/tests', testsRouter.ui)

module.exports = {
  ui: uiRouter,
  api: apiRouter
}