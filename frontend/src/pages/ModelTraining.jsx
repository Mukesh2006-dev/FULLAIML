import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  ArrowLeft,
  Loader2,
  Sliders,
  CheckCircle,
  Trophy,
  Activity,
  Award,
  BarChart3,
  ScatterChart,
  Scale,
  ListChecks,
  Circle,
  XCircle,
  Clock,
  Zap,
  Plus,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import API from "../utils/api";
import { useTrainingJob } from "../components/TrainingJobContext";
import { safeApiCall } from "../utils/asyncHandler";
import "./ModelTraining.css";


/* ── Circular progress ring component ── */
const ProgressRing = ({ progress }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-wrapper">
      <svg className="progress-ring-svg" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-bg" cx="70" cy="70" r={radius} />
        <circle
          className={`progress-ring-fill ${progress < 100 ? "animating" : ""}`}
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-text">
        {progress}<span>%</span>
      </div>
    </div>
  );
};

/* ── Status badge component ── */
const StatusBadge = ({ status }) => {
  const icons = {
    pending: <Clock size={12} />,
    running: <Zap size={12} />,
    completed: <CheckCircle size={12} />,
    failed: <XCircle size={12} />,
  };

  return (
    <span className={`job-status-badge ${status}`}>
      {icons[status] || <Circle size={12} />}
      {status}
    </span>
  );
};

/* ── Step progress indicators ── */
const TRAINING_STEPS = [
  { threshold: 0, label: "Job created — queued" },
  { threshold: 10, label: "Training job started" },
  { threshold: 30, label: "Loading dataset & preprocessing" },
  { threshold: 100, label: "Model trained & saved" },
];

