import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { InferenceClient } from "@huggingface/inference";
import streamifier from "streamifier";

dotenv.config();
const router = express.Router();
const client = new InferenceClient(process.env.HF_TOKEN);

// 🔧 Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🖼️ Multer - Store images in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";
    const metrics = JSON.parse(req.body.metrics || "{}");

    // 🧠 Build prompt content
    const baseContext = `
You are a geography expert helping your friend analyze a specific region based on scientific metrics and/or an image. Use only the data provided and the user’s question to generate a factual, educational response. Do not speculate or make assumptions beyond the data or image.

--- Region Data ---
Latitude: ${metrics.lat}
Longitude: ${metrics.lon}
NDVI (Vegetation Index): ${metrics.ndvi}
Land Surface Temperature (LST): ${metrics.lst} °C
Rainfall (Annual): ${metrics.rainfall} mm
Water Frequency (temporal distribution of surface water from 1984 to 2021): ${metrics.waterFreq} %
Population Density: ${metrics.popDensity} people per 100 sq. meter grid

--- User Question ---
"${prompt}"

--- Instructions ---
1. If an image is provided, integrate it to support the explanation — describe visual features that correlate with the metrics.
2. Use the above region data to explain patterns, landforms, or environmental conditions relevant to the user's question.
3.  Be specific, concise, and avoid guessing. Say "Data not available" where information is missing or unclear.
4. When possible, include relevant scientific concepts (e.g., aridity, vegetation health, human impact).
5. Never fabricate facts or names of places if not explicitly mentioned.

Begin your response below:
`;

    const content = [{ type: "text", text: baseContext }];

    // 📷 Upload image if present
    if (req.file) {
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await streamUpload();

      content.push({
        type: "image_url",
        image_url: { url: result.secure_url },
      });
    }

    // 🤖 Send prompt (with or without image) to Hugging Face
    const chatCompletion = await client.chatCompletion({
      model: "unsloth/Mistral-Small-3.2-24B-Instruct-2506",
      messages: [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Describe this image in one sentence.",
                },
                {
                    type: "image_url",
                    image_url: {
                        url: "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg",
                    },
                },
            ],
        },
    ],
});

console.log(chatCompletion.choices[0].message);

export default router;


