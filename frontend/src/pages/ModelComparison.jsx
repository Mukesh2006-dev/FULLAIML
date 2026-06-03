import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Scale,
  ArrowLeft,
  Loader2,
  Trophy,
  Database,
  BarChart2
} from "lucide-react";
import { motion } from "framer-motion";
import API from "../utils/api";
import { useToast } from "../components/ToastContext";
import { safeApiCall } from "../utils/asyncHandler";
import "./ModelComparison.css";

const ModelComparison = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const queryDatasetId = searchParams.get("dataset_id");
  const queryProblemType = searchParams.get("problem_type") || "classification";

  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState(queryDatasetId || "");
  const [problemType, setProblemType] = useState(queryProblemType);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      const [res, err] = await safeApiCall(API.get("/datasets/"));
      if (err) {
        console.error("Failed to load datasets:", err);
      } else if (res) {
        setDatasets(res.data);
        if (res.data.length > 0 && !queryDatasetId) {
          setDatasetId(res.data[0].id.toString());
        }
      }
    };
    fetchDatasets();
  }, [queryDatasetId]);

  const handleCompare = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!datasetId) {
      setError("Please select a dataset.");
      return;
    }

    setLoading(true);
    const [response, err] = await safeApiCall(API.get(`/ml/compare/${problemType}`, {
      params: { dataset_id: datasetId }
    }));

    if (err) {
      const detail = err.response?.data?.detail || "Failed to compare models.";
      setError(detail);
      addToast("Comparison Failed", detail, "error");
    } else if (response) {
      setResult(response.data);
      addToast(
        "Comparison Complete",
        response.data.message || "Models compared successfully.",
        "success"
      );
    }
    setLoading(false);
  };

  const getMetricKeys = () => {
    if (problemType === "classification") {
      return ["accuracy", "precision", "recall", "f1_score"];
    }
    return ["r2_score", "rmse", "mae", "mse"];
  };

  const formatMetric = (val) => {
    if (val === null || val === undefined) return "-";
    return Number(val).toFixed(4);
  };

  return (
    <div className="comparison-container page-enter">
      <div className="comparison-header">
        <button className="back-btn clickable" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="comparison-title-section">
          <h1>Compare Models</h1>
          <p>Evaluate and find the best performing model for your dataset</p>
        </div>
      </div>

      <div className="comparison-grid">
        {/* Setup Card */}
        <div className="glass-panel setup-card">
          <h2>Evaluation Setup</h2>
          <p className="card-desc">Select dataset and problem type</p>

          {error && (
            <div className="ml-alert error animate-danger-pulse" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-danger)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCompare} className="ml-form">
            <div className="form-group">
              <label>Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                required
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
                  <BarChart2 size={16} /> Classification
                </div>
                <div 
                  className={`radio-option ${problemType === 'regression' ? 'selected' : ''}`}
                  onClick={() => setProblemType('regression')}
                >
                  <Scale size={16} /> Regression
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="generate-btn clickable"
              disabled={loading || !datasetId}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Evaluating...
                </>
              ) : (
                <>
                  <Scale size={18} />
                  Compare Models
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="glass-panel results-card">
          <h2>Comparison Results</h2>
          <p className="card-desc">Performance metrics across trained models</p>

          {!result && !loading && (
            <div className="idle-display">
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Scale size={56} className="idle-icon" />
              </motion.div>
              <h3>Ready to Compare</h3>
              <p>Configure the evaluation parameters on the left and click "Compare Models" to see the leaderboard.</p>
            </div>
          )}

          {loading && (
            <div className="idle-display">
              <Loader2 size={56} className="idle-icon animate-spin text-accent" />
              <h3>Crunching Metrics</h3>
              <p>Loading historical model performances...</p>
            </div>
          )}

          {result && !loading && (
            <div className="results-content animate-fade-in-up">
              
              {result.unique_models_count === 1 ? (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--text-warning)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {result.message}
                </div>
              ) : null}

              {result.best_model && (
                <div className="best-model-highlight">
                  <div className="trophy-badge">
                    <Trophy size={40} />
                  </div>
                  <div className="best-model-title">
                    Best Performing Model
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Algorithm: <strong style={{ color: 'var(--text-primary)' }}>{result.best_model.algorithm}</strong> 
                    &nbsp;|&nbsp; Name: <strong style={{ color: 'var(--text-primary)' }}>{result.best_model.model_name}</strong>
                  </div>
                  <div className="best-model-metrics">
                    {getMetricKeys().map((key) => (
                      <div key={key} className="metric-card">
                        <span className="metric-label">{key.replace('_', ' ')}</span>
                        <span className="metric-value">{formatMetric(result.best_model[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.comparison && result.comparison.length > 0 && (
                <>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>All Models Ranked</h3>
                  <div className="comparison-table-container">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Model Name</th>
                          <th>Algorithm</th>
                          {getMetricKeys().map((key) => (
                            <th key={key}>{key.replace('_', ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Sort comparison array by best metric (just visually matching the backend max) */}
                        {[...result.comparison].sort((a, b) => {
                           if (problemType === 'classification') {
                             return (b.f1_score || 0) - (a.f1_score || 0);
                           } else {
                             return (b.r2_score || -999) - (a.r2_score || -999);
                           }
                        }).map((model) => {
                          const isBest = result.best_model && model.model_id === result.best_model.model_id;
                          return (
                            <tr key={model.model_id} className={isBest ? 'is-best-row' : ''}>
                              <td>
                                {model.model_name}
                                {isBest && <span className="is-best-badge"><Trophy size={10}/> Best</span>}
                              </td>
                              <td>{model.algorithm}</td>
                              {getMetricKeys().map((key) => (
                                <td key={key}>{formatMetric(model[key])}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelComparison;
