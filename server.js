document.getElementById("print-btn").addEventListener("click", async () => {
  const canvas = document.querySelector("canvas");

  if (!canvas) {
    alert("No canvas found!");
    return;
  }

  // Convert canvas to base64 PNG
  const imageData = canvas.toDataURL("image/png");

  // Send to server for printing
  try {
    const response = await fetch("/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });

    const text = await response.text();
    if (response.ok) {
      console.log("Print successful:", text);
    } else {
      console.error("Print failed:", text);
    }
  } catch (err) {
    console.error("Error printing:", err);
  }
});
