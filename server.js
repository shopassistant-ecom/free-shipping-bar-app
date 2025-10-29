import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("<h1>Free Shipping Bar app running ✅</h1><p>JS: /fsb.js, CSS: /fsb.css</p>");
});

const PORT = process.env.PORT || 3000;   // << fontos Renderhez
app.listen(PORT, () => console.log("Server running on port " + PORT));
