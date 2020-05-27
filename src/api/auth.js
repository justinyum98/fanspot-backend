const express = require('express');

const router = express.Router();

router.post('/login', (req, res) => {
    // Login user here
    res.send('Logged in user');
});

router.post('/register', (req, res) => {
    // Register user here
    res.send('Registered user');
});

module.exports = router;
