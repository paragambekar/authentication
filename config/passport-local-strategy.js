const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback : true,
},
async function(request,email,password,done){

    try{

        let user = await User.findOne({email : email});
        console.log('User---------->',user);

        let match = false;
        if(user){
            match = await bcrypt.compare(password, user.password);
            console.log('Match----->',match);
        }

        if(!user || !match){
            if(!user){
                request.flash('error', 'User doesnt exists');
            }else{
                request.flash('error', 'Invalid Email/Password');
            }
            return done(null, false);
        }

        // if user is found we return the user
         
        console.log('User found');
        return done(null, user);
        

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