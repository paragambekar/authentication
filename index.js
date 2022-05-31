if(process.env.NODE_ENV !== 'porduction'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = process.env.PORT;

const db = require('./config/mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');

const sassMiddleware = require('node-sass-middleware');

app.use(sassMiddleware({ 
    src : './assets/scss',
    dest : './assets/css',
    // debug : true,
    outputStyle : 'extended',
    prefix : '/css'
}));

app.use(express.urlencoded());

app.use(express.static('./assets'));

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

}));


app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

// use express router 
app.use('/', require('./routes/index'));


app.listen(port, function(error){
    if(error){
        console.log(`Error in running server on port ${port}`);
        return;
    }

    console.log(`Server is running on port ${port}`);
});

