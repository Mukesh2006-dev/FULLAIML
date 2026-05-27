import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Trash2,
  Sparkles,
  SearchCode,
  LineChart,
  BrainCircuit,
  FileSpreadsheet,
  AlertCircle,
  Loader2
} from "lucide-react";
import API from "../utils/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import "./Dashboard.css";

const Dashboard = () => {
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    dataset: null,
    isDeleting: false,
    deleteResult: null,
  });

  const navigate = useNavigate();

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await API.get("/datasets/");
      setDatasets(response.data);
    } catch (error) {
        console.error(error);
      setError("Failed to load datasets. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDatasets();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Only CSV files are allowed.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setSuccess("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await API.post("/datasets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess("Dataset uploaded successfully!");
      setFile(null);
      // Reset input element
      const inputEl = document.getElementById("csv-file-input");
      if (inputEl) inputEl.value = "";
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  // Open the delete confirmation modal
  const handleDeleteClick = (dataset) => {
    setError("");
    setSuccess("");
    setDeleteModal({
      isOpen: true,
      dataset,
      isDeleting: false,
      deleteResult: null,
    });
  };

  // Execute the delete
  const handleDeleteConfirm = async () => {
    const datasetId = deleteModal.dataset?.id;
    if (!datasetId) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const response = await API.delete(`/datasets/${datasetId}`);
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        deleteResult: response.data,
      }));
    } catch (error) {
        console.error(error);
      setDeleteModal((prev) => ({
        ...prev,
        isOpen: false,
        isDeleting: false,
        deleteResult: null,
      }));
      setError("Failed to delete dataset. Please try again.");
    }
  };

  // Close the modal and refresh list
  const handleDeleteModalClose = () => {
    const hadResult = deleteModal.deleteResult !== null;
    setDeleteModal({
      isOpen: false,
      dataset: null,
      isDeleting: false,
      deleteResult: null,
    });
    if (hadResult) {
      setSuccess("Dataset and all related resources deleted successfully.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDatasets();
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="dashboard-container page-enter">
      <div className="dashboard-header-section">
        <h1>Dataset Hub</h1>
        <p>Upload, explore, clean, and build machine learning models with your data</p>
      </div>

      {error && (
        <div className="dashboard-alert error-bg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="dashboard-alert success-bg">
          <Sparkles size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Upload Card */}
        <div className="dashboard-card glass-panel upload-card">
          <h2>Upload Dataset</h2>
          <p className="card-desc">Upload a CSV file containing your structured dataset (max 50MB)</p>
          
          <form className="upload-form" onSubmit={handleUploadSubmit}>
            <div className="drag-drop-zone">
              <Upload className="upload-icon" size={40} />
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                aria-label="Upload CSV file"
              />
              <span className="file-name-label">
                {file ? file.name : "Select or drag CSV file"}
              </span>
              {file && <span className="file-size">{formatBytes(file.size)}</span>}
            </div>

            <button
              type="submit"
              className="upload-btn clickable"
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Uploading…
                </>
              ) : (
                "Upload File"
              )}
            </button>
          </form>
        </div>

        {/* Datasets List */}
        <div className="dashboard-card glass-panel datasets-card">
          <h2>My Datasets</h2>
          <p className="card-desc">Your uploaded data assets currently available on the server</p>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin loading-icon" size={32} />
              <span>Fetching datasets…</span>
            </div>
          ) : datasets.length === 0 ? (
            <div className="empty-state">
              <FileSpreadsheet size={48} className="empty-icon" />
              <h3>No Datasets Found</h3>
              <p>Upload your first CSV dataset using the upload panel to get started.</p>
            </div>
          ) : (
            <div className="datasets-table-wrapper">
              <table className="datasets-table">
                <thead>
                  <tr>
                    <th>Dataset Name</th>
                    <th>Size</th>
                    <th>Rows</th>
                    <th>Cols</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id}>
                      <td className="dataset-name-cell">
                        <FileSpreadsheet size={16} className="table-doc-icon" />
                        <span title={dataset.filename}>{dataset.filename}</span>
                      </td>
                      <td>{formatBytes(dataset.file_size)}</td>
                      <td>{dataset.rows_count}</td>
                      <td>{dataset.columns_count}</td>
                      <td className="actions-cell">
                        <button type="button"
                          className="action-btn clickable"
                          onClick={() => navigate(`/preprocessing?dataset_id=${dataset.id}`)}
                          title="Preprocess & Clean"
                        >
                          <Sparkles size={16} className="preprocess-ico" />
                        </button>
                        <button type="button"
                          className="action-btn clickable"
                          onClick={() => navigate(`/eda?dataset_id=${dataset.id}`)}
                          title="Run automated EDA"
                        >
                          <SearchCode size={16} className="eda-ico" />
                        </button>
                        <button type="button"
                          className="action-btn clickable"
                          onClick={() => navigate(`/visualizations?dataset_id=${dataset.id}`)}
                          title="Visualizations"
                        >
                          <LineChart size={16} className="chart-ico" />
                        </button>
                        <button type="button"
                          className="action-btn clickable"
                          onClick={() => navigate(`/ml-model?dataset_id=${dataset.id}`)}
                          title="Train ML Model"
                        >
                          <BrainCircuit size={16} className="train-ico" />
                        </button>
                        <button type="button"
                          className="action-btn clickable delete-btn"
                          onClick={() => handleDeleteClick(dataset)}
                          title="Delete Dataset"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        dataset={deleteModal.dataset}
        isDeleting={deleteModal.isDeleting}
        deleteResult={deleteModal.deleteResult}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteModalClose}
      />
    </div>
  );
};

export default Dashboard;
