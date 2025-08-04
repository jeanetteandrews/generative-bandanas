let p5Instance = null;

// Color state
let currentColors = {
  pattern: '#020202',
  border: '#020202',
  background: '#fffcef'
};
let activeColorType = null; // 'pattern', 'border', or 'background'

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

const symptomVariants = {};
let activeSymptoms = [];

// P5.js variables
let icons = {};
let iconPositions = [];
let userSelectedSymptoms = symptoms;

function startP5Sketch() {
    p5Instance = new p5((p) => {
        p.preload = function() {
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
            p.angleMode(p.DEGREES);
            p.background(255);
            
            generateRandomIcons(p);
            drawPattern(p);
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
            let iconSymmetry = p.random(possibleSymmetries);
            let iconAngle = iconSymmetry === 1 ? 0 : 360 / iconSymmetry;
            
            let x, y;
            switch(iconSymmetry) {
                case 1:
                    x = 0;
                    y = 0;
                    break;
                case 2:
                    x = p.random(0, 2900 /2);
                    x = Math.max(0, x); 
                    y = p.random(0, 2900 /2);
                    y = Math.max(0, y);
                    break;
                case 4:
                    x = p.random(0, 2900 /2);
                    y = p.random(x, 2900 /2);
                    break;
                case 6:
                    x = p.random(100, 2600 / 6 - 100);
                    y = p.random(x+100, 2600 /2);
                    break;
                case 8:
                    x = p.random(100,  2400 / 8 - 100);
                    y = p.random(x+200, 2400 /2);
                    break;
                case 10:
                    x = p.random(200, 2400 / 10 - 200);
                    y = p.random(x+300, 2400 /2);
                    break;
            }
            
            let randomSymptom = p.random(userSelectedSymptoms);
            
            let iconHeight= p.random(220, 290);
            let iconWidth = 0; // This will maintain aspect ratio

            let estimatedSize = iconHeight; // Use width as reference for collision detection
            
            let snapDistance = estimatedSize / 2;
            let snappedToDiagonal = false;
            
            if (iconSymmetry === 2) {
                if (x < snapDistance) {
                    x = 0;
                }
                if (y < snapDistance) {
                    y = 0;
                }
            } else if (iconSymmetry === 4) {
                if (x < snapDistance) {
                    x = 0;
                }
                if (y < snapDistance) {
                    y = 0;
                }
                
                let distanceToLine = Math.abs(y - x);
                if (distanceToLine < snapDistance) {
                    y = x;
                }
            }
            
            let collision = false;
            let newIconPositions;
            if (snappedToDiagonal) {
                newIconPositions = [{x: x, y: y}];
            } else {
                newIconPositions = generateSymmetricalPositions(x, y, iconSymmetry, iconAngle, p);
            }
            
            for (let existing of iconPositions) {
                let existingPositions;
                if (existing.snappedToDiagonal) {
                    existingPositions = [{x: existing.x, y: existing.y}];
                } else {
                    existingPositions = generateSymmetricalPositions(
                        existing.x, existing.y, existing.symmetry, existing.angle, p
                    );
                }
                
                for (let newPos of newIconPositions) {
                    for (let existingPos of existingPositions) {
                        let distance = p.dist(newPos.x, newPos.y, existingPos.x, existingPos.y);
                        let minDistance = (estimatedSize + existing.size) / 2;
                        
                        if (distance < minDistance) {
                            collision = true;
                            break;
                        }
                    }
                    if (collision) break;
                }
                if (collision) break;
            }
            
            if (!collision) {
                iconPositions.push({
                    x: x,
                    y: y,
                    symptom: randomSymptom,
                    width: iconWidth,
                    height: iconHeight,
                    size: estimatedSize, // Keep for collision detection
                    symmetry: iconSymmetry,
                    angle: iconAngle,
                    snappedToDiagonal: snappedToDiagonal
                });
                placed = true;
            }
            
            attempts++;
        }
        
        if (!placed) {
            let fallbackAttempts = 0;
            while (!placed && fallbackAttempts < 50) {
                let iconSymmetry = p.random(possibleSymmetries);
                let iconAngle = iconSymmetry === 1 ? 0 : 360 / iconSymmetry;
                
                let x = p.random(-p.width/2 + 100, p.width/2 - 100);
                let y = p.random(-p.height/2 + 100, p.height/2 - 100);
                
                let randomSymptom = p.random(userSelectedSymptoms);
                let fallbackWidth = 0;
                let fallbackHeight = 190;
                let fallbackSize = 190;
                
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
                        width: fallbackWidth,
                        height: fallbackHeight,
                        size: fallbackSize,
                        symmetry: iconSymmetry,
                        angle: iconAngle,
                        snappedToDiagonal: false
                    });
                    placed = true;
                }
                
                fallbackAttempts++;
            }
        }
        
        if (!placed) {
            iconPositions.push({
                x: p.random(-p.width/2 + 100, p.width/2 - 100),
                y: p.random(-p.height/2 + 100, p.height/2 - 100),
                symptom: p.random(userSelectedSymptoms),
                width: 100,
                height: 0,
                size: 100,
                symmetry: p.random(possibleSymmetries),
                angle: 360 / p.random(possibleSymmetries),
                snappedToDiagonal: false
            });
        }
    }
}

