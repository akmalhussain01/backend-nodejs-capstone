const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for items: /api/secondchance/search
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        // Build the filter from the query parameters
        let query = {};

        // Filter on name (partial, case-insensitive match)
        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: 'i' };
        }

        // Filter on category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter on condition
        if (req.query.condition) {
            query.condition = req.query.condition;
        }

        // Filter on age (items up to this many years old)
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }

        const secondChanceItems = await collection.find(query).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
