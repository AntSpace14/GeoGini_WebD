import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import askMistral from "./routes/ask-mistral.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/ask-mistral", askMistral);

app.listen(PORT, () => {
  console.log(`🚀 Server listening`);
});
