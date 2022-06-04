const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');


// Using passport local strategy to authenticate user using email and password
passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback : true,
},
async function(request,email,password,done){

    try{
        // find user with the provided email in form 
        let user = await User.findOne({email : email});
        let match = false;
        // if found check if password is correct 
        if(user){
            match = await bcrypt.compare(password, user.password);
        }

        // if user not found or invalid email/ password
        if(!user || !match){
            if(!user){
                request.flash('error', 'User doesnt exists');
            }else{
                request.flash('error', 'Invalid Email/Password');
            }
            return done(null, false);
        }

        // if user is found we return the user 
        return done(null, user);
        

    // if any error occured during the process
    }catch(error){
        request.flash('error', 'Error in creating new account')
        console.log('Error in bcrpyt', error);
        return done(error);
    }
 }
));



// serializing the user to decide which key is to be kept in the cookies
passport.serializeUser(function(user, done){
    done(null, user.id);
});


// deserializing the user from the key in the cookies
passport.deserializeUser(function(id, done){
    User.findById(id, function(error, user){
        if(error){
            console.log('Error in finding user --> Passport');
            return done(error);
        }

        return done(null, user);
    });
});

// using this function as a middlware
passport.checkAuthentication = function(request,response,next){
    
    // if user is signed in then pass on the request to the next function (controller action )
    // detects if the user is signed in or not 
    if(request.isAuthenticated()){
        return next();
    }
    // if user not found 
    return response.redirect('/users/sign-in'); 

}


passport.setAuthenticatedUser = function(request,response,next){
    if(request.isAuthenticated()){
        // request.user contains the current signed in user from the session cookie and we are just sending this to the locals for views
        response.locals.user = request.user;
    }
    next();
}


module.exports = passport;