function generateSymmetricalPositions(x, y, symmetry, angle, p) {
    let positions = [];
    
    if (symmetry === 1) {
        positions.push({x: x, y: y});
        return positions;
    }
    
    const isOnYAxis = (x === 0);
    const isOnXAxis = (y === 0);
    const isOnDiagonal = (Math.abs(y - x) < 1);
    
    for (let i = 0; i < symmetry; i++) {
        let currentAngle = i * angle;
        
        let rotatedX = x * p.cos(currentAngle) - y * p.sin(currentAngle);
        let rotatedY = x * p.sin(currentAngle) + y * p.cos(currentAngle);
        positions.push({x: rotatedX, y: rotatedY});
        
        let shouldMirror = true;
        
        if (symmetry === 2) {
            if (isOnXAxis || isOnYAxis) {
                shouldMirror = false;
            }
        } else if (symmetry === 4) {
            if (isOnXAxis || isOnYAxis || isOnDiagonal) {
                shouldMirror = false;
            }
        }
        
        if (shouldMirror) {
            let mirroredX = x * p.cos(currentAngle) - (-y) * p.sin(currentAngle);
            let mirroredY = x * p.sin(currentAngle) + (-y) * p.cos(currentAngle);
            positions.push({x: mirroredX, y: mirroredY});
        }
    }
    
    return positions;
}

