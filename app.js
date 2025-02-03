// Load a .env file if one exists
require('dotenv').config()

const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
const path = require("path");


// Listen port will be loaded from .env file, or use 3000
const port = process.env.EXPRESS_PORT || 3000;

// Setup Handlebars
app.engine("handlebars", handlebars.create({
    defaultLayout: "main",
    helpers: {
        json: function (context) {
            return JSON.stringify(context, null, 2);
        }
    },
    partialsDir: path.join(__dirname, 'views/partials'),
}).engine);

app.set("view engine", "handlebars");

app.use("/bootstrap", express.static(__dirname + "/node_modules/bootstrap/dist"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Set up to read POSTed form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

// Session
const session = require("express-session");
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "COMPX569FinalProject"
}));



// Setup our routes
const account = require("./routes/account-routes.js");
app.use("/account", account);

const api = require("./routes/api-routes.js");
app.use("/api", api);

const appRouter = require("./routes/application-routes.js");
app.use(appRouter);


app.listen(port, function () {
    console.log(`Web final project listening on http://localhost:${port}/`);
});
