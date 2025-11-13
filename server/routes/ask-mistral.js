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

    // 📊 Prepare region data string
    const regionData = `
Latitude: ${metrics.lat || "N/A"}
Longitude: ${metrics.lon || "N/A"}
NDVI (Vegetation Index): ${metrics.ndvi || "N/A"}
Land Surface Temperature (LST): ${metrics.lst || "N/A"} °C
Rainfall (Annual): ${metrics.rainfall || "N/A"} mm
Water Frequency (1984–2021): ${metrics.waterFreq || "N/A"} %
Population Density: ${metrics.popDensity || "N/A"} people / 100 sq. meters
`;

    // 📷 Upload image to Cloudinary if provided
    let imageUrl = null;
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
      imageUrl = result.secure_url;
    }

    // 🧠 Construct multimodal message structure for Llama-4 Scout
    const messages = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `
You are a geography and environmental science expert.
Analyze environmental patterns, landforms, and ecological conditions using the provided metrics and/or image.
Always use scientific reasoning, real-world correlations, and educational tone.
Avoid speculation; using the coordinates given, try to figure out the region, even if broadly, to inform your answer, else state “Data not available.”
When an image is included, describe its visual environmental context (vegetation, terrain, land use, etc.).
Provide a structured, well-developed answer — at least 3 paragraphs if enough context is available.
            `,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Region Data:
${regionData}

Question:
${prompt}

Please analyze and explain this data scientifically in detail.
            `,
          },
          ...(imageUrl
            ? [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ]
            : []),
        ],
      },
    ];

    // 🚀 Call the Hugging Face model (Llama 4 Scout supports multimodal)
    const chatCompletion = await client.chatCompletion({
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      messages,
    });

    const answer =
      chatCompletion?.choices?.[0]?.message?.content?.trim() ||
      "No response received.";

    return res.json({
      success: true,
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      imageUsed: imageUrl || null,
      answer,
    });
  } catch (err) {
    console.error("AI route error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong", details: err.message });
  }
});

export default router;
