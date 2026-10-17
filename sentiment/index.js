require('dotenv').config();
const express = require('express');
const natural = require("natural");

const app = express();
app.use(express.json());

// Sentiment analysis: GET /sentiment?sentence=...
app.get('/sentiment', async (req, res) => {
    const { sentence } = req.query;

    if (!sentence) {
        return res.status(400).json({ error: 'No sentence provided' });
    }

    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer("English", stemmer, "afinn");

    try {
        const words = new natural.WordTokenizer().tokenize(sentence);
        const analysisResult = analyzer.getSentiment(words);

        let sentiment = "neutral";
        if (analysisResult < 0) {
            sentiment = "negative";
        } else if (analysisResult > 0.33) {
            sentiment = "positive";
        }

        res.status(200).json({ sentimentScore: analysisResult, sentiment: sentiment });
    } catch (error) {
        console.error(`Error performing sentiment analysis: ${error}`);
        res.status(500).json({ message: 'Error performing sentiment analysis' });
    }
});

const port = process.env.PORT || 3070;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
