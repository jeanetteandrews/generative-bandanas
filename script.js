const symptoms = [
  "angryoutbursts", "avoidance", "emotionalnumbing", "exaggeratedstartleresponse",
  "excessivealertness", "feelingdetached", "flashbacks", "intrusivethoughts",
  "lossofinterest", "nightmares", "problemswithconcentration", "selfblame",
  "sleepdisturbance"
];

const introScreen = document.getElementById("intro-screen");
const selectionContainer = document.getElementById("symptom-selection");
const nextButton = document.getElementById("next-button");
const mainInterface = document.getElementById("main-interface");
const controlsDiv = document.getElementById("controls");
const sketchHolder = document.getElementById("sketch-holder");
const overlayGrid = document.getElementById("overlay-grid");


const selectedSymptoms = new Set();


// Create buttons for each symptom
symptoms.forEach(symptom => {
  const btn = document.createElement("button");
  btn.textContent = symptom;
  btn.addEventListener("click", () => {
    if (selectedSymptoms.has(symptom)) {
      selectedSymptoms.delete(symptom);
      btn.classList.remove("selected");
    } else {
      selectedSymptoms.add(symptom);
      btn.classList.add("selected");
    }
  });
  selectionContainer.appendChild(btn);
});

// When "Next" is clicked
nextButton.addEventListener("click", () => {
  if (selectedSymptoms.size === 0) {
    alert("Please select at least one symptom.");
    return;
  }

  // Hide intro screen and show main interface
  introScreen.style.display = "none";
  mainInterface.style.display = "block";

  // Build control buttons based on selected symptoms
  selectedSymptoms.forEach(symptom => {
    const btn = document.createElement("button");
    btn.textContent = symptom;
    btn.classList.add("control-button");
    btn.addEventListener("click", () => {
      document.querySelectorAll("#controls button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show correct SVG variant logic goes here (if you have that already)
      // For example: updateSliderFor(symptom);
    });
    controlsDiv.appendChild(btn);
  });
  createMainGrid();
  createOverlayGrid();

});

// Initially hide main interface
mainInterface.style.display = "none";

// A helper function that returns a symptom based on a (col, row) in the top-left 7x7 quadrant
function getSymptom(col, row) {
  // feelingdetached (symptoms[5])
  if (
    (col === 3 && row === 3) || (col === 3 && row === 4) || (col === 4 && row === 3) || (col === 4 && row === 4) ||
    (col === 3 && row === 9) || (col === 3 && row === 10) || (col === 4 && row === 9) || (col === 4 && row === 10) ||
    (col === 9 && row === 3) || (col === 9 && row === 4) || (col === 10 && row === 3) || (col === 10 && row === 4) ||
    (col === 9 && row === 9) || (col === 9 && row === 10) || (col === 10 && row === 9) || (col === 10 && row === 10)
  ) return symptoms[5];

  // flashbacks (symptoms[6])
  if (
    (col === 2 && row === 3) || (col === 2 && row === 4) || (col === 3 && row === 2) || (col === 4 && row === 2) ||
    (col === 2 && row === 9) || (col === 2 && row === 10) || (col === 3 && row === 11) || (col === 4 && row === 11) ||
    (col === 9 && row === 2) || (col === 10 && row === 2) || (col === 11 && row === 3) || (col === 11 && row === 4) ||
    (col === 9 && row === 11) || (col === 10 && row === 11) || (col === 11 && row === 9) || (col === 11 && row === 10)
  ) return symptoms[6];

  // intrusivethoughts (symptoms[7])
  if (
    (col === 0 && row === 0) || (col === 1 && row === 1) || (col === 2 && row === 2) ||
    (col === 0 && row === 13) || (col === 1 && row === 12) || (col === 2 && row === 11) ||
    (col === 13 && row === 0) || (col === 12 && row === 1) || (col === 11 && row === 2) ||
    (col === 13 && row === 13) || (col === 12 && row === 12) || (col === 11 && row === 11)
  ) return symptoms[7];

  // lossofinterest (symptoms[8])
  if (
    (col === 5 && row === 2) || (col === 5 && row === 1) || (col === 5 && row === 0) ||
    (col === 5 && row === 11) || (col === 5 && row === 12) || (col === 5 && row === 13) ||
    (col === 8 && row === 2) || (col === 8 && row === 1) || (col === 8 && row === 0) ||
    (col === 8 && row === 11) || (col === 8 && row === 12) || (col === 8 && row === 13)
  ) return symptoms[8];

  // nightmares (symptoms[9])
  if (
    (col === 2 && row === 5) || (col === 1 && row === 5) || (col === 0 && row === 5) ||
    (col === 2 && row === 8) || (col === 1 && row === 8) || (col === 0 && row === 8) ||
    (col === 11 && row === 5) || (col === 12 && row === 5) || (col === 13 && row === 5) ||
    (col === 11 && row === 8) || (col === 12 && row === 8) || (col === 13 && row === 8)
  ) return symptoms[9];

  // problemswithconcentration (symptoms[10])
  if (
    (col === 0 && row >= 1 && row <= 5) ||
    (col >= 1 && col <= 5 && row === 0) ||
    (col === 0 && row >= 8 && row <= 12) ||
    (col >= 1 && col <= 5 && row === 13) ||
    (col === 13 && row >= 1 && row <= 5) ||
    (col >= 8 && col <= 12 && row === 0) ||
    (col === 13 && row >= 8 && row <= 12) ||
    (col >= 8 && col <= 12 && row === 13)
  ) return symptoms[10];

  // selfblame (symptoms[11])
  if (
    (col === 6 && row === 1) || (col === 1 && row === 6) || (col === 0 && row === 6) || (col === 6 && row === 0) ||
    (col === 7 && row === 1) || (col === 12 && row === 6) || (col === 13 && row === 6) || (col === 7 && row === 0) ||
    (col === 6 && row === 13) || (col === 1 && row === 7) || (col === 0 && row === 7) || (col === 6 && row === 12) ||
    (col === 7 && row === 13) || (col === 12 && row === 7) || (col === 13 && row === 7) || (col === 7 && row === 12)
  ) return symptoms[11];

  // sleepdisturbance (symptoms[12])
  if (
    (col === 2 && row === 1) || (col === 3 && row === 1) || (col === 4 && row === 1) ||
    (col === 1 && row === 2) || (col === 1 && row === 3) || (col === 1 && row === 4) ||

    (col === 2 && row === 12) || (col === 3 && row === 12) || (col === 4 && row === 12) ||
    (col === 1 && row === 10) || (col === 1 && row === 9) || (col === 1 && row === 8) ||

    (col === 12 && row === 1) || (col === 11 && row === 1) || (col === 10 && row === 1) ||
    (col === 13 && row === 2) || (col === 13 && row === 3) || (col === 13 && row === 4) ||

    (col === 12 && row === 12) || (col === 11 && row === 12) || (col === 10 && row === 12) ||
    (col === 13 && row === 10) || (col === 13 && row === 9) || (col === 13 && row === 8) ||

    (col === 9 && row === 1) || (col === 12 && row === 2) || (col === 12 && row === 3) ||
    (col === 12 && row === 4) || (col === 1 && row === 11) || (col === 9 && row === 12) ||
    (col === 12 && row === 9) || (col === 12 && row === 10) || (col === 12 && row === 11)
  ) return symptoms[12];
}

function getOverlaySymptom(i, j) {
  // angryoutbursts (symptoms[0])
  if (
    (i === 3 && j === 3) || (i === 3 && j === 4) || (i === 4 && j === 3) || (i === 4 && j === 4)
  ) return symptoms[0];

  // avoidance (symptoms[1])
  if (
    (i === 1 && j === 1) || (i === 1 && j === 6) || (i === 6 && j === 1) || (i === 6 && j === 6)
  ) return symptoms[1];

  // emotionalnumbing (symptoms[2])
  if (
    (i === 2 && j === 3) || (i === 2 && j === 2) || (i === 3 && j === 2) ||
    (i === 5 && j === 3) || (i === 5 && j === 2) || (i === 4 && j === 2) ||
    (i === 2 && j === 4) || (i === 2 && j === 5) || (i === 3 && j === 5) ||
    (i === 5 && j === 4) || (i === 5 && j === 5) || (i === 4 && j === 5)
  ) return symptoms[2];

  // exaggeratedstartleresponse (symptoms[3])
  if (
    (i === 1 && j === 2) || (i === 2 && j === 1) || (i === 1 && j === 3) || (i === 3 && j === 1) ||
    (i === 1 && j === 5) || (i === 2 && j === 6) || (i === 1 && j === 4) || (i === 3 && j === 6) ||
    (i === 6 && j === 2) || (i === 5 && j === 1) || (i === 6 && j === 3) || (i === 4 && j === 1) ||
    (i === 6 && j === 5) || (i === 5 && j === 6) || (i === 6 && j === 4) || (i === 4 && j === 6)
  ) return symptoms[3];

  // excessivealertness (symptoms[4])
  if (
    (i === 0 && j === 3) || (i === 0 && j === 2) || (i === 0 && j === 1) || (i === 0 && j === 0) ||
    (i === 1 && j === 0) || (i === 2 && j === 0) || (i === 3 && j === 0) ||

    (i === 7 && j === 3) || (i === 7 && j === 2) || (i === 7 && j === 1) || (i === 7 && j === 0) ||
    (i === 6 && j === 0) || (i === 5 && j === 0) || (i === 4 && j === 0) ||

    (i === 0 && j === 4) || (i === 0 && j === 5) || (i === 0 && j === 6) || (i === 0 && j === 7) ||
    (i === 1 && j === 7) || (i === 2 && j === 7) || (i === 3 && j === 7) ||

    (i === 7 && j === 4) || (i === 7 && j === 5) || (i === 7 && j === 6) || (i === 7 && j === 7) ||
    (i === 6 && j === 7) || (i === 5 && j === 7) || (i === 4 && j === 7)
  ) return symptoms[4];

  return null;
}


function createMainGrid() {
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 14; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.id = `cell-${col}-${row}`;

      let symptom = getSymptom(col, row);
      if (symptom && selectedSymptoms.has(symptom)) {
        cell.dataset.symptom = symptom;

        fetch(`symptoms/${symptom}1.svg`)
          .then(res => res.text())
          .then(svgMarkup => {
            cell.innerHTML = svgMarkup;

            const svgElement = cell.querySelector('svg');
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.setAttribute('preserveAspectRatio', 'none');

            let flipX = col >= 7;
            let flipY = row >= 7;
            const scaleX = flipX ? -1 : 1;
            const scaleY = flipY ? -1 : 1;
            svgElement.style.transform = `scale(${scaleX}, ${scaleY})`;
            svgElement.style.transformOrigin = 'center center';
          });
      }

      sketchHolder.appendChild(cell);
    }
  }
}

function createOverlayGrid() {
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      const cell = document.createElement('div');
      cell.className = 'overlay-cell';
      cell.id = `overlay-cell-${i}-${j}`;

      const symptom = getOverlaySymptom(i, j);
      if (symptom && selectedSymptoms.has(symptom)) {
        cell.dataset.symptom = symptom;

        fetch(`symptoms/${symptom}1.svg`)
          .then(res => res.text())
          .then(svgMarkup => {
            cell.innerHTML = svgMarkup;

            const svgElement = cell.querySelector('svg');
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.setAttribute('preserveAspectRatio', 'none');

            let flipX = i >= 4;
            let flipY = j >= 4;
            const scaleX = flipX ? -1 : 1;
            const scaleY = flipY ? -1 : 1;
            svgElement.style.transform = `scale(${scaleX}, ${scaleY})`;
            svgElement.style.transformOrigin = 'center center';
          });
      }

      overlayGrid.appendChild(cell);
    }
  }
}