function drawPattern(p) {
    // Get the mapped colors for canvas rendering
    const canvasBackgroundColor = getCanvasColor(currentColors.background, 'background');
    const canvasBorderColor = getCanvasColor(currentColors.border, 'border');
    const canvasPatternColor = getCanvasColor(currentColors.pattern, 'pattern');

    // Set background color
    let bgColor = p.color(canvasBackgroundColor);
    p.background(bgColor);
    p.translate(p.width / 2, p.height / 2);
    
    // Set pattern color tint
    let patternColor = p.color(currentColors.pattern);
    
    for (let iconData of iconPositions) {
        let currentLevel = symptomVariants[iconData.symptom] || 0;
        
        if (currentLevel === 0) {
            continue;
        }
        
        let img = icons[iconData.symptom] && icons[iconData.symptom][currentLevel];
        
        if (img) {
            // Create a resized copy to maintain aspect ratio
            let resizedImg = img.get(); // Create a copy
            resizedImg.resize(iconData.width, iconData.height); // Resize with aspect ratio
            
            // Get actual dimensions after resize for centering
            let actualWidth = resizedImg.width;
            let actualHeight = resizedImg.height;
            
            p.tint(patternColor);
            p.push();

            if (iconData.symmetry === 1) {
                p.push();
                p.translate(iconData.x, iconData.y);
                p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                p.pop();
            } else {
                const isOnYAxis = (iconData.x === 0);
                const isOnXAxis = (iconData.y === 0);
                const isOnDiagonal = (Math.abs(iconData.y - iconData.x) < 1);
                
                for (let i = 0; i < iconData.symmetry; i++) {
                    p.push();
                    p.translate(iconData.x, iconData.y);
                    p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                    p.pop();
                    
                    let shouldMirror = true;
                    
                    if (iconData.symmetry === 2) {
                        if (isOnXAxis || isOnYAxis) {
                            shouldMirror = false;
                        }
                    } else if (iconData.symmetry === 4) {
                        if (isOnXAxis || isOnYAxis || isOnDiagonal) {
                            shouldMirror = false;
                        }
                    }
                    
                    if (shouldMirror) {
                        p.push();
                        p.scale(1, -1);
                        p.translate(iconData.x, iconData.y);
                        p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                        p.pop();
                    }
                    
                    p.rotate(iconData.angle);
                }
            }
            p.pop();
            p.noTint();
        }
    }
    
    // Draw layered borders with selected color (using mapped color)
    const borderColor = p.color(canvasBorderColor);
    const borders = [
        { thickness: 224, color: borderColor },
        { thickness: 204, color: bgColor },
        { thickness: 160, color: borderColor },
        { thickness: 148, color: bgColor },
        { thickness: 104, color: borderColor }
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

// Initialize the main interface
function initializeMainInterface() {
    const controlsDiv = document.getElementById("controls");

    symptoms.forEach((symptom, index) => {
        const controlDiv = document.createElement("div");
        controlDiv.classList.add("symptom-control");
        controlDiv.id = `control-${symptom.replace(/\s+/g, '-')}`;

        // Custom grid placement for last 3 symptoms
        if (index >= symptoms.length - 3) {
            const col = 3 + (index - (symptoms.length - 3));
            controlDiv.style.gridColumn = `${col}`;
            controlDiv.style.gridRow = "3";
        } else {
            const col = (index % 5) + 1;
            const row = Math.floor(index / 5) + 1;
            controlDiv.style.gridColumn = `${col}`;
            controlDiv.style.gridRow = `${row}`;
        }

        // Label as a button
        const label = document.createElement("button");
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

        symptomVariants[symptom] = 0;

        // === Slider input logic ===
        slider.addEventListener("input", () => {
            const variant = parseInt(slider.value);
            const previousVariant = symptomVariants[symptom];
            symptomVariants[symptom] = variant;
            valueDisplay.textContent = variant;

            if (variant > 0) {
                controlDiv.classList.add("active");
            } else {
                controlDiv.classList.remove("active");
            }

            const wasActive = previousVariant > 0;
            const isActive = variant > 0;

            if (!wasActive && isActive) {
                activeSymptoms.push(symptom);
                updateSymptomPositions(symptom, null);
            } else if (wasActive && !isActive) {
                const index = activeSymptoms.indexOf(symptom);
                if (index > -1) {
                    activeSymptoms.splice(index, 1);
                    updateSymptomPositions(null, symptom);
                }
            }

            updateAddedLabel();
            if (p5Instance) p5Instance.redraw();
        });

        // === Toggle slider on label click ===
        label.addEventListener("click", () => {
            slider.value = slider.value === "0" ? "1" : "0";
            slider.dispatchEvent(new Event("input")); // Trigger slider logic
        });
    });

    initializeColorSelection();
    startP5Sketch();
}



const colorMapping = {
    '#020202': '#272727',
    '#fffcef': '#f0e9c9',
    '#573f33': '#b7a69f',
    '#0a1849': '#1d3da2',
    '#b7d1e6': '#88bde6',
    '#771026': '#56021c',
    '#f7e7bc': '#efe0a0',
    '#a8ae28': '#626520',
    '#f9922d': '#bc6b26',
    '#c8a2c8': '#ba91c9'
};

// Function to get the actual color to use on canvas
function getCanvasColor(selectedColor, elementType, backgroundColorForComparison = null) {
    // Border and background always use original colors
    if (elementType === 'background' || elementType === 'border') {
        return selectedColor;
    }
    
    // Pattern logic: use original UNLESS background is already using the same original color
    if (elementType === 'pattern') {
        // If pattern color matches background color, switch pattern to mapped version
        if (selectedColor === backgroundColorForComparison) {
            return colorMapping[selectedColor] || selectedColor;
        }
        // Otherwise use original color
        return selectedColor;
    }
    
    return selectedColor;
}

// Updated drawPattern function that uses color mapping
function drawPattern(p) {
    // Get the colors using the new logic
    const canvasBackgroundColor = getCanvasColor(currentColors.background, 'background');
    const canvasBorderColor = getCanvasColor(currentColors.border, 'border');
    const canvasPatternColor = getCanvasColor(currentColors.pattern, 'pattern', currentColors.background);
    
    // Set background color (always original)
    let bgColor = p.color(canvasBackgroundColor);
    p.background(bgColor);
    p.translate(p.width / 2, p.height / 2);
    
    // Set pattern color tint (original unless it matches background, then mapped)
    let patternColor = p.color(canvasPatternColor);
    
    for (let iconData of iconPositions) {
        let currentLevel = symptomVariants[iconData.symptom] || 0;
        
        if (currentLevel === 0) {
            continue;
        }
        
        let img = icons[iconData.symptom] && icons[iconData.symptom][currentLevel];
        
        if (img) {
            // Create a resized copy to maintain aspect ratio
            let resizedImg = img.get(); // Create a copy
            resizedImg.resize(iconData.width, iconData.height); // Resize with aspect ratio
            
            // Get actual dimensions after resize for centering
            let actualWidth = resizedImg.width;
            let actualHeight = resizedImg.height;
            
            p.tint(patternColor);
            p.push();

            if (iconData.symmetry === 1) {
                p.push();
                p.translate(iconData.x, iconData.y);
                p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                p.pop();
            } else {
                const isOnYAxis = (iconData.x === 0);
                const isOnXAxis = (iconData.y === 0);
                const isOnDiagonal = (Math.abs(iconData.y - iconData.x) < 1);
                
                for (let i = 0; i < iconData.symmetry; i++) {
                    p.push();
                    p.translate(iconData.x, iconData.y);
                    p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                    p.pop();
                    
                    let shouldMirror = true;
                    
                    if (iconData.symmetry === 2) {
                        if (isOnXAxis || isOnYAxis) {
                            shouldMirror = false;
                        }
                    } else if (iconData.symmetry === 4) {
                        if (isOnXAxis || isOnYAxis || isOnDiagonal) {
                            shouldMirror = false;
                        }
                    }
                    
                    if (shouldMirror) {
                        p.push();
                        p.scale(1, -1);
                        p.translate(iconData.x, iconData.y);
                        p.image(resizedImg, -actualWidth/2, -actualHeight/2);
                        p.pop();
                    }
                    
                    p.rotate(iconData.angle);
                }
            }
            p.pop();
            p.noTint();
        }
    }
    
    // Draw layered borders with selected color (always original)
    const borderColor = p.color(canvasBorderColor);
    const borders = [
        { thickness: 224, color: borderColor },
        { thickness: 204, color: bgColor },
        { thickness: 160, color: borderColor },
        { thickness: 148, color: bgColor },
        { thickness: 104, color: borderColor }
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

function initializeColorSelection() {
    // Color type button handlers
    document.getElementById('pattern-color-btn').addEventListener('click', () => {
        setActiveColorType('pattern');
    });
    
    document.getElementById('border-color-btn').addEventListener('click', () => {
        setActiveColorType('border');
    });
    
    document.getElementById('background-color-btn').addEventListener('click', () => {
        setActiveColorType('background');
    });
    
    // Color option handlers
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            if (activeColorType) {
                const color = option.dataset.color;
                currentColors[activeColorType] = color;
                updateColorSelection();
                if (p5Instance) {
                    p5Instance.redraw();
                }
            }
        });
    });
    setActiveColorType('background');
}

