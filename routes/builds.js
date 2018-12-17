const express = require('express');
const mongoose = require('mongoose');
const testsRouter = require('./tests')
const path = require('path');
const { adminOnly } = require('../helpers/auth');
const jwt = require('jwt-simple');
const JWT_SECRET = require('../config/keys').jwtSecret;
const uiRouter = express.Router();
const apiRouter = express.Router();

// Load Build model
require('../models/Build');
require('../models/BuildResult');
require('../models/Test');

const Build = mongoose.model('builds');
const BuildResult = mongoose.model('buildResults');
const Test = mongoose.model('tests');
const TestResult = mongoose.model('testResults');

// Routes for web UI
uiRouter.get('/', (req, res) => {
  Build.find()
    .sort({name:'desc'})
    .then(builds => {
      var build_info = [];

      var gatherInfo = new Promise((resolve, reject) => {
        builds.forEach((b, index, array) => {
        BuildResult.find({
          build: b._id
        }).sort('-timestamp')
          .limit(10)
          .then(buildResults => {
            var run_results = [];
            buildResults.forEach(br => {
              run_results.push(br.passed ? 1 : 0)
            })

            avg = run_results.reduce((p, c) => { return p + c; }) / run_results.length;
            var health;
            if (avg >= 8)
              health = "Good"
            else if (avg >= 5)
              health = "Fair"
            else
              health = "Poor"

            build_info.push({
              build_id: b._id,
              health: health,
              last: buildResults[0].passed
            })
          }).catch(err => {
            build_info.push({
              build_id: b._id,
              health: "None",
              last: "N/A"
            });
          });
          if (index === array.length - 1) resolve();
        })
      });

      gatherInfo.then(() => {
        res.render('builds/index', {
          builds: builds,
          build_info: encodeURIComponent(JSON.stringify(build_info))
        });
      }).catch(e => { console.log(e) })
    });
});

uiRouter.get('/register', adminOnly, (req, res) => {
  res.render('builds/register')
});

uiRouter.post('/register', adminOnly, (req, res) => {
  const newBuild = { name: req.body.name };

  // Create Build
  new Build(newBuild)
    .save()
    .then(build => {
      res.redirect('/');
    });
})

uiRouter.get('/:buildId', (req, res) => {
  var buildName;
  Build.findById(req.params.buildId).then(build => {
    if (build)
      buildName = build.name;
    else
      res.redirect('/builds')
  });
   var now = new Date();
  var payload = {
    build_id: req.params.buildId
  };
  var token = jwt.encode(payload, JWT_SECRET);

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
      build_name: buildName,
      build_id: req.params.buildId,
      token: token
    })
  }).catch(err => { res.render('builds/show', {
    results: null,
    tests: null,
    base_url: req.originalUrl,
    build_name: buildName,
    build_id: req.params.buildId,
    token: token
  }) })
})

uiRouter.delete('/:buildId', adminOnly, (req, res) => {
  BuildResult.deleteMany({ build: req.params.buildId }, err => {
    if (err) console.log(err);
  });

  Test.find({
    build: req.params.buildId
  }).then(tests => {
    tests.forEach(t => {
      TestResult.deleteMany({ test: t._id }, err => {
        if (err) console.log(err);
      })
    })
  })

  Test.deleteMany({ build: req.params.buildId }, err => {
    if (err) console.log(err)
  });

  Build.deleteOne({ _id: req.params.buildId }, err => {
    if (err) console.log(err)
  });

  res.redirect('/')
})


//////////////////////////////////
// Routes for API
//////////////////////////////////
apiRouter.post('/:buildId/result', (req, res) => {
  const newBuildResult = {
    passed: req.body.passed,
    runtime: req.body.runtime,
    build: req.params.buildId
  }

  new BuildResult(newBuildResult)
    .save()
    .then(result => {
      res.send(result)
    }).catch(err => {res.send(err)})
})

apiRouter.use('/:buildId/tests', testsRouter.api)
uiRouter.use('/:buildId/tests', testsRouter.ui)

module.exports = {
  ui: uiRouter,
  api: apiRouter
}