import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Sparkle,
  ArrowLeft,
  CircleNotch,
  CheckCircle,
  FileCsv,
  Info
} from "@phosphor-icons/react";
import API from "../utils/api";
import { safeApiCall } from "../utils/asyncHandler";
import "./Preprocessing.css";

const Preprocessing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryDatasetId = searchParams.get("dataset_id");

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(queryDatasetId || "");
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoadingDatasets(true);
      const [response, error] = await safeApiCall(API.get("/datasets/"));
      if (error) {
        console.error(error);
        setError("Failed to fetch datasets list.");
      } else if (response) {
        setDatasets(response.data);
        if (response.data.length > 0) {
          setSelectedDatasetId(prev => prev || response.data[0].id.toString());
        }
      }
      setLoadingDatasets(false);
    };
     
    fetchDatasets();
  }, []);

  const handleDatasetChange = (e) => {
    setSelectedDatasetId(e.target.value);
    setResult(null);
    setError("");
  };

  const handleCleanAction = async (endpoint) => {
    if (!selectedDatasetId) {
      setError("Please select a dataset first.");
      return;
    }

    setError("");
    setResult(null);
    setProcessing(true);

    const [response, err] = await safeApiCall(API.post(`/preprocessing/${selectedDatasetId}/${endpoint}`));
    if (err) {
      setError(err.response?.data?.detail || "An error occurred during cleaning.");
    } else if (response) {
      setResult({
        action: endpoint,
        ...response.data,
      });
    }
    setProcessing(false);
  };

  const getCleanedPercentage = (original, cleaned) => {
    if (!original) return 0;
    return ((cleaned / original) * 100).toFixed(1);
  };

  return (
    <div className="preprocess-container page-enter">
      <div className="preprocess-header">
        <button type="button" className="back-btn clickable" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="preprocess-title-section">
          <h1>Data Preprocessing Pipeline</h1>
          <p>Remove noise, handle missing data, and clean your datasets for training</p>
        </div>
      </div>

      {error && <div className="preprocess-alert error-bg">{error}</div>}

      <div className="preprocess-grid">
        {/* Settings Panel */}
        <div className="preprocess-settings-card glass-panel">
          <h2>Select Dataset</h2>
          <p className="card-desc">Choose which dataset to pass through the preprocessing steps</p>

          <div className="dataset-picker-group">
            {loadingDatasets ? (
              <div className="loading-dropdown">
                <CircleNotch className="animate-spin" size={16} />
                <span>Loading datasets…</span>
              </div>
            ) : (
              <select
                value={selectedDatasetId}
                onChange={handleDatasetChange}
                disabled={processing}
                aria-label="Dataset Select"
              >
                {datasets.length === 0 && <option value="">No datasets uploaded yet</option>}
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.rows_count} rows × {d.columns_count} columns)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pipeline-actions-group">
            <h3>Pipeline Operations</h3>
            <p className="card-desc">Run specific data cleaning modules on the active dataset</p>

            <div className="action-buttons-list">
              <div className="pipeline-action-item">
                <div className="pipeline-action-text">
                  <h4>Remove Missing Values</h4>
                  <p>Drop any row containing null or empty values across all features</p>
                </div>
                <button type="button"
                  className="pipeline-btn clickable"
                  onClick={() => handleCleanAction("remove-missing")}
                  disabled={processing || !selectedDatasetId}
                >
                  Run
                </button>
              </div>

              <div className="pipeline-action-item">
                <div className="pipeline-action-text">
                  <h4>Remove Duplicate Rows</h4>
                  <p>Identify and delete identical duplicate records in the dataset</p>
                </div>
                <button type="button"
                  className="pipeline-btn clickable"
                  onClick={() => handleCleanAction("remove-duplicates")}
                  disabled={processing || !selectedDatasetId}
                >
                  Run
                </button>
              </div>

              <div className="pipeline-action-item highlight-action">
                <div className="pipeline-action-text">
                  <h4>Auto Clean Pipeline</h4>
                  <p>Run full cleanup (deduplication followed by missing row pruning)</p>
                </div>
                <button type="button"
                  className="pipeline-btn clean-all-btn clickable"
                  onClick={() => handleCleanAction("auto-clean")}
                  disabled={processing || !selectedDatasetId}
                >
                  <Sparkle size={14} weight="duotone" /> Run Auto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="preprocess-results-card glass-panel">
          <h2>Cleaning Logs & Report</h2>
          <p className="card-desc">Detailed results and metrics from the executed pipeline actions</p>

          {processing ? (
            <div className="pipeline-running">
              <CircleNotch className="animate-spin processing-ico" size={40} />
              <h3>Cleaning Pipeline Executing…</h3>
              <p>Analyzing rows, dropping anomalies, and saving cleaned dataset output.</p>
            </div>
          ) : result ? (
            <div className="pipeline-report-container page-enter">
              <div className="report-success-header">
                <CheckCircle size={24} weight="duotone" className="success-ico" />
                <span>{result.message}</span>
              </div>

              <div className="report-stats-grid">
                <div className="report-stat-item">
                  <span className="stat-lbl">Original Rows</span>
                  <span className="stat-val">{result.original_rows}</span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-lbl">Cleaned Rows</span>
                  <span className="stat-val text-success">{result.cleaned_rows}</span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-lbl">Rows Removed</span>
                  <span className="stat-val text-danger">
                    {result.removed_rows !== undefined ? result.removed_rows : result.total_removed_rows}
                  </span>
                </div>
                <div className="report-stat-item">
                  <span className="stat-lbl">Retention Rate</span>
                  <span className="stat-val text-accent">
                    {getCleanedPercentage(result.original_rows, result.cleaned_rows)}%
                  </span>
                </div>
              </div>

              <div className="report-log-details">
                <h3>Pipeline Log Report</h3>
                <div className="log-console">
                  <div className="console-line info-line">
                    <span className="timestamp">[INFO]</span> Executed operation: <strong>{result.action.toUpperCase()}</strong>
                  </div>
                  {result.after_duplicates_removed !== undefined && (
                    <div className="console-line">
                      <span className="timestamp">[STEP 1]</span> Duplicate rows removed. Rows remaining: {result.after_duplicates_removed}
                    </div>
                  )}
                  <div className="console-line success-line">
                    <span className="timestamp">[SUCCESS]</span> Saved cleaned dataset artifact to server at:
                    <div className="filepath-box">{result.cleaned_file_path}</div>
                  </div>
                </div>
              </div>

              <div className="info-notice">
                <Info size={16} weight="duotone" />
                <span>Note: Preprocessing creates a new cleaned file asset on the server. The original source dataset is kept intact.</span>
              </div>
            </div>
          ) : (
            <div className="pipeline-idle-state">
              <FileCsv size={48} weight="duotone" className="idle-icon" />
              <h3>Pipeline Ready</h3>
              <p>Select a dataset and choose an operation on the left panel to begin data cleaning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preprocessing;
