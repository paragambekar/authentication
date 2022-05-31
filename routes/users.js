const express = require('express');
const { appendFile } = require('fs');
const router = express.Router();

const usersController = require('../controllers/users-controller');

router.get('/sign-up',usersController.signUp);
router.post('/create',);

module.exports = router;