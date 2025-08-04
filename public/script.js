function startP5Sketch() {
    // Create P5 instance in instance mode to avoid global conflicts
    p5Instance = new p5((p) => {
        p.preload = function() {
            // Load icons for all symptoms
            for (let symptom of userSelectedSymptoms) {
                icons[symptom] = [];
                for (let i = 1; i <= 7; i++) {
                    icons[symptom][i] = p.loadImage(`symptoms/${symptom}${i}.svg`);
                }
            }
        };

        p.setup = function() {
            let canvas = p.createCanvas(3600, 3600);
            canvas.parent('sketch-holder');
            let pixels = p.pixelDensity();
            pixels = 10;
            console.log(`pixel density: ${pixels}`);
            // let canvas = p.createCanvas(3000, 3000);
            canvas.parent('sketch-holder');

            // canvas.elt.style.width = '100%';
            // canvas.elt.style.height = '100%';

            p.angleMode(p.DEGREES);
            p.background(255);
            
            // Generate initial pattern
            generateRandomIcons(p);
            
            // Draw the initial pattern
            drawPattern(p);
            
            // Disable continuous drawing - we'll redraw manually when needed
            p.noLoop();
        };

        p.draw = function() {
            drawPattern(p);
        };
    });
}

function generateRandomIcons(p) {
    if (userSelectedSymptoms.length === 0) return;
    
    iconPositions = [];
    let numIcons = 13;
    let maxAttempts = 200;
    let possibleSymmetries = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 8, 10, 2, 4, 6, 8, 10]
    
    for (let i = 0; i < numIcons; i++) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < maxAttempts) {
            // Step 1: Select a symmetry
            let iconSymmetry = p.random(possibleSymmetries);
            let iconAngle = iconSymmetry === 1 ? 0 : 360 / iconSymmetry;
            
            // Step 2: Randomly place coordinates based on the symmetry
            let x, y;
            switch(iconSymmetry) {
                case 1: // Single icon at center - Gray/Silver
                    x = 0;
                    y = 0;
                    break;
                case 2: // Red
                    x = p.random(0, 2900 /2);
                    x = Math.max(0, x); 
                    y = p.random(0, 2900 /2);
                    y = Math.max(0, y);
                    break;
                case 4: // Blue
                    x = p.random(0, 2900 /2);
                    y = p.random(x, 2900 /2);
                    break;
                case 6: // Green
                    x = p.random(100, 2600 / 6 - 100);
                    y = p.random(x, 2600 /2);
                    break;
                case 8: // Black
                    x = p.random(100,  2400 / 8 - 100);
                    y = p.random(x+200, 2400 /2);
                    break;
                case 10: // Orange
                    x = p.random(200, 2400 / 10 - 200);
                    y = p.random(x+300, 2400 /2);
                    break;
            }
            
            let randomSymptom = p.random(userSelectedSymptoms);
            let iconSize = p.random(190, 290); // Preferred size range
            
            // Apply snapping logic based on symmetry and icon size
            let snapDistance = iconSize / 2;
            let snappedToDiagonal = false;
            
            if (iconSymmetry === 2) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
            } else if (iconSymmetry === 4) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
                
                // Snap to y=x line if within half icon size
                let distanceToLine = Math.abs(y - x);
                if (distanceToLine < snapDistance) {
                    y = x; // Snap to y=x line
                }
            }
            
            // Step 3 & 5: Check collision with all symmetrical positions of existing icons
            let collision = false;
            
            // Generate all symmetrical positions for the new icon
            // If snapped to diagonal line, don't generate mirrored versions
            let newIconPositions;
            if (snappedToDiagonal) {
                newIconPositions = [{x: x, y: y}]; // Only the original position, no mirrors
            } else {
                newIconPositions = generateSymmetricalPositions(x, y, iconSymmetry, iconAngle, p);
            }
            
            // Check collision against all existing icons and their symmetrical positions
            for (let existing of iconPositions) {
                let existingPositions;
                if (existing.snappedToDiagonal) {
                    existingPositions = [{x: existing.x, y: existing.y}]; // Only original position
                } else {
                    existingPositions = generateSymmetricalPositions(
                        existing.x, existing.y, existing.symmetry, existing.angle, p
                    );
                }
                
                // Check each new position against each existing position
                for (let newPos of newIconPositions) {
                    for (let existingPos of existingPositions) {
                        let distance = p.dist(newPos.x, newPos.y, existingPos.x, existingPos.y);
                        let minDistance = (iconSize + existing.size) / 2 - 20;
                        
                        if (distance < minDistance) {
                            collision = true;
                            break;
                        }
                    }
                    if (collision) break;
                }
                if (collision) break;
            }
            
            // Step 4 & 6: If no collision, place the icon
            if (!collision) {
                iconPositions.push({
                    x: x,
                    y: y,
                    symptom: randomSymptom,
                    size: iconSize, // Size 150-250
                    symmetry: iconSymmetry,
                    angle: iconAngle,
                    snappedToDiagonal: snappedToDiagonal
                });
                placed = true;
            }
            
            attempts++;
        }
        
        // If we can't place an icon after max attempts, try with smaller size
        if (!placed) {
            // Fall back to smaller size (100) and relaxed constraints
            let fallbackAttempts = 0;
            while (!placed && fallbackAttempts < 50) {
                let iconSymmetry = p.random(possibleSymmetries);
                let iconAngle = iconSymmetry === 1 ? 0 : 360 / iconSymmetry;
                
                // More lenient placement - anywhere in the canvas
                let x = p.random(-p.width/2 + 100, p.width/2 - 100);
                let y = p.random(-p.height/2 + 100, p.height/2 - 100);
                
                let randomSymptom = p.random(userSelectedSymptoms);
                let fallbackSize = 170; // Smaller fallback size
                
                // Check only basic collision with reduced minimum distance
                let collision = false;
                for (let existing of iconPositions) {
                    let distance = p.dist(x, y, existing.x, existing.y);
                    let minDistance = (fallbackSize + existing.size) / 2 - 20;
                    
                    if (distance < minDistance) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    iconPositions.push({
                        x: x,
                        y: y,
                        symptom: randomSymptom,
                        size: fallbackSize, // Size 100 as fallback
                        symmetry: iconSymmetry,
                        angle: iconAngle,
                        snappedToDiagonal: false
                    });
                    placed = true;
                    console.log(`Placed icon ${i + 1} with fallback method (size 100)`);
                }
                
                fallbackAttempts++;
            }
        }
        
        // If still not placed, force placement with size 100
        if (!placed) {
            console.log(`Force placing icon ${i + 1} with size 100`);
            iconPositions.push({
                x: p.random(-p.width/2 + 100, p.width/2 - 100),
                y: p.random(-p.height/2 + 100, p.height/2 - 100),
                symptom: p.random(userSelectedSymptoms),
                size: 100, // Force size 100 for guaranteed placement
                symmetry: p.random(possibleSymmetries),
                angle: 360 / p.random(possibleSymmetries),
                snappedToDiagonal: false
            });
        }
    }
    
    console.log(`Total icons placed: ${iconPositions.length}`);
}

