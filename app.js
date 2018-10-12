const express = require('express');
const mongoose = require('mongoose');
const keys = require('./config/keys');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jwt-simple');
const handlebars = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const { ensureAuthenticated } = require('./helpers/auth');

const app = express();

// Load routes
const apiRouter = require('./routes/api')
const usersRouter = require('./routes/users');
const buildsRouter = require('./routes/builds');

// Load models
require('./models/User');

// Bring in Passport
require('./config/passport')(passport);

// Mongoose Middleware
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useNewUrlParser: true })
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Handlebars Helpers
const {
  truncate,
  formatDate,
  select
} = require('./helpers/handlebars');

// Handlebars middleware
app.engine('handlebars', handlebars({
  helpers: {
    truncate: truncate,
    formatDate:formatDate,
    select:select
  },
  defaultLayout:'main'
}));
app.set('view engine', 'handlebars');

app.use(flash());

app.use(session({
  secret: keys.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


// Set global vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  if(req.user) {
    res.locals.admin = req.user.isAdmin || false;
  }
  next();
});

app.get('/', (req, res) => {
  res.redirect('/builds');
});

// Use routes
// app.use('/api', passport.authenticate('bearer', { session: false }));
app.use('/api', apiRouter);
app.use('/users', usersRouter);
app.use('/builds', ensureAuthenticated)
app.use('/builds', buildsRouter.ui);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})