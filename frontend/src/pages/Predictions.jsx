import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  BrainCircuit,
  FileJson,
  Upload,
  History,
  CheckCircle,
  AlertCircle,
  Download,
  Star,
  LayoutList,
  Code,
  FileCheck,
} from "lucide-react";
import API from "../utils/api";
import { useToast } from "../components/useToast";
import { safeApiCall } from "../utils/asyncHandler";
import Papa from "papaparse";
import "./Predictions.css";

/* ──────────────────────────────────────────────
   Helper: determine best model from a list
   ────────────────────────────────────────────── */
function findBestModel(models) {
  if (!models || models.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const m of models) {
    const metrics = m.metrics || {};
    let score;

    if (m.problem_type === "classification") {
      // prefer f1, fallback to accuracy
      score = metrics.f1_score ?? metrics.accuracy ?? -1;
    } else {
      // regression: use r2_score
      score = metrics.r2_score ?? -1;
    }

    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }

  return best;
}

/* ──────────────────────────────────────────────
   Helper: confidence color class
   ────────────────────────────────────────────── */
function confidenceClass(score) {
  if (score == null) return "";
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

function confidenceBarClass(score) {
  if (score == null) return "confidence-medium";
  if (score >= 0.75) return "confidence-high";
  if (score >= 0.45) return "confidence-medium";
  return "confidence-low";
}

/* ──────────────────────────────────────────────
   Helper: get display metrics for a model
   ────────────────────────────────────────────── */
function getDisplayMetrics(model) {
  if (!model || !model.metrics) return [];
  const m = model.metrics;

  if (model.problem_type === "classification") {
    return [
      { label: "Accuracy", value: m.accuracy },
      { label: "Precision", value: m.precision },
      { label: "Recall", value: m.recall },
      { label: "F1 Score", value: m.f1_score },
    ].filter(x => x.value != null);
  }

  return [
    { label: "R² Score", value: m.r2_score },
    { label: "MAE", value: m.mae },
    { label: "RMSE", value: m.rmse },
    { label: "MSE", value: m.mse },
  ].filter(x => x.value != null);
}


/* ══════════════════════════════════════════════
   Predictions Component
   ══════════════════════════════════════════════ */
const Predictions = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("single");

  // Selection state
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  // Input state
  const [inputMode, setInputMode] = useState("form"); // 'form' | 'json'
  const [jsonInput, setJsonInput] = useState("{\n  \n}");
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [schemaColumns, setSchemaColumns] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Result & History state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [batchShowAll, setBatchShowAll] = useState(false);

  // Best model
  const bestModel = useMemo(() => findBestModel(models), [models]);

  // ── Fetch datasets ──
  useEffect(() => {
    const fetchDatasets = async () => {
      const [res] = await safeApiCall(API.get("/datasets/"));
      if (res) {
        setDatasets(res.data);
        if (res.data.length > 0) {
          setDatasetId(res.data[0].id.toString());
        }
      }
    };
    fetchDatasets();
  }, []);

  // ── Fetch models — auto-select best ──
  useEffect(() => {
    const fetchModels = async () => {
      if (!datasetId) return;
      setModels([]);
      setModelId("");
      setLoadingModels(true);

      const [res] = await safeApiCall(API.get(`/models/dataset/${datasetId}`));

      if (res && res.data) {
        setModels(res.data);
        // Auto-select the best model
        const best = findBestModel(res.data);
        if (best) {
          setModelId(best.id.toString());
        } else if (res.data.length > 0) {
          setModelId(res.data[0].id.toString());
        }
      }
      setLoadingModels(false);
    };
    fetchModels();
  }, [datasetId]);

  // ── Fetch input schema → populate form fields ──
  useEffect(() => {
    if (!modelId) {
      setJsonInput("{\n  \n}");
      setSchemaColumns([]);
      setFormValues({});
      setFormErrors({});
      return;
    }
    const fetchSchema = async () => {
      setLoadingSchema(true);
      const [res] = await safeApiCall(API.get(`/predictions/${modelId}/input-schema`));
      if (res && res.data) {
        const cols = res.data.required_input_columns || [];
        setSchemaColumns(cols);

        // Build empty form values
        const vals = {};
        cols.forEach(col => { vals[col] = ""; });
        setFormValues(vals);
        setFormErrors({});

        // Build template JSON
        const template = {};
        cols.forEach(col => { template[col] = ""; });
        setJsonInput(JSON.stringify(template, null, 2));
      }
      setLoadingSchema(false);
    };
    fetchSchema();
  }, [modelId]);

  // ── Fetch history ──
  const fetchHistory = useCallback(async () => {
    if (!modelId) return;
    setLoading(true);
    const [res] = await safeApiCall(API.get(`/predictions/${modelId}/history`));
    if (res) {
      setHistory(res.data);
    }
    setLoading(false);
  }, [modelId]);

  useEffect(() => {
    if (activeTab === "history" && modelId) {
      fetchHistory();
    }
  }, [activeTab, modelId, fetchHistory]);

  // ── Find the selected model object ──
  const selectedModel = models.find(m => m.id.toString() === modelId);
  const displayMetrics = useMemo(() => getDisplayMetrics(selectedModel), [selectedModel]);

  /* ═══════════════════════════════════════════
     Validation
     ═══════════════════════════════════════════ */
  const validateFormFields = () => {
    const errors = {};
    let hasError = false;

    schemaColumns.forEach(col => {
      const val = (formValues[col] ?? "").toString().trim();
      if (val === "") {
        errors[col] = "This field is required";
        hasError = true;
      }
    });

    setFormErrors(errors);
    return !hasError;
  };

  const buildInputFromForm = () => {
    const input = {};
    schemaColumns.forEach(col => {
      const raw = (formValues[col] ?? "").toString().trim();
      // Try to parse as number
      const num = Number(raw);
      input[col] = raw !== "" && !isNaN(num) && raw === num.toString() ? num : raw;
    });
    return input;
  };

  /* ═══════════════════════════════════════════
     Single Prediction
     ═══════════════════════════════════════════ */
  const handleSinglePrediction = async () => {
    setError(null);
    setResult(null);

    let parsedData;

    if (inputMode === "form") {
      if (!validateFormFields()) return;
      parsedData = buildInputFromForm();
    } else {
      try {
        parsedData = JSON.parse(jsonInput);
      } catch {
        setError("Invalid JSON format. Please check your input.");
        return;
      }
    }

    setLoading(true);
    const [res, err] = await safeApiCall(API.post(`/predictions/${modelId}/single`, {
      input_data: parsedData
    }));

    if (err) {
      setError(err.response?.data?.detail || "Failed to generate prediction.");
    } else if (res) {
      setResult(res.data);
      addToast("Success", "Prediction generated.", "success");
    }
    setLoading(false);
  };

  /* ═══════════════════════════════════════════
     Batch Prediction
     ═══════════════════════════════════════════ */
  const handleBatchPrediction = async () => {
    if (!csvFile) {
      setError("Please select a CSV file first.");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    setBatchShowAll(false);

    Papa.parse(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError("Error parsing CSV file.");
          setLoading(false);
          return;
        }

        const [res, err] = await safeApiCall(API.post(`/predictions/${modelId}/batch`, {
          input_data: results.data
        }));

        if (err) {
          setError(err.response?.data?.detail || "Failed to generate batch predictions.");
        } else if (res) {
          setResult(res.data);
          addToast("Success", `Generated ${res.data.predictions_generated} predictions.`, "success");
        }
        setLoading(false);
      },
      error: () => {
        setError("Failed to read CSV file.");
        setLoading(false);
      }
    });
  };

  /* ═══════════════════════════════════════════
     Download batch results as CSV
     ═══════════════════════════════════════════ */
  const handleDownloadCSV = () => {
    if (!result || !result.results) return;

    const csvString = Papa.unparse(result.results);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch_predictions_model_${modelId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast("Downloaded", "Batch predictions exported as CSV.", "success");
  };

  const formatJSON = (data) => JSON.stringify(data, null, 2);

  /* ═══════════════════════════════════════════
     Render
     ═══════════════════════════════════════════ */
  return (
    <div className="predictions-container page-enter">
      <div className="predictions-header">
        <button className="back-btn clickable" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="predictions-title-section">
          <h1>Model Predictions</h1>
          <p>Make new predictions using your trained models</p>
        </div>
      </div>

      <div className="predictions-grid">
        {/* ═══ Setup Card ═══ */}
        <div className="glass-panel setup-card">
          <h2>Select Model</h2>
          <p className="card-desc">Choose which model to use</p>

          <div className="ml-form">
            <div className="form-group">
              <label>Dataset context</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
              >
                <option value="" disabled>Select a dataset...</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.filename} ({ds.rows_count} rows)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Trained Model</label>
              {loadingModels ? (
                <div className="loading-dropdown">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Loading models…</span>
                </div>
              ) : (
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={models.length === 0}
                >
                  {models.length === 0 && <option value="">No models found for this dataset</option>}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {bestModel && bestModel.id === m.id ? "★ " : ""}
                      {m.model_name} — {m.algorithm} ({m.problem_type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedModel && (
              <div className="model-info-badge page-enter">
                <span className="model-info-type">{selectedModel.problem_type}</span>
                <span className="model-info-target">Target: {selectedModel.target_column}</span>
                {bestModel && bestModel.id === selectedModel.id && (
                  <span className="best-badge">
                    <Star size={10} />
                    Best
                  </span>
                )}
              </div>
            )}

            {/* Mini metrics display */}
            {displayMetrics.length > 0 && (
              <div className="model-metrics-mini">
                {displayMetrics.map((m, i) => (
                  <div className="metric-mini" key={i}>
                    <span className="metric-mini-label">{m.label}</span>
                    <span className="metric-mini-value">
                      {typeof m.value === "number" ? m.value.toFixed(4) : m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Action Card ═══ */}
        <div className="glass-panel results-card" style={{ minHeight: '500px' }}>
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => { setActiveTab('single'); setResult(null); setError(null); }}
            >
              <FileJson size={14} className="inline mr-2" /> Single
            </button>
            <button
              className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => { setActiveTab('batch'); setResult(null); setError(null); }}
            >
              <Upload size={14} className="inline mr-2" /> Batch
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} className="inline mr-2" /> History
            </button>
          </div>

          {!modelId ? (
            <div className="idle-display">
              <BrainCircuit size={56} className="idle-icon" />
              <h3>Select a Model</h3>
              <p>You need to train and select a model before making predictions.</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {error && (
                <div className="prediction-error-alert">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* ═══ SINGLE TAB ═══ */}
              {activeTab === 'single' && (
                <div>
                  {loadingSchema ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 className="animate-spin text-accent-cyan" size={32} />
                    </div>
                  ) : (
                    <div>
                      {/* Input mode toggle */}
                      <div className="input-mode-toggle">
                        <button
                          className={`mode-btn ${inputMode === 'form' ? 'active' : ''}`}
                          onClick={() => setInputMode('form')}
                        >
                          <LayoutList size={12} /> Form
                        </button>
                        <button
                          className={`mode-btn ${inputMode === 'json' ? 'active' : ''}`}
                          onClick={() => setInputMode('json')}
                        >
                          <Code size={12} /> JSON
                        </button>
                      </div>

                      {inputMode === 'form' ? (
                        /* ── Dynamic Form ── */
                        <div className="dynamic-form">
                          {schemaColumns.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                              No schema available for this model. Use JSON mode instead.
                            </p>
                          ) : (
                            schemaColumns.map((col, idx) => (
                              <div
                                className={`dynamic-field ${formErrors[col] ? 'has-error' : ''}`}
                                key={col}
                              >
                                <label>
                                  <span className="field-index">{idx + 1}</span>
                                  {col}
                                </label>
                                <input
                                  type="text"
                                  value={formValues[col] || ""}
                                  onChange={(e) => {
                                    setFormValues(prev => ({ ...prev, [col]: e.target.value }));
                                    // Clear error on type
                                    if (formErrors[col]) {
                                      setFormErrors(prev => {
                                        const next = { ...prev };
                                        delete next[col];
                                        return next;
                                      });
                                    }
                                  }}
                                  placeholder={`Enter value for ${col}`}
                                />
                                {formErrors[col] && (
                                  <span className="field-error">
                                    <AlertCircle size={11} /> {formErrors[col]}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        /* ── Raw JSON ── */
                        <div>
                          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Enter Input JSON</h3>
                          <p className="card-desc" style={{ marginBottom: '1rem' }}>
                            Provide the feature keys and values exactly as they appeared in the training dataset.
                          </p>
                          <textarea
                            className="json-editor"
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='{"feature1": 10.5, "feature2": "category"}'
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    className="generate-btn clickable"
                    onClick={handleSinglePrediction}
                    disabled={loading}
                    style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 2rem' }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                    {loading ? "Predicting..." : "Predict"}
                  </button>

                  {/* ── Single Prediction Result ── */}
                  {result && !loading && result.prediction !== undefined && (
                    <div className="result-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-success)' }}>
                        <CheckCircle size={18} />
                        <strong>Prediction Result</strong>
                      </div>
                      <div className="prediction-value">{String(result.prediction)}</div>

                      {/* Confidence gauge */}
                      {result.confidence_score != null && (
                        <div className="confidence-gauge">
                          <div className="confidence-gauge-label">
                            <span>Confidence Score</span>
                            <span
                              className="confidence-gauge-value"
                              style={{
                                color: result.confidence_score >= 0.75
                                  ? 'var(--text-success)'
                                  : result.confidence_score >= 0.45
                                    ? 'var(--text-warning)'
                                    : 'var(--text-danger)'
                              }}
                            >
                              {(result.confidence_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="confidence-gauge-bar">
                            <div
                              className={`confidence-gauge-fill ${confidenceBarClass(result.confidence_score)}`}
                              style={{ width: `${Math.min(result.confidence_score * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Model info in result */}
                      {result.model_name && (
                        <div style={{
                          marginTop: '0.75rem',
                          display: 'flex',
                          gap: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}>
                          <span>Model: {result.model_name}</span>
                          <span>•</span>
                          <span>ID: {result.model_id}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ BATCH TAB ═══ */}
              {activeTab === 'batch' && (
                <div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Upload Batch CSV</h3>
                  <p className="card-desc" style={{ marginBottom: '1rem' }}>
                    Upload a CSV file containing rows of features to generate bulk predictions.
                  </p>

                  {/* Styled file upload area */}
                  <div className={`file-upload-area ${csvFile ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                    />
                    {csvFile ? (
                      <>
                        <FileCheck size={32} className="file-upload-icon" />
                        <div className="file-name-display">
                          <CheckCircle size={12} /> {csvFile.name}
                        </div>
                        <span className="file-upload-text">
                          {(csvFile.size / 1024).toFixed(1)} KB — Click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="file-upload-icon" />
                        <span className="file-upload-text">
                          <strong>Click to upload</strong> or drag & drop a CSV file
                        </span>
                        <span className="file-upload-text">.csv files only</span>
                      </>
                    )}
                  </div>

                  <button
                    className="generate-btn clickable"
                    onClick={handleBatchPrediction}
                    disabled={loading || !csvFile}
                    style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 2rem' }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                    {loading ? "Processing Batch..." : "Run Batch Predict"}
                  </button>

                  {/* ── Batch Results Table ── */}
                  {result && !loading && result.results && (
                    <div className="result-box" style={{ marginTop: '2rem' }}>
                      <div className="batch-results-header">
                        <div className="batch-count">
                          <CheckCircle size={18} />
                          <strong>Batch Complete — {result.predictions_generated} rows</strong>
                        </div>
                        <button className="download-csv-btn" onClick={handleDownloadCSV}>
                          <Download size={14} /> Download CSV
                        </button>
                      </div>

                      <div className="batch-table-wrapper">
                        <table className="batch-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Prediction</th>
                              <th>Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(batchShowAll ? result.results : result.results.slice(0, 20)).map((row, idx) => {
                              const confClass = confidenceClass(row.confidence_score);
                              const confPct = row.confidence_score != null
                                ? (row.confidence_score * 100).toFixed(1) + "%"
                                : "—";
                              return (
                                <tr key={idx}>
                                  <td className="row-num">{row.row_number || idx + 1}</td>
                                  <td className="prediction-cell">{String(row.prediction)}</td>
                                  <td>
                                    <div className="mini-confidence-bar">
                                      <span className={`confidence-cell ${confClass}`}>{confPct}</span>
                                      {row.confidence_score != null && (
                                        <div className="mini-bar-track">
                                          <div
                                            className={`mini-bar-fill ${confidenceBarClass(row.confidence_score)}`}
                                            style={{ width: `${Math.min(row.confidence_score * 100, 100)}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {!batchShowAll && result.results.length > 20 && (
                          <div className="batch-show-more">
                            <button onClick={() => setBatchShowAll(true)}>
                              Show all {result.results.length} rows
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ HISTORY TAB ═══ */}
              {activeTab === 'history' && (
                <div>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Prediction History</h3>

                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 className="animate-spin text-accent-cyan" size={32} />
                    </div>
                  ) : history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No history found for this model.</p>
                  ) : (
                    <div className="history-list">
                      {history.map((item) => (
                        <div key={item.id} className="history-item">
                          <div className="history-meta">
                            <span>ID: {item.id}</span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Input:</strong>
                            <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', marginTop: '0.25rem' }}>
                              {Array.isArray(item.input_data)
                                ? `Batch CSV (${item.input_data.length} rows)`
                                : formatJSON(item.input_data)}
                            </pre>
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Result:</strong>
                            <pre style={{ background: 'rgba(var(--accent-primary-rgb), 0.05)', border: '1px solid var(--border-success)', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                              {item.prediction_result.results
                                ? `Generated ${item.prediction_result.results.length} predictions`
                                : item.prediction_result.prediction}
                            </pre>
                          </div>
                          {item.confidence_score != null && (
                            <div style={{
                              marginTop: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                            }}>
                              <span style={{ color: 'var(--text-muted)' }}>Confidence:</span>
                              <span className={`confidence-cell ${confidenceClass(item.confidence_score)}`}>
                                {(item.confidence_score * 100).toFixed(1)}%
                              </span>
                              <div className="mini-bar-track" style={{ maxWidth: '60px' }}>
                                <div
                                  className={`mini-bar-fill ${confidenceBarClass(item.confidence_score)}`}
                                  style={{ width: `${Math.min(item.confidence_score * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predictions;
