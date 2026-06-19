const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

const app = express();

app.use(cors());
app.use(express.json());

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Store clean rows globally
let latestCleanData = [];

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Upload and Validate CSV
app.post("/upload", upload.single("file"), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      let validRows = 0;
      let invalidRows = 0;
      let errors = [];
      let cleanData = [];

      results.forEach((row, index) => {
        let isValid = true;

        // Customer ID Validation
        if (!row.customer_id || row.customer_id.trim() === "") {
          errors.push(`Row ${index + 1} - Missing Customer ID`);
          isValid = false;
        }

        // Full Name Validation
        if (!row.full_name || row.full_name.trim() === "") {
          errors.push(`Row ${index + 1} - Missing Full Name`);
          isValid = false;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!row.email || !emailRegex.test(row.email)) {
          errors.push(`Row ${index + 1} - Invalid Email`);
          isValid = false;
        }

        // Phone Validation
        const phone = String(row.phone_number).trim();

        if (!/^\d{10}$/.test(phone)) {
          errors.push(`Row ${index + 1} - Invalid Phone Number`);
          isValid = false;
        }

        if (isValid) {
          validRows++;
          cleanData.push(row);
        } else {
          invalidRows++;
        }
      });

      // Save for download feature
      latestCleanData = cleanData;

      res.json({
        validRows,
        invalidRows,
        errors,
        cleanData,
      });
    })
    .on("error", (error) => {
      console.error(error);

      res.status(500).json({
        message: "Error reading CSV file",
      });
    });
});

app.get("/download-clean-csv", (req, res) => {
  try {
    if (!latestCleanData.length) {
      return res.status(400).json({
        message: "No clean data available",
      });
    }

    const parser = new Parser();
    const csvData = parser.parse(latestCleanData);

    res.header("Content-Type", "text/csv");
    res.attachment("clean-data.csv");

    return res.send(csvData);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error generating CSV",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
