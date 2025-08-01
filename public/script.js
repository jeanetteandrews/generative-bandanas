const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "100mb" }));

app.post("/print", async (req, res) => {
  const base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
  const outputPngPath = path.join(__dirname, "output.png");
  const outputPdfPath = path.join(__dirname, "output.pdf");

  try {
    fs.writeFileSync(outputPngPath, base64Data, "base64");

    // Convert to A6 PDF (298 x 420 points)
    await sharp(outputPngPath)
      .withMetadata()
      .pdf({
        page: { width: 298, height: 420 },
      })
      .toFile(outputPdfPath);

    // Path to SumatraPDF
    const sumatraPath = path.join(__dirname, "SumatraPDF", "SumatraPDF-3.5.2-64.exe");

    const command = `"${sumatraPath}" -print-to-default -silent "${outputPdfPath}"`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Print failed:", err);
        res.status(500).send("Printing error.");
      } else {
        console.log("Printed successfully");
        res.send("Printed");
      }
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server error.");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