// Helper function to generate all symmetrical positions for an icon
function generateSymmetricalPositions(x, y, symmetry, angle, p) {
    let positions = [];
    
    if (symmetry === 1) {
        // For symmetry 1, only one position at (0,0)
        positions.push({x: x, y: y});
        return positions;
    }
    
    // Check if icon is snapped to axes or symmetry lines
    const isOnYAxis = (x === 0);
    const isOnXAxis = (y === 0);
    const isOnDiagonal = (Math.abs(y - x) < 1); // y = x line (allowing for floating point precision)
    
    for (let i = 0; i < symmetry; i++) {
        let currentAngle = i * angle;
        
        // Original position rotated
        let rotatedX = x * p.cos(currentAngle) - y * p.sin(currentAngle);
        let rotatedY = x * p.sin(currentAngle) + y * p.cos(currentAngle);
        positions.push({x: rotatedX, y: rotatedY});
        
        // Only add mirrored position if not snapped to a symmetry line
        let shouldMirror = true;
        
        if (symmetry === 2) {
            // For 2-fold symmetry, don't mirror if on x-axis or y-axis
            if (isOnXAxis || isOnYAxis) {
                shouldMirror = false;
            }
        } else if (symmetry === 4) {
            // For 4-fold symmetry, don't mirror if on x-axis, y-axis, or diagonal
            if (isOnXAxis || isOnYAxis || isOnDiagonal) {
                shouldMirror = false;
            }
        }
        // Add more conditions for other symmetries if needed
        
        if (shouldMirror) {
            // Mirrored position rotated
            let mirroredX = x * p.cos(currentAngle) - (-y) * p.sin(currentAngle);
            let mirroredY = x * p.sin(currentAngle) + (-y) * p.cos(currentAngle);
            positions.push({x: mirroredX, y: mirroredY});
        }
    }
    
    return positions;
}

