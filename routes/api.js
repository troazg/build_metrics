const express = require('express');
const buildsRouter = require('./builds')
const apiRouter = express.Router();

apiRouter.use('/builds', buildsRouter.api)

module.exports = apiRouter;