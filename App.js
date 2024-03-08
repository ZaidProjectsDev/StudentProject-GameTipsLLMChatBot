import 'dotenv/config';
import express from "express";
import * as bodyParser from "express";
import { ChatOpenAI } from "@langchain/openai"
const app = express();
const port = 3050;
// Middleware to parse JSON bodies
app.use(bodyParser.json());

const memPrompt= "You are a very helpful Game Guides tool named Lulu that eagerly answers questions when asked. If someone asks about booting up an N64, you tell them to hit the on button in the most eager way possible." +
    "If someone asks aobut something that isn't related to games at all in any way (such as politics, sensitive issues, movies, tv shows or music), tell them in a nice way that they should use a different service" +
    "If someone asks about a game you don't know about or recognize, pretend it exists and provide basic information aproximated from any recognizable trait you can from the title. For example, if you dont recognize Halo 4, you probably recognize Halo 1-3 and can aproximate a tip based on that." +
    "If a user asks an inappropriate question that violates your operating terms or involves cheat codes, please tell the user that your database does not have that information and to consult another service." +
    "If someone is asking for help but does not state the issue: Make an assumption and answer." +
    "Please also provide random fun Facts in your response using the funfacts provided."
const guideTable = "Use these to help you fill in the blanks for games or guides you dont have any knowledge of and cannot aproxmimate : " +
    "Another Code: Two Memories -Guide Help: Use the Nintendo DS's gyros to solve puzzles." +
    "Another Code: Recollection -Guide Help: Use the Nintendo Switch's JoyCon gyros to solve puzzles." +
    "The Legend of Zelda: Tears of The Kingdom -Guide Help: Use the dungeon specific mechanics to solve the puzzles and get the orbs." +
    "Palworld -Guide Help: To ensure maximum efficency and longevity for your resource managment and Pal farming, make sure your Pals are happy and maximize the space you're using in your base."
const funFacts= " funfacts = 'The Xbox 360 was released in 2005! The blue colored discs of the PlayStation 2 were actually CD formated games and not DVDs- SSX was one of them. The PS3's GPU was called the RSX!'"


const programSetupPrompt = "You are Lulu, a Game Guides Tool. You will answer questions with enthusiasm. However, your answers must be constructed in a json format that has the string 'answer' and the bool value of 'game_known'. 'game_known' is determined by if you are able to answer the user's question using your current data. If you are unable to, you will set 'game_unknown' to false." +
    "To get more information about the game, get the string information from this link : " +
    "The actual question will be here : "
const pastQuestions = [];
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.get('/Test', async (req,res)=> {
    try {
        const model = new ChatOpenAI({
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
            azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
        });
        const joke = await model.invoke("Tell me a Javascript joke!");
        res.send(joke.content); // Send the joke back as the response
    } catch (error) {
        console.error("Error during testLM:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
})
app.get('/gamequestion', async (req, res) => {
    // Retrieve the question from the query parameter
    const question = req.query.question;

    // Check if the question parameter is provided
    if (!question) {
        return res.status(400).send({ error: 'Please provide a question' });
    }

    try {
        // Assuming you have a function to call your language model, replace the below example
        const model = new ChatOpenAI({
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
            azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
            azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
        });
        // Here, 'invoke' is a hypothetical method of your model instance
        // Replace it with the actual method to send a question to your LLM

            const answer = await model.invoke(programSetupPrompt + question);
            console.log(guideTable + memPrompt + funFacts + question)


            //const answer = await model.invoke(guideTable+memPrompt+funFacts+question +pastQuestions[pastQuestions.length-1]);

            // Send the answer back to the client
            res.send({question, answer: answer.content});



    } catch (error) {
        console.error("Error during LLM invocation:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
})




