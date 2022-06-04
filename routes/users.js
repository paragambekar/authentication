const express = require('express');
const { appendFile } = require('fs');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');

// User Controller
const usersController = require('../controllers/users-controller');

// TO handle Sign-in , Sign Up , create & destroy session
router.get('/sign-up',usersController.signUp);
router.get('/sign-in',usersController.signIn);
router.get('/sign-out',usersController.destroySession);
router.post('/create-session',passport.authenticate(
    'local',
    {failureRedirect : '/users/sign-in'}  
),usersController.createSession);

// router create new user
router.post('/create',usersController.create);

// handle requests related to passwords
router.get('/forgot-password',usersController.forgotPassword);
router.post('/forgot-password',usersController.forgotPasswordAction);
router.post('/reset-password',usersController.resetPasswordAction);
router.get('/reset-password',usersController.resetPassword);
  

router.get('/profile',passport.checkAuthentication, usersController.profile);
router.get('/verify',usersController.verify); 

// Google Auth
router.get('/auth/google', passport.authenticate('google',{scope : ['profile','email']}));
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect : '/users/sign-in'}),usersController.createSession)
   
module.exports = router; 