function drawPattern(p) {
    p.background(255);
    p.translate(p.width / 2, p.height / 2);
    

    for (let iconData of iconPositions) {
        // Get the current variant level for this symptom
        let currentLevel = symptomVariants[iconData.symptom] || 0;
        
        // Skip drawing if variant is 0 (hidden)
        if (currentLevel === 0) {
            continue;
        }
        
        let img = icons[iconData.symptom] && icons[iconData.symptom][currentLevel];
        
        if (img) {
            p.tint(0, 0, 0);
            p.push();

            // For symmetry 1, just draw the single icon
            if (iconData.symmetry === 1) {
                p.push();
                p.translate(iconData.x, iconData.y);
                p.image(img, -iconData.size/2, -iconData.size/2, iconData.size, iconData.size);
                p.pop();
            } else {
                // Check if icon is snapped to axes or symmetry lines
                const isOnYAxis = (iconData.x === 0);
                const isOnXAxis = (iconData.y === 0);
                const isOnDiagonal = (Math.abs(iconData.y - iconData.x) < 1); // y = x line
                const isOn3xLine = (Math.abs(iconData.y - 3 * iconData.x) < 1); // y = 3x line
                const isOn4xLine = (Math.abs(iconData.y - 4 * iconData.x) < 1); // y = 4x line
                const isOn5xLine = (Math.abs(iconData.y - 5 * iconData.x) < 1); // y = 5x line
                const isOn6xLine = (Math.abs(iconData.y - 6 * iconData.x) < 1); // y = 6x line
                
                // Show full symmetrical pattern for other symmetries
                for (let i = 0; i < iconData.symmetry; i++) {
                    p.push();
                    p.translate(iconData.x, iconData.y);
                    p.image(img, -iconData.size/2, -iconData.size/2, iconData.size, iconData.size);
                    p.pop();
                    
                    // Only add mirrored version if not snapped to a symmetry line
                    let shouldMirror = true;
                    
                    if (iconData.symmetry === 2) {
                        // For 2-fold symmetry, don't mirror if on x-axis or y-axis
                        if (isOnXAxis || isOnYAxis) {
                            shouldMirror = false;
                        }
                    } else if (iconData.symmetry === 4) {
                        // For 4-fold symmetry, don't mirror if on x-axis, y-axis, or diagonal
                        if (isOnXAxis || isOnYAxis || isOnDiagonal) {
                            shouldMirror = false;
                        }
                    }
                    
                    if (shouldMirror) {
                        p.push();
                        p.scale(1, -1);
                        p.translate(iconData.x, iconData.y);
                        p.image(img, -iconData.size/2, -iconData.size/2, iconData.size, iconData.size);
                        p.pop();
                    }
                    
                    p.rotate(iconData.angle);
                }
            }
            p.pop();
            p.noTint(); // Reset tint for next icon
        }
    }
    // Draw layered borders inside the canvas
    const borders = [
        { thickness: 224, color: 0 },
        { thickness: 204, color: 255 },
        { thickness: 160, color: 0 },
        { thickness: 148, color: 255 },
        { thickness: 104, color: 0 }
    ];

    for (let { thickness, color } of borders) {
        p.push();
        p.resetMatrix();
        p.stroke(color);
        p.strokeWeight(thickness);
        p.noFill();
        p.rect(thickness / 2, thickness / 2, p.width - thickness, p.height - thickness);
        p.pop();
    }
}

let p5Instance = null;

const symptoms = [
    "Angry Outbursts", "Avoidance", "Emotional Numbing", "Exaggerated Startle Response",
    "Excessive Alertness", "Feeling Detached", "Flashbacks", "Intrusive Thoughts",
    "Loss of Interest", "Nightmares", "Problems With Concentration", "Self Blame",
    "Sleep Disturbance"
];

const symptomToHebrew = {
    "Angry Outbursts": "התקפי עצבים",
    "Avoidance": "המנעות",
    "Emotional Numbing": "תפיסה שלילית",
    "Exaggerated Startle Response": "בהלה מופרזת",
    "Excessive Alertness": "דריכות יתר",
    "Feeling Detached": "תחושת ניתוק",
    "Flashbacks": "פלשבקים",
    "Intrusive Thoughts": "מחשבות טורדניות",
    "Loss of Interest": "חסר עניין",
    "Nightmares": "סיוטים",
    "Problems With Concentration": "קשיי ריכוז",
    "Self Blame": "אשמה",
    "Sleep Disturbance": "בעיות שנה"
};


