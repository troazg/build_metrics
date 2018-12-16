const express = require('express');
const buildsRouter = require('./builds')
const router = express.Router();

router.use('/builds', buildsRouter.api)

module.exports = router;