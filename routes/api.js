const express = require('express');
const buildsRouter = require('./builds')
const passport = require('passport');
const router = express.Router();

router.use('/builds', passport.authenticate('jwt'), buildsRouter.api);

// router.use('/builds',
//   // wrap passport.authenticate call in a middleware function
//   function (req, res, next) {
//     // call passport authentication passing the "local" strategy name and a callback function
//     passport.authenticate('jwt', function (error, build, info) {
//       // this will execute in any case, even if a passport strategy will find an error
//       // log everything to console
//       console.log(error);
//       console.log(build);
//       console.log(info);

//       if (error) {
//         res.status(401).send(error);
//       } else if (!build) {
//         res.status(401).send(info);
//       } else {
//         next();
//       }

//       res.status(401).send(info);
//     })(req, res);
//   },

//   // function to call once successfully authenticated
//   function (req, res) {
//     res.status(200).send('logged in!');
//   });

module.exports = router;