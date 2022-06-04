const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const res = require('express/lib/response');

// for sign up form 
module.exports.signUp = function(request,response){

    // if user already signed in redirect to profile page 
    if(request.isAuthenticated()){
        return response.redirect('/users/profile');
    }
    return response.render('sign_up');
}



// Sign in form : to handle get request ie to take to sign in page 
module.exports.signIn = function(request,response){

    // if user already signed in redirect to profile page 
    if(request.isAuthenticated()){
        return response.redirect('/users/profile');
    }
    console.log('Inside sign in');
    return response.render('sign_in');
}
 



// Create User : To create new user account 
module.exports.create = async function(request,response){
    try{
        // if password and confirm password dont match
        if(request.body.password != request.body.confirm_password){
            request.flash('error',"Passwords Don't Match");
            return response.redirect('back');
        }

        // Find if user already exists
        let user = await User.findOne({email : request.body.email});

        // if doesnt exists create new account 
        if(!user){
            const hashedPassword = await bcrypt.hash(request.body.password,10);
            console.log(hashedPassword);
            let newUser = await User.create({
                email : request.body.email,
                password : hashedPassword,
                name : request.body.name,
                isVerified : false,
            });
        
            // send mail to verify email id
            let transporter = nodemailer.createTransport({
                service : 'gmail',
                host : 'smtp.gmail.com',
                port : 587,
                secure : false,
                auth : {
                    user : process.env.USER_ID,
                    pass : process.env.USER_PASSWORD,
                }
            });

            let mailOptions = {
                from : "Authenticator",
                to : newUser.email,
                subject : "Verify your email!",
                html : `<h2> Hello ${newUser.name} </h2>

                <p>You registered an account on Authenticator, before being able to use your account you need to verify that this is your email address by clicking here </p>
                <a href="http://${request.headers.host}/users/verify/?token=${newUser._id}">Click on the link to verify email</a>
                <br>
                <br>

                <p> Kind Regards </p>

                `
            } 

            // send mail via transporter
            transporter.sendMail(mailOptions, function(error,data){
                if(error){
                    console.log('Error in sending verification mail', error);
                    return;
                }else{
                    console.log('Verification mail sent!!');
                }
            });
            request.flash('success','Account Created. Login to continue');
        }else if(user){
            request.flash('info','Email Id Already Registered');
        }        
        return response.redirect('/users/sign-in');
    }catch(error){
        request.flash('error', 'Error in creating account');
        console.log('Error in creating new user',error);
    }
} 



// to verify user email 
module.exports.verify = async function(request,response){
    try{
        const token = request.query.token;
        const user = await User.findById(token);
        
        if(user){
            user.isVerified = true;
            await user.save();
            response.redirect('/users/sign-in');
        }else{
            response.redirect('/users/sign-up');
        }

    }catch(error){
        console.log('Error in verification', error);
    }

}

// Render profile page
module.exports.profile = function(request,response){
    return response.render('profile');
}


// Sign in and create a session 
module.exports.createSession = function(request,response){
    request.flash('success','Logged In Successfully');
    return response.redirect('/users/profile');
}

// To end session ie to logout user
module.exports.destroySession = function(request,response){
    // passport js gives this method to logout user 
    request.logout(function(error){
        if(error){
            console.log('Error in logging out',error);
        }
        request.flash('success','Logged Out Successfully');
        response.redirect('/');
    })
}


// Forgot Password controller to render appropriate page
module.exports.forgotPassword = function(request,response){

    // if user is already authenticated ie logged in, user can directly change the password
    if(request.isAuthenticated()){
        console.log('User authencticated forgot pass',request.user._id);
        return response.render('reset-password',{
            id : request.user._id,
        });
    }
    // if not authenticated take user to forgot password from the get valid email id
    return response.render('forgot-password');
}


