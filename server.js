const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const printer = require("pdf-to-printer");
const readline = require("readline");
const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "100mb" }));
let selectedPrinter = null;

// Function to convert PNG to PDF using pdf-lib with two canvases
async function createPdfFromTwoCanvases(mainImagePath, variantImagePath, pdfPath) {
  const mainImageBytes = fs.readFileSync(mainImagePath);
  const variantImageBytes = fs.readFileSync(variantImagePath);
  
  const pdfDoc = await PDFDocument.create();
  const mainImage = await pdfDoc.embedPng(mainImageBytes);
  const variantImage = await pdfDoc.embedPng(variantImageBytes);
  
  // Page size: 4 x 6 inches in points
  const pageWidth = 288;  // 4 inches
  const pageHeight = 432; // 6 inches
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Define margins
  const margin = pageWidth * 0.08; 
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);
  
  // Main canvas (bandana pattern) 
  const mainImgWidth = mainImage.width;
  const mainImgHeight = mainImage.height;
  
  // Make main canvas 96% of content width and position it in upper portion
  const mainWidthScale = (contentWidth * 0.96) / mainImgWidth; // 96% of content width
  const mainHeightScale = (contentHeight * 0.75) / mainImgHeight; // Leave 25% for variant list
  const mainScale = Math.min(mainWidthScale, mainHeightScale) * 1.15; // 15% bigger
  
  const mainDrawWidth = mainImgWidth * mainScale;
  const mainDrawHeight = mainImgHeight * mainScale;
  
  // Position main canvas in upper portion, centered horizontally within content area
  const mainX = margin + (contentWidth - mainDrawWidth) / 2;
  const mainY = pageHeight - margin - mainDrawHeight - 20; // 20 points from top margin
  
  page.drawImage(mainImage, {
    x: mainX,
    y: mainY,
    width: mainDrawWidth,
    height: mainDrawHeight,
  });
  
  // Variant canvas (variant list)
  const variantImgWidth = variantImage.width;
  const variantImgHeight = variantImage.height;
  
  // Scale variant canvas to fit below main canvas
  const availableVariantHeight = mainY - margin - 10; // Space below main canvas minus bottom margin
  const variantWidthScale = (contentWidth * 0.9) / variantImgWidth; // Use 90% of content width
  const variantHeightScale = availableVariantHeight / variantImgHeight;
  const variantScale = Math.min(variantWidthScale, variantHeightScale);
  
  const variantDrawWidth = variantImgWidth * variantScale;
  const variantDrawHeight = variantImgHeight * variantScale;
  
  // Position variant canvas below main canvas, aligned to left edge of main canvas
  const variantX = mainX - 5; // Align with left edge of main canvas, nudge 5 points
  const variantY = mainY - variantDrawHeight - 50; // 10 points below main canvas
  
  page.drawImage(variantImage, {
    x: variantX,
    y: variantY,
    width: variantDrawWidth,
    height: variantDrawHeight,
  });
  
  // Add black border around the entire PDF page
//   page.drawRectangle({
//     x: 0,
//     y: 0,
//     width: pageWidth,
//     height: pageHeight,
//     borderColor: rgb(0, 0, 0), // Black border
//     borderWidth: 1, // 2 point border width
//     color: undefined, // No fill, just border
//   });
  
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
    const mainImageData = req.body.mainImage.replace(/^data:image\/png;base64,/, "");
    const variantImageData = req.body.variantImage.replace(/^data:image\/png;base64,/, "");
    
    const outputMainPngPath = path.join(__dirname, "output-main.png");
    const outputVariantPngPath = path.join(__dirname, "output-variant.png");
    const outputPdfPath = path.join(__dirname, "output.pdf");
    
    console.log("Received print request with two canvases");
    
    try {
      // Save both PNG image files
      fs.writeFileSync(outputMainPngPath, mainImageData, "base64");
      fs.writeFileSync(outputVariantPngPath, variantImageData, "base64");
      
      // Create PDF with both canvases
      await createPdfFromTwoCanvases(outputMainPngPath, outputVariantPngPath, outputPdfPath);
      
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