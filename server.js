import express from "express";
const app = express();
app.get("/", (req, res) => res.send("<h1>Free Shipping Bar app running ✅</h1>"));
app.listen(3000, () => console.log("Server running on 3000"));
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// statikus fájlok: /fsb.js és /fsb.css
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("<h1>Free Shipping Bar app running ✅</h1><p>JS: /fsb.js, CSS: /fsb.css</p>");
});

app.listen(3000, () => console.log("Server running on port 3000"));
