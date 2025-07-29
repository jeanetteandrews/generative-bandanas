let currentSymptom = null;
const selectedSlider = document.getElementById("variant-slider");
const selectedLabel = document.getElementById("selected-label");

const symptoms = [
    "Angry Outbursts", "Avoidance", "Emotional Numbing", "Exaggerated Startle Response",
    "Excessive Alertness", "Feeling Detached", "Flashbacks", "Intrusive Thoughts",
    "Loss of Interest", "Nightmares", "Problems With Concentration", "Self Blame",
    "Sleep Disturbance"
];

const mainInterface = document.getElementById("main-interface");
const controlButtonsDiv = document.getElementById("controls");

const symptomVariants = {}; // stores { symptomName: variantNumber }
let activeSymptoms = []; // tracks which symptoms are currently active (non-zero)

// P5.js variables
let icons = {};
let iconPositions = [];
let userSelectedSymptoms = symptoms; // Use all symptoms by default
let showOriginalOnly = false; // Toggle for showing original vs symmetrical pattern
let showSymmetryLines = false; // Toggle for showing symmetry lines
let showAllBlack = false; // Toggle for making all symbols black

// P5.js instance variable
let p5Instance = null;

// Initialize the main interface immediately
function initializeMainInterface() {
    // Make sure slider starts at 0 and can go to 0
    selectedSlider.min = "0";
    selectedSlider.max = "7";
    selectedSlider.value = "0";
    
    // Build control buttons for all symptoms
    symptoms.forEach((symptom, index) => {
        const btn = document.createElement("button");
        btn.textContent = symptom;
        btn.classList.add("control-button");
        
        btn.addEventListener("click", () => {
            document.querySelectorAll(".control-button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            currentSymptom = symptom;
            const variant = symptomVariants[symptom]; // No fallback to 1
            
            if (variant === 0) {
                selectedLabel.textContent = `Selected: ${symptom} (Hidden)`;
            } else {
                selectedLabel.textContent = `Selected: ${symptom} (Variant ${variant})`;
            }
            
            selectedSlider.value = variant;
        });
        
        controlButtonsDiv.appendChild(btn);
        
        // Initialize variant for this symptom to 0 (hidden)
        symptomVariants[symptom] = 0;
        
        // Automatically select the first symptom
        if (index === 0) {
            btn.classList.add("active");
            currentSymptom = symptom;
            selectedLabel.textContent = `Selected: ${symptom} (Hidden)`;
            selectedSlider.value = 0;
        }
    });
    
    // Start P5.js sketch immediately
    startP5Sketch();
}

// Initialize everything when the page loads
initializeMainInterface();

// Function to calculate how to distribute icons among active symptoms
function calculateDistribution(numActiveSymptoms) {
    if (numActiveSymptoms === 0) return [];
    
    const totalIcons = 13; // Changed from 26 to 13
    const baseAmount = Math.floor(totalIcons / numActiveSymptoms);
    const remainder = totalIcons % numActiveSymptoms;
    
    let distribution = new Array(numActiveSymptoms).fill(baseAmount);
    
    // Distribute the remainder by giving +1 to the first 'remainder' symptoms
    for (let i = 0; i < remainder; i++) {
        distribution[i]++;
    }
    
    return distribution;
}

// Function to redistribute symptoms among icons
function redistributeSymptoms() {
    if (!p5Instance || iconPositions.length === 0) return;
    
    if (activeSymptoms.length === 0) {
        // No active symptoms - all icons stay as they are but won't be visible
        return;
    }
    
    // Calculate distribution
    const distribution = calculateDistribution(activeSymptoms.length);
    
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

// Slider event listener
selectedSlider.addEventListener("input", () => {
    if (currentSymptom && p5Instance) {
        const variant = parseInt(selectedSlider.value);
        const previousVariant = symptomVariants[currentSymptom];
        symptomVariants[currentSymptom] = variant;
        
        // Update label to show current variant level
        if (variant === 0) {
            selectedLabel.textContent = `Selected: ${currentSymptom} (Hidden)`;
        } else {
            selectedLabel.textContent = `Selected: ${currentSymptom} (Variant ${variant})`;
        }
        
        // Update active symptoms list
        const wasActive = previousVariant > 0;
        const isActive = variant > 0;
        
        if (!wasActive && isActive) {
            // Symptom became active
            activeSymptoms.push(currentSymptom);
            redistributeSymptoms();
        } else if (wasActive && !isActive) {
            // Symptom became inactive
            const index = activeSymptoms.indexOf(currentSymptom);
            if (index > -1) {
                activeSymptoms.splice(index, 1);
                redistributeSymptoms();
            }
        }
        
        // Console log icon colors for the current symptom only
        if (iconPositions.length > 0 && variant > 0) {
            const colorCounts = {};
            const symmetryToColor = {
                1: 'Silver/Light Gray',
                2: 'Red', 
                4: 'Blue',
                6: 'Green',
                8: 'Black',
                10: 'Orange',
                12: 'Purple'
            };
            
            // Count icons that belong to the current symptom only
            for (let iconData of iconPositions) {
                if (iconData.symptom === currentSymptom) {
                    const color = symmetryToColor[iconData.symmetry] || 'Unknown';
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            }
            
            console.log(`Colors of icons for ${currentSymptom} (variant ${variant}):`);
            Object.entries(colorCounts).forEach(([color, count]) => {
                console.log(`  ${color}: ${count} icons`);
            });
            console.log(`Total ${currentSymptom} icons: ${Object.values(colorCounts).reduce((a, b) => a + b, 0)}`);
        } else if (variant === 0) {
            console.log(`${currentSymptom} is now hidden (variant 0)`);
        }
        
        // Force redraw to show the new SVG variants
        p5Instance.redraw();
    }
});

// Regenerate button event listener
document.getElementById('regenerate-btn').addEventListener('click', () => {
    if (p5Instance) {
        generateRandomIcons(p5Instance);
        redistributeSymptoms(); // Redistribute after generating new pattern
        p5Instance.redraw();
    }
});

// Download button event listener
document.getElementById('download-btn').addEventListener('click', () => {
    if (p5Instance) {
        p5Instance.saveCanvas('symptom-pattern', 'png');
    } else {
        alert('Canvas not ready for download');
    }
});

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
            let canvas = p.createCanvas(4000, 4000);
            // let canvas = p.createCanvas(3000, 3000);
            canvas.parent('sketch-holder');

            canvas.elt.style.width = '100%';
            canvas.elt.style.height = '100%';

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

        // p.keyPressed = function() {
        //     if (p.key === ' ') {
        //         // Toggle between original and symmetrical pattern when spacebar is pressed
        //         showOriginalOnly = !showOriginalOnly;
        //         p.redraw();
        //         return false; // Prevent default spacebar behavior
        //     } else if (p.key === 'q' || p.key === 'Q') {
        //         // Toggle symmetry lines visibility
        //         showSymmetryLines = !showSymmetryLines;
        //         p.redraw();
        //         return false;
        //     } else if (p.key === 'w' || p.key === 'W') {
        //         // Toggle all symbols to black
        //         showAllBlack = !showAllBlack;
        //         p.redraw();
        //         return false;
        //     }
        // };
    });
}

