require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose  = require('passport-local-mongoose');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret : process.env.SECRET,
    resave:false, 
    saveUninitialized:false
}));

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/TBS", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    pwd: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose);

const user = new mongoose.model('User', userSchema);

passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());



let isLoggedIn = false;
app.route('/')
    .get(function (req, res) {
        res.render('index', {
            loggedIn: isLoggedIn
        });
    });


app.route('/login')
    .get(function (req, res) {
        res.render('login');
    }).post(function (req, res) {
        let name = req.body.email;
        let password = req.body.password;

        user.findOne({
            name: name
        }, function (err, foundUser) {
            if (err)
                console.log('error');
            else {
                if (foundUser) {
                    if (foundUser.pwd === password) {
                        isLoggedIn = true;
                        res.redirect('/');
                    } else
                        res.send('invalid credentials');
                } else
                    res.send('user not found');
            }
        });
    });
let port = 3000;
app.listen(port, function () {
    console.log("Server Listening to port 3000");
});