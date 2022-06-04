// to use env variables 
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

// Server 
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');
const session = require('express-session');

// Authentication
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');
const passportGoogle = require('./config/passport-google-oauth2-strategy');
const MongoStore = require('connect-mongo');

// SASS Middleware
const sassMiddleware = require('node-sass-middleware');
const flash = require('connect-flash');
const customMware = require('./config/middleware');
app.use(sassMiddleware({ 
    src : './assets/scss',
    dest : './assets/css',
    // debug : true,
    outputStyle : 'extended',
    prefix : '/css'
}));

app.use(express.urlencoded());
app.use(cookieParser());

// to access static files
app.use(express.static('./assets'));

// use express layouts
app.use(expressLayouts);
// extract style and scripts from sub pages into the layout
app.set('layout extractStyles', true);

// setup view engine 
app.set('view engine', 'ejs');
app.set('views' , './views');

app.use(session({
    name : 'authenticate',
    secret : 'secret',
    saveUninitialized : false,
    resave : false,
    cookie: {
        maxAge: (1000 * 60 * 100)
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI ||  'mongodb://localhost/authentication',
        autoRemove : 'disabled',
    },function(error){
        console.log(error || 'Connect MongoDB setup ok');
    })

}));

// use passport
app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

app.use(flash());
app.use(customMware.setFlash); 

// use express router 
app.use('/', require('./routes/index'));


app.listen(port, function(error){
    if(error){
        console.log(`Error in running server on port ${port}`);
        return;
    }

    console.log(`Server is running on port ${port}`);
});