const symptomVariants = {}; // stores { symptomName: variantNumber }
let activeSymptoms = []; // tracks which symptoms are currently active (non-zero)

// P5.js variables
let icons = {};
let iconPositions = [];
let userSelectedSymptoms = symptoms; // Use all symptoms by default

// Initialize the main interface immediately
function initializeMainInterface() {
    const controlsDiv = document.getElementById("controls");
    const addedLabel = document.getElementById("added-label");
    
    // Build control sliders for all symptoms
    symptoms.forEach((symptom, index) => {
        const controlDiv = document.createElement("div");
        controlDiv.classList.add("symptom-control");
        controlDiv.id = `control-${symptom.replace(/\s+/g, '-')}`;

        if (index >= symptoms.length - 3) {
            // Place last 3 symptoms in row 3, columns 3–5
            const col = 3 + (index - (symptoms.length - 3));
            controlDiv.style.gridColumn = `${col}`;
            controlDiv.style.gridRow = "3";
        } else {
            // Fill first 10 into rows 1–2, columns 1–5
            const col = (index % 5) + 1; // columns 1 to 5
            const row = Math.floor(index / 5) + 1; // rows 1 and 2
            controlDiv.style.gridColumn = `${col}`;
            controlDiv.style.gridRow = `${row}`;
        }
        
        const label = document.createElement("div");
        label.classList.add("symptom-label");
        label.textContent = symptomToHebrew[symptom] || symptom;
        
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "7";
        slider.value = "0";
        slider.classList.add("symptom-slider");
        slider.id = `slider-${symptom.replace(/\s+/g, '-')}`;
        
        const valueDisplay = document.createElement("div");
        valueDisplay.classList.add("symptom-value");
        valueDisplay.textContent = "0";
        valueDisplay.id = `value-${symptom.replace(/\s+/g, '-')}`;
        
        controlDiv.appendChild(label);
        controlDiv.appendChild(slider);
        controlDiv.appendChild(valueDisplay);
        controlsDiv.appendChild(controlDiv);
        
        // Initialize variant for this symptom to 0 (hidden)
        symptomVariants[symptom] = 0;
        
        // Add event listener to slider
        slider.addEventListener("input", () => {
            const variant = parseInt(slider.value);
            const previousVariant = symptomVariants[symptom];
            symptomVariants[symptom] = variant;
            
            // Update value display
            valueDisplay.textContent = variant;
            
            // Update control div background
            if (variant > 0) {
                controlDiv.classList.add("active");
            } else {
                controlDiv.classList.remove("active");
            }
            
            // Update active symptoms list with incremental changes
            const wasActive = previousVariant > 0;
            const isActive = variant > 0;
            
            if (!wasActive && isActive) {
                // Symptom became active - add it to the list and distribute incrementally
                activeSymptoms.push(symptom);
                updateSymptomPositions(symptom, null); // Add new symptom
            } else if (wasActive && !isActive) {
                // Symptom became inactive - remove it from the list and redistribute incrementally
                const index = activeSymptoms.indexOf(symptom);
                if (index > -1) {
                    activeSymptoms.splice(index, 1);
                    updateSymptomPositions(null, symptom); // Remove symptom
                }
            }
            
            // Update the "Added:" label
            updateAddedLabel();
            
            // Force redraw to show the new SVG variants
            if (p5Instance) {
                p5Instance.redraw();
            }
        });
    });
    
    // Start P5.js sketch immediately
    startP5Sketch();
}

