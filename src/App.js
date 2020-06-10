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
const {
    dateDiff
} = require('./dateDiff');
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const app = express(); // We made an instance of the express framework here and will use it to further work with any type of requests.



app.use(bodyParser.urlencoded({
    extended: true // We have integrated the body-parser into the express.
}));
app.set('view engine', 'ejs'); // use ejs as our view engine and access ejs using node. Hence, we have to get the ejs files from views folder.
const publicFilesDir = path.join(__dirname, '../public')
app.use(express.static(publicFilesDir)); // use the static files such as styles.css by mentioning this.
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.use(session({
    secret: process.env.SECRET, // secret stored in a secret file 
    resave: false,
    saveUninitialized: false
})); // Save the user session when logged in . This is integrated with the express framework now as well

app.use(passport.initialize()); // Initialise the passport library which does the function mentioned in the comment near the require statement of passport

app.use(passport.session()); // The main session starts here. Integrate Passport And Express session

mongoose.connect("mongodb+srv://admin-pratik:2zRzRbVAwHKxhbnh@cluster0-0iz6t.mongodb.net/TBS", {
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
        name: String,
        rooms: Number,
        checkIn: String,
        checkOut: String,
        price: Number
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
    price: Number,
    customers: [{
        name: String,
        email: String,
        price: Number,
        roomsBooked: {
            type: Number,
            defualt: 1
        },
        checkIn: String,
        checkOut: String
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

app.get('/bookings', function (req, res) {
    if (!req.isAuthenticated())
        return res.redirect('/login')
    res.render('bookings', {
        loggedIn: req.isAuthenticated(),
        data: req.user.hotels
    })
})

app.post('/searchQuery', function (req, res) {
    if (!req.isAuthenticated())
        return res.redirect('/login');
    const city = req.body.city;
    res.redirect('/hotels/' + city);
})
// Route to get hotels sorted by particular city
app.route("/hotels/:cityName") // route to select hotels filtered by city names
    .get(function (req, res) {
        let city = req.params.cityName; // get the name of city from the express routing parameters
        Hotels.find({
            city: city // find all hotels having city field set to the requested name in the parameters
        }, function (err, docs) {
            res.render('hotels', {
                loggedIn: req.isAuthenticated(),
                hotels: docs
            }) // render the ejs page, for only the filtered out hotels
        });
    })
app.route("/hotels") // routes for hotels all hotels
    .get(function (req, res) {
        Hotels.find({}, function (err, docs) {
            res.render('hotels', {
                hotels: docs,
                loggedIn: req.isAuthenticated()
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
            rooms: parseInt(req.body.rooms),
            price: req.body.price
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
        if (!req.isAuthenticated())
            return res.redirect('/login')
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
            else if (docs.rooms < req.body.numRooms) { // Case when we don't have enough rooms in the hotel which are vacant
                res.redirect('/hotels');
            } else {
                // return res.send(typeof req.body.checkIn);
                const presentCustomers = docs.customers.filter(item => item.email === req.user.username);
                if (presentCustomers.length > 0) {
                    console.log('No'); // We do not let any user book twice at a hotel and hence this line of code
                } else {
                    // Calculate price of the stay based on difference in days. dateDiff implementation in src/dateDiff.js
                    const diff = dateDiff(req.body.checkIn, req.body.checkOut);
                    const calcPrice = docs.price * req.body.numRooms * diff;

                    docs.rooms -= req.body.numRooms; // reduce the number of rooms
                    docs.customers.push({
                        email: req.user.username,
                        roomsBooked: req.body.numRooms,
                        checkIn: req.body.checkIn,
                        checkOut: req.body.checkOut,
                        price: calcPrice
                    });

                    docs.save(); // update the hotel database
                    req.user.hotels.push({
                        id: id,
                        name: docs.hotelName,
                        rooms: req.body.numRooms,
                        checkIn: req.body.checkIn,
                        checkOut: req.body.checkOut,
                        price: calcPrice
                    });
                    req.user.save(); // update the user database
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
            if (req.isAuthenticated()) { // if user is not authenticated he cannot cancel
                if (!req.user.hotels.length > 0)
                    return res.redirect('/hotels');
                let rooms = 0;

                req.user.hotels = req.user.hotels.filter((hotel) => {
                    if (hotel.id === ide.toString())
                        rooms = hotel.rooms;
                    return hotel.id !== ide.toString();
                })
                req.user.save(); // remove the number of rooms and the hotel details from user's info

                docs.rooms += rooms; // add up the rooms previously booked by the user
                docs.customers = docs.customers.filter((customer) => {
                    return customer.email !== req.user.username // filter out the users
                });
                docs.save();
                res.redirect('/hotels');
            } else
                return res.redirect('/login');
        }
    })
})

app.get('/manage-page/:id', function (req, res) {
    const id = ObjectId(req.params.id);
    Hotels.findById(id, function (error, docs) {
        if (error)
            return res.redirect('/')
        if (docs) {
            res.render('manager', {
                loggedIn: true,
                data: docs // show the hotel managing page to the manager or receptionist of the hotel
            })
        } else
            res.redirect('/')
    })
});

app.post('/check-click', function (req, res) { // works when called for checking out a customer from a hotel. accessed via the key provided to the hotel management
    const id = ObjectId(req.body.hotelId); // get the hotel id
    const mail = req.body.emailCustomer; // get the customer mail which can be used as a primary key
    let rooms = 0;
    user.findOne({
        username: mail // search by the user's mail
    }, function (err, docs) {
        if (err)
            return res.redirect('/manage-page/' + id);
        if (docs) {
            docs.hotels = docs.hotels.filter((hotel) => {
                if (hotel.id == id.toString())
                    rooms = hotel.rooms;
                return hotel.id !== id.toString();
            })
            docs.save(); // remove the hotel details from the user
            Hotels.findById(id, function (err, docss) {
                if (err) {
                    console.log(err)
                    return res.redirect('/manage-page/' + id);
                }
                if (docss) {

                    docss.rooms += rooms;
                    docss.customers = docss.customers.filter((customer) => {
                        return customer.email !== mail
                    });
                    docss.save(); // remove the user details from the hotel. 
                    return res.redirect('/manage-page/' + id);
                } else
                    return res.redirect('/manage-page/' + id);
                // res.redirect('/')
            })
        } else
            return res.redirect('/manage-page/' + id);

    })

})
////

//MONGOOSE Model Config.
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {
        type: Date,
        default: Date.now
    }
});

var Blog = mongoose.model("Blog", blogSchema);

app.get("/blogs", function (req, res) {
    Blog.find({}, function (err, blogs) {
        if (err) {
            console.log("ERROR!");
        } else {
            res.render("blog_index", {
                blogs: blogs
            });
        }
    })
})

app.get("/blogs/new", function (req, res) {
    res.render("blog_new");
})

app.post("/blogs", function (req, res) {
    //sanitizing the post
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.create(req.body.blog, function (err, newBlog) {
        if (err) {
            res.render("blog_new");
        } else {
            res.redirect("/blogs");
        }
    });
});

app.get("/blogs/:id", function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            res.redirect("/blogs");
        } else if (!req.isAuthenticated())
            return res.redirect('/login');
        else {
            res.render("blog_show", {
                blog: foundBlog,
                user: req.user.username
            });
        }
    })
})

//EDIT
app.get("/blogs/:id/edit", function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("blog_edit", {
                blog: foundBlog
            });
        }
    })
})

app.put("/blogs/:id", function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);

    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    })
})

app.delete("/blogs/:id", function (req, res) {
    Blog.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    })
})


//// Blogs Here 
////

app.get("*", function (req, res) {
    res.render('404-page', {
        loggedIn: req.isAuthenticated()
    });
})

let port = process.env.PORT;
if (port == null || port == "")
    port = 3000
app.listen(port, function () { // Start the server
    console.log("Server Listening to port 3000");
});