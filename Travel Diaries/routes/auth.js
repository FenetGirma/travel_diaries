const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njc5ODY3MWRmMDg4OGQyZDMyM2UyY2EiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTkyNDA0MTksImV4cCI6MTcxOTI0NDAxOX0.gqCT2LjOsRLS3DAUxNU-ozRBQPp-juvCPriRPz4TXN4';

// Register route
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();
        res.status(201).send('User registered');
    } catch (err) {
        res.status(500).send('Error registering user');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).send('User not found');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).send('Invalid password');

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

// Protected route (User)
router.get('/user-protected', authenticateToken, authorizeRoles('user'), (req, res) => {
    res.status(200).send('This is a protected route for users');
});

// Protected route (Admin)
router.get('/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.status(200).send('This is a protected route for admins');
});

// Get all users, accessible only to admin users
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        // Verify that req.user is correctly set
        if (!req.user) {
            return res.status(403).json({ message: 'Access denied, no user information found.' });
        }

        // Fetch users from the database
        const users = await User.find();
        res.json(users);
    } catch (error) {
        // Log the error for debugging
        console.error('Error retrieving users:', error);

        // Send a more detailed error response
        if (error.name === 'MongoError') {
            return res.status(500).json({ message: 'Database error occurred while retrieving users.' });
        }

        res.status(500).json({ message: 'An unexpected error occurred while retrieving users.' });
    }
});
module.exports = router;
