import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  ArrowLeft,
  Loader2,
  Image,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import API from "../utils/api";
import "./Visualizations.css";

const Visualizations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryDatasetId = searchParams.get("dataset_id");

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(queryDatasetId || "");
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [columns, setColumns] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(false);

  // Plot configurations
  const [plotType, setPlotType] = useState("histogram");
  const [column, setColumn] = useState("");
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");

  // Outputs
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");
  const [chartResult, setChartResult] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoadingDatasets(true);
        const response = await API.get("/datasets/");
        setDatasets(response.data);
        if (response.data.length > 0) {
          setSelectedDatasetId(prev => prev || response.data[0].id.toString());
        }
      } catch (err) {
        setError("Failed to fetch datasets list.");
      } finally {
        setLoadingDatasets(false);
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchColumns = async () => {
      setError("");
      setLoadingColumns(true);
      setChartResult(null);

      try {
        const response = await API.get(`/analysis/${selectedDatasetId}/summary`);
        setColumns(response.data.column_names || []);
        if (response.data.column_names?.length > 0) {
          setColumn(response.data.column_names[0]);
          setXColumn(response.data.column_names[0]);
          setYColumn(response.data.column_names[1] || response.data.column_names[0]);
        }
      } catch (err) {
        setError("Failed to fetch columns metadata for dataset.");
      } finally {
        setLoadingColumns(false);
      }
    };

    fetchColumns();
  }, [selectedDatasetId]);

  const handleDatasetChange = (e) => {
    setSelectedDatasetId(e.target.value);
  };

  const handleGeneratePlot = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId) return;

    setError("");
    setLoadingChart(true);
    setChartResult(null);

    try {
      let response;
      if (plotType === "histogram") {
        response = await API.get(`/visualizations/${selectedDatasetId}/histogram`, {
          params: { column }
        });
      } else if (plotType === "bar") {
        response = await API.get(`/visualizations/${selectedDatasetId}/bar`, {
          params: { column }
        });
      } else if (plotType === "scatter") {
        response = await API.get(`/visualizations/${selectedDatasetId}/scatter`, {
          params: { x_column: xColumn, y_column: yColumn }
        });
      } else if (plotType === "heatmap") {
        response = await API.get(`/visualizations/${selectedDatasetId}/heatmap`);
      }

      setChartResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to generate visualization. Verify input columns datatype compatibility."
      );
    } finally {
      setLoadingChart(false);
    }
  };

  return (
    <div className="visualizations-container page-enter">
      <div className="visualizations-header">
        <button type="button" className="back-btn clickable" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="visualizations-title-section">
          <h1>Visual Studio</h1>
          <p>Generate, render, and export graphical reports from your datasets</p>
        </div>
      </div>

      {error && <div className="visualizations-alert error-bg">{error}</div>}

      <div className="visualizations-grid">
        {/* Setup Panel */}
        <div className="setup-card glass-panel">
          <h2>Configure Chart</h2>
          <p className="card-desc">Select dataset, plot types, and target parameters</p>

          <form onSubmit={handleGeneratePlot} className="setup-form">
            <div className="select-group">
              <label htmlFor="vis-dataset">Dataset Source</label>
              {loadingDatasets ? (
                <div className="loading-dropdown">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Loading datasets…</span>
                </div>
              ) : (
                <select
                  id="vis-dataset"
                  value={selectedDatasetId}
                  onChange={handleDatasetChange}
                  disabled={loadingChart}
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

            <div className="select-group">
              <span className="label-text">Visualization Type</span>
              <div className="plot-types-grid">
                {[
                  { id: "histogram", label: "Histogram" },
                  { id: "bar", label: "Bar Chart" },
                  { id: "scatter", label: "Scatter Plot" },
                  { id: "heatmap", label: "Heatmap" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`plot-type-select-btn clickable ${plotType === type.id ? "active" : ""}`}
                    onClick={() => {
                      setPlotType(type.id);
                      setChartResult(null);
                    }}
                    disabled={loadingChart || loadingColumns}
                  >
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {loadingColumns ? (
              <div className="loading-columns">
                <Loader2 className="animate-spin" size={18} />
                <span>Reading columns from dataset…</span>
              </div>
            ) : (
              columns.length > 0 && (
                <div className="column-selections-area page-enter">
                  {/* Histogram & Bar Chart Options */}
                  {(plotType === "histogram" || plotType === "bar") && (
                    <div className="select-group">
                      <label htmlFor="vis-single-col">Target Column</label>
                      <select
                        id="vis-single-col"
                        value={column}
                        onChange={(e) => setColumn(e.target.value)}
                        disabled={loadingChart}
                        aria-label="Target Column"
                      >
                        {columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {plotType === "histogram" && (
                        <span className="field-hint">Note: Histograms require numeric features.</span>
                      )}
                    </div>
                  )}

                  {/* Scatter Plot Options */}
                  {plotType === "scatter" && (
                    <div className="double-selects-row">
                      <div className="select-group">
                        <label htmlFor="vis-x-col">X Axis Column</label>
                        <select
                          id="vis-x-col"
                          value={xColumn}
                          onChange={(e) => setXColumn(e.target.value)}
                          disabled={loadingChart}
                          aria-label="X Axis Column"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="select-group">
                        <label htmlFor="vis-y-col">Y Axis Column</label>
                        <select
                          id="vis-y-col"
                          value={yColumn}
                          onChange={(e) => setYColumn(e.target.value)}
                          disabled={loadingChart}
                          aria-label="Y Axis Column"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Heatmap options */}
                  {plotType === "heatmap" && (
                    <div className="heatmap-info-note">
                      <SlidersHorizontal size={16} />
                      <span>Heatmaps compute correlations across all numeric variables in parallel. No parameter settings required.</span>
                    </div>
                  )}
                </div>
              )
            )}

            <button
              type="submit"
              className="generate-btn clickable"
              disabled={loadingChart || loadingColumns || !selectedDatasetId}
            >
              {loadingChart ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Plotting…
                </>
              ) : (
                "Render Visualization"
              )}
            </button>
          </form>
        </div>

        {/* Display Card */}
        <div className="display-card glass-panel">
          <h2>Render Area</h2>
          <p className="card-desc">Computed plot visualization results output</p>

          {loadingChart ? (
            <div className="rendering-placeholder">
              <RefreshCw className="animate-spin render-spin-ico" size={40} />
              <h3>Compiling Data Graphics…</h3>
              <p>Aggregating records and building plot outputs via the matplotlib server.</p>
            </div>
          ) : chartResult ? (
            <div className="render-output page-enter">
              <div className="chart-wrapper glass-panel">
                <img
                  src={`http://localhost:8000${chartResult.chart_url}`}
                  alt={`${plotType} chart`}
                  className="rendered-image"
                />
              </div>

              <div className="chart-metadata">
                <div className="meta-headline">
                  <TrendingUp size={16} className="trend-ico" />
                  <h4>Chart Attributes & Insights</h4>
                </div>

                <div className="meta-stats-list">
                  <div className="meta-stat-row">
                    <span>Chart Type</span>
                    <strong>{plotType.toUpperCase()}</strong>
                  </div>
                  {chartResult.column && (
                    <div className="meta-stat-row">
                      <span>Column Target</span>
                      <strong>{chartResult.column}</strong>
                    </div>
                  )}
                  {chartResult.x_column && (
                    <div className="meta-stat-row">
                      <span>X Variable</span>
                      <strong>{chartResult.x_column}</strong>
                    </div>
                  )}
                  {chartResult.y_column && (
                    <div className="meta-stat-row">
                      <span>Y Variable</span>
                      <strong>{chartResult.y_column}</strong>
                    </div>
                  )}
                </div>

                {chartResult.top_values && (
                  <div className="bar-chart-stats">
                    <h5>Top Category Counts</h5>
                    <div className="bar-stat-table">
                      {Object.entries(chartResult.top_values).map(([val, cnt]) => (
                        <div key={val} className="bar-stat-row">
                          <span className="bar-lbl">{val || "[empty]"}</span>
                          <div className="bar-bar-track">
                            <div
                              className="bar-bar-fill"
                              style={{
                                width: `${(cnt / Math.max(...Object.values(chartResult.top_values))) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="bar-cnt">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="idle-display">
              <Image size={56} className="idle-img-icon" />
              <h3>No Active Chart</h3>
              <p>Configure your visualization and click "Render" on the left panel to output charts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
