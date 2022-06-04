// home controller 
module.exports.home = function(request, response){

     // if user already signed in redirect to profile page 
     if(request.isAuthenticated()){
        return response.redirect('/users/profile');
    }

    return response.render('home'); 

} 