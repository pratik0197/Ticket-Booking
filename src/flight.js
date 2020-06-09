require('dotenv').config(); // contains secure details about hash and salt to secure the password . Do not touch this, if you want your DB to be consistent.
const express = require('express'); // Includes Express, backend web framework to  be used with Node.js
const bodyParser = require('body-parser'); // library to parse details in the forms
const ejs = require('ejs'); // embedded javascript to write javascript inside HTML to make it more robust and help in reusing a single piece of HTML code in  multiple files
const mongoose = require('mongoose'); // A medium for operating on our mongodb database using Node.js
const passport = require('passport'); // An authentication and cookies library which helps in making passwords secure and hashed, adding salting.
const passportLocal = require('passport-local'); // Used internally by passport. No explicit calls made in code yet
const session = require('express-session'); // Saves user login session until logged out.
const passportLocalMongoose = require('passport-local-mongoose'); // used to combine mongoose and passport to automatically save users into the Database.
const ObjectId = require('mongodb').ObjectID; // Required to convert string into an objectId
const path = require('path') // Changing the File Streucture and hence need to modify some file strcutre
const app = express(); // We made an instance of the express framework here and will use it to further work with any type of requests.

//----------------------------Line 14 to line 57 I've tried to do it the same way as in app.js. If some error, debug it.------------------------------ 

app.use(bodyParser.urlencoded({
    extended: true // We have integrated the body-parser into the express.
}));
app.set('view engine', 'ejs'); // use ejs as our view engine and access ejs using node. Hence, we have to get the ejs files from views folder.
const publicFilesDir = path.join(__dirname, '../public')
app.use(express.static(publicFilesDir)); // use the static files such as styles.css by mentioning this.

app.use(session({
    secret: "SOUMYASHREE", // secret stored in a secret file 
    resave: false,
    saveUninitialized: false
})); // Save the user session when logged in . This is integrated with the express framework now as well

app.use(passport.initialize()); // Initialise the passport library which does the function mentioned in the comment near the require statement of passport

app.use(passport.session()); // The main session starts here. Integrate Passport And Express session

mongoose.connect("mongodb://localhost:27017/TBS", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});
// Connect mongoose to the localhost mongodb database. (While Development Phase). Change once produced.
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    flights: [{
        id: String,
        tickets: Number
    }]
}); // Create a schema for users having username and password, both as strings.

userSchema.plugin(passportLocalMongoose); // Plugin passportLocalMongoose within user scheme to integrate with the collection users

const user = new mongoose.model('User', userSchema); // create a new model named user. To be shifted to another file soon after changing of file system is discussed.



passport.use(user.createStrategy()); // passportLocalMongoose has its defualt strategy to use passport and hence used here.

passport.serializeUser(user.serializeUser()); // When user logs in, passport saves its details here.
passport.deserializeUser(user.deserializeUser()); // When user logs out, passport removes its details and cookies associated with the user

const flightSchema = mongoose.Schema({
    flightId: String,
    airlines: String,
    start: String,
    destination: String,
    seats: Number,
    customers: [{
        name: String,
        email: String,
        price: {
            type: Number,
            defualt: 2000
        },
        seatsBooked: {
            type: Number,
            defualt: 1
        },
        from: {
            type: String,
            default: None
        },
        to: {
            type: String,
            default: None
        },
        date: {
            type: Date,
            default: Date.now() + 2*24*60*60*1000,
        }
    }]
});
// The schema for flights.
const Filghts = new mongoose.model('Flight', flightSchema);
// Create a model using the flightSchema 
app.route('/') // Home route requests
    .get(function (req, res) { // get requests for the home route
        // console.log(req.user.username)
        res.render('index', { // rendering the index file or home file
            loggedIn: req.isAuthenticated(), // if the user is logged in, then logout is shown and vice versa. That is the pupose of this line
            // val : req.isAuthenticated() ? req.user.username : "Nothing" // Testing purpose . req.user._details can be used to get _details field of the user who is logged in
        });
    });

//---------------------Login, logout, signup, signin, confirm and cancel booking done like in app.js but the ejs files are left to be done.--------------------------------

app.route('/login') // login route requests handled here.
    .get(function (req, res) { // get requests for the login route.
        res.render('login'); // Renders the login page to the browsers
    }).post(function (req, res) { // post requests to the login route.
        let toBeLoggedInUser = new user({ // get details from the user typed data using body parser
            username: req.body.username,
            password: req.body.password
        });
        req.login(toBeLoggedInUser, function (err) { /// Use login method of passport and see the validity of the credentials
            if (err) {
                console.log(err); // let the server admin about potential errors
                res.redirect('/login'); // If any errors are there, tell errors to developer, redirect user to login page again.
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/'); // If no problem , then redirect to home route . To choose among different options on the page
                });
            }
        })
    });

