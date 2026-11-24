
import { useState } from "react";
import {
  Leaf,
  ScanLine,
  Upload,
  Droplets,
  Sparkles,
  ShieldCheck,
  Sun,
  CircleAlert,
  X,
  ArrowRight
} from "lucide-react";
import "./App.css";

function App() {
  const [skinType, setSkinType] = useState("Combination");
  const [concerns, setConcerns] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const skinTypes = [
    "Dry",
    "Oily",
    "Combination",
    "Normal",
    "Sensitive"
  ];

  const skinConcerns = [
    "Acne",
    "Dryness",
    "Redness",
    "Pigmentation",
    "Sensitivity",
    "Uneven texture"
  ];

  function toggleConcern(concern) {
    setConcerns((previous) =>
      previous.includes(concern)
        ? previous.filter((item) => item !== concern)
        : [...previous, concern]
    );
  }

  function handleFile(event) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setMessage("Please select an image smaller than 10 MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage("");
  }

  function removeFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }

  
  async function handleSubmit() {
    if (!file) {
      setMessage("Please upload a product ingredient label first.");
      return;
    }

    if (concerns.length === 0) {
      setMessage("Please select at least one skin concern.");
      return;
    }

    setLoading(true);
    setMessage("");
    setExtractedText("");
    setAnalysisResult(null);

    try {
      // STEP 1: Extract ingredients using OCR
      const formData = new FormData();
      formData.append("file", file);

      const ocrResponse = await fetch("http://127.0.0.1:8000/api/ocr", {
        method: "POST",
        body: formData
      });

      const ocrData = await ocrResponse.json();

      if (!ocrResponse.ok) {
        throw new Error(ocrData.detail || "Could not read the image.");
      }

      const text = ocrData.extracted_text;
      setExtractedText(text);

      // STEP 2: Analyze the extracted ingredients
      const analysisResponse = await fetch(
        "http://127.0.0.1:8000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            extracted_text: text,
            skin_type: skinType.toLowerCase(),
            concerns: concerns
          })
        }
      );

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.detail || "Could not analyze ingredients."
        );
      }

      // STEP 3: Store the analysis
      setAnalysisResult(analysisData);
      setMessage("Your product analysis is ready!");

    } catch (error) {
      console.error("Analysis Error:", error);
      setMessage(error.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }
  


    


  return (
    <div className="app">
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Leaf size={21} />
          </span>
          SkinSense
        </a>

        <div className="nav-links">
          <a href="#profile">My Skin</a>
          <a href="#scanner">Ingredient Scanner</a>
        </div>

        <div className="profile-avatar">S</div>
      </nav>

      <main className="container">
        <section className="welcome">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> YOUR PERSONAL SKINCARE COMPANION
            </span>
            <h1>Skincare that <span>understands</span> your skin.</h1>
            <p>
              Discover what's inside your skincare products.
              Understand the ingredients and find out how they
              may interact with your skin.
            </p>
          </div>

          <div className="welcome-decoration">
            <div className="decoration-circle">
              <Droplets size={64} strokeWidth={1} />
              <Leaf size={32} className="decoration-leaf" />
            </div>
          </div>
        </section>

        <div className="section-heading" id="profile">
          <div>
            <span className="eyebrow">STEP 01</span>
            <h2>Let's understand your skin</h2>
            <p>Personalize your analysis based on your skin profile.</p>
          </div>
          <ShieldCheck size={30} />
        </div>

        <section className="profile-card">
          <h3>What's your skin type?</h3>
          <p className="helper">Choose the option that best describes your skin.</p>

          <div className="skin-options">
            {skinTypes.map((type) => (
              <button
                key={type}
                className={`skin-option ${skinType === type ? "selected" : ""}`}
                onClick={() => setSkinType(type)}
                type="button"
              >
                {type === "Dry" && <Droplets size={19} />}
                {type === "Oily" && <Sun size={19} />}
                {type === "Combination" && <Sparkles size={19} />}
                {type === "Normal" && <Leaf size={19} />}
                {type === "Sensitive" && <ShieldCheck size={19} />}
                {type}
              </button>
            ))}
          </div>

          <div className="profile-divider" />

          <h3>What are your skin concerns?</h3>
          <p className="helper">Select all that apply.</p>

          <div className="concern-options">
            {skinConcerns.map((concern) => (
              <button
                key={concern}
                type="button"
                className={`concern-option ${
                  concerns.includes(concern) ? "selected" : ""
                }`}
                onClick={() => toggleConcern(concern)}
              >
                {concerns.includes(concern) ? "✓" : "+"} {concern}
              </button>
            ))}
          </div>
        </section>

        <div className="section-heading scanner-heading" id="scanner">
          <div>
            <span className="eyebrow">STEP 02</span>
            <h2>Scan your skincare product</h2>
            <p>Upload a clear photograph of the ingredient list on your product.</p>
          </div>
          <ScanLine size={30} />
        </div>

        <section className="upload-card">
          {!preview ? (
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                hidden
              />
              <div className="upload-icon">
                <Upload size={30} />
              </div>
              <h3>Drop your product image here</h3>
              <p>Or click to browse your files</p>
              <span className="upload-note">PNG, JPG or WEBP · Maximum 10 MB</span>
            </label>
          ) : (
            <div className="preview-area">
              <img src={preview} alt="Uploaded skincare product label" />
              <div className="preview-info">
                <h3>Product image uploaded</h3>
                <p>{file?.name}</p>
                <button type="button" className="remove-button" onClick={removeFile}>
                  <X size={15} /> Remove image
                </button>
              </div>
            </div>
          )}

          <div className="upload-tip">
            <CircleAlert size={17} />
            <span>
              Tip: Make sure the ingredient list is well-lit, in focus
              and readable.
            </span>
          </div>

          {message && <p className="status-message">{message}</p>}

          {loading && (
            <div className="loading-message">
              <Sparkles size={18} />
              Reading your ingredient label...
            </div>
          )}

          {extractedText && (
            <div className="result-card">
              <div className="result-header">
                <div>
                  <span className="eyebrow">OCR RESULTS</span>
                  <h3>Extracted ingredients</h3>
                </div>
                <ShieldCheck size={25} />
              </div>

              <p className="extracted-text">
                {extractedText}
              </p>

              <p className="result-note">
                Please verify the extracted text against your product label.
                OCR can make mistakes.
              </p>
            </div>
          )}

    

          {analysisResult && (
            <div className="analysis-report">

              {/* Report heading */}
              <div className="report-heading">
                <div>
                  <span className="eyebrow">SKINSENSE ANALYSIS</span>
                  <h2>Your ingredient report</h2>
                  <p>Here's what we found in your product.</p>
                </div>
                <div className="report-icon">
                  <ShieldCheck size={27} />
                </div>
              </div>

              {/* Skin profile summary */}
              <div className="report-profile">
                <div>
                  <span className="report-label">YOUR SKIN TYPE</span>
                  <h3>{analysisResult.skin_type}</h3>
                </div>
                <div>
                  <span className="report-label">YOUR CONCERNS</span>
                  <div className="report-tags">
                    {analysisResult.concerns?.map((concern, index) => (
                      <span className="report-tag" key={index}>
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ingredient count */}
              <div className="ingredient-count">
                <div>
                  <span className="report-label">IDENTIFIED INGREDIENTS</span>
                  <h3>{analysisResult.matched_count}</h3>
                </div>
                <span className="count-icon">
                  <Leaf size={24} />
                </span>
              </div>

              {/* Individual ingredient cards */}
              <div className="ingredient-list">
                {analysisResult.matched_ingredients?.map((ingredient, index) => {
                  const hasCaution = ingredient.cautions?.length > 0;

                  return (
                    <div className="ingredient-card" key={`${ingredient.name}-${index}`}>

                      <div className="ingredient-card-header">
                        <div>
                          <h3>{ingredient.name}</h3>
                          <span className="ingredient-category">
                            {ingredient.category}
                          </span>
                        </div>

                        <span className={`ingredient-status ${
                          hasCaution ? "caution-status" : "suitable-status"
                        }`}>
                          {hasCaution ? "Potential caution" : "Generally suitable"}
                        </span>
                      </div>

                      <div className="ingredient-details">
                        <div>
                          <h4>What it does</h4>
                          <ul>
                            {ingredient.functions?.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4>Potential benefits</h4>
                          <ul>
                            {ingredient.benefits?.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="ingredient-assessment">
                        <strong>Skin assessment</strong>
                        <p>{ingredient.skin_assessment}</p>
                      </div>

                      {hasCaution && (
                        <div className="ingredient-caution">
                          <CircleAlert size={18} />
                          <div>
                            <strong>Things to be aware of</strong>
                            <ul>
                              {ingredient.cautions.map((caution, i) => (
                                <li key={i}>{caution}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Overall caution summary */}
              {analysisResult.potential_cautions?.length > 0 && (
                <div className="overall-caution">
                  <div className="overall-caution-heading">
                    <CircleAlert size={21} />
                    <h3>Potential cautions found</h3>
                  </div>

                  {analysisResult.potential_cautions.map((item, index) => (
                    <div className="caution-item" key={index}>
                      <strong>{item.ingredient}</strong>
                      <ul>
                        {item.reason?.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Backend message */}
              <p className="analysis-message">
                <ShieldCheck size={17} />
                {analysisResult.message}
              </p>

              {/* Disclaimer */}
              <div className="report-disclaimer">
                <CircleAlert size={18} />
                <p>
                  SkinSense provides informational ingredient insights, not medical
                  advice. Individual reactions can vary depending on skin sensitivity,
                  ingredient concentration and the overall product formulation.
                  Always verify the original product label.
                </p>
              </div>

            </div>
          )}



          
          <button
            className="analyze-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze my product"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </section>

        <footer>
          <Leaf size={16} />
          <span>SkinSense · Skincare intelligence, personalized.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

