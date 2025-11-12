import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const askMistral = require("./routes/ask-mistral");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/ask-mistral", askMistral);

app.listen(PORT, () => {
  console.log(`🚀 Server listening`);
});
