import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  SearchCode,
  FileSpreadsheet,
  Grid,
  TrendingUp,
  HelpCircle,
  ArrowLeft,
  Loader2,
  TableProperties
} from "lucide-react";
import API from "../utils/api";
import "./EDA.css";

const Eda = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryDatasetId = searchParams.get("dataset_id");

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(queryDatasetId || "");
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);

  // Status states
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

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

    const runEDA = async () => {
      setError("");
      setLoadingAnalysis(true);
      
      try {
        const [sumRes, insRes, distRes] = await Promise.all([
          API.get(`/analysis/${selectedDatasetId}/summary`),
          API.get(`/analysis/${selectedDatasetId}/insights`),
          API.get(`/analysis/${selectedDatasetId}/distribution`),
        ]);

        setSummaryData(sumRes.data);
        setInsightsData(insRes.data);
        setDistributionData(distRes.data);

        // Correlation might fail if there are no numeric columns
        try {
          const corrRes = await API.get(`/analysis/${selectedDatasetId}/correlation`);
          setCorrelationData(corrRes.data);
        } catch {
          setCorrelationData(null); // Set null if no numeric columns
        }
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to retrieve analysis data.");
      } finally {
        setLoadingAnalysis(false);
      }
    };

    runEDA();
  }, [selectedDatasetId]);

  const handleDatasetChange = (e) => {
    setSelectedDatasetId(e.target.value);
  };

  // Helper to color code correlation cells
  const getCorrColorStyle = (val) => {
    const absVal = Math.abs(val);
    if (val > 0) {
      return {
        backgroundColor: `rgba(99, 102, 241, ${absVal * 0.7})`,
        color: absVal > 0.4 ? "#fff" : "var(--text-primary)",
      };
    } else {
      return {
        backgroundColor: `rgba(239, 68, 68, ${absVal * 0.7})`,
        color: absVal > 0.4 ? "#fff" : "var(--text-primary)",
      };
    }
  };

  return (
    <div className="eda-container page-enter">
      <div className="eda-header">
        <button type="button" className="back-btn clickable" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="eda-title-section">
          <h1>Automated EDA</h1>
          <p>Instantly perform exploratory data analysis and uncover insights</p>
        </div>
      </div>

      {error && <div className="eda-alert error-bg">{error}</div>}

      <div className="dataset-selector-card glass-panel">
        <label htmlFor="eda-dataset-select">Active Dataset</label>
        {loadingDatasets ? (
          <div className="loading-dropdown">
            <Loader2 className="animate-spin" size={16} />
            <span>Loading datasets…</span>
          </div>
        ) : (
          <select
            id="eda-dataset-select"
            value={selectedDatasetId}
            onChange={handleDatasetChange}
            disabled={loadingAnalysis}
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

      {loadingAnalysis && (
        <div className="analysis-loading glass-panel">
          <Loader2 className="animate-spin loading-icon" size={40} />
          <h2>Running Analytics Engine…</h2>
          <p>Calculating summaries, dataset insights, distributions, and correlations.</p>
        </div>
      )}

      {!loadingAnalysis && summaryData && (
        <div className="eda-results-section">
          {/* Tab Navigation */}
          <div className="eda-tabs">
            <button type="button"
              className={`eda-tab clickable ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <TableProperties size={16} />
              <span>Overview & Insights</span>
            </button>
            <button type="button"
              className={`eda-tab clickable ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              <FileSpreadsheet size={16} />
              <span>Numeric Summary</span>
            </button>
            <button type="button"
              className={`eda-tab clickable ${activeTab === "distribution" ? "active" : ""}`}
              onClick={() => setActiveTab("distribution")}
            >
              <TrendingUp size={16} />
              <span>Column Distributions</span>
            </button>
            <button type="button"
              className={`eda-tab clickable ${activeTab === "correlation" ? "active" : ""}`}
              onClick={() => setActiveTab("correlation")}
            >
              <Grid size={16} />
              <span>Correlation Matrix</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="tab-content-container">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && insightsData && (
              <div className="overview-tab-content page-enter">
                <div className="insights-summary-grid">
                  <div className="insight-metric-card glass-panel">
                    <span className="metric-label">Total Rows</span>
                    <span className="metric-value">{insightsData.total_rows}</span>
                  </div>
                  <div className="insight-metric-card glass-panel">
                    <span className="metric-label">Total Columns</span>
                    <span className="metric-value">{insightsData.total_columns}</span>
                  </div>
                  <div className="insight-metric-card glass-panel">
                    <span className="metric-label">Missing Cells</span>
                    <span className={`metric-value ${insightsData.missing_cells > 0 ? "highlight-warn" : ""}`}>
                      {insightsData.missing_cells} ({insightsData.missing_percentage}%)
                    </span>
                  </div>
                  <div className="insight-metric-card glass-panel">
                    <span className="metric-label">Duplicate Rows</span>
                    <span className={`metric-value ${insightsData.duplicate_rows > 0 ? "highlight-danger" : ""}`}>
                      {insightsData.duplicate_rows}
                    </span>
                  </div>
                </div>

                <div className="columns-breakdown glass-panel">
                  <h2>Columns Types Breakdown</h2>
                  <p className="card-desc">Categorization based on data types parsed from CSV</p>
                  
                  <div className="breakdown-columns">
                    <div className="column-list-box">
                      <h3>Numeric Columns ({insightsData.numeric_columns_count})</h3>
                      <ul>
                        {insightsData.numeric_columns.map((col) => (
                          <li key={col}>
                            <span className="col-name">{col}</span>
                            <span className="type-badge numeric-badge">float/int</span>
                          </li>
                        ))}
                        {insightsData.numeric_columns.length === 0 && (
                          <li className="no-cols">No numeric columns found.</li>
                        )}
                      </ul>
                    </div>

                    <div className="column-list-box">
                      <h3>Categorical Columns ({insightsData.categorical_columns_count})</h3>
                      <ul>
                        {insightsData.categorical_columns.map((col) => (
                          <li key={col}>
                            <span className="col-name">{col}</span>
                            <span className="type-badge categorical-badge">string</span>
                          </li>
                        ))}
                        {insightsData.categorical_columns.length === 0 && (
                          <li className="no-cols">No categorical columns found.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NUMERIC SUMMARY TAB */}
            {activeTab === "summary" && summaryData && (
              <div className="summary-tab-content page-enter">
                <div className="glass-panel summary-table-card">
                  <h2>Descriptive Statistics</h2>
                  <p className="card-desc">Detailed summary statistics for numeric features</p>
                  
                  <div className="stats-table-wrapper">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Statistic</th>
                          {Object.keys(summaryData.numeric_summary).map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.numeric_summary[Object.keys(summaryData.numeric_summary)[0]] ? (
                          Object.keys(summaryData.numeric_summary[Object.keys(summaryData.numeric_summary)[0]]).map((statName) => (
                            <tr key={statName}>
                              <td className="stat-name-cell">{statName}</td>
                              {Object.keys(summaryData.numeric_summary).map((col) => {
                                const val = summaryData.numeric_summary[col][statName];
                                return (
                                  <td key={col}>
                                    {typeof val === "number" ? val.toFixed(4) : val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5">No numeric columns to summarize.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DISTRIBUTION TAB */}
            {activeTab === "distribution" && distributionData && (
              <div className="distribution-tab-content page-enter">
                <div className="distributions-grid">
                  {Object.entries(distributionData.distributions).map(([colName, dist]) => (
                    <div key={colName} className="dist-card glass-panel">
                      <div className="dist-card-header">
                        <h4>{colName}</h4>
                        <span className={`type-badge ${dist.type === "numeric" ? "numeric-badge" : "categorical-badge"}`}>
                          {dist.type}
                        </span>
                      </div>
                      
                      {dist.type === "numeric" ? (
                        <div className="dist-stats">
                          <div className="dist-row"><span>Mean</span><strong>{dist.mean?.toFixed(4) ?? "N/A"}</strong></div>
                          <div className="dist-row"><span>Median</span><strong>{dist.median?.toFixed(4) ?? "N/A"}</strong></div>
                          <div className="dist-row"><span>Std Dev</span><strong>{dist.std?.toFixed(4) ?? "N/A"}</strong></div>
                          <div className="dist-row"><span>Min</span><strong>{dist.min?.toFixed(4) ?? "N/A"}</strong></div>
                          <div className="dist-row"><span>Max</span><strong>{dist.max?.toFixed(4) ?? "N/A"}</strong></div>
                        </div>
                      ) : (
                        <div className="dist-stats">
                          <div className="dist-row"><span>Unique Values</span><strong>{dist.unique_values}</strong></div>
                          <div className="top-values-heading">Top Values:</div>
                          <div className="top-values-list">
                            {Object.entries(dist.top_values).map(([val, count]) => (
                              <div key={val} className="top-value-row">
                                <span className="top-value-name">{val || "[empty]"}</span>
                                <span className="top-value-count">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CORRELATION MATRIX TAB */}
            {activeTab === "correlation" && (
              <div className="correlation-tab-content page-enter">
                {correlationData ? (
                  <div className="glass-panel corr-card">
                    <h2>Pearson Correlation Matrix</h2>
                    <p className="card-desc">Visual correlation coefficient map between numeric features (-1.0 to +1.0)</p>

                    <div className="corr-table-wrapper">
                      <table className="corr-table">
                        <thead>
                          <tr>
                            <th><span aria-label="Feature" style={{ display: 'none' }}>Feature</span></th>
                            {correlationData.numeric_columns.map((col) => (
                              <th key={col} className="corr-th-rotated"><div>{col}</div></th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {correlationData.numeric_columns.map((rowCol) => (
                            <tr key={rowCol}>
                              <td className="corr-row-label">{rowCol}</td>
                              {correlationData.numeric_columns.map((colCol) => {
                                const val = correlationData.correlation_matrix[rowCol][colCol];
                                return (
                                  <td
                                    key={colCol}
                                    style={getCorrColorStyle(val)}
                                    className="corr-cell"
                                    title={`Correlation between ${rowCol} and ${colCol}: ${val.toFixed(4)}`}
                                  >
                                    {val.toFixed(2)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state glass-panel">
                    <HelpCircle size={48} className="empty-icon" />
                    <h3>No Numeric Columns</h3>
                    <p>Pearson correlation analysis requires at least two numeric features in your dataset.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Eda;