function generateRandomIcons(p) {
    if (userSelectedSymptoms.length === 0) return;
    
    iconPositions = [];
    let numIcons = 13; // Changed from 26 to 13
    let maxAttempts = 200; // Increased attempts
    let possibleSymmetries = [1, 2, 2, 4, 4, 6, 8];
    
    for (let i = 0; i < numIcons; i++) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < maxAttempts) {
            // Step 1: Select a symmetry
            let iconSymmetry = p.random(possibleSymmetries);
            let iconAngle = iconSymmetry === 1 ? 0 : 360 / iconSymmetry;
            
            // Step 2: Randomly place coordinates based on the symmetry
            let x, y, ymin, ymax, maxRadius, radius, randomAngle;
            switch(iconSymmetry) {
                case 1: // Single icon at center - Gray/Silver
                    x = 0;
                    y = 0;
                    break;
                case 2: // Red
                    x = p.random(0, 2500 /2);
                    y = p.random(0, 2500 /2);
                    break;
                case 4: // Blue
                    x = p.random(0, 2500 /2);
                    y = p.random(x, 2500 /2);
                    break;
                case 6: // Green
                    x = p.random(100, 2500 / 2 - 300);
                    ymin = 100;
                    ymax = 3 * x - 300;
                    if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                    y = p.random(ymin, ymax);
                    break;
                case 8: // Black
                    x = p.random(100, 2500 / 2 - 400);
                    ymin = 100;
                    ymax = 4 * x - 400;
                    if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                    y = p.random(ymin, ymax);
                    break;
                // case 10: // Orange
                //     x = p.random(250, 2600 / 2 - 100);
                //     ymin = 250;
                //     ymax = 5 * x - 100;
                //     if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                //     y = p.random(ymin, ymax);
                //     break;
                // case 12: // Purple
                //     x = p.random(200, 2600 / 2 - 100);
                //     ymin = 200;
                //     ymax = 6 * x - 100;
                //     if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                //     y = p.random(ymin, ymax);
                //     break;
            }
            
            let randomSymptom = p.random(userSelectedSymptoms);
            let iconSize = p.random(200, 300); // Preferred size range
            
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
            } else if (iconSymmetry === 6) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
                
                // Snap to y=3x line if within half icon size
                let distanceToLine = Math.abs(y - 3 * x) / Math.sqrt(1 + 9); // Distance from point to line y=3x
                if (distanceToLine < snapDistance) {
                    y = 3 * x; // Snap to y=3x line
                    snappedToDiagonal = true;
                }
            } else if (iconSymmetry === 8) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
                
                // Snap to y=4x line if within half icon size
                let distanceToLine = Math.abs(y - 4 * x) / Math.sqrt(1 + 16); // Distance from point to line y=4x
                if (distanceToLine < snapDistance) {
                    y = 4 * x; // Snap to y=4x line
                    snappedToDiagonal = true;
                }
            } else if (iconSymmetry === 10) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
                
                // Snap to y=5x line if within half icon size
                let distanceToLine = Math.abs(y - 5 * x) / Math.sqrt(1 + 25); // Distance from point to line y=5x
                if (distanceToLine < snapDistance) {
                    y = 5 * x; // Snap to y=5x line
                    snappedToDiagonal = true;
                }
            } else if (iconSymmetry === 12) {
                // Snap to axes if within half icon size
                if (x < snapDistance) {
                    x = 0; // Snap to y-axis (x=0)
                }
                if (y < snapDistance) {
                    y = 0; // Snap to x-axis (y=0)
                }
                
                // Snap to y=6x line if within half icon size
                let distanceToLine = Math.abs(y - 6 * x) / Math.sqrt(1 + 36); // Distance from point to line y=6x
                if (distanceToLine < snapDistance) {
                    y = 6 * x; // Snap to y=6x line
                    snappedToDiagonal = true;
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
                        let minDistance = (iconSize + existing.size) / 2 - 40;
                        
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
                let fallbackSize = 150; // Smaller fallback size
                
                // Check only basic collision with reduced minimum distance
                let collision = false;
                for (let existing of iconPositions) {
                    let distance = p.dist(x, y, existing.x, existing.y);
                    let minDistance = (fallbackSize + existing.size) / 2;
                    
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
    const isOn3xLine = (Math.abs(y - 3 * x) < 1); // y = 3x line
    const isOn4xLine = (Math.abs(y - 4 * x) < 1); // y = 4x line
    const isOn5xLine = (Math.abs(y - 5 * x) < 1); // y = 5x line
    const isOn6xLine = (Math.abs(y - 6 * x) < 1); // y = 6x line
    
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
        } else if (symmetry === 6) {
            // For 6-fold symmetry, don't mirror if on x-axis, y-axis, or y=3x line
            if (isOnXAxis || isOnYAxis || isOn3xLine) {
                shouldMirror = false;
            }
        } else if (symmetry === 8) {
            // For 8-fold symmetry, don't mirror if on x-axis, y-axis, or y=4x line
            if (isOnXAxis || isOnYAxis || isOn4xLine) {
                shouldMirror = false;
            }
        } else if (symmetry === 10) {
            // For 10-fold symmetry, don't mirror if on x-axis, y-axis, or y=5x line
            if (isOnXAxis || isOnYAxis || isOn5xLine) {
                shouldMirror = false;
            }
        } else if (symmetry === 12) {
            // For 12-fold symmetry, don't mirror if on x-axis, y-axis, or y=6x line
            if (isOnXAxis || isOnYAxis || isOn6xLine) {
                shouldMirror = false;
            }
        }
        
        if (shouldMirror) {
            // Mirrored position rotated
            let mirroredX = x * p.cos(currentAngle) - (-y) * p.sin(currentAngle);
            let mirroredY = x * p.sin(currentAngle) + (-y) * p.cos(currentAngle);
            positions.push({x: mirroredX, y: mirroredY});
        }
    }
    
    return positions;
}

