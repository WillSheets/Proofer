import { useEffect, useState } from "react";
import {
  csi,
  evalES,
  subscribeBackgroundColor,
  evalTS,
} from "../lib/utils/proofer";
import "./App.scss";

export const App = () => {
  // Panel background color synced with Illustrator theme
  const [bgColor, setBgColor] = useState("#333333");
  
  // Form state
  const [mode, setMode] = useState<"Make" | "Upload">("Make");
  const [labelType, setLabelType] = useState("Sheets");
  const [shapeType, setShapeType] = useState("Squared");
  const [material, setMaterial] = useState<string | null>(null);
  const [whiteInk, setWhiteInk] = useState("No");
  const [addGuidelines, setAddGuidelines] = useState(false);
  const [swapOrientation, setSwapOrientation] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [defaultDir, setDefaultDir] = useState("Not Set");
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (window.cep) {
      // Subscribe to Illustrator theme changes
      subscribeBackgroundColor(setBgColor);
      
      // Load user preferences
      loadPreferences();
    }
  }, []);

  // Load preferences from ExtendScript
  const loadPreferences = async () => {
    try {
      const result = await evalTS("loadPrefs");
      if (result && result !== "{}") {
        try {
          const prefs = JSON.parse(result);
          if (prefs.defaultUploadDir) {
            setDefaultDir(prefs.defaultUploadDir);
            
            // Check for most recent file in the default directory
            const recentFileResult = await evalES(
              `var folder = new Folder("${prefs.defaultUploadDir.replace(/\\/g, "\\\\")}"); 
               var latest = getMostRecentFileInFolder(folder); 
               latest ? latest.fsName : "";`,
              true
            );
            if (recentFileResult) {
              setUploadFile(recentFileResult);
            }
          }
        } catch (parseError) {
          console.log("Error parsing preferences:", parseError);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  // Save preferences
  const savePreferences = async (defaultUploadDir: string) => {
    try {
      const prefs = { defaultUploadDir };
      await evalTS("savePrefs", prefs);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  // Business rules for label types
  useEffect(() => {
    if (labelType === "Sheets") {
      // Sheets mode: disable white ink and material options
      setWhiteInk("No");
      setMaterial(null);
    } else if (labelType === "Die-cut" || labelType === "Custom") {
      // Die-cut/Custom: force guidelines on
      setAddGuidelines(true);
    }
  }, [labelType]);

  // White ink requires guidelines and material selection
  useEffect(() => {
    if (whiteInk !== "No") {
      setAddGuidelines(true);
      // Ensure at least one material is selected
      if (!material) {
        setMaterial("White");
      }
    }
  }, [whiteInk, material]);

  const handleMaterialToggle = (value: string) => {
    if (whiteInk !== "No") {
      // In white ink mode, always have one material selected
      setMaterial(value);
    } else {
      // Without white ink, allow toggle on/off
      setMaterial(material === value ? null : value);
    }
  };

  const adjustValue = (field: "width" | "height", delta: number) => {
    const setter = field === "width" ? setWidth : setHeight;
    const currentValue = field === "width" ? width : height;
    const newValue = Math.max(0, (parseFloat(currentValue) || 0) + delta);
    setter(newValue.toString());
  };

  const handleSetDefaultDir = async () => {
    try {
      const result = await evalTS("setDefaultDir");
      if (result) {
        const [dir, file] = result.split("|");
        if (dir) {
          setDefaultDir(dir);
          // Save the preference
          await savePreferences(dir);
        }
        if (file) {
          setUploadFile(file);
        }
      }
    } catch (error) {
      console.error("Error setting default directory:", error);
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await evalES("var f = File.openDialog('Select an Illustrator file', '*.ai;*.pdf', false); f ? f.fsName : ''");
      if (result) {
        setUploadFile(result);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const handleCreateProof = async () => {
    setStatusText("");

    // Validation
    if (mode === "Make" && (!width || !height || parseFloat(width) <= 0 || parseFloat(height) <= 0)) {
      setStatusText("Missing the label width or height.");
      return;
    }

    if (mode === "Upload" && !uploadFile) {
      setStatusText("Please upload a proof template.");
      return;
    }

    const config = {
      mode,
      labelType,
      shapeType: mode === "Make" ? shapeType : undefined,
      material,
      whiteInk: whiteInk !== "No",
      whiteInkOrientation: whiteInk === "Yes-wide" ? "horizontal" : whiteInk === "Yes-tall" ? "vertical" : undefined,
      addGuidelines,
      swapOrientation,
      widthInches: mode === "Make" ? parseFloat(width) : undefined,
      heightInches: mode === "Make" ? parseFloat(height) : undefined,
      dieLineFile: mode === "Upload" ? uploadFile : undefined,
    };

    try {
      // Use evalTS to call createProof with the config object
      const result = await evalTS("createProof", config);
      
      if (result === "OK") {
        setStatusText("Proof created successfully!");
      } else if (result) {
        setStatusText(result);
      }
    } catch (error) {
      console.error("Error creating proof:", error);
      setStatusText("Error creating proof: " + error);
    }
  };

  const handleReset = () => {
    setMode("Make");
    setLabelType("Sheets");
    setShapeType("Squared");
    setMaterial(null);
    setWhiteInk("No");
    setAddGuidelines(false);
    setSwapOrientation(false);
    setWidth("");
    setHeight("");
    setUploadFile(null);
    setStatusText("");
  };

  const truncateLabel = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return "..." + text.slice(-(maxLength - 3));
  };

  return (
    <div className="proofer-panel" style={{ backgroundColor: bgColor }}>
      <div className="panel-content">
        <h3>New Proof</h3>
        
        <div className="mode-section">
          <label htmlFor="mode-select">Mode:</label>
          <select 
            id="mode-select" 
            value={mode} 
            onChange={(e) => setMode(e.target.value as "Make" | "Upload")}
          >
            <option value="Make">Make a Proof Template</option>
            <option value="Upload">Upload a Proof Template</option>
          </select>
        </div>

        <hr className="separator" />

        {mode === "Upload" && (
          <div className="upload-section">
            <div className="file-buttons">
              <button onClick={handleSetDefaultDir} className="file-button">
                Default Directory: {truncateLabel(defaultDir)}
              </button>
              <button onClick={handleSelectFile} className="file-button">
                {uploadFile ? truncateLabel(uploadFile.split(/[/\\]/).pop() || "Upload Proof Template") : "Upload Proof Template"}
              </button>
            </div>
            <hr className="separator" />
          </div>
        )}

        {mode === "Make" && (
          <>
            <div className="radio-group">
              <div className="group-label">Shape Type:</div>
              <div className="radio-options">
                {["Squared", "Rounded", "Round"].map((value) => (
                  <label key={value} className="radio-label">
                    <input
                      type="radio"
                      name="shapeType"
                      value={value}
                      checked={shapeType === value}
                      onChange={(e) => setShapeType(e.target.value)}
                    />
                    {value}
                  </label>
                ))}
              </div>
            </div>

            <hr className="separator" />

            <div className="size-inputs">
              <div className="size-input-group">
                <label>Width (inches):</label>
                <div className="spinner-group">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    step="0.0625"
                    min="0"
                  />
                  <div className="spinner-buttons">
                    <button className="spinner-btn" onClick={() => adjustValue("width", 1)}>▲</button>
                    <button className="spinner-btn" onClick={() => adjustValue("width", -1)}>▼</button>
                    <button className="spinner-btn small" onClick={() => adjustValue("width", 0.0625)}>▲</button>
                    <button className="spinner-btn small" onClick={() => adjustValue("width", -0.0625)}>▼</button>
                  </div>
                </div>
              </div>

              <div className="size-input-group">
                <label>Height (inches):</label>
                <div className="spinner-group">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    step="0.0625"
                    min="0"
                  />
                  <div className="spinner-buttons">
                    <button className="spinner-btn" onClick={() => adjustValue("height", 1)}>▲</button>
                    <button className="spinner-btn" onClick={() => adjustValue("height", -1)}>▼</button>
                    <button className="spinner-btn small" onClick={() => adjustValue("height", 0.0625)}>▲</button>
                    <button className="spinner-btn small" onClick={() => adjustValue("height", -0.0625)}>▼</button>
                  </div>
                </div>
              </div>
            </div>

            <hr className="separator" />
          </>
        )}

        <div className="radio-group">
          <div className="group-label">Label Type:</div>
          <div className="radio-options">
            {["Sheets", "Rolls", "Die-cut", "Custom"].map((value) => (
              <label key={value} className="radio-label">
                <input
                  type="radio"
                  name="labelType"
                  value={value}
                  checked={labelType === value}
                  onChange={(e) => setLabelType(e.target.value)}
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <hr className="separator" />

        <div className="radio-group">
          <div className="group-label">Material Type:</div>
          <div className="radio-options">
            {["White", "Clear", "Metallic", "Holographic"].map((value) => (
              <label key={value} className="radio-label">
                <input
                  type="radio"
                  name="material"
                  value={value}
                  checked={material === value}
                  onChange={() => handleMaterialToggle(value)}
                  disabled={labelType === "Sheets"}
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <hr className="separator" />

        <div className="radio-group">
          <div className="group-label">White Ink:</div>
          <div className="radio-options">
            {[
              { value: "No", label: "No" },
              { value: "Yes-wide", label: "Yes (8.5×11)" },
              { value: "Yes-tall", label: "Yes (11×8.5)" }
            ].map((option) => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  name="whiteInk"
                  value={option.value}
                  checked={whiteInk === option.value}
                  onChange={(e) => setWhiteInk(e.target.value)}
                  disabled={labelType === "Sheets"}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <hr className="separator" />

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={addGuidelines}
              onChange={(e) => setAddGuidelines(e.target.checked)}
              disabled={
                labelType === "Die-cut" || 
                labelType === "Custom" || 
                whiteInk !== "No"
              }
            />
            Add Guidelines?
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={swapOrientation}
              onChange={(e) => setSwapOrientation(e.target.checked)}
            />
            Swap the Orientation?
          </label>
        </div>

        <hr className="separator" />

        <div className="status-text">{statusText}</div>

        <div className="button-group bottom-buttons">
          <button onClick={handleCreateProof} className="primary-btn">OK</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>
    </div>
  );
};
