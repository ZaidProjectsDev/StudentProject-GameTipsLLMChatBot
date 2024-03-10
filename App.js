import 'dotenv/config';
import cors from 'cors';
import express, { json } from "express";
import { ChatOpenAI } from "@langchain/openai";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(json());

const port = 3050; //Used 3050 cause the React client kept using port 3000
let conversationHistory = []; // Stores the conversation history
let lastGameDetails = null; // Cache for storing the last game's details

// Revised prompt for extracting the game name from the question
const promptGetGameInQuestion = "Identify the game's name in the question. Answer with the game's name or 'no-game' if unrelated. Example games: 'Halo 2', 'GTAV', 'Legend of Zelda: Tears of the Kingdom'.";

async function getGameDetails(gameName) {
    // Check cache first
    if (lastGameDetails && lastGameDetails.name.toLowerCase() === gameName.toLowerCase()) {
        return lastGameDetails.details; // Return cached details
    }

    if (gameName.includes('no-game')) {
        return null;
    }
    const apiKey = process.env.RAWG_API_KEY;
    const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        const details = data.results.length > 0 ? data.results[0] : null; // Return first result or null if no matches

        // Update cache
        lastGameDetails = { name: gameName, details };

        return details;
    } catch (error) {
        console.error('Failed to fetch game details:', error);
        throw error;
    }
}

app.get('/', (req, res) => {
    res.send('Hi, all systems go!');
});

app.get('/gamequestion', async (req, res) => {
    const question = req.query.question;
    if (!question) {
        return res.status(400).send({ error: 'Please provide a question' });
    }

    conversationHistory.push({ role: 'user', message: question });

    try {
        const model = new ChatOpenAI({
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
            azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
            temperature:1.05,
        });

        // Extract game name from the question
        const answer = await model.invoke(promptGetGameInQuestion + " " + question);
        const gameName = answer.content.trim();

        const gameDetails = (!gameName || gameName === 'no-game') && lastGameDetails ? lastGameDetails.details : await getGameDetails(gameName);

        if (!gameDetails) {
            return res.status(404).send({ error: 'Game details could not be fetched.' });
        }

        // Revised prompt for generating an answer based on game details and conversation history
        const historyPrompt = conversationHistory.map(entry => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.message}`).join('\n');
        const gameDetailsPrompt = `Using the provided game information, answer the following question about ${gameName || lastGameDetails.name}. Try to provide a playful response.`;
        const detailedPrompt = `${historyPrompt}\n${gameDetailsPrompt}\nQuestion: ${question}\nGame Details: ${JSON.stringify(gameDetails).slice(0, 1500)}`;

        const detailedAnswer = await model.invoke(detailedPrompt);

        conversationHistory.push({ role: 'assistant', message: detailedAnswer.content});

        res.json({ answer: detailedAnswer.content });
    } catch (error) {
        console.error("Error during processing:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