function updateAddedLabel() {
    const addedLabel = document.getElementById("added-label");
    addedLabel.innerHTML = ""; // Clear previous content

    const symptomToChar = {
        "Angry Outbursts": "E",
        "Avoidance": "C",
        "Emotional Numbing": "D",
        "Exaggerated Startle Response": "E",
        "Excessive Alertness": "E",
        "Feeling Detached": "D",
        "Flashbacks": "B",
        "Intrusive Thoughts": "B",
        "Loss of Interest": "D",
        "Nightmares": "B",
        "Problems With Concentration": "E",
        "Self Blame": "D",
        "Sleep Disturbance": "E"
    };

    const activeSymptomsList = [];

    symptoms.forEach(symptom => {
        const variant = symptomVariants[symptom];
        if (variant > 0) {
            const char = symptomToChar[symptom] || "?";
            const labelText = `${char}-00${variant}`;

            const container = document.createElement("span");
            container.style.display = "inline-flex";
            container.style.alignItems = "center";
            container.style.whiteSpace = "nowrap";

            const labelSpan = document.createElement("span");
            labelSpan.textContent = labelText;
            labelSpan.style.fontSize = "1em";
            labelSpan.style.marginRight = "0.3em";

            const img = document.createElement("img");
            img.src = `variants/${symptom}.svg`;
            img.alt = `${symptom} icon`;
            img.style.height = "1em";  // Match text height
            img.style.width = "auto";
            img.style.verticalAlign = "middle";

            container.appendChild(labelSpan);
            container.appendChild(img);

            activeSymptomsList.push(container);
        }
    });

    if (activeSymptomsList.length > 0) {
        const label = document.createElement("span");
        label.textContent = "Added: ";
        label.style.fontWeight = "bold";
        label.style.marginRight = "0.5em";
        addedLabel.appendChild(label);

        activeSymptomsList.forEach((item, index) => {
            addedLabel.appendChild(item);
            if (index < activeSymptomsList.length - 1) {
                const comma = document.createElement("span");
                comma.textContent = ", ";
                addedLabel.appendChild(comma);
            }
        });
    } else {
        addedLabel.textContent = "Added:";
    }
}




// Initialize everything when the page loads
initializeMainInterface();

// Function to calculate how to distribute icons among active symptoms
function calculateDistribution(numActiveSymptoms) {
    if (numActiveSymptoms === 0) return [];
    
    const totalIcons = 13;
    const baseAmount = Math.floor(totalIcons / numActiveSymptoms);
    const remainder = totalIcons % numActiveSymptoms;
    
    let distribution = new Array(numActiveSymptoms).fill(baseAmount);
    
    // Distribute the remainder by giving +1 to the first 'remainder' symptoms
    for (let i = 0; i < remainder; i++) {
        distribution[i]++;
    }
    
    return distribution;
}

