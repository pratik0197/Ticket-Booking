# Ticket-Booking & Blogging Site


This is a Ticket Booking Application for booking hotels and flights easily. We have not yet added the transaction feature.
The features include booking a hotel,cancelling a hotel, viewing hotels booked for the user side.
From the admin side, features include adding a hotel, checkin and checkout of customers along with tallies of customers.


Technologies used are : Node.js, Express.js, MongoDB Database, Mongoose


For adding an user, the login and signup pages are there, which are very secure thanks to Passport.js. 
only after an user logs in or signup will he be able to book,cancel tickets.
To add a hotel, we have  "/hotelAdmin" route which takes the information and stores it in a database

To view the customers of a hotel ,"/manage-page/:id" is there where id is an unique key provided to the managers of the hotel where he will have access to the view of customers who have checkedin and checkedout


To view the hotels booked by the user currently, the user 
