const express = require('express');
const multer = require('multer');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems: /api/secondchance/items
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e);
        next(e);
    }
});

// Add a new item: POST /api/secondchance/items
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        let secondChanceItem = req.body;

        // Give the new item the next id
        const lastItem = await collection.find().sort({ id: -1 }).limit(1).toArray();
        secondChanceItem.id = lastItem.length > 0
            ? (parseInt(lastItem[0].id) + 1).toString()
            : '1';

        secondChanceItem.date_added = Math.floor(new Date().getTime() / 1000);

        await collection.insertOne(secondChanceItem);
        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Get a single item by id: /api/secondchance/items/:id
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id: id });

        if (!secondChanceItem) {
            return res.status(404).send('secondChanceItem not found');
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Update an existing item: PUT /api/secondchance/items/:id
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id: id });

        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: 'secondChanceItem not found' });
        }

        secondChanceItem.category = req.body.category;
        secondChanceItem.condition = req.body.condition;
        secondChanceItem.age_days = req.body.age_days;
        secondChanceItem.description = req.body.description;
        secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1));
        secondChanceItem.updatedAt = new Date();

        await collection.findOneAndUpdate(
            { id: id },
            { $set: secondChanceItem }
        );

        res.json({ uploaded: 'success' });
    } catch (e) {
        next(e);
    }
});

// Delete an existing item: DELETE /api/secondchance/items/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id: id });

        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: 'secondChanceItem not found' });
        }

        await collection.deleteOne({ id: id });
        res.json({ deleted: 'success' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
