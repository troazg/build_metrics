const express = require('express');
const mongoose = require('mongoose');
const uiRouter = express.Router({ mergeParams: true });
const apiRouter = express.Router({ mergeParams: true });

// Load Build model
require('../models/Test');
require('../models/TestResult');
require('../models/Build');

const Test = mongoose.model('tests');
const TestResult = mongoose.model('testResults');
const Build = mongoose.model('builds');

// Routes for web UI
uiRouter.get('/', (req, res) => {
  res.redirect(`/builds/${req.params.buildId}`)
});

uiRouter.get('/:testId', (req, res) => {
  TestResult.find({ test: req.params.testId })
  .populate('test').then(testResults => {
    res.render('tests/show', {
      results: testResults,
      results_data: encodeURIComponent(JSON.stringify(testResults))
    });
  }).catch(err => { res.send("No results found")});
})

// Routes for API
apiRouter.get('/', (req, res) => {
  Test.find({ build: req.params.buildId })
  .populate('build').then(tests => {
    res.send(tests);
  }).catch(err => { res.send("No results found")});
})

apiRouter.post('/result', (req, res) => {
  Test.findOne({
    build: req.params.buildId,
    rspecID: req.body.rspecID
  }).populate('build')
  .then(test => {
    if (test) {
      const newTestResult = {
        result: req.body.result,
        runtime: req.body.runtime,
        test: test._id,
        timestamp: req.body.timestamp,
        exceptions: req.body.exceptions
      };

      new TestResult(newTestResult)
        .save()
        .then(result => {
          res.send(result)
        });
    } else {
      Build.findOne({
        _id: req.params.buildId
      }).then(build => {
        const newTest = {
          rspecID: req.body.rspecID,
          description: req.body.description,
          path: req.body.path,
          build: build._id
        };

        new Test(newTest)
        .save()
        .then(test => {
          const newTestResult = {
            result: req.body.result,
            runtime: req.body.runtime,
            test: test._id,
            timestamp: req.body.timestamp,
            exceptions: req.body.exceptions
          };

          new TestResult(newTestResult)
          .save()
          .then(result => {
            res.send(result)
          });
        });
      });
    }
  })
})

module.exports = {
  ui: uiRouter,
  api: apiRouter
}