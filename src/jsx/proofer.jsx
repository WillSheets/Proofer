/*
 * PROOFER - CEP Host Script for Adobe Illustrator
 * Creates proof templates for label production with proper dimensions,
 * guidelines, and spot colors according to print specifications.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// File paths
var ROOT_FOLDER = (function () {
    var thisFile = new File($.fileName);
    return thisFile.parent.parent.parent; // Navigate up to extension root
})();

var LEGENDS_FOLDER_PATH = ROOT_FOLDER.fsName + "/assets/legends";

// Unit conversion
var INCH_TO_POINTS = 72;

// Label Configuration
var LABEL_TYPE_CONFIG = {
    "Sheets": {},
    "Rolls": {},
    "Die-cut": {},
    "Custom": {}
};

// Dimensioning
var DIMENSION_OFFSETS_TABLE = {
    "Rolls": {
        "under0_5":  { dimLine: 0.1875, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.2125, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.2375, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.3125, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
    "Sheets": {
        "under0_5":  { dimLine: 0.25, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2625, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.275, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
    "Die-cut": {
        "under0_5":  { dimLine: 0.3125, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.325, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.3375, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3625, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.4375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    },
    "Custom": {
        "under0_5":  { dimLine: 0.25, text: 0.025, strokeWidth: 0.5, fontSize: 4, arrowAction: "50%" },
        "0_5to1":    { dimLine: 0.2625, text: 0.0375, strokeWidth: 0.75, fontSize: 6, arrowAction: "50%" },
        "1to2":      { dimLine: 0.275, text: 0.0375, strokeWidth: 0.75, fontSize: 8, arrowAction: "50%" },
        "2to4":      { dimLine: 0.3, text: 0.0375, strokeWidth: 1, fontSize: 8, arrowAction: "50%" },
        "4to6":      { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "6to10":     { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" },
        "over10":    { dimLine: 0.375, text: 0.0375, strokeWidth: 1, fontSize: 12, arrowAction: "75%" }
    }
};

var DIMENSION_FONT_NAME = "Arial-BoldMT";
var DIMENSION_ACTION_SET_NAME = "Add Arrows";
var DIMENSION_COLOR_CMYK = [0, 100, 0, 0]; // Magenta

// Bleed Line
var BLEEDLINE_COLOR_CMYK = [100, 0, 0, 0]; // Cyan
var BLEEDLINE_COLOR_NAME = "BleedLine";

// General
var FONT_NAME = "MyriadPro-Regular";

// Preferences
var PREF_KEY_DEFAULT_DIR = "LabelProof/defaultUploadDir";
var PREFS_FILE = File(Folder.userData + "/LabelProofPrefs.json");

// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================

function createRectangle(doc, x, y, width, height) {
    var rect = doc.pathItems.rectangle(y + height, x, width, height);
    return rect;
}

function createRoundedRectangle(doc, x, y, width, height, cornerRadius) {
    var rect = doc.pathItems.roundedRectangle(y + height, x, width, height, cornerRadius, cornerRadius);
    return rect;
}

function createEllipse(doc, centerX, centerY, width, height) {
    var left = centerX - width / 2;
    var top = centerY + height / 2;
    var ellipse = doc.pathItems.ellipse(top, left, width, height);
    return ellipse;
}

// ============================================================================
// ILLUSTRATOR UTILITIES
// ============================================================================

function createDocument(widthInches, heightInches, name) {
    var preset = new DocumentPreset();
    preset.units = RulerUnits.Inches;
    preset.width = widthInches * INCH_TO_POINTS;
    preset.height = heightInches * INCH_TO_POINTS;
    preset.colorMode = DocumentColorSpace.CMYK;
    preset.rasterResolution = DocumentRasterResolution.HighResolution;
    preset.title = name || "Untitled";
    
    var doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
    doc.rulerUnits = RulerUnits.Inches;
    
    return doc;
}

function fitViewToArt(doc) {
    app.executeMenuCommand("fitall");
}

function createSpotColor(doc, name, cmykValues) {
    var spot = doc.spots.add();
    spot.name = name;
    
    var color = new CMYKColor();
    color.cyan = cmykValues[0];
    color.magenta = cmykValues[1];
    color.yellow = cmykValues[2];
    color.black = cmykValues[3];
    
    spot.color = color;
    spot.colorType = ColorModel.SPOT;
    
    var spotColor = new SpotColor();
    spotColor.spot = spot;
    
    return spotColor;
}

function createLabelShape(doc, shapeType, widthPts, heightPts) {
    var shape;
    var centerX = doc.width / 2;
    var centerY = doc.height / 2;
    var x = centerX - widthPts / 2;
    var y = centerY - heightPts / 2;
    
    switch (shapeType) {
        case "Rounded":
            var cornerRadius = Math.min(widthPts, heightPts) * 0.1;
            shape = createRoundedRectangle(doc, x, y, widthPts, heightPts, cornerRadius);
            break;
        case "Round":
            shape = createEllipse(doc, centerX, centerY, widthPts, heightPts);
            break;
        default: // "Squared"
            shape = createRectangle(doc, x, y, widthPts, heightPts);
            break;
    }
    
    return shape;
}

function applyStrokeToShape(shape, strokeColor, strokeWidth, name) {
    shape.stroked = true;
    shape.strokeColor = strokeColor;
    shape.strokeWidth = strokeWidth;
    shape.filled = false;
    if (name) shape.name = name;
}

function runOffsetAction(labelType) {
    try {
        // Map labelType to the exact action names in the Actions panel
        var actionName;
        switch(labelType) {
            case "Sheets":
                actionName = "Sheet Offset";
                break;
            case "Rolls":
                actionName = "Roll Offset";
                break;
            case "Die-cut":
                actionName = "Die-Cut Offset";
                break;
            default:
                actionName = labelType;
        }
        
        // Use the correct action set name "Proofer Actions"
        app.doScript(actionName, "Proofer Actions");
        return true;
    } catch (e) {
        // If the action isn't found, provide helpful error message
        alert("Action '" + actionName + "' not found in 'Proofer Actions' action set.\n\nPlease ensure the 'Proofer Actions' action set is loaded with actions named:\n- Sheet Offset\n- Roll Offset\n- Die-Cut Offset");
        return false;
    }
}

function handleMultiplePaths(doc, labelType, dielineColorSpot, bleedLineSpotColor) {
    var selection = doc.selection;
    var bounds = [];
    
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].typename === "PathItem") {
            var path = selection[i];
            var pathBounds = path.geometricBounds;
            bounds.push({
                path: path,
                area: Math.abs((pathBounds[2] - pathBounds[0]) * (pathBounds[1] - pathBounds[3]))
            });
        }
    }
    
    bounds.sort(function(a, b) { return b.area - a.area; });
    
    if (bounds.length >= 2) {
        bounds[0].path.name = "Bleed";
        bounds[0].path.strokeColor = bleedLineSpotColor;
        bounds[1].path.name = "Safezone";
    }
    if (bounds.length >= 3) {
        bounds[2].path.name = "Backer";
    }
}

function adjustArtboardForLabelType(artboard, labelType, baseWidthPts, baseHeightPts) {
    if (labelType === "Die-cut" || labelType === "Custom") {
        var currentBounds = artboard.artboardRect;
        var currentWidth = currentBounds[2] - currentBounds[0];
        var currentHeight = currentBounds[1] - currentBounds[3];
        
        var scaleFactor = labelType === "Die-cut" ? 1.125 : 1.0625;
        var newWidth = baseWidthPts * scaleFactor;
        var newHeight = baseHeightPts * scaleFactor;
        
        var centerX = (currentBounds[0] + currentBounds[2]) / 2;
        var centerY = (currentBounds[1] + currentBounds[3]) / 2;
        
        artboard.artboardRect = [
            centerX - newWidth / 2,
            centerY + newHeight / 2,
            centerX + newWidth / 2,
            centerY - newHeight / 2
        ];
    }
}

function organizeLayers(doc, labelType, bleedLineSpotColor) {
    var guidesLayer = doc.layers.add();
    guidesLayer.name = "Guides";
    
    var artworkLayer = doc.layers.add();
    artworkLayer.name = "Artwork";
    
    moveAllNonSystemLayersToLayer(doc, artworkLayer);
    
    var dielineObj = null;
    var bleedObj = null;
    var safezoneObj = null;
    var backerObj = null;
    
    for (var i = 0; i < artworkLayer.pageItems.length; i++) {
        var item = artworkLayer.pageItems[i];
        if (item.typename === "PathItem") {
            if (item.name === "Dieline") {
                dielineObj = item.duplicate(guidesLayer, ElementPlacement.PLACEATBEGINNING);
            } else if (item.name === "Bleed") {
                bleedObj = item.duplicate(guidesLayer, ElementPlacement.PLACEATBEGINNING);
            } else if (item.name === "Safezone") {
                safezoneObj = item.duplicate(guidesLayer, ElementPlacement.PLACEATBEGINNING);
            } else if (item.name === "Backer") {
                backerObj = item.duplicate(guidesLayer, ElementPlacement.PLACEATBEGINNING);
            }
        }
    }
    
    guidesLayer.locked = true;
}

function moveAllNonSystemLayersToLayer(doc, targetLayer) {
    for (var i = doc.layers.length - 1; i >= 0; i--) {
        var layer = doc.layers[i];
        if (layer !== targetLayer && layer.name !== "Guides" && layer.name !== "Artwork") {
            for (var j = layer.pageItems.length - 1; j >= 0; j--) {
                layer.pageItems[j].move(targetLayer, ElementPlacement.PLACEATBEGINNING);
            }
            if (layer.pageItems.length === 0 && layer.layers.length === 0) {
                layer.remove();
            }
        }
    }
}

function findObjectByName(layer, name) {
    for (var i = 0; i < layer.pageItems.length; i++) {
        if (layer.pageItems[i].name === name) {
            return layer.pageItems[i];
        }
    }
    for (var j = 0; j < layer.layers.length; j++) {
        var found = findObjectByName(layer.layers[j], name);
        if (found) return found;
    }
    return null;
}

function getScaleFactor(dimension) {
    if (dimension < 6) return 2.5;
    else if (dimension < 10) return 2;
    else return 1.5;
}

function createWhiteBackerColor(doc) {
    var spot = doc.spots.add();
    spot.name = "White Backer";
    
    var color = new CMYKColor();
    color.cyan = 5;
    color.magenta = 3;
    color.yellow = 3;
    color.black = 0;
    
    spot.color = color;
    spot.colorType = ColorModel.SPOT;
    
    var spotColor = new SpotColor();
    spotColor.spot = spot;
    
    return spotColor;
}

function createDimensionLinesForObject(doc, targetObj, labelType, dimensionColorSpot, bleedObjBounds, whiteRectBounds) {
    // Implementation would go here - this is a placeholder
    // The actual implementation would create dimension lines based on the object bounds
}

function getLegendFileName(config) {
    var fileName = config.labelType;
    
    if (config.material) {
        fileName += "_" + config.material;
    }
    
    if (config.whiteInk) {
        if (config.swapOrientation) {
            fileName += "_WhiteHorizontal";
        } else {
            fileName += "_WhiteVertical";
        }
    }
    
    fileName += ".ai";
    return fileName;
}

function addLegend(doc, legendFileName, whiteRect) {
    var legendFile = new File(LEGENDS_FOLDER_PATH + "/" + legendFileName);
    
    if (!legendFile.exists) {
        alert("Legend file not found: " + legendFileName);
        return;
    }
    
    // Place the legend file
    var placedItem = doc.placedItems.add();
    placedItem.file = legendFile;
    
    // Position the legend based on the white rectangle bounds
    if (whiteRect) {
        var bounds = whiteRect.geometricBounds;
        var legendX = bounds[0];
        var legendY = bounds[3];
        placedItem.position = [legendX, legendY];
    }
}

// ============================================================================
// PREFERENCE UTILITIES
// ============================================================================

function loadPrefs() {
    var obj = {};
    
    try {
        var storedDir = app.preferences.getStringPreference(PREF_KEY_DEFAULT_DIR);
        if (storedDir && storedDir !== "") {
            obj.defaultUploadDir = storedDir;
        }
    } catch (prefErr) {}
    
    if (!obj.defaultUploadDir && PREFS_FILE.exists) {
        try {
            PREFS_FILE.encoding = "UTF-8";
            PREFS_FILE.open("r");
            var txt = PREFS_FILE.read();
            PREFS_FILE.close();
            var parsed = JSON.parse(txt);
            if (parsed && parsed.defaultUploadDir) obj.defaultUploadDir = parsed.defaultUploadDir;
        } catch (e) {
            if (PREFS_FILE.opened) PREFS_FILE.close();
        }
    }
    
    return obj;
}

function savePrefs(obj) {
    if (!obj) return;
    
    if (obj.defaultUploadDir) {
        try {
            app.preferences.setStringPreference(PREF_KEY_DEFAULT_DIR, obj.defaultUploadDir);
        } catch(prefErr) {}
    }
    
    try {
        PREFS_FILE.encoding = "UTF-8";
        PREFS_FILE.open("w");
        PREFS_FILE.write(JSON.stringify(obj));
        PREFS_FILE.close();
    } catch (e) {
        if (PREFS_FILE.opened) PREFS_FILE.close();
    }
}

function getMostRecentFileInFolder(folderObj) {
    if (!folderObj || !folderObj.exists) return null;
    var candidates = [].concat(
        folderObj.getFiles("*.ai"),
        folderObj.getFiles("*.pdf")
    );
    if (!candidates || candidates.length === 0) return null;
    var latest = candidates[0];
    for (var i = 1; i < candidates.length; i++) {
        if (candidates[i].modified && candidates[i].modified > latest.modified) {
            latest = candidates[i];
        }
    }
    return latest;
}

// ============================================================================
// DIALOG UTILITIES FOR CEP
// ============================================================================

function setDefaultDir() {
    var folder = Folder.selectDialog("Select default proof template directory");
    if (folder) {
        app.preferences.setStringPreference(PREF_KEY_DEFAULT_DIR, folder.fsName);
        var latest = getMostRecentFileInFolder(folder);
        return latest ? (folder.fsName + "|" + latest.fsName) : (folder.fsName + "|");
    }
    return null;
}

// ============================================================================
// ACTION UTILITIES
// ============================================================================

function checkRequiredActions() {
    var requiredActions = {
        "Proofer Actions": ["Sheet Offset", "Roll Offset", "Die-Cut Offset"]
    };
    
    var missingActions = [];
    
    for (var setName in requiredActions) {
        var actions = requiredActions[setName];
        for (var i = 0; i < actions.length; i++) {
            try {
                // Try to run a dummy action to check if it exists
                app.doScript(actions[i], setName);
            } catch (e) {
                missingActions.push(setName + " > " + actions[i]);
            }
        }
    }
    
    if (missingActions.length > 0) {
        alert("Missing required actions:\n\n" + missingActions.join("\n") + 
              "\n\nPlease ensure the 'Proofer Actions' action set is loaded in the Actions panel with these actions:\n" +
              "- Sheet Offset\n- Roll Offset\n- Die-Cut Offset\n\n" +
              "You can load the actions from Window > Actions panel.");
        return false;
    }
    
    return true;
}

// ============================================================================
// MAIN WORKFLOW FUNCTION
// ============================================================================

function createProof(config) {
    try {
        app.preferences.setIntegerPreference("rulerUnits", 2); // Inches
        
        // Handle swap orientation
        if (config.swapOrientation && config.widthInches && config.heightInches) {
            var temp = config.widthInches;
            config.widthInches = config.heightInches;
            config.heightInches = temp;
        }
        
        if (config.mode === "Upload") {
            return uploadProofTemplate(config);
        } else {
            return createProofTemplate(config);
        }
    } catch (e) {
        alert("Error: " + e.toString());
        return "Error: " + e.toString();
    }
}

function createProofTemplate(config) {
    var widthPts = config.widthInches * INCH_TO_POINTS;
    var heightPts = config.heightInches * INCH_TO_POINTS;
    
    var doc = createDocument(config.widthInches, config.heightInches, "LabelProof");
    fitViewToArt(doc);
    
    // Create spot colors
    var dielineColorSpot = createSpotColor(doc, "Dieline", [0, 100, 0, 0]);
    var dimensionColorSpot = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    var bleedLineSpotColor = createSpotColor(doc, BLEEDLINE_COLOR_NAME, BLEEDLINE_COLOR_CMYK);
    
    // Create primary shape
    var shape = createLabelShape(doc, config.shapeType, widthPts, heightPts);
    applyStrokeToShape(shape, dielineColorSpot, 1, "Dieline");
    
    doc.selection = [shape];
    
    // Run offset action
    if (!runOffsetAction(config.labelType)) {
        alert("Error running offset action. Please try again.");
        return "Error running offset action";
    }
    
    // Handle multiple paths created by offset
    if (doc.selection.length > 1) {
        if (shape) shape.selected = false;
        handleMultiplePaths(doc, config.labelType, dielineColorSpot, bleedLineSpotColor);
        adjustArtboardForLabelType(doc.artboards[0], config.labelType, widthPts, heightPts);
    } else {
        if (doc.selection.length === 1) shape = doc.selection[0];
    }
    
    organizeLayers(doc, config.labelType, bleedLineSpotColor);
    fitViewToArt(doc);
    
    // Add guidelines and legend if requested
    if (config.addGuidelines) {
        var guidesLayer = doc.layers.getByName("Guides");
        var bleedObj = findObjectByName(guidesLayer, "Bleed");
        var dielineObj = findObjectByName(guidesLayer, "Dieline");
        
        if (!dielineObj) {
            if (shape && shape.name === "Dieline") {
                dielineObj = shape;
            } else {
                alert("Cannot locate a valid Dieline path – aborting.");
                return "Cannot locate Dieline";
            }
        }
        
        // Create white background
        var whiteLayer = doc.layers.add();
        whiteLayer.name = "White Background";
        whiteLayer.zOrder(ZOrderMethod.SENDTOBACK);
        
        var widthScale = getScaleFactor(config.widthInches);
        var heightScale = getScaleFactor(config.heightInches);
        var dielineBounds = dielineObj.geometricBounds;
        var baseWidthPts = dielineBounds[2] - dielineBounds[0];
        var baseHeightPts = dielineBounds[1] - dielineBounds[3];
        var finalWidthPts = baseWidthPts * widthScale;
        var finalHeightPts = baseHeightPts * heightScale;
        
        var whiteBackerSpotColor = createWhiteBackerColor(doc);
        
        var centerX = (dielineBounds[0] + dielineBounds[2]) / 2;
        var centerY = (dielineBounds[1] + dielineBounds[3]) / 2;
        var rectTop = centerY + finalHeightPts / 2;
        var rectLeft = centerX - finalWidthPts / 2;
        var whiteRect = whiteLayer.pathItems.rectangle(rectTop, rectLeft, finalWidthPts, finalHeightPts);
        whiteRect.stroked = false;
        whiteRect.filled = true;
        whiteRect.fillColor = whiteBackerSpotColor;
        
        var bleedObjBounds = bleedObj ? bleedObj.geometricBounds : null;
        var whiteRectBounds = whiteRect.geometricBounds;
        
        createDimensionLinesForObject(doc, dielineObj, config.labelType, dimensionColorSpot, bleedObjBounds, whiteRectBounds);
        
        // Add legend
        var legendFileName = getLegendFileName(config);
        addLegend(doc, legendFileName, whiteRect);
        
        whiteLayer.locked = true;
    }
    
    return "OK";
}

function uploadProofTemplate(config) {
    if (!config.dieLineFile) {
        return "No file specified for upload";
    }
    
    var file = new File(config.dieLineFile);
    if (!file.exists) {
        return "File does not exist: " + config.dieLineFile;
    }
    
    var doc = app.open(file);
    doc.rulerUnits = RulerUnits.Inches;
    fitViewToArt(doc);
    
    // Find existing dieline
    var dielineObj = null;
    for (var i = 0; i < doc.layers.length && !dielineObj; i++) {
        dielineObj = findObjectByName(doc.layers[i], "Dieline");
    }
    
    if (!dielineObj) {
        alert("Cannot find Dieline object in uploaded file");
        return "Cannot find Dieline in uploaded file";
    }
    
    // Create spot colors if needed
    var dimensionColorSpot = createSpotColor(doc, "DimensionLine", DIMENSION_COLOR_CMYK);
    
    if (config.addGuidelines) {
        // Add guidelines to existing document
        var dielineBounds = dielineObj.geometricBounds;
        var artboardBounds = doc.artboards[0].artboardRect;
        
        createDimensionLinesForObject(doc, dielineObj, config.labelType, dimensionColorSpot, null, artboardBounds);
        
        // Add legend
        var legendFileName = getLegendFileName(config);
        
        // Create a dummy white rect for legend positioning (using artboard bounds)
        var dummyWhiteRect = {
            geometricBounds: artboardBounds
        };
        
        addLegend(doc, legendFileName, dummyWhiteRect);
    }
    
    return "OK";
}

// ============================================================================
// CEP INTERFACE FUNCTIONS
// ============================================================================

// Make functions available to CEP panel
var prooferInterface = {
    createProof: createProof,
    loadPrefs: function() {
        var prefs = loadPrefs();
        // Convert to JSON string for CEP communication
        return "{" + 
            (prefs.defaultUploadDir ? '"defaultUploadDir":"' + prefs.defaultUploadDir.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"' : '') + 
            "}";
    },
    savePrefs: savePrefs,
    setDefaultDir: setDefaultDir
}; 