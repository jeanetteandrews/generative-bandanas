const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const printer = require("pdf-to-printer");
const readline = require("readline");

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "100mb" }));

let selectedPrinter = null;

// Step 1: Prompt user to choose a printer
async function selectPrinter() {
  try {
    const printers = await printer.getPrinters();

    if (!printers || printers.length === 0) {
      console.log("No printers found.");
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
        console.log("Invalid selection.");
        process.exit(1);
      }

      selectedPrinter = printers[index].name;
      console.log(`Selected printer: ${selectedPrinter}`);
      rl.close();

      // Now start the server
      startServer();
    });
  } catch (err) {
    console.error("Failed to list printers:", err);
    process.exit(1);
  }
}

// Step 2: Start Express server
function startServer() {
  app.post("/print", async (req, res) => {
    const base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    const outputPngPath = path.join(__dirname, "output.png");
    const outputPdfPath = path.join(__dirname, "output.pdf");

    try {
      // Save image
      fs.writeFileSync(outputPngPath, base64Data, "base64");

      // Convert to A6 PDF (approx. 105mm × 148mm → 298 x 420 pts)
      await sharp(outputPngPath)
        .withMetadata()
        .pdf({ page: { width: 298, height: 420 } })
        .toFile(outputPdfPath);

      // Print using the selected printer
      await printer.print(outputPdfPath, { printer: selectedPrinter });

      res.send("Printed");
    } catch (err) {
      console.error("Print error:", err);
      res.status(500).send("Failed to print");
    }
  });

  app.listen(3000, () => {
    console.log(`\nServer running at http://localhost:3000`);
  });
}

// Step 3: Kick it off
selectPrinter();
