if(process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./helpers/ExpressError');
const path = require('path');
const methodOverride = require('method-override');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');

//require routes
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const reflectionRoutes = require('./routes/reflections');

mongoose.connect('mongodb://localhost:27017/book-comment3', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "Connection error:"));
db.once('open', () => {
  console.log('Database connected');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
mongoose.set('useFindAndModify', false);

app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const sessionConfig = {
  secret: 'thisissecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 *24 * 7,
    maxAge: 1000 * 60 * 60 *24 * 7
  }
}
app.use(session(sessionConfig));
app.use(flash());

//configuring passport.
app.use(passport.initialize());
//using session for persistent login.
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.use('/', userRoutes);
app.use('/books', bookRoutes);
app.use('/books/:id/reflections', reflectionRoutes);

app.get('/', (req, res) => {
  res.render('home/home');
});

//if the search does not matches any of the above, run this error.//

app.all('*', (req, res, next) => {
  next(new ExpressError('Page not found!', 404))
})

app.use((err, req, res, next) => {
  const {statusCode= 500} = err;
  if(!err.message) err.message= "Something went wrong"
  res.status(statusCode).render('error', {err});
})

app.listen(8080, () => {
  console.log('listening on port 8080!');
})
