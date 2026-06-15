import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  BrainCircuit,
  FileJson,
  Upload,
  History,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import API from "../utils/api";
import { useToast } from "../components/useToast";
import { safeApiCall } from "../utils/asyncHandler";
import Papa from "papaparse";
import "./Predictions.css";

const Predictions = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("single"); // 'single', 'batch', 'history'
  
  // Selection state
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [problemType, setProblemType] = useState("classification");
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");

  // Input state
  const [jsonInput, setJsonInput] = useState("{\n  \n}");
  const [csvFile, setCsvFile] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Result & History state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch datasets
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

  // Fetch models when dataset or problem type changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!datasetId) return;
      setModels([]);
      setModelId("");
      
      const [res] = await safeApiCall(API.get(`/ml/compare/${problemType}`, {
        params: { dataset_id: datasetId }
      }));
      
      if (res && res.data) {
        if (res.data.unique_models_count === 1 && res.data.model) {
          setModels([res.data.model]);
          setModelId(res.data.model.model_id.toString());
        } else if (res.data.comparison) {
          setModels(res.data.comparison);
          if (res.data.comparison.length > 0) {
            setModelId(res.data.comparison[0].model_id.toString());
          }
        }
      }
    };
    fetchModels();
  }, [datasetId, problemType]);

  // Fetch input schema
  useEffect(() => {
    if (!modelId) {
      setJsonInput("{\n  \n}");
      return;
    }
    const fetchSchema = async () => {
      setLoadingSchema(true);
      const [res] = await safeApiCall(API.get(`/predictions/${modelId}/input-schema`));
      if (res && res.data) {
        const template = {};
        res.data.required_input_columns.forEach(col => template[col] = "");
        setJsonInput(JSON.stringify(template, null, 2));
      }
      setLoadingSchema(false);
    };
    fetchSchema();
  }, [modelId]);

  // Fetch history
  const fetchHistory = async () => {
    if (!modelId) return;
    setLoading(true);
    const [res] = await safeApiCall(API.get(`/predictions/${modelId}/history?limit=50`));
    if (res) {
      setHistory(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "history" && modelId) {
      fetchHistory();
    }
  }, [activeTab, modelId]);


  const handleSinglePrediction = async () => {
    setError(null);
    setResult(null);

    let parsedData;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch {
      setError("Invalid JSON format. Please check your input.");
      return;
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

  const handleBatchPrediction = async () => {
    if (!csvFile) {
      setError("Please select a CSV file first.");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

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

  const formatJSON = (data) => {
    return JSON.stringify(data, null, 2);
  };

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
        {/* Setup Card */}
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

            <div className="radio-group">
              <label>Problem Type</label>
              <div className="radio-options">
                <div 
                  className={`radio-option ${problemType === 'classification' ? 'selected' : ''}`}
                  onClick={() => setProblemType('classification')}
                >
                  Classification
                </div>
                <div 
                  className={`radio-option ${problemType === 'regression' ? 'selected' : ''}`}
                  onClick={() => setProblemType('regression')}
                >
                  Regression
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Trained Model</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                disabled={models.length === 0}
              >
                {models.length === 0 && <option value="">No models found</option>}
                {models.map((m) => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.model_name} ({m.algorithm})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="glass-panel results-card" style={{ minHeight: '500px' }}>
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              <FileJson size={14} className="inline mr-2" /> Single
            </button>
            <button 
              className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveTab('batch')}
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
                <div className="ml-alert error" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--border-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-danger)', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} className="inline mr-2" /> {error}
                </div>
              )}

              {/* SINGLE TAB */}
              {activeTab === 'single' && (
                <div>
                  {loadingSchema ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 className="animate-spin text-accent-cyan" size={32} />
                    </div>
                  ) : (
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
                  <button 
                    className="generate-btn clickable" 
                    onClick={handleSinglePrediction}
                    disabled={loading}
                    style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 2rem' }}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                    {loading ? "Predicting..." : "Predict"}
                  </button>

                  {result && !loading && result.prediction !== undefined && (
                    <div className="result-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-success)' }}>
                        <CheckCircle size={18} />
                        <strong>Prediction Result</strong>
                      </div>
                      <div className="prediction-value">{result.prediction}</div>
                      {result.confidence_score !== null && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Confidence: {(result.confidence_score * 100).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BATCH TAB */}
              {activeTab === 'batch' && (
                <div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Upload Batch CSV</h3>
                  <p className="card-desc" style={{ marginBottom: '1rem' }}>
                    Upload a CSV file containing rows of features to generate bulk predictions.
                  </p>
                  
                  <div className="form-group">
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', width: '100%', color: 'var(--text-primary)' }}
                    />
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

                  {result && !loading && result.results && (
                    <div className="result-box" style={{ marginTop: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-success)', marginBottom: '1rem' }}>
                        <CheckCircle size={18} />
                        <strong>Batch Complete ({result.predictions_generated} rows)</strong>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <pre style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formatJSON(result.results.slice(0, 5))}
                          {result.results.length > 5 && "\n\n... (showing first 5 results)"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
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
