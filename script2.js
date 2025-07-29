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
    
    const totalIcons = 26;
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

// Updated slider event listener - use incremental updates
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
        
        // Update active symptoms list with incremental changes
        const wasActive = previousVariant > 0;
        const isActive = variant > 0;
        
        if (!wasActive && isActive) {
            // Symptom became active - add it to the list and distribute incrementally
            activeSymptoms.push(currentSymptom);
            updateSymptomPositions(currentSymptom, null); // Add new symptom
        } else if (wasActive && !isActive) {
            // Symptom became inactive - remove it from the list and redistribute incrementally
            const index = activeSymptoms.indexOf(currentSymptom);
            if (index > -1) {
                activeSymptoms.splice(index, 1);
                updateSymptomPositions(null, currentSymptom); // Remove symptom
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
                // 12: 'Purple'
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

// Regenerate button event listener - keep full redistribution for this case
document.getElementById('regenerate-btn').addEventListener('click', () => {
    if (p5Instance) {
        generateRandomIcons(p5Instance);
        redistributeSymptoms(); // Full redistribution makes sense when regenerating the pattern
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

document.getElementById('print-btn').addEventListener('click', () => {
    if (p5Instance) {
        // Get the canvas and convert to data URL
        const canvas = p5Instance.canvas;
        const dataURL = canvas.toDataURL('image/png');
        
        // Create a hidden iframe for printing
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-1000px';
        printFrame.style.left = '-1000px';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        
        document.body.appendChild(printFrame);
        
        // Write the canvas image to the iframe
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Symptom Pattern</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            background: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        img {
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                        }
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                            }
                            img {
                                width: 100%;
                                height: 100vh;
                                object-fit: contain;
                            }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataURL}" alt="Symptom Pattern" />
                </body>
            </html>
        `);
        frameDoc.close();
        
        // Wait for the image to load, then print
        const img = frameDoc.querySelector('img');
        img.onload = function() {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            // Remove the iframe after a short delay
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 1000);
        };
        
    } else {
        alert('Canvas not ready for printing');
    }
});

// Replace the existing email button event listener with this modified version:

document.getElementById('email-btn').addEventListener('click', () => {
    if (!p5Instance) {
        alert('Canvas not ready.');
        return;
    }

    const email = prompt('Enter your email address:');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    const btn = document.getElementById('email-btn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';

    const canvas = p5Instance.canvas;

    canvas.toBlob(blob => {
        if (!blob) {
            alert('Could not generate image from canvas');
            btn.disabled = false;
            btn.textContent = originalText;
            return;
        }

        const file = new File([blob], 'symptom-pattern.png', { type: 'image/png' });

        // Fill the form fields
        const emailInput = document.getElementById('user-email');
        const fileInput = document.getElementById('canvas-file');
        emailInput.value = email;

        // Create DataTransfer to simulate file upload
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;

        // Submit form
        document.getElementById('email-form').submit();

        // Reset UI
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            alert(`✅ Image sent to ${email}`);
        }, 2000);
    }, 'image/png');
});

// Add this new function to create a tiny version of the canvas
function createTinyCanvas() {
    const tinyCanvas = document.createElement('canvas');
    tinyCanvas.width = 10;
    tinyCanvas.height = 10;
    const ctx = tinyCanvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 10, 10);
    
    // Create a simplified representation of the active symptoms
    // Each active symptom gets a colored pixel
    let pixelIndex = 0;
    const colors = ['#FF0000', '#0000FF', '#00FF00', '#000000', '#FFA500', '#800080', '#C0C0C0'];
    
    for (let i = 0; i < activeSymptoms.length && pixelIndex < 100; i++) {
        const symptom = activeSymptoms[i];
        const variant = symptomVariants[symptom];
        
        if (variant > 0) {
            // Calculate pixel position (row, col)
            const row = Math.floor(pixelIndex / 10);
            const col = pixelIndex % 10;
            
            // Use different colors based on variant level
            const colorIndex = Math.min(variant - 1, colors.length - 1);
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(col, row, 1, 1);
            
            pixelIndex++;
        }
    }
    
    return tinyCanvas;
}

// Alternative version that creates an even smaller data representation
function createMicroCanvas() {
    const microCanvas = document.createElement('canvas');
    microCanvas.width = 1;
    microCanvas.height = 1;
    const ctx = microCanvas.getContext('2d');
    
    // Create a single pixel that represents the overall "intensity" of symptoms
    let totalIntensity = 0;
    for (let symptom of activeSymptoms) {
        totalIntensity += symptomVariants[symptom];
    }
    
    // Map intensity to grayscale (0-255)
    const intensity = Math.min(255, totalIntensity * 10);
    ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
    ctx.fillRect(0, 0, 1, 1);
    
    return microCanvas;
}

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
            let canvas = p.createCanvas(3800, 3800);
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
    let numIcons = 16;
    let maxAttempts = 200; // Increased attempts
    // let possibleSymmetries = [1, 1, 2, 2, 2, 4, 4, 4, 6, 6, 8, 10];
    let possibleSymmetries = [1, 2, 4, 6, 8, 10]
    
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
                    x = p.random(0, 3000 /2);
                    x = Math.max(0, x); 
                    y = p.random(0, 3000 /2);
                    y = Math.max(0, y);
                    break;
                case 4: // Blue
                    x = p.random(0, 3000 /2);
                    y = p.random(x, 3000 /2);
                    break;
                case 6: // Green
                    x = p.random(0, 3000 / 6 - 100);
                    y = p.random(x, 3000 /2);
                    // ymin = 100;
                    // ymax = 3 * x - 200;
                    // if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                    // y = p.random(ymin, ymax);
                    break;
                case 8: // Black
                    x = p.random(100,  3000 / 8 - 100);
                    y = p.random(x+200, 3000 /2);
                    // ymin = 400;
                    // ymax = 4 * x - 200;
                    // if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                    // y = p.random(ymin, ymax);
                    break;
                case 10: // Orange
                    x = p.random(0, 3100 / 10 - 200);
                    y = p.random(x+200, 3100 /2);
                    // ymin = 400;
                    // ymax = 5 * (x - 200);
                    // if (ymin > ymax) [ymin, ymax] = [ymax, ymin]; // flip if needed
                    // y = p.random(ymin, ymax);
                    break;
                // case 12: // Purple
                //     x = p.random(200, 3100 / 12 - 300);
                //     y = p.random(x+200, 3100 /2);
                //     break;
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
            //         // case 12:
            //         //     p.tint(128, 0, 128); // Purple
            //         //     break;
            //         // default:
            //         //     p.tint(128, 128, 128); // Gray for other symmetries
            //         //     break;
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
     // Draw thick black border inside the canvas over all icons
    p.push();
    p.resetMatrix(); // Reset transformations so the border aligns with the canvas edges
    
    let borderThickness = 224; // thickness of the border in pixels
    p.stroke(0);
    p.strokeWeight(borderThickness);
    p.noFill();
    
    // Draw rect inset by half the strokeWeight to fully show the border inside the canvas
    p.rect(borderThickness / 2, borderThickness / 2, p.width - borderThickness, p.height - borderThickness);
    
    p.pop();

    p.push();
    p.resetMatrix(); // Reset transformations so the border aligns with the canvas edges
    
    borderThickness = 204; // thickness of the border in pixels
    p.stroke(255);
    p.strokeWeight(borderThickness);
    p.noFill();
    
    // Draw rect inset by half the strokeWeight to fully show the border inside the canvas
    p.rect(borderThickness / 2, borderThickness / 2, p.width - borderThickness, p.height - borderThickness);
    
    p.pop();


    p.push();
    p.resetMatrix(); // Reset transformations so the border aligns with the canvas edges
    
    borderThickness = 160; // thickness of the border in pixels
    p.stroke(0);
    p.strokeWeight(borderThickness);
    p.noFill();
    
    // Draw rect inset by half the strokeWeight to fully show the border inside the canvas
    p.rect(borderThickness / 2, borderThickness / 2, p.width - borderThickness, p.height - borderThickness);
    
    p.pop();

    p.push();
    p.resetMatrix(); // Reset transformations so the border aligns with the canvas edges
    
    borderThickness = 148; // thickness of the border in pixels
    p.stroke(255);
    p.strokeWeight(borderThickness);
    p.noFill();
    
    // Draw rect inset by half the strokeWeight to fully show the border inside the canvas
    p.rect(borderThickness / 2, borderThickness / 2, p.width - borderThickness, p.height - borderThickness);
    
    p.pop();



    p.push();
    p.resetMatrix(); // Reset transformations so the border aligns with the canvas edges
    
    borderThickness = 104; // thickness of the border in pixels
    p.stroke(0);
    p.strokeWeight(borderThickness);
    p.noFill();
    
    // Draw rect inset by half the strokeWeight to fully show the border inside the canvas
    p.rect(borderThickness / 2, borderThickness / 2, p.width - borderThickness, p.height - borderThickness);
    
    p.pop();
}

// Restart button event listener
document.getElementById('restart-btn').addEventListener('click', () => {
    // Reset all symptom variants to 0
    for (let symptom of symptoms) {
        symptomVariants[symptom] = 0;
    }
    
    // Clear active symptoms
    activeSymptoms = [];
    
    // Clear all icon symptoms (since all symptoms are now inactive)
    if (iconPositions.length > 0) {
        for (let i = 0; i < iconPositions.length; i++) {
            iconPositions[i].symptom = null;
        }
    }
    
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