const StepIndicators = ({ progress }) => (
  <div className="job-steps-list">
    {TRAINING_STEPS.map((step, i) => {
      const isDone = progress > step.threshold || (progress === 100 && step.threshold === 100);
      const isActive = !isDone && progress >= (TRAINING_STEPS[i - 1]?.threshold ?? 0);
      return (
        <div
          key={step.threshold}
          className={`job-step-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
        >
          {isDone ? (
            <CheckCircle size={13} />
          ) : isActive ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Circle size={13} />
          )}
          {step.label}
        </div>
      );
    })}
  </div>
);

/* ── Memoized Confusion Matrix chart (prevents re-init on parent re-render) ── */
const ConfusionMatrixChart = ({ trainResult }) => {
  const option = useMemo(() => {
    const cm = trainResult?.metrics?.confusion_matrix;
    if (!cm) return null;
    const labelCount = cm.labels.length;
    return {
      tooltip: {
        formatter: (p) => `Actual: ${p.data[1]}<br/>Predicted: ${p.data[0]}<br/>Count: <strong>${p.data[2]}</strong>`
      },
      grid: { top: 40, right: 40, bottom: 60, left: 70 },
      xAxis: {
        type: "category",
        data: cm.labels,
        name: "Predicted",
        nameLocation: "center",
        nameGap: 35,
        nameTextStyle: { color: "#8892a8", fontSize: 12, fontFamily: "JetBrains Mono" },
        axisLabel: { color: "#8892a8", fontSize: 10, fontFamily: "JetBrains Mono" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
        splitLine: { show: false }
      },
      yAxis: {
        type: "category",
        data: cm.labels,
        name: "Actual",
        nameLocation: "center",
        nameGap: 50,
        nameTextStyle: { color: "#8892a8", fontSize: 12, fontFamily: "JetBrains Mono" },
        axisLabel: { color: "#8892a8", fontSize: 10, fontFamily: "JetBrains Mono" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
        splitLine: { show: false }
      },
      visualMap: {
        min: 0,
        max: Math.max(...cm.heatmap_data.map(d => d.value)),
        calculable: true,
        orient: "vertical",
        right: 0,
        top: "center",
        inRange: { color: ["#0a1628", "#00494f", "#00c8d4", "#00f0ff"] },
        textStyle: { color: "#8892a8", fontSize: 10 },
        show: false
      },
      series: [{
        type: "heatmap",
        data: cm.heatmap_data.map(d => [d.predicted, d.actual, d.value]),
        label: {
          show: true,
          color: "#e8ecf4",
          fontSize: labelCount > 20 ? 8 : labelCount > 10 ? 10 : 13,
          fontWeight: 700,
          formatter: (p) => p.data[2] === 0 ? "" : p.data[2]
        },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,240,255,0.5)" } },
        itemStyle: {
          borderWidth: labelCount > 20 ? 1 : 2,
          borderColor: "#0c1020"
        }
      }]
    };
  }, [trainResult]);

  const labelCount = trainResult?.metrics?.confusion_matrix?.labels?.length || 0;
  const chartHeight = labelCount > 20 ? Math.max(400, labelCount * 14) : 360;

  if (!option) return null;
  return <ReactECharts style={{ height: chartHeight }} option={option} notMerge />;
};

/* ── Memoized Actual vs Predicted chart ── */
const ActualVsPredictedChart = ({ trainResult }) => {
  const option = useMemo(() => {
    const pts = trainResult?.metrics?.prediction_quality?.actual_vs_predicted;
    if (!pts) return null;
    const allVals = pts.flatMap(p => [p.actual, p.predicted]);
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const pad = (maxV - minV) * 0.08 || 1;
    return {
      tooltip: {
        formatter: (p) => `Actual: ${p.data[0].toFixed(3)}<br/>Predicted: ${p.data[1].toFixed(3)}`
      },
      grid: { top: 30, right: 30, bottom: 50, left: 60 },
      xAxis: {
        name: "Actual",
        nameLocation: "center",
        nameGap: 32,
        nameTextStyle: { color: "#8892a8", fontSize: 12, fontFamily: "JetBrains Mono" },
        min: minV - pad,
        max: maxV + pad,
        axisLabel: { color: "#8892a8", fontSize: 10, fontFamily: "JetBrains Mono" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } }
      },
      yAxis: {
        name: "Predicted",
        nameLocation: "center",
        nameGap: 42,
        nameTextStyle: { color: "#8892a8", fontSize: 12, fontFamily: "JetBrains Mono" },
        min: minV - pad,
        max: maxV + pad,
        axisLabel: { color: "#8892a8", fontSize: 10, fontFamily: "JetBrains Mono" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } }
      },
      series: [
        {
          type: "scatter",
          data: pts.map(p => [p.actual, p.predicted]),
          symbolSize: 8,
          itemStyle: { color: "#00f0ff", opacity: 0.8 },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,240,255,0.6)" } }
        },
        {
          type: "line",
          data: [[minV - pad, minV - pad], [maxV + pad, maxV + pad]],
          lineStyle: { color: "rgba(167,139,250,0.5)", type: "dashed", width: 2 },
          symbol: "none",
          tooltip: { show: false }
        }
      ]
    };
  }, [trainResult]);

  if (!option) return null;
  return <ReactECharts style={{ height: 360 }} option={option} notMerge />;
};

const ModelTraining = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryDatasetId = searchParams.get("dataset_id");

  // Use global training job context (persists across page navigations)
  const {
    jobProgress,
    jobMessage,
    jobStatus,
    training,
    trainResult,
    trainError,
    formBusy,
    startTrainingJob,
    startNewJob,
    jobHistory,
    removeJobFromHistory,
  } = useTrainingJob();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(queryDatasetId || "");
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [columns, setColumns] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(false);

  // Form states
  const [modelName, setModelName] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [problemType, setProblemType] = useState("classification");
  const [algorithm, setAlgorithm] = useState("random_forest");
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);

  // Hyperparameters
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState("");

  // Local UI error (distinct from context trainError)
  const [error, setError] = useState("");

  const selectedFeatureColumns = columns.filter((column) => column !== targetColumn);

  // ── Fetch datasets ──
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

  // ── Fetch columns when dataset changes ──
  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchColumns = async () => {
      setError("");
      setLoadingColumns(true);

      const [response, error] = await safeApiCall(API.get(`/analysis/${selectedDatasetId}/summary`));
      if (error) {
        console.error(error);
        setError("Failed to fetch columns metadata.");
      } else if (response) {
        setColumns(response.data.column_names || []);
        if (response.data.column_names?.length > 0) {
          setTargetColumn(response.data.column_names[response.data.column_names.length - 1]);
        }
      }
      setLoadingColumns(false);
    };

    fetchColumns();
  }, [selectedDatasetId]);

  // Reset algorithm to random_forest when problem type changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlgorithm("random_forest");
  }, [problemType]);

  const handleDatasetChange = (e) => {
    setSelectedDatasetId(e.target.value);
  };

  const handleTrainSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId || !targetColumn || !modelName) {
      setError("Please fill in all required training parameters.");
      return;
    }

    if (selectedFeatureColumns.length === 0) {
      setError("Select a dataset with at least one input column besides the target.");
      return;
    }

    setError("");

    const hyperparameters = {};
    if (algorithm === "random_forest") {
      hyperparameters.n_estimators = parseInt(nEstimators);
      if (maxDepth) {
        hyperparameters.max_depth = parseInt(maxDepth);
      }
    }

    await startTrainingJob(
      {
        dataset_id: parseInt(selectedDatasetId),
        model_name: modelName,
        algorithm,
        problem_type: problemType,
        target_column: targetColumn,
        test_size: parseFloat(testSize),
        random_state: parseInt(randomState),
        hyperparameters,
      },
      { datasetId: selectedDatasetId, problemType }
    );
  };

  return (
    <div className="ml-container page-enter">
      <div className="ml-header">
        <button type="button" className="back-btn clickable" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="ml-title-section">
          <h1>Model Training Studio</h1>
          <p>Configure algorithms, tune hyperparameters, and train ML predictive models</p>
        </div>
      </div>

      {(error || trainError) && <div className="ml-alert error-bg">{error || trainError}</div>}

      <div className="ml-grid">
        {/* Configurations Form */}
        <div className="ml-setup-card glass-panel">
          <h2>Training Settings</h2>
          <p className="card-desc">Set target, algorithm configurations, and hyperparameters</p>

          <form onSubmit={handleTrainSubmit} className="ml-form">
            <div className="form-group">
              <label htmlFor="ml-dataset">Dataset Source</label>
              {loadingDatasets ? (
                <div className="loading-dropdown">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Loading datasets…</span>
                </div>
              ) : (
                <select
                  id="ml-dataset"
                  value={selectedDatasetId}
                  onChange={handleDatasetChange}
                  disabled={formBusy}
                  aria-label="Dataset Source"
                >
                  {datasets.length === 0 && <option value="">No datasets uploaded yet</option>}
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.filename}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ml-model-name">Model Name</label>
              <input
                id="ml-model-name"
                type="text"
                placeholder="e.g. Churn Prediction Model"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                disabled={formBusy}
                aria-label="Model Name"
              />
            </div>

            <div className="double-form-row">
              <div className="form-group">
                <label htmlFor="ml-problem-type">Problem Type</label>
                <select
                  id="ml-problem-type"
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  disabled={formBusy}
                >
                  <option value="classification">Classification</option>
                  <option value="regression">Regression</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ml-algo">Algorithm</label>
                <select
                  id="ml-algo"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  disabled={formBusy}
                >
                  {problemType === "classification" ? (
                    <>
                      <option value="random_forest">Random Forest Classifier</option>
                      <option value="logistic_regression">Logistic Regression</option>
                    </>
                  ) : (
                    <>
                      <option value="random_forest">Random Forest Regressor</option>
                      <option value="linear_regression">Linear Regression</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {loadingColumns ? (
              <div className="loading-columns">
                <Loader2 className="animate-spin" size={16} />
                <span>Reading columns from dataset…</span>
              </div>
            ) : (
              columns.length > 0 && (
                <div className="form-group page-enter">
                  <label htmlFor="ml-target">Target (Y) Column</label>
                  <select
                    id="ml-target"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    disabled={formBusy}
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">The column you want the model to predict.</span>
                </div>
              )
            )}

            {!loadingColumns && columns.length > 0 && targetColumn && (
              <div className="training-inputs-panel page-enter">
                <div className="training-inputs-header">
                  <div>
                    <span className="training-inputs-kicker">Training Inputs</span>
                    <strong>{selectedFeatureColumns.length} feature columns</strong>
                  </div>
                  <ListChecks size={18} />
                </div>

                <div className="feature-chip-list" aria-label="Feature columns used for model training">
                  {selectedFeatureColumns.map((column) => (
                    <span key={column} className="feature-chip" title={column}>
                      {column}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hyperparameter Accordion */}
            <div className="hyperparameters-section">
              <div className="hyper-header">
                <Sliders size={16} />
                <span>Hyperparameters & Parameters</span>
              </div>

              <div className="hyper-fields">
                <div className="double-form-row">
                  <div className="form-group">
                    <label htmlFor="ml-test-size">Test Split Size</label>
                    <input
                      id="ml-test-size"
                      type="number"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={testSize}
                      onChange={(e) => setTestSize(e.target.value)}
                      disabled={formBusy}
                      aria-label="Test Split Size"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ml-random">Random State</label>
                    <input
                      id="ml-random"
                      type="number"
                      value={randomState}
                      onChange={(e) => setRandomState(e.target.value)}
                      disabled={formBusy}
                      aria-label="Random State"
                    />
                  </div>
                </div>

                {algorithm === "random_forest" && (
                  <div className="double-form-row forest-params page-enter">
                    <div className="form-group">
                      <label htmlFor="ml-estimators">Estimators (Trees)</label>
                      <input
                        id="ml-estimators"
                        type="number"
                        min="10"
                        max="1000"
                        value={nEstimators}
                        onChange={(e) => setNEstimators(e.target.value)}
                        disabled={formBusy}
                        aria-label="Estimators"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ml-depth">Max Depth</label>
                      <input
                        id="ml-depth"
                        type="number"
                        placeholder="Unlimited"
                        value={maxDepth}
                        onChange={(e) => setMaxDepth(e.target.value)}
                        disabled={formBusy}
                        aria-label="Max Depth"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="train-btn clickable"
              disabled={formBusy || loadingColumns || !selectedDatasetId}
            >
              {training ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Training in Progress…
                </>
              ) : (
                "Start Model Training"
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="ml-results-card glass-panel">
          <h2>Training Results</h2>
          <p className="card-desc">Validation performance metrics and weights report</p>

          {training ? (
            /* ── Async Job Progress UI ── */
            <div className="job-progress-container page-enter">
              <StatusBadge status={jobStatus || "pending"} />
              <ProgressRing progress={jobProgress} />
              <p className="job-message-text">{jobMessage}</p>
              <StepIndicators progress={jobProgress} />
            </div>
          ) : trainResult ? (
            <div className="training-report-container page-enter">
              <div className="report-success-header">
                <CheckCircle size={22} className="success-ico" />
                <span>{trainResult.message}</span>
              </div>

              {/* Performance Metrics Cards */}
              <div className="performance-metrics-title">
                <Activity size={16} />
                <span>Validation Performance</span>
              </div>

              {trainResult.problem_type === "classification" ? (
                <>
                  {/* Classification Metric Cards */}
                  <div className="metrics-box-grid metrics-box-grid-4">
                    {["accuracy", "precision", "recall", "f1_score"].map((key) => {
                      const val = trainResult.metrics[key];
                      if (val === undefined) return null;
                      const pct = (val * 100).toFixed(1);
                      return (
                        <div key={key} className="metric-box-item glass-panel">
                          <Trophy className="trophy-ico" size={24} />
                          <span className="metric-box-lbl">{key.replace("_", " ").toUpperCase()}</span>
                          <span className="metric-box-val">{pct}%</span>
                          <div className="metric-bar-track">
                            <div className="metric-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Confusion Matrix Heatmap */}
                  {trainResult.metrics.confusion_matrix && (
                    <div className="chart-section glass-panel">
                      <div className="chart-section-header">
                        <BarChart3 size={16} />
                        <span>Confusion Matrix</span>
                      </div>
                      <ConfusionMatrixChart trainResult={trainResult} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Regression Metric Cards */}
                  <div className="metrics-box-grid metrics-box-grid-4">
                    {["mae", "mse", "rmse", "r2_score"].map((key) => {
                      const val = trainResult.metrics[key];
                      if (val === undefined) return null;
                      return (
                        <div key={key} className="metric-box-item glass-panel">
                          <Trophy className="trophy-ico" size={24} />
                          <span className="metric-box-lbl">{key.replace("_", " ").toUpperCase()}</span>
                          <span className="metric-box-val">{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actual vs Predicted Scatter */}
                  {trainResult.metrics.prediction_quality?.actual_vs_predicted && (
                    <div className="chart-section glass-panel">
                      <div className="chart-section-header">
                        <ScatterChart size={16} />
                        <span>Actual vs Predicted</span>
                      </div>
                      <ActualVsPredictedChart trainResult={trainResult} />
                    </div>
                  )}
                </>
              )}

              {/* Model attributes */}
              <div className="model-report-details">
                <div className="model-report-header">
                  <Award size={16} />
                  <span>Model Metadata</span>
                </div>

                <div className="meta-stats-list">
                  <div className="meta-stat-row">
                    <span>Model ID</span>
                    <strong>#{trainResult.model_id}</strong>
                  </div>
                  <div className="meta-stat-row">
                    <span>Model Name</span>
                    <strong>{trainResult.model_name}</strong>
                  </div>
                  <div className="meta-stat-row">
                    <span>Algorithm</span>
                    <strong>{trainResult.algorithm}</strong>
                  </div>
                  <div className="meta-stat-row">
                    <span>Problem Type</span>
                    <strong>{trainResult.problem_type}</strong>
                  </div>
                  <div className="meta-stat-row">
                    <span>Target Variable</span>
                    <strong>{trainResult.target_column}</strong>
                  </div>
                  <div className="meta-stat-row file-path-row">
                    <span>Serialized Output</span>
                    <strong className="filepath-text" title={trainResult.model_path}>
                      {trainResult.model_path}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button 
                    className="generate-btn clickable" 
                    style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border-focus)' }}
                    onClick={() => navigate(`/ml-comparison?dataset_id=${selectedDatasetId}&problem_type=${problemType}`)}
                  >
                    <Scale size={18} />
                    Compare with Previous Models
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="training-idle-state">
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <BrainCircuit size={56} className="idle-brain-icon" />
              </motion.div>
              <h3>Training Ready</h3>
              <p>Configure model target and algorithm parameters on the left card and click "Start" to launch the training process.</p>
            </div>
          )}

          {/* Start New Job button — shown when training or results are visible */}
          {(training || trainResult) && (
            <button
              type="button"
              className="new-job-btn clickable"
              onClick={() => {
                startNewJob();
                setModelName("");
                setError("");
              }}
            >
              <Plus size={16} />
              Start New Job
            </button>
          )}

          {/* ── Job History List ── */}
          {jobHistory.length > 0 && (
            <div className="job-history-section page-enter">
              <div className="job-history-header">
                <div className="job-history-title">
                  <Activity size={18} />
                  <span>Training Jobs</span>
                </div>
                <span className="job-history-count">{jobHistory.length} job{jobHistory.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="job-history-list">
                {jobHistory.map((job) => (
                  <div key={job.id} className={`job-history-item glass-panel ${job.status}`}>
                    <div className="job-history-item-top">
                      <div className="job-history-item-left">
                        <StatusBadge status={job.status} />
                        <span className="job-history-id">Job #{job.id}</span>
                        {job.result?.model_name && (
                          <span className="job-history-model-name">{job.result.model_name}</span>
                        )}
                      </div>
                      <div className="job-history-item-right">
                        <span className="job-history-progress-text">{job.progress}%</span>
                        <button
                          type="button"
                          className="job-history-dismiss"
                          onClick={() => removeJobFromHistory(job.id)}
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="job-history-progress-track">
                      <div
                        className={`job-history-progress-fill ${job.status}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>

                    {/* Message */}
                    {job.message && (
                      <p className="job-history-message">{job.message}</p>
                    )}

                    {/* Error */}
                    {job.error && (
                      <p className="job-history-error">{job.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelTraining;
