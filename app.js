// Load a .env file if one exists
require('dotenv').config()

const express = require("express");
const handlebars = require("express-handlebars");
const app = express();

// Listen port will be loaded from .env file, or use 3000
const port = process.env.EXPRESS_PORT || 3000;

// Setup Handlebars
app.engine("handlebars", handlebars.create({
    defaultLayout: null
}).engine);
app.set("view engine", "handlebars");

// Set up to read POSTed form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

// Setup our routes
const account = require("./routes/account-routes.js");
app.use("/account", account);
// TODO: Your app here

const appRouter = require("./routes/application-routes.js");
app.use(appRouter);


app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
