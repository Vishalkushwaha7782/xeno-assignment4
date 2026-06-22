const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json());

// =====================
// Create uploads folder
// =====================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("Current Directory:", __dirname);
console.log("Upload Directory:", uploadDir);
console.log("Upload Directory Exists:", fs.existsSync(uploadDir));

// =====================
// Multer Configuration
// =====================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
});

// =====================
// Global Clean Data
// =====================

let latestCleanData = [];

// =====================
// Test Route
// =====================

app.get("/", (req, res) => {
  res.send("Backend Running");
});

// =====================
// Upload Route
// =====================

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    console.log("===== UPLOAD REQUEST =====");
    console.log("FILE RECEIVED:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("FILE PATH:", req.file.path);
    console.log("FILE EXISTS:", fs.existsSync(req.file.path));

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        console.log("CSV READ SUCCESSFULLY");

        let validRows = 0;
        let invalidRows = 0;
        let errors = [];
        let cleanData = [];

        results.forEach((row, index) => {
          let isValid = true;

          if (!row.customer_id || row.customer_id.trim() === "") {
            errors.push(`Row ${index + 2} - Missing Customer ID`);
            isValid = false;
          }

          if (!row.full_name || row.full_name.trim() === "") {
            errors.push(`Row ${index + 2} - Missing Full Name`);
            isValid = false;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!row.email || !emailRegex.test(row.email)) {
            errors.push(`Row ${index + 2} - Invalid Email`);
            isValid = false;
          }

          const phone = String(row.phone_number || "").trim();

          if (!/^\d{10}$/.test(phone)) {
            errors.push(`Row ${index + 2} - Invalid Phone Number`);
            isValid = false;
          }

          if (isValid) {
            validRows++;
            cleanData.push(row);
          } else {
            invalidRows++;
          }
        });

        latestCleanData = cleanData;

        // Delete uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Delete Error:", err);
          }
        });

        return res.json({
          success: true,
          totalRows: results.length,
          validRows,
          invalidRows,
          errors,
          cleanData,
        });
      })
      .on("error", (err) => {
        console.error("CSV ERROR:", err);

        return res.status(500).json({
          success: false,
          message: err.message,
        });
      });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// Download Clean CSV
// =====================

app.get("/download-clean-csv", (req, res) => {
  try {
    if (!latestCleanData.length) {
      return res.status(400).json({
        success: false,
        message: "No clean data available",
      });
    }

    const parser = new Parser();
    const csvData = parser.parse(latestCleanData);

    res.header("Content-Type", "text/csv");
    res.attachment("clean-data.csv");

    return res.send(csvData);
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Error generating CSV",
    });
  }
});

// =====================
// Start Server
// =====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
