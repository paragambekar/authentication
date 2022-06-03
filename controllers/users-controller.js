const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { transporter } = require('../config/nodemailer');
const crypto = require('crypto');
const res = require('express/lib/response');

module.exports.signUp = function(request,response){

    // if user already signed in redirect to profile page 
    if(request.isAuthenticated()){
        return response.redirect('/users/profile');
    }

    return response.render('sign_up');
}

module.exports.create = async function(request,response){

    try{

        if(request.body.password != request.body.confirm_password){
            request.flash('error',"Passwords Don't Match");
            return response.redirect('back');
        }

        let user = await User.findOne({email : request.body.email});
        console.log('User----------->',user);
        if(!user){
            const hashedPassword = await bcrypt.hash(request.body.password,10);
            console.log(hashedPassword);
            let newUser = await User.create({
                email : request.body.email,
                password : hashedPassword,
                name : request.body.name,
                isVerified : false,
            });

            request.flash('success','Account Created. Login to continue');

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

            console.log('New User----------->',newUser);
            var mailOptions = {
                from : "Verify your email",
                to : newUser.email,
                subject : "Verify",
                html : `<h2> Hello ${newUser.name} </h2>
                <a href="http://${request.headers.host}/users/verify/?token=${newUser._id}">Click on the link to verify email</a>
                `

            }

            // transporter.sendMail(mailOptions, function(error,data){
               

            // });

            transporter.sendMail(mailOptions, function(error,data){
                if(error){
                    console.log('Error in sending verification mail', error);
                    return;
                }else{
                    console.log('Verification mail sent!!');
                }
            })

            console.log('newUser---->',newUser);
            
        }

        
        console.log('request.body------>>',request.body);
        // const hashedPassword = await bcrypt.hash(request.body.password,1);
        // console.log(hashedPassword);
 
        return response.render('sign_in');
    }catch(error){
        request.flash('error', 'Error in creating account');
        console.log('Error in creating new user',error);
    }

} 

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

module.exports.signIn = function(request,response){

    // if user already signed in redirect to profile page 
    if(request.isAuthenticated()){
        return response.redirect('/users/profile');
    }


    console.log('Inside sign in');
    return response.render('sign_in');
}

module.exports.profile = function(request,response){
    console.log('Inside profile');
    console.log('Request body------->',request.body);
    return response.render('profile',{
    })
}

// Sign in and create a session 
module.exports.createSession = function(request,response){
    console.log('Inside create session');
    request.flash('success','Logged In Successfully');
    return response.redirect('/users/profile');
}

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


module.exports.forgotPassword = function(request,response){

    // console.log('Rq body in forgot pass',request.body);
    // console.log('Locals users', locals.user);
    request.flash('info','Email has been sent to reset password');
    return response.render('forgot-password');
}

module.exports.forgotPasswordAction = async function(request,response){
    console.log('Request Body in fpass action',request.body);

    const{ id , email } = request.body;
    const token = crypto.randomBytes(20).toString('hex');
    const hashToken = await bcrypt.hash(token,10);

    let user = await User.findOne({email : email});
    console.log('user in fpass action', user);
    if(user){

        user.emailToken = hashToken;
        user.tokenExpiresIn = Date.now()+ 1000*60*15;
        user.save();

        console.log('After generating email Token', user);

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

    
        var mailOptions = {
            from : "Verify your email",
            to : email,
            subject : "Verify",
            html : `<h2> Hello ${user.name} </h2>
            <a href="http://${request.headers.host}/users/reset-password/?tc=${token}&lm=${user._id}">Click on the link to Reset Password</a>
            `
        }

        transporter.sendMail(mailOptions, function(error,data){
            if(error){
                console.log('Error in reset pass mail', error);
                return;
            }else{
                console.log('Reset pass mail sent!!');
            }
        })

        request.flash('success','Email sent to reset password');
        return response.redirect('/users/profile');
    }else{
        request.flash('error', 'No user found');
        console.log('No user found check email');
        response.redirect('back');
    } 
}

module.exports.resetPassword = async function(request,response){

    try{
        const token  = request.query.tc;
        const id = request.query.lm;
        console.log('Toke in reset Pass----->>',token);
        console.log('Id in reset Pass----->>',id);
        const user = await User.findOne({
            $and : [
                { _id : id },
                {tokenExpiresIn :  { $gt : `${Date.now()}` }}
            ]
        });
        if(user){
            console.log('user found in reset pass*****', user);
            console.log('email token in reset pass*****', user.emailToken);
            const match = await bcrypt.compare(token,user.emailToken);
            console.log('Match',match);
            if(match){
                console.log('Tokens matched');
                return response.render('reset-password',{
                    message : "You can resff the password now"
                });
            }else{
                request.flash('error','Invalid Link');
                console.log('Token invalid');
            }
        }else{
            request.flash('error','Invalid Link');
        }
        return response.redirect('/users/forgot-password');

    }catch(error){
        console.log('Error', error);
        request.flash('error','Tokens expired');
        return response.redirect('back');
    }


}

module.exports.resetPasswordAction = async function(request,response){
    console.log('Request.body in reset password action', request.body);

    // let user = await User.find([{_id : request.body.id},{emailToken :{ $lt : `${Date.now()}`}}]);
    let user = await User.findOne({
        $and : [
            { _id : request.body.id },
            {tokenExpiresIn :  { $gt : `${Date.now()}` }}
        ]
    });
    console.log('User in rest pass action----->',user);
    if(user && request.body.password === request.body.confirm_password){
        const hashedPassword =await bcrypt.hash(request.body.password,10);
        user.password = hashedPassword;
        user.save();
        console.log('passwords changed');
        request.flash('success','Passowrds changed');
        // request.logout(function(error){  
        //     if(error){
        //         console.log('Error in logging out',error);
        //     }
        //     response.redirect('/');
        // })
        response.redirect('/users/profile');
    }else{
        console.log('Passwords dont match');
        request.flash('error','Link expired');
        return response.redirect('back');
    }

    // return response.redirect('/users/profile');
}