function setActiveColorType(type) {
    activeColorType = type;
    
    // Update button states
    document.querySelectorAll('.color-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${type}-color-btn`).classList.add('active');
    
    updateColorSelection();
}

function updateColorSelection() {
    // Update color option selections
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (activeColorType && option.dataset.color === currentColors[activeColorType]) {
            option.classList.add('selected');
        }
    });
}

function updateAddedLabel() {
    const addedLabel = document.getElementById("added-label");
    addedLabel.innerHTML = "";

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
            img.style.height = "0.85em";
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

// Symptom distribution functions
function calculateDistribution(numActiveSymptoms) {
    if (numActiveSymptoms === 0) return [];
    
    const totalIcons = 13;
    const baseAmount = Math.floor(totalIcons / numActiveSymptoms);
    const remainder = totalIcons % numActiveSymptoms;
    
    let distribution = new Array(numActiveSymptoms).fill(baseAmount);
    
    for (let i = 0; i < remainder; i++) {
        distribution[i]++;
    }
    
    return distribution;
}

function addSymptomToRandomPositions(newSymptom) {
    if (!p5Instance || iconPositions.length === 0) return;
    
    const distribution = calculateDistribution(activeSymptoms.length);
    const symptomIndex = activeSymptoms.indexOf(newSymptom);
    const targetCount = distribution[symptomIndex];
    
    const emptyPositions = [];
    for (let i = 0; i < iconPositions.length; i++) {
        if (!iconPositions[i].symptom) {
            emptyPositions.push(i);
        }
    }
    
    const availablePositions = emptyPositions.length >= targetCount 
        ? emptyPositions 
        : getAllAvailablePositions();
    
    for (let i = availablePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    for (let i = 0; i < targetCount && i < availablePositions.length; i++) {
        iconPositions[availablePositions[i]].symptom = newSymptom;
    }
}

function removeSymptomAndRedistribute(symptomToRemove) {
    if (!p5Instance || iconPositions.length === 0) return;
    
    const removedPositions = [];
    for (let i = 0; i < iconPositions.length; i++) {
        if (iconPositions[i].symptom === symptomToRemove) {
            iconPositions[i].symptom = null;
            removedPositions.push(i);
        }
    }
    
    if (activeSymptoms.length === 0) {
        return;
    }
    
    const distribution = calculateDistribution(activeSymptoms.length);
    
    for (let i = removedPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [removedPositions[i], removedPositions[j]] = [removedPositions[j], removedPositions[i]];
    }
    
    let positionIndex = 0;
    for (let symptomIndex = 0; symptomIndex < activeSymptoms.length; symptomIndex++) {
        const symptom = activeSymptoms[symptomIndex];
        const currentCount = countSymptomPositions(symptom);
        const targetCount = distribution[symptomIndex];
        const needed = targetCount - currentCount;
        
        for (let i = 0; i < needed && positionIndex < removedPositions.length; i++) {
            iconPositions[removedPositions[positionIndex]].symptom = symptom;
            positionIndex++;
        }
    }
}

function getAllAvailablePositions() {
    return Array.from({ length: iconPositions.length }, (_, i) => i);
}

function countSymptomPositions(symptom) {
    let count = 0;
    for (let i = 0; i < iconPositions.length; i++) {
        if (iconPositions[i].symptom === symptom) {
            count++;
        }
    }
    return count;
}

function updateSymptomPositions(addedSymptom = null, removedSymptom = null) {
    if (removedSymptom) {
        removeSymptomAndRedistribute(removedSymptom);
    }
    
    if (addedSymptom) {
        addSymptomToRandomPositions(addedSymptom);
    }
}

function redistributeSymptoms() {
    if (!p5Instance || iconPositions.length === 0) return;
    
    if (activeSymptoms.length === 0) {
        for (let i = 0; i < iconPositions.length; i++) {
            iconPositions[i].symptom = null;
        }
        return;
    }
    
    const distribution = calculateDistribution(activeSymptoms.length);
    
    for (let i = 0; i < iconPositions.length; i++) {
        iconPositions[i].symptom = null;
    }
    
    const shuffledIndices = Array.from({ length: iconPositions.length }, (_, i) => i);
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }
    
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
}

// Initialize everything when the page loads
initializeMainInterface();

// Button event listeners
document.getElementById('regenerate-btn').addEventListener('click', () => {
    if (p5Instance) {
        generateRandomIcons(p5Instance);
        redistributeSymptoms();
        p5Instance.redraw();
    }
});

document.getElementById('restart-btn').addEventListener('click', () => {
    symptoms.forEach(symptom => {
        symptomVariants[symptom] = 0;
        
        const slider = document.getElementById(`slider-${symptom.replace(/\s+/g, '-')}`);
        if (slider) {
            slider.value = "0";
        }
        
        const valueDisplay = document.getElementById(`value-${symptom.replace(/\s+/g, '-')}`);
        if (valueDisplay) {
            valueDisplay.textContent = "0";
        }
        
        const controlDiv = document.getElementById(`control-${symptom.replace(/\s+/g, '-')}`);
        if (controlDiv) {
            controlDiv.classList.remove("active");
        }
    });
    
    activeSymptoms = [];
    
    if (iconPositions.length > 0) {
        for (let i = 0; i < iconPositions.length; i++) {
            iconPositions[i].symptom = null;
        }
    }
    
    updateAddedLabel();
    
    if (p5Instance) {
        p5Instance.redraw();
    }
});

document.getElementById("print-btn").addEventListener("click", async () => {
    const canvas = document.querySelector("canvas");

    if (!canvas) {
        alert("No canvas found!");
        return;
    }

    const imageData = canvas.toDataURL("image/png");

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

function openFullscreen() {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

document.getElementById("start-screen").addEventListener("click", () => {
  openFullscreen();

  // Hide the overlay
  document.getElementById("start-screen").style.display = "none";

  // Optional: center .fixed-ratio-wrapper again
  document.getElementById("main-interface").style.display = "flex";
});