// Handle the request of Forgot Password ie generate valid token and store it wrt a user
module.exports.forgotPasswordAction = async function(request,response){

    try{
        const email = request.body.email;
        // find user of which password has to be changed
        let users = await User.findOne({email : email});
        // if found
        if(users){
            // generate a token and hash if for more security and store the token for a user
            const token = await crypto.randomBytes(20).toString('hex');
            const hashToken = await bcrypt.hash(token,10);
            users.emailToken = hashToken;
            // token expires in 15mins
            users.tokenExpiresIn = Date.now()+ 1000*60*15;
            users.save();
            
            // Create transporter
            let transporter = nodemailer.createTransport({
                service : 'gmail',
                host : 'smtp.gmail.com',
                port : 587,
                secure : false,
                auth : {
                    user : process.env.USER_ID,
                    pass : process.env.USER_PASSWORD,
                }
            });
            
        
            // Creating mail to send to link to reset password
            let mailOptions = {
                from : "Authenticator",
                to : email,
                subject : "Reset Password",
                html : `<h2> Hello ${users.name} </h2>

                <p>You recently requested to reset the password for your Authenticator account. Click the button below to proceed.</p>
                <a href="http://${request.headers.host}/users/reset-password/?tc=${token}&lm=${users._id}">Click on the link to Reset Password</a>
                <br>
                <br>

                <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset link is only valid for the next 15 minutes.</p>

                <p> Kind Regards </p>
                `
        }

        // Send mail via nodemailer
        let msg = await transporter.sendMail(mailOptions);
        
        if(request.isAuthenticated()){
            request.flash('info','Email Sent To Reset Password');
            return response.redirect('/users/profile');
        }else{
            request.flash('info','Email Sent To Reset Password');
            return response.redirect('/users/sign-in');
        }
        
        
    }else{
        console.log('No user! Found Check Email Id');
        request.flash('error', 'No user! Found Check Email Id');
        return response.redirect('back');
    } 
    
    }catch(error){
        console.log('error in finding user');
    }
}


// To validate the link of the user for resetting passwords
module.exports.resetPassword = async function(request,response){

    try{
        // Extract token & id from query params
        const token  = request.query.tc;
        const id = request.query.lm;
        
        // find user wrt to the id
        const user = await User.findOne({
            $and : [
                { _id : id },
                {tokenExpiresIn :  { $gt : `${Date.now()}` }}
            ]
        });

        // if user found 
        if(user){
            // Match the token of user and token we have with us in the database
            const match = await bcrypt.compare(token,user.emailToken);

            // if tokens match we can allowed the user to reset password
            if(match){
                return response.render('reset-password',{
                    message : "You can reset the password now",
                    id : id,
                });

                // Not authorized
            }else{
                request.flash('error','Invalid Link');
            
            }
        }else{
            request.flash('error','Invalid Link');
        }
        return response.redirect('/users/forgot-password');

    }catch(error){
        console.log('Error', error);
        request.flash('error','Token expired');
        return response.redirect('back');
    }
}

// Change password according to the data provided in reset password form
module.exports.resetPasswordAction = async function(request,response){

    try{
        // check if user is already authenticated

        if(request.isAuthenticated()){
            let user = await User.findById(request.body.id);
            if(request.body.password === request.body.confirm_password){
                const hashedPassword =await bcrypt.hash(request.body.password,10);
                user.password = hashedPassword;
                user.save();
                if(request.isAuthenticated()){
                    request.flash('info','Password Changed');
                    return response.redirect('/users/profile');
                }else{
                    request.flash('info','Password Changed');
                    return response.redirect('/users/sign-in');
                }
            }else{
                console.log('Passwords dont match');
                request.flash('error','Link expired');
                return response.redirect('back');
            }
        }else{

            // Reset password with link provided through email

            // find the user with valid token 
            let user = await User.findOne({
                $and : [
                    { _id : request.body.id },
                    {tokenExpiresIn :  { $gt : `${Date.now()}` }}
                ]
            });
            
            // if valid token found proceed further
            // if password & confirm password match, hash it save for security
            if(user && request.body.password === request.body.confirm_password){
                const hashedPassword =await bcrypt.hash(request.body.password,10);
                user.password = hashedPassword;
                user.save();
                if(request.isAuthenticated()){
                    request.flash('info','Password Changed');
                    return response.redirect('/users/profile');
                }else{
                    request.flash('info','Password Changed');
                    return response.redirect('/users/sign-in');
                }

                // if passwords dont match throw flash
            }else{
                console.log('Passwords dont match');
                request.flash('error','Link expired');
                return response.redirect('back');
            }
        }
        
    }catch(error){
        console.log('Error while reseting password');
        return response.redirect('back');
    }
}
