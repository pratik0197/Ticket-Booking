require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');

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
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const user = new mongoose.model('User', userSchema);


passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

const hotelSchema = mongoose.Schema({
    city: String,
    hotelName: String,
    stars: String,
    contactNumber: String,
    email: String,
    imgURL: String
});

const Hotels = new mongoose.model('Hotel', hotelSchema);

app.route('/')
    .get(function (req, res) {
        // console.log(req.user.username)
        res.render('index', {
            loggedIn: req.isAuthenticated(),
            // val : req.isAuthenticated() ? req.user.username : "Nothing"
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
                res.redirect('/signup');
                // alert('UIs')
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/');
                });
            }
        });
    });
app.route("/hotels/:cityName")
    .get(function (req, res) {
        let city = req.params.cityName;
        Hotels.find({
            city
        }, function (err, docs) {
            res.send(docs);
        });
    })
app.route("/hotels")
    .get(function (req, res) {
        Hotels.find({}, function (err, docs) {
            res.render('hotels',{hotels:docs,loggedIn:true});
        })
    })
    .post(function (req, res) {
        const newHotel = new Hotels({
            city: req.body.city,
            hotelName: req.body.name,
            stars: req.body.stars,
            contactNumber: req.body.phone,
            email: req.body.email,
            imgURL: req.body.imgURL
        });
        newHotel.save(function (err) {
            if (err)
                console.log(err);
            else
                res.redirect('/hotels')
        });
    });

app.route('/hotelAdmin')
    .get(function (req, res) {
        res.render('hotels_admin', {
            loggedIn: true
        });
    })
    .delete(function (req, res) {})
let port = 3000;
app.listen(port, function () {
    console.log("Server Listening to port 3000");
});