function drawSymmetryLines(p) {
    if (!showSymmetryLines) return;
    
    // Get all unique symmetries used in current pattern
    let usedSymmetries = new Set();
    for (let iconData of iconPositions) {
        let currentLevel = symptomVariants[iconData.symptom] || 0;
        if (currentLevel > 0) { // Only consider visible icons
            usedSymmetries.add(iconData.symmetry);
        }
    }
    
    // Draw lines for each used symmetry
    for (let symmetry of usedSymmetries) {
        // Skip drawing lines for symmetry 1 (single icon)
        if (symmetry === 1) continue;
        
        let angleStep = 360 / symmetry;
        let lineColor;
        
        // Set line color based on symmetry
        switch(symmetry) {
            case 2:
                lineColor = p.color(255, 0, 0); // Red
                break;
            case 4:
                lineColor = p.color(0, 0, 255); // Blue
                break;
            case 6:
                lineColor = p.color(0, 255, 0); // Green
                break;
            case 8:
                lineColor = p.color(0, 0, 0); // Black
                break;
            case 10:
                lineColor = p.color(255, 165, 0); // Orange
                break;
            case 12:
                lineColor = p.color(128, 0, 128); // Purple
                break;
            default:
                lineColor = p.color(128, 128, 128); // Gray for other symmetries
                break;
        }
        
        p.stroke(lineColor);
        p.strokeWeight(2);
        
        // Draw symmetry lines
        for (let i = 0; i < symmetry; i++) {
            let angle = i * angleStep;
            let lineLength = p.width; // Make lines go across entire canvas
            
            p.push();
            p.rotate(angle);
            p.line(0, 0, lineLength/2, 0);
            p.line(0, 0, -lineLength/2, 0);
            p.pop();
        }
        
        // Also draw the reflection line (horizontal line for vertical mirroring)
        p.stroke(lineColor);
        p.strokeWeight(1);
        p.line(-p.width/2, 0, p.width/2, 0);
    }
    
    p.noStroke(); // Reset stroke for other drawing
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
            // Set color based on toggle or symmetry
            // if (showAllBlack) {
            //     p.tint(0, 0, 0); // All black when toggle is on
            // } else {
            //     // Set color based on symmetry
            //     switch(iconData.symmetry) {
            //         case 1:
            //             p.tint(192, 192, 192); // Silver/Light Gray
            //             break;
            //         case 2:
            //             p.tint(255, 0, 0); // Red
            //             break;
            //         case 4:
            //             p.tint(0, 0, 255); // Blue
            //             break;
            //         case 6:
            //             p.tint(0, 255, 0); // Green
            //             break;
            //         case 8:
            //             p.tint(0, 0, 0); // Black
            //             break;
            //         case 10:
            //             p.tint(255, 165, 0); // Orange
            //             break;
            //         case 12:
            //             p.tint(128, 0, 128); // Purple
            //             break;
            //         default:
            //             p.tint(128, 128, 128); // Gray for other symmetries
            //             break;
            //     }
            // }
            
            p.push();
            
            if (showOriginalOnly) {
                // Show only the original placements without symmetry
                p.push();
                p.translate(iconData.x, iconData.y);
                p.image(img, -iconData.size/2, -iconData.size/2, iconData.size, iconData.size);
                p.pop();
            } else {
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
            }
            
            p.pop();
            p.noTint(); // Reset tint for next icon
        }
    }
}

// Restart button event listener
document.getElementById('restart-btn').addEventListener('click', () => {
    // Reset all symptom variants to 0
    for (let symptom of symptoms) {
        symptomVariants[symptom] = 0;
    }
    
    // Clear active symptoms
    activeSymptoms = [];
    
    // Update the current symptom display
    if (currentSymptom) {
        selectedLabel.textContent = `Selected: ${currentSymptom} (Hidden)`;
        selectedSlider.value = 0;
    }
    
    // Remove active class from all buttons and add to first button
    document.querySelectorAll(".control-button").forEach(b => b.classList.remove("active"));
    const firstButton = document.querySelector(".control-button");
    if (firstButton) {
        firstButton.classList.add("active");
        currentSymptom = symptoms[0];
        selectedLabel.textContent = `Selected: ${currentSymptom} (Hidden)`;
        selectedSlider.value = 0;
    }
    
    // Redraw the pattern (should show no icons since all are hidden)
    if (p5Instance) {
        p5Instance.redraw();
    }
    
    console.log('All symptoms reset to hidden (variant 0)');
});