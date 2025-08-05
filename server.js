const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const printer = require("pdf-to-printer");
const readline = require("readline");

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "100mb" }));

let selectedPrinter = null;

// Function to convert PNG to PDF using pdf-lib
async function pngToPdf(pngPath, pdfPath) {
  const pngImageBytes = fs.readFileSync(pngPath);
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngImageBytes);

  // Page size: 4 x 6 inches in points
  const pageWidth = 288;  // 4 inches
  const pageHeight = 432; // 6 inches
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Original image dimensions
  const imgWidth = pngImage.width;
  const imgHeight = pngImage.height;

  // Calculate scale to fit image within page while preserving aspect ratio
  const widthScale = pageWidth / imgWidth;
  const heightScale = pageHeight / imgHeight;
  const scale = Math.min(widthScale, heightScale);

  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;

  // Center the image on the page
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;

  page.drawImage(pngImage, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);
}


// Ask user to select printer on server start
async function selectPrinter() {
  try {
    const printers = await printer.getPrinters();

    if (!printers || printers.length === 0) {
      console.log("No printers found. Exiting.");
      process.exit(1);
    }

    console.log("\nAvailable Printers:");
    printers.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\nSelect a printer number from the list above: ", (answer) => {
      const index = parseInt(answer.trim()) - 1;

      if (isNaN(index) || index < 0 || index >= printers.length) {
        console.log("Invalid selection. Exiting.");
        process.exit(1);
      }

      selectedPrinter = printers[index].name;
      console.log(`Selected printer: ${selectedPrinter}`);
      rl.close();

      startServer();
    });
  } catch (err) {
    console.error("Failed to list printers:", err);
    process.exit(1);
  }
}

// Start Express server and setup print route
function startServer() {
  app.post("/print", async (req, res) => {
    const base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    const outputPngPath = path.join(__dirname, "output.png");
    const outputPdfPath = path.join(__dirname, "output.pdf");

    try {
      // Save PNG image file
      fs.writeFileSync(outputPngPath, base64Data, "base64");

      // Convert PNG to PDF
      await pngToPdf(outputPngPath, outputPdfPath);

      // Send PDF to printer
      await printer.print(outputPdfPath, { printer: selectedPrinter });

      res.send("Printed");
    } catch (err) {
      console.error("Print error:", err);
      res.status(500).send("Failed to print");
    }
  });

  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}

// Start by asking user to pick a printer
selectPrinter();