app.route("/logout") // logout route. Handled in  ./views/login page by manipulating parameters
    .get(function (req, res) {
        req.logout(function (err) { // When the request to logout comes, log the user out of the page. Passport handles this
            console.log(err); // If any errors encountered, inform the developer about the error
        });
        res.redirect('/'); // redirect the user to home page and log him out of the page.
    });

app.route('/signup')
    .get(function (req, res) { // Get the signup route
        res.render('signup'); // render the signup page.
    })
    .post(function (req, res) {
        user.register({ // passport takes care of registering the user and adds him to the DB.`
            username: req.body.username // gets the username of the user.
        }, req.body.password, function (err, newUser) { // encrypts the password
            if (err) {
                res.redirect('/signup'); // If any error encountered, redirect and request user to again signup
                // alert('UIs')
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/'); // If he's authenticated successfully, redirect to home route and save his login session
                });
            }
        });
    });

// Route to get hotels sorted by particular city
app.route("/flights/:Destination") // route to select hotels filtered by city names
    .get(function (req, res) {
        let city = req.params.Destination; // get the name of city from the express routing parameters
        Flights.find({
            city: city // find all hotels having city field set to the requested name in the parameters
        }, function (err, docs) {
            res.render('flights', {
                loggedIn: true,
                flights: docs
            }) // render the ejs page, for only the filtered out hotels
        });
    })
app.route("/flights") // routes for flights
    .get(function (req, res) {
        Flights.find({}, function (err, docs) {
            res.render('flights', {
                flights: docs,
                loggedIn: true
            }); // get all flights from the db and render it in the hotels ejs file. See the ejs file for more reference
        })
    })
    .post(function (req, res) {
        const newFlight = new Flights({ // get the informations about the hotel using body-parser .Privilege given only to admins of hotels
            flightId: req.body.flightId,
            airlines: req.body.airlines
        });
        newFlight.save(function (err) { // insert the hotel into the hotel collections
            if (err)
                console.log(err);
            else
                res.redirect('/flights') // redirect to  the hotels page
        });
    });

app.route('/flightAdmin') // Flight admins to upload flight details
    .get(function (req, res) {
        res.render('flights_admin', {
            loggedIn: true
        });
    })

app.route('/book-flight')  // For booking flights...
    .post(function (req, res) {
        if (!req.isAuthenticated())
            res.redirect('/login');
        else {
            let passId = req.body.id;
            res.redirect('/checkout/' + passId);
        }

    });

app.route('/confirm-book')
    .post(function (req, res) {
        const id = ObjectId(req.body.id);
        Flights.findById(id, function (err, docs) {
            if (err)
                console.log(err);
            else if (docs.seats < req.body.numSeats) {
                res.redirect('/flights');
            } else {

                const presentCustomers = docs.customers.filter(item => item.email === req.user.username);
                if (presentCustomers.length > 0) {
                    console.log('Not allowed');
                } else {
                    docs.seats -= req.body.numSeats;
                    docs.customers.push({
                        email: req.user.username,
                        seatsBooked: req.body.numSeats
                    });

                    docs.save();
                    req.user.flights.push({
                        id: id,
                        rooms: req.body.numRooms
                    });
                    req.user.save();
                    // console.log(user);
                }
                res.redirect('/');
            }
        })
    });

app.post('/cancel-flight', function (req, res) {
    const ide = ObjectId(req.body.id);
    Flights.findById(ide, function (err, docs) {
        {
            if (req.isAuthenticated()) { // if user is not authenticated he cannot cancel
                if (!req.user.flights.length > 0)
                    return res.redirect('/flights');
                let seats = 0;

                req.user.flights = req.user.flights.filter((flight) => {
                    if (flight.id === ide.toString())
                        rooms = hotel.rooms;
                    return flight.id !== ide.toString();
                })
                req.user.save(); // remove the number of seats and the flight details from user's info

                docs.seats += seats; // add up the rooms previously booked by the user
                docs.customers = docs.customers.filter((customer) => {
                    return customer.email !== req.user.username // filter out the users
                });
                docs.save();
                res.redirect('/flights');
            } else
                return res.redirect('/login');
        }
    })
})