// Function to add a new symptom to random positions
function addSymptomToRandomPositions(newSymptom) {
    if (!p5Instance || iconPositions.length === 0) return;
    
    // Calculate how many positions this new symptom should occupy
    const distribution = calculateDistribution(activeSymptoms.length);
    const symptomIndex = activeSymptoms.indexOf(newSymptom);
    const targetCount = distribution[symptomIndex];
    
    // Find all positions that are currently empty (no symptom assigned)
    const emptyPositions = [];
    for (let i = 0; i < iconPositions.length; i++) {
        if (!iconPositions[i].symptom) {
            emptyPositions.push(i);
        }
    }
    
    // If we don't have enough empty positions, we need to reassign some
    const availablePositions = emptyPositions.length >= targetCount 
        ? emptyPositions 
        : getAllAvailablePositions();
    
    // Shuffle available positions and take the first targetCount
    for (let i = availablePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    // Assign the new symptom to random positions
    for (let i = 0; i < targetCount && i < availablePositions.length; i++) {
        iconPositions[availablePositions[i]].symptom = newSymptom;
    }
    
    console.log(`Added symptom "${newSymptom}" to ${targetCount} random positions`);
}

// Function to remove a specific symptom and redistribute remaining symptoms
function removeSymptomAndRedistribute(symptomToRemove) {
    if (!p5Instance || iconPositions.length === 0) return;
    
    // Find all positions with the symptom to remove
    const removedPositions = [];
    for (let i = 0; i < iconPositions.length; i++) {
        if (iconPositions[i].symptom === symptomToRemove) {
            iconPositions[i].symptom = null; // Clear the symptom
            removedPositions.push(i);
        }
    }
    
    if (activeSymptoms.length === 0) {
        console.log(`Removed symptom "${symptomToRemove}" from ${removedPositions.length} positions`);
        return;
    }
    
    // Calculate new distribution for remaining active symptoms
    const distribution = calculateDistribution(activeSymptoms.length);
    
    // Shuffle the removed positions to randomize reassignment
    for (let i = removedPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [removedPositions[i], removedPositions[j]] = [removedPositions[j], removedPositions[i]];
    }
    
    // Redistribute remaining symptoms to the freed positions
    let positionIndex = 0;
    for (let symptomIndex = 0; symptomIndex < activeSymptoms.length; symptomIndex++) {
        const symptom = activeSymptoms[symptomIndex];
        const currentCount = countSymptomPositions(symptom);
        const targetCount = distribution[symptomIndex];
        const needed = targetCount - currentCount;
        
        // Add this symptom to freed positions if it needs more
        for (let i = 0; i < needed && positionIndex < removedPositions.length; i++) {
            iconPositions[removedPositions[positionIndex]].symptom = symptom;
            positionIndex++;
        }
    }
    
    console.log(`Removed symptom "${symptomToRemove}" and redistributed remaining symptoms to ${removedPositions.length} positions`);
}

// Helper function to get all available positions (for fallback)
function getAllAvailablePositions() {
    return Array.from({ length: iconPositions.length }, (_, i) => i);
}

// Helper function to count how many positions a symptom currently occupies
function countSymptomPositions(symptom) {
    let count = 0;
    for (let i = 0; i < iconPositions.length; i++) {
        if (iconPositions[i].symptom === symptom) {
            count++;
        }
    }
    return count;
}

// Modified main function that handles both adding and removing symptoms
function updateSymptomPositions(addedSymptom = null, removedSymptom = null) {
    if (removedSymptom) {
        removeSymptomAndRedistribute(removedSymptom);
    }
    
    if (addedSymptom) {
        addSymptomToRandomPositions(addedSymptom);
    }
}

// Keep the old redistributeSymptoms function for cases where you need full redistribution (like regenerate)
function redistributeSymptoms() {
    if (!p5Instance || iconPositions.length === 0) return;
    
    if (activeSymptoms.length === 0) {
        // Clear all symptoms from positions
        for (let i = 0; i < iconPositions.length; i++) {
            iconPositions[i].symptom = null;
        }
        return;
    }
    
    // Calculate distribution
    const distribution = calculateDistribution(activeSymptoms.length);
    
    // Clear all current assignments
    for (let i = 0; i < iconPositions.length; i++) {
        iconPositions[i].symptom = null;
    }
    
    // Shuffle the iconPositions array to randomize assignment
    const shuffledIndices = Array.from({ length: iconPositions.length }, (_, i) => i);
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }
    
    // Assign symptoms based on distribution
    let iconIndex = 0;
    for (let symptomIndex = 0; symptomIndex < activeSymptoms.length; symptomIndex++) {
        const symptom = activeSymptoms[symptomIndex];
        const count = distribution[symptomIndex];
        
        for (let i = 0; i < count; i++) {
            if (iconIndex < iconPositions.length) {
                iconPositions[shuffledIndices[iconIndex]].symptom = symptom;
                iconIndex++;
            }
        }
    }
    
    console.log(`Redistributed ${iconPositions.length} icons among ${activeSymptoms.length} active symptoms:`, 
                activeSymptoms.map((symptom, i) => `${symptom}: ${distribution[i]}`));
}

// Regenerate button event listener - keep full redistribution for this case
document.getElementById('regenerate-btn').addEventListener('click', () => {
    if (p5Instance) {
        generateRandomIcons(p5Instance);
        redistributeSymptoms(); // Full redistribution makes sense when regenerating the pattern
        p5Instance.redraw();
    }
});

// Download button event listener
// document.getElementById('download-btn').addEventListener('click', () => {
//     if (p5Instance) {
//         p5Instance.saveCanvas('symptom-pattern', 'png');
//     } else {
//         alert('Canvas not ready for download');
//     }
// });

// Restart button event listener
document.getElementById('restart-btn').addEventListener('click', () => {
    // Reset all symptom variants to 0
    symptoms.forEach(symptom => {
        symptomVariants[symptom] = 0;
        
        // Reset the slider value
        const slider = document.getElementById(`slider-${symptom.replace(/\s+/g, '-')}`);
        if (slider) {
            slider.value = "0";
        }
        
        // Reset the value display
        const valueDisplay = document.getElementById(`value-${symptom.replace(/\s+/g, '-')}`);
        if (valueDisplay) {
            valueDisplay.textContent = "0";
        }
        
        // Remove active class from control div
        const controlDiv = document.getElementById(`control-${symptom.replace(/\s+/g, '-')}`);
        if (controlDiv) {
            controlDiv.classList.remove("active");
        }
    });
    
    // Clear active symptoms array
    activeSymptoms = [];
    
    // Clear all symptom assignments from icon positions
    if (iconPositions.length > 0) {
        for (let i = 0; i < iconPositions.length; i++) {
            iconPositions[i].symptom = null;
        }
    }
    
    // Update the "Added:" label
    updateAddedLabel();
    
    // Force redraw to reflect changes
    if (p5Instance) {
        p5Instance.redraw();
    }
    
    console.log("All symptoms reset to 0");
});

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