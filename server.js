require("dotenv").config(); // 👈 Add this
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

const upload = multer({ dest: "uploads/" });

app.post("/transcribe", upload.single("audio"), (req, res) => {
  console.log("File received:", req.file);
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = path.join(__dirname, req.file.path);
  const fileStats = fs.statSync(filePath);
  console.log("Uploaded file stats:", fileStats);

  if (fileStats.size === 0) {
    return res.status(400).json({ error: "Uploaded file is empty" });
  }
  const command = `./whisper-cli -m ./ggml-tiny.en.bin -f "${filePath}" --output-txt`;

  exec(command, (error, stdout, stderr) => {
    console.log("Whisper stderr:", stderr);
    if (error) {
      console.error("Exec Error:", stderr);
      return res
        .status(500)
        .json({ error: "Transcription failed due to an internal error." });
    }

    const transcriptPath = filePath + ".txt";
    console.log("🚀 ~ exec ~ transcriptPath:", transcriptPath);
    if (fs.existsSync(transcriptPath)) {
      let transcript = fs.readFileSync(transcriptPath, "utf8");
      console.log("🚀 ~ exec ~ transcript:", transcript);

      // **Format transcript for better readability**
      transcript = formatTranscript(transcript);
      console.log("🚀 ~ exec ~ formatTranscript:", transcript);

      res.json({ transcript });

      // Clean up temp files
      fs.unlinkSync(transcriptPath);
    } else {
      res.status(500).json({ error: "Failed to transcribe" });
    }

    fs.unlinkSync(filePath);
  });
});

function formatTranscript(text) {
  text = text.trim(); // Remove leading/trailing spaces
  text = text.replace(/\s+/g, " "); // Remove extra spaces
  text = text.replace(/([.?!])\s+/g, "$1\n\n"); // Break sentences onto new lines
  return text;
}

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
