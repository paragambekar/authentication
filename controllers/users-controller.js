const User = require('../models/user');
const bcrypt = require('bcrypt');


module.exports.signUp = function(request,response){

    return response.render('sign_up');
}

module.exports.create = async function(request,response){

    try{

        if(request.body.password != request.body.confirm_password){
            return response.redirect('back');
        }

        let user = await User.findOne({email : request.body.email});
        console.log('User----------->',user);
        if(!user){
            const hashedPassword = await bcrypt.hash(request.body.password,1);
            console.log(hashedPassword);
            let newUser = await User.create({
                email : request.body.email,
                password : hashedPassword,
                name : request.body.name
            });
            console.log('newUser---->',newUser);
        }

        
        console.log('request.body------>>',request.body);
        // const hashedPassword = await bcrypt.hash(request.body.password,1);
        // console.log(hashedPassword);
 
        return response.render('sign_in');
    }catch(error){
        console.log('Error in creating new user',error);
    }

} 

module.exports.signIn = function(request,response){
    console.log('Inside sign in');
    return response.render('sign_in');
}

module.exports.profile = function(request,response){
    console.log('Inside profile');
    return response.render('profile',{
        user : request.body.name
    })
}

// Sign in and create a session 
module.exports.createSession = function(request,response){
    console.log('Inside create session');
    return response.send('<h1>Session created</h1>');
}