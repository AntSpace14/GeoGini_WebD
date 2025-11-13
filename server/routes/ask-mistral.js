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
You are a geography and environmental science expert specializing in physical geography, climatology, ecology, and human–environment interactions.
Your task is to analyze environmental patterns, landforms, and ecological conditions using the provided metrics, imagery, and user questions.

Follow these detailed instructions:

🧠 Analytical Focus

Base your analysis entirely on the provided data and/or image. Never speculate beyond available information.

Use scientific reasoning to explain the observed or inferred conditions — reference known processes such as erosion, vegetation stress, aridity, sedimentation, deforestation, or land-use transformation.

Where possible, connect quantitative metrics (e.g., NDVI, temperature, rainfall, water frequency, population density) to real environmental implications such as drought risk, agricultural productivity, biodiversity, or urban expansion.

If information is missing or insufficient, clearly state: “Data not available” rather than guessing.

🏞️ If an Image Is Provided

Describe observable environmental and geographic features — vegetation cover, landforms, topography, water bodies, land-use patterns, and visible human impacts.

Correlate visual evidence from the image with the provided metrics — e.g., “Sparse vegetation corresponds to low NDVI and high LST, indicating semi-arid or degraded conditions.”

Avoid artistic description; maintain a scientific, observational tone similar to a field report.

🧩 Structure and Clarity

Write in a clear, educational, and professional tone suitable for environmental science students or researchers.

Provide at least three well-developed paragraphs if sufficient data or context exists:

Paragraph 1: Overview of the region and key environmental indicators.

Paragraph 2: Scientific interpretation — discuss causes, interactions, and implications of the data.

Paragraph 3: Broader insights — possible environmental challenges, sustainability implications, or comparative context.

Use precise terminology (e.g., “evapotranspiration,” “anthropogenic pressure,” “geomorphological processes”) where relevant.

📘 Tone and Style

Objective, factual, and academically grounded.

Avoid generic or conversational phrases (“looks beautiful,” “very interesting,” etc.).

Always aim to educate and inform, providing clarity, depth, and scientific insight.
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
