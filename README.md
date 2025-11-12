
# 🌍 GeoGini — Explore Earth Intelligently

**GeoGini** is an interactive geospatial intelligence platform powered by Google Earth Engine, satellite data, and AI.  
Draw regions on the map, extract real metrics like **NDVI**, **Land Surface Temperature**, **Rainfall**, and get **AI-generated insights** based on both data and uploaded images.

### 🔗 Live Site: [GeoGini on Netlify](https://geogini.netlify.app)

---

## 🚀 Features

✅ **Draw Any Region** — Instantly select a polygon, rectangle, or point on the map  
✅ **Auto-Metric Extraction** — NDVI, LST, Rainfall, Water Frequency & Population Density  
✅ **Time-Series Modal** — Summarized climate profile over Jan 2024 – Jan 2025  
✅ **AI Region Summaries** — Hugging Face-powered, data-aware responses using Mistral  
✅ **Image Upload Support** — Analyze both metrics and images in combination  
✅ **Responsive UI** — Built with Tailwind CSS + ShadCN for a smooth, modern experience  
✅ **Earth Engine + React Integration** — Real-time syncing via `postMessage`  
✅ **Secure Backend** — Node.js + Cloudinary + Hugging Face APIs  
✅ **Vertical Modern Layout** — No sidebars, full-screen elegance  
✅ **Helpful Tooltips + Layer Legends** — Beginner-friendly with visual guides

---


## 🛠️ Stack Used

| Tech                | Description                                      |
|---------------------|--------------------------------------------------|
| 🌐 **Frontend**      | React + Vite + Tailwind + ShadCN UI, deployed on Netlify.             |
| 🌎 **GEE**           | Google Earth Engine for real-time metric data   |
| 🧠 **AI**            | Hugging Face Inference API (Mistral model)      |
| ☁️ **Cloudinary**    | Image upload and hosting                        |
| 📡 **postMessage**   | Secure iframe messaging between GEE & frontend  |
| 🔒 **Backend**       | Express (Node.js) API for AI and image uploads, deployed on Render.  |

---

## 💡 How It Works

1. **Select a region** on the map — the app captures it via GEE's `drawingTools`.
2. **Metrics are computed** using `reduceRegion` and sent via `postMessage`.
3. **React frontend receives metrics**, displays them, and auto-fills the AI form.
4. **You upload an image** or just type a prompt — and get a **Mistral-generated response**.
5. **Time-series modal** shows a summary of average values across a year.

---


## 🧪 Try It Yourself

✅ Open [https://geogini.netlify.app](https://geogini.netlify.app)  
✅ Draw a rectangle on the map  
✅ Wait for metrics to load  
✅ Ask questions like:

> _"Explain the land use and vegetation in this region."_  
> _"How does the rainfall affect habitability here?"_

Or upload an image and ask:

> _"What environmental challenges can you guess from this?"_

---

## 🙌 Credits

Made with 💙 by [Antariksh Sarmah](https://github.com/AntSpace14)  
Earth Engine map hosted at: [GEE App](https://antariksh.users.earthengine.app/view/geogini-gee-latest)  
AI responses by Hugging Face Mistral API

