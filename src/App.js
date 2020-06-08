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
const path = require('path'); // Changing the File Streucture and hence need to modify some file strcutre
const {
    isObject
} = require('util');
const app = express(); // We made an instance of the express framework here and will use it to further work with any type of requests.



app.use(bodyParser.urlencoded({
    extended: true // We have integrated the body-parser into the express.
}));
app.set('view engine', 'ejs'); // use ejs as our view engine and access ejs using node. Hence, we have to get the ejs files from views folder.
const publicFilesDir = path.join(__dirname, '../public')
app.use(express.static(publicFilesDir)); // use the static files such as styles.css by mentioning this.

app.use(session({
    secret: process.env.SECRET, // secret stored in a secret file 
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
    hotels: [{
        id: String,
        rooms: Number
    }]
}); // Create a schema for users having username and password, both as strings.

userSchema.plugin(passportLocalMongoose); // Plugin passportLocalMongoose within user scheme to integrate with the collection users

const user = new mongoose.model('User', userSchema); // create a new model named user. To be shifted to another file soon after changing of file system is discussed.



passport.use(user.createStrategy()); // passportLocalMongoose has its defualt strategy to use passport and hence used here.

passport.serializeUser(user.serializeUser()); // When user logs in, passport saves its details here.
passport.deserializeUser(user.deserializeUser()); // When user logs out, passport removes its details and cookies associated with the user

const hotelSchema = mongoose.Schema({
    city: String,
    hotelName: String,
    stars: String,
    contactNumber: String,
    email: String,
    imgURL: String,
    rooms: Number,
    customers: [{
        name: String,
        email: String,
        price: {
            type: Number,
            defualt: 2000
        },
        roomsBooked: {
            type: Number,
            defualt: 1
        }
    }]
});
// The schema for hotels . The data fields should be self-explanatory
const Hotels = new mongoose.model('Hotel', hotelSchema);
// Create a model using the hotelSchema 
app.route('/') // Home route requests
    .get(function (req, res) { // get requests for the home route
        // console.log(req.user.username)
        res.render('index', { // rendering the index file or home file
            loggedIn: req.isAuthenticated(), // if the user is logged in, then logout is shown and vice versa. That is the pupose of this line
            // val : req.isAuthenticated() ? req.user.username : "Nothing" // Testing purpose . req.user._details can be used to get _details field of the user who is logged in
        });
    });


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
app.route("/hotels/:cityName") // route to select hotels filtered by city names
    .get(function (req, res) {
        let city = req.params.cityName; // get the name of city from the express routing parameters
        Hotels.find({
            city: city // find all hotels having city field set to the requested name in the parameters
        }, function (err, docs) {
            res.render('hotels', {
                loggedIn: true,
                hotels: docs
            }) // render the ejs page, for only the filtered out hotels
        });
    })
app.route("/hotels") // routes for hotels all hotels
    .get(function (req, res) {
        Hotels.find({}, function (err, docs) {
            res.render('hotels', {
                hotels: docs,
                loggedIn: true
            }); // get all hotels from the dba dn render it in the hotels ejs file. See the ejs file for more reference
        })
    })
    .post(function (req, res) {
        const newHotel = new Hotels({ // get the informations about the hotel using body-parser .Privilege given only to admins of hotels
            city: req.body.city,
            hotelName: req.body.name,
            stars: req.body.stars,
            contactNumber: req.body.phone,
            email: req.body.email,
            imgURL: req.body.imgURL,
            rooms: parseInt(req.body.rooms)
        });
        newHotel.save(function (err) { // insert the hotel into the hotel collections
            if (err)
                console.log(err);
            else
                res.redirect('/hotels') // redirect to  the hotels page
        });
    });
// Task for whoever is assigned task on this, add the put,patch and delete request features. I've left them empty while working on the frontend
app.route('/hotelAdmin') // Only privilege given to hotel admins. To upload the hotels
    .get(function (req, res) {
        res.render('hotels_admin', {
            loggedIn: true
        });
    })
// One shortcoming, to save space on DB, ive used URL explicitly, anyone assigned this task is requested to come up with a better solution in which the proces occurs backgorund rather than infront of the user. Question of UX.


app.route('/book-hotel')
    .post(function (req, res) {
        if (!req.isAuthenticated())
            res.redirect('/login');
        else {
            // console.log(req.user.username);
            let passId = req.body.id;
            res.redirect('/checkout/' + passId);

            // res.redirect('/hotels');
        }

    });

app.route('/checkout/:passId') // Checkout page based on id of the hotel
    .get(function (req, res) { // Gets the checkout route

        let id = ObjectId(req.params.passId);
        // let foundHotel = null;
        Hotels.findById(id, function (err, docs) { // Searches the hotel.
            if (err)
                console.log(err);
            else {
                res.render('checkout', {
                    name: docs.hotelName,
                    city: docs.city,
                    id: docs.id,
                    loggedIn: req.isAuthenticated()
                })
            }
        })

    });


app.route('/confirm-book')
    .post(function (req, res) {
        const id = ObjectId(req.body.id);
        Hotels.findById(id, function (err, docs) {
            if (err)
                console.log(err);
            else if (docs.rooms < req.body.numRooms) {
                res.redirect('/hotels');
            } else {

                const presentCustomers = docs.customers.filter(item => item.email === req.user.username);
                if (presentCustomers.length > 0) {
                    console.log('No');
                } else {
                    docs.rooms -= req.body.numRooms;
                    docs.customers.push({
                        email: req.user.username,
                        roomsBooked: req.body.numRooms
                    });

                    docs.save();
                    req.user.hotels.push({
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

app.post('/cancel-hotel', function (req, res) {
    const ide = ObjectId(req.body.id);
    Hotels.findById(ide, function (err, docs) {
        // console.log(ide)
        {
            if (req.isAuthenticated() ) {
                if(!req.user.hotels.length >0)
                    return res.redirect('/hotels');
                let rooms = req.user.hotels[0].rooms;
                req.user.hotels = [] // because we can add only one hotel per user
                // console.log(docs.rooms);
                req.user.save();
                // console.log(req.user.hotels);
                docs.rooms += rooms;
                docs.customers = docs.customers.filter((customer) => {
                    return customer.email !== req.user.username
                });
                docs.save();
                res.redirect('/');
            } else
                return res.redirect('/login');
        }
    })
})




const blogSchema = mongoose.Schema({
    title: String,
    content: String,
    author: String
});
const blogs = mongoose.model('Blog', blogSchema);
app.route('/blogs')
    .post(function (req, res) {
        const title = req.body.title;
        const content = req.body.content;
        const author = req.body.author;
        const newBlog = new blogs({
            title: title,
            content: content,
            author: author
        });
        newBlog.save();
        res.redirect('/blogs')
    })
    .get(function (req, res) {
        blogs.find({}, function (err, docs) {
            res.render('blog-page', {
                loggedIn: req.isAuthenticated(),
                articles: docs
            });
        })
    })
app.get('/blogs/:title', function (req, res) {
    blogs.findOne({
        title: req.params.title
    }, function (error, docs) {
        if (error)
            return res.send('Error occured');

        if (docs) {
            return res.render('indi-blog', {
                title: docs.title,
                content: docs.content,
                author: docs.author
            })
        }
        res.send('Could not find the blog')
    })
})
app.get('/add-blog', function (req, res) {
    if (!req.isAuthenticated())
        return res.redirect('/login');
    res.render('blog-addition-page');
})




app.get("*", function (req, res) {
    res.render('404-page', {
        loggedIn: req.isAuthenticated()
    });
})

let port = 3000;
app.listen(port, function () {
    console.log("Server Listening to port 3000");
});