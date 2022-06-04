const express = require('express');
const router = express.Router();

const homeController = require('../controllers/home-controller');

console.log('Router Loaded');

// handle the home route
router.get('/', homeController.home);

// handle requests that start with /users/.....
router.use('/users',require('./users')); 

module.exports = router;  