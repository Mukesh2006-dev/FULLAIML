import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  BrainCircuit,
  Trash2,
  Eye,
  Crosshair,
  Boxes,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import API from "../utils/api";
import { useToast } from "../components/useToast";
import { safeApiCall } from "../utils/asyncHandler";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import "./ModelManagement.css";

const ModelManagement = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  // Filters
  const [filterDataset, setFilterDataset] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    const [res, err] = await safeApiCall(API.get("/models/"));
    if (err) {
      console.error("Failed to load models:", err);
      addToast("Error", "Failed to load models.", "error");
    } else if (res) {
      setModels(res.data);
    }
    setLoading(false);
  }, [addToast]);

  const fetchDatasets = useCallback(async () => {
    const [res] = await safeApiCall(API.get("/datasets/"));
    if (res) {
      setDatasets(res.data);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchDatasets();
  }, [fetchModels, fetchDatasets]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const [, err] = await safeApiCall(API.delete(`/models/${deleteTarget.id}`));
    if (err) {
      addToast("Error", "Failed to delete model.", "error");
    } else {
      addToast("Deleted", `Model "${deleteTarget.model_name}" deleted successfully.`, "success");
      fetchModels();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Filter models
  const filteredModels = models.filter((m) => {
    if (filterDataset !== "all" && m.dataset_id.toString() !== filterDataset) return false;
    if (filterType !== "all" && m.problem_type !== filterType) return false;
    return true;
  });

  // Stats
  const classificationCount = models.filter((m) => m.problem_type === "classification").length;
  const regressionCount = models.filter((m) => m.problem_type === "regression").length;

  // Helper to get primary metric value
  const getPrimaryMetric = (model) => {
    const m = model.metrics || {};
    if (model.problem_type === "classification") {
      return { label: "F1", value: m.f1_score };
    }
    return { label: "R²", value: m.r2_score };
  };

  // Get dataset name
  const getDatasetName = (datasetId) => {
    const ds = datasets.find((d) => d.id === datasetId);
    return ds ? ds.filename : `Dataset #${datasetId}`;
  };

  return (
    <div className="models-container page-enter">
      <div className="models-header">
        <button className="back-btn clickable" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="models-title-section">
          <h1>Model Management</h1>
          <p>View, manage, and navigate to your trained ML models</p>
        </div>
      </div>

      {/* Stats */}
      <div className="models-stats-bar">
        <div className="model-stat-chip glass-panel">
          <Boxes size={16} />
          <span>Total Models:</span>
          <strong>{models.length}</strong>
        </div>
        <div className="model-stat-chip glass-panel">
          <BarChart2 size={16} />
          <span>Classification:</span>
          <strong>{classificationCount}</strong>
        </div>
        <div className="model-stat-chip glass-panel">
          <TrendingUp size={16} />
          <span>Regression:</span>
          <strong>{regressionCount}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="models-filter-bar">
        <select
          value={filterDataset}
          onChange={(e) => setFilterDataset(e.target.value)}
          aria-label="Filter by dataset"
        >
          <option value="all">All Datasets</option>
          {datasets.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.filename}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filter by problem type"
        >
          <option value="all">All Types</option>
          <option value="classification">Classification</option>
          <option value="regression">Regression</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="models-loading">
          <Loader2 className="animate-spin" size={40} />
          <span>Loading models…</span>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="models-empty-state glass-panel">
          <BrainCircuit size={56} />
          <h3>{models.length === 0 ? "No Models Trained Yet" : "No Models Match Filters"}</h3>
          <p>
            {models.length === 0
              ? "Train your first model from the Model Training page to see it here."
              : "Try adjusting the dataset or type filter above."}
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div className="models-table-wrapper">
            <table className="models-table">
              <thead>
                <tr>
                  <th>Model Name</th>
                  <th>Algorithm</th>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Dataset</th>
                  <th>Primary Metric</th>
                  <th>Trained</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => {
                  const metric = getPrimaryMetric(model);
                  return (
                    <tr key={model.id}>
                      <td>
                        <div className="model-name-cell">
                          <BrainCircuit size={14} />
                          <span title={model.model_name}>{model.model_name}</span>
                        </div>
                      </td>
                      <td>{model.algorithm}</td>
                      <td>
                        <span className={`type-badge ${model.problem_type}`}>
                          {model.problem_type}
                        </span>
                      </td>
                      <td>{model.target_column}</td>
                      <td title={getDatasetName(model.dataset_id)}>
                        {getDatasetName(model.dataset_id)}
                      </td>
                      <td>
                        {metric.value !== undefined && metric.value !== null ? (
                          <span className="metric-chip">
                            {metric.label}: <strong>{Number(metric.value).toFixed(4)}</strong>
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="model-date-cell">
                        {new Date(model.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="model-actions">
                          <button
                            className="model-action-btn clickable"
                            title="Make Predictions"
                            onClick={() => navigate(`/predictions`)}
                          >
                            <Crosshair size={14} />
                          </button>
                          <button
                            className="model-action-btn clickable"
                            title="Compare Models"
                            onClick={() =>
                              navigate(
                                `/ml-comparison?dataset_id=${model.dataset_id}&problem_type=${model.problem_type}`
                              )
                            }
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="model-action-btn danger clickable"
                            title="Delete Model"
                            onClick={() => setDeleteTarget(model)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="glass-panel page-enter"
            style={{
              padding: "2rem",
              maxWidth: 420,
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2
              size={40}
              style={{ color: "var(--text-danger)", marginBottom: "1rem" }}
            />
            <h3
              style={{
                fontFamily: "var(--font-display)",
                marginBottom: "0.5rem",
              }}
            >
              Delete Model?
            </h3>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
              }}
            >
              This will permanently delete{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {deleteTarget.model_name}
              </strong>{" "}
              and its serialized file. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                className="back-btn clickable"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{ padding: "0.6rem 1.5rem" }}
              >
                Cancel
              </button>
              <button
                className="clickable"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--border-danger)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-danger)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagement;
