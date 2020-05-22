require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const {
    response
} = require('express');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/TBS", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

const userSchema = new mongoose.Schema({
    username :String,
    password : String
});

userSchema.plugin(passportLocalMongoose);

const user = new mongoose.model('User', userSchema);


passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.route('/')
    .get(function (req, res) {
        res.render('index', {
            loggedIn: req.isAuthenticated()
        });
    });


app.route('/login')
    .get(function (req, res) {
        res.render('login');
    }).post(function (req, res) {
        let toBeLoggedInUser = new user({
            username: req.body.username,
            password: req.body.password
        });
        req.login(toBeLoggedInUser, function (err) {
            if (err) {
                console.log(err);
                res.redirect('/login');
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/');
                });
            }
        })
    });

app.route("/logout")
    .get(function (req, res) {
        req.logout(function (err) {
            console.log(err);
        });
        res.redirect("/");
    });

app.route('/signup')
    .get(function (req, res) {
        res.render('signup');
    })
    .post(function (req, res) {
        user.register({
            username: req.body.username
        }, req.body.password, function (err, newUser) {
            if (err) {
                console.log(err);
                res.redirect('/signup');
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/');
                });
            }
        });
    });

let port = 3000;
app.listen(port, function () {
    console.log("Server Listening to port 3000");
});