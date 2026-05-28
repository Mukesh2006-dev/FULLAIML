import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Image,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Cell
} from "recharts";
import API from "../utils/api";
import "./Visualizations.css";

/* ─── Color Palette ─── */
const CHART_COLORS = {
  cyan: "#00f0ff",
  cyanDim: "rgba(0,240,255,0.6)",
  purple: "#7c3aed",
  purpleDim: "rgba(124,58,237,0.6)",
  pink: "#ec4899",
  green: "#10b981",
  amber: "#f59e0b",
  gridLine: "rgba(255,255,255,0.06)",
  tickText: "#8892a8",
  tooltipBg: "rgba(12,16,32,0.95)",
  tooltipBorder: "rgba(0,240,255,0.2)",
};

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label, xKey, yKey }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="custom-chart-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="tooltip-value" style={{ color: entry.color || CHART_COLORS.cyan }}>
          {entry.name || xKey || "value"}: <strong>{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── Heatmap (custom SVG) ─── */
const HeatmapChart = ({ data, columns }) => {
  const size = columns.length;
  const cellSize = Math.min(65, Math.floor(800 / size));

  const colorScale = (value) => {
    // -1 (blue) → 0 (dark) → +1 (cyan/green)
    const clamped = Math.max(-1, Math.min(1, value));
    if (clamped >= 0) {
      const r = Math.round(0 + clamped * 0);
      const g = Math.round(30 + clamped * 210);
      const b = Math.round(40 + clamped * 215);
      return `rgb(${r},${g},${b})`;
    } else {
      const t = Math.abs(clamped);
      const r = Math.round(30 + t * 90);
      const g = Math.round(20 + t * 20);
      const b = Math.round(60 + t * 177);
      return `rgb(${r},${g},${b})`;
    }
  };

  const width = cellSize * size + 120;
  const height = cellSize * size + 80;

  return (
    <div className="heatmap-container">
      <svg width={width} height={height} className="heatmap-svg">
        <g transform="translate(100, 10)">
          {/* Column labels (top) */}
          {columns.map((col, i) => (
            <text
              key={`col-${i}`}
              x={i * cellSize + cellSize / 2}
              y={-4}
              textAnchor="end"
              transform={`rotate(-45, ${i * cellSize + cellSize / 2}, -4)`}
              className="heatmap-label"
            >
              {col.length > 10 ? col.slice(0, 9) + "…" : col}
            </text>
          ))}

          {/* Row labels (left) */}
          {columns.map((col, i) => (
            <text
              key={`row-${i}`}
              x={-8}
              y={i * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              className="heatmap-label"
            >
              {col.length > 12 ? col.slice(0, 11) + "…" : col}
            </text>
          ))}

          {/* Cells */}
          {data.map((cell, idx) => {
            const xi = columns.indexOf(cell.x);
            const yi = columns.indexOf(cell.y);
            if (xi === -1 || yi === -1) return null;
            return (
              <g key={idx}>
                <rect
                  x={xi * cellSize}
                  y={yi * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  rx={8}
                  fill={colorScale(cell.value)}
                  className="heatmap-cell"
                >
                  <title>{`${cell.y} × ${cell.x}: ${cell.value}`}</title>
                </rect>
                {cellSize >= 30 && (
                  <text
                    x={xi * cellSize + cellSize / 2}
                    y={yi * cellSize + cellSize / 2 + 4}
                    textAnchor="middle"
                    className="heatmap-cell-text"
                  >
                    {cell.value.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Legend */}
        <g transform={`translate(${cellSize * size + 110}, 10)`}>
          <defs>
            <linearGradient id="heatGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={colorScale(-1)} />
              <stop offset="50%" stopColor={colorScale(0)} />
              <stop offset="100%" stopColor={colorScale(1)} />
            </linearGradient>
          </defs>
          <rect width={12} height={cellSize * size} fill="url(#heatGrad)" rx={4} />
          <text x={18} y={10} className="heatmap-legend-text">+1</text>
          <text x={18} y={cellSize * size / 2 + 4} className="heatmap-legend-text">0</text>
          <text x={18} y={cellSize * size} className="heatmap-legend-text">-1</text>
        </g>
      </svg>
    </div>
  );
};

/* ─── Box Plot (custom SVG) ─── */
const BoxPlotChart = ({ data, column }) => {
  const { min, q1, median, q3, max, mean } = data;
  const padding = 40;
  const w = 500;
  const h = 200;
  const boxH = 70;
  const midY = h / 2;
  const range = max - min || 1;
  const scale = (v) => padding + ((v - min) / range) * (w - 2 * padding);

  return (
    <div className="boxplot-container">
      <svg viewBox={`0 0 ${w} ${h}`} className="boxplot-svg">
        {/* Axis line */}
        <line x1={padding} y1={midY + boxH / 2 + 20} x2={w - padding} y2={midY + boxH / 2 + 20}
          stroke={CHART_COLORS.gridLine} strokeWidth={1} />

        {/* Whisker lines */}
        <line x1={scale(min)} y1={midY} x2={scale(q1)} y2={midY}
          stroke={CHART_COLORS.cyan} strokeWidth={2} strokeDasharray="4,3" />
        <line x1={scale(q3)} y1={midY} x2={scale(max)} y2={midY}
          stroke={CHART_COLORS.cyan} strokeWidth={2} strokeDasharray="4,3" />

        {/* Whisker caps */}
        <line x1={scale(min)} y1={midY - 14} x2={scale(min)} y2={midY + 14}
          stroke={CHART_COLORS.cyan} strokeWidth={2} />
        <line x1={scale(max)} y1={midY - 14} x2={scale(max)} y2={midY + 14}
          stroke={CHART_COLORS.cyan} strokeWidth={2} />

        {/* IQR Box */}
        <rect
          x={scale(q1)} y={midY - boxH / 2}
          width={scale(q3) - scale(q1)} height={boxH}
          rx={6}
          fill="rgba(0,240,255,0.08)"
          stroke={CHART_COLORS.cyan}
          strokeWidth={1.5}
        />

        {/* Median */}
        <line x1={scale(median)} y1={midY - boxH / 2} x2={scale(median)} y2={midY + boxH / 2}
          stroke={CHART_COLORS.pink} strokeWidth={2.5} />

        {/* Mean dot */}
        <circle cx={scale(mean)} cy={midY} r={5}
          fill={CHART_COLORS.amber} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />

        {/* Labels */}
        {[
          { val: min, label: "Min" },
          { val: q1, label: "Q1" },
          { val: median, label: "Median" },
          { val: q3, label: "Q3" },
          { val: max, label: "Max" },
        ].map(({ val, label }) => (
          <g key={label}>
            <text x={scale(val)} y={midY + boxH / 2 + 16} textAnchor="middle"
              className="boxplot-label-text">{label}</text>
            <text x={scale(val)} y={midY + boxH / 2 + 32} textAnchor="middle"
              className="boxplot-value-text">{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
          </g>
        ))}

        {/* Mean label */}
        <text x={scale(mean)} y={midY - boxH / 2 - 10} textAnchor="middle"
          className="boxplot-mean-text">Mean: {mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
      </svg>

      <div className="boxplot-legend">
        <span><span className="legend-dot" style={{ background: CHART_COLORS.cyan }}></span> IQR Range</span>
        <span><span className="legend-dot" style={{ background: CHART_COLORS.pink }}></span> Median</span>
        <span><span className="legend-dot" style={{ background: CHART_COLORS.amber }}></span> Mean</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Main Visualizations Page
   ═══════════════════════════════════════════════════════ */
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
      } catch (error) {
        console.error(error);
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
      } catch (error) {
        console.error(error);
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
      } else if (plotType === "boxplot") {
        response = await API.get(`/visualizations/${selectedDatasetId}/boxplot`, {
          params: { column }
        });
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

  /* ─── Chart renderer ─── */
  const renderChart = () => {
    if (!chartResult) return null;
    const { chart_type, data } = chartResult;

    switch (chart_type) {
      case "histogram":
        return (
          <ResponsiveContainer width="100%" height={550}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
              <XAxis
                dataKey="bin"
                tick={{ fill: CHART_COLORS.tickText, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={80}
              />
              <YAxis tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,240,255,0.04)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {data.map((_, i) => (
                  <Cell key={i} fill={`rgba(0,240,255,${0.5 + (i / data.length) * 0.5})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={550}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 60 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }} />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fill: CHART_COLORS.tickText, fontSize: 11 }}
                width={120}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? CHART_COLORS.cyan : CHART_COLORS.purple} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={550}>
            <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
              <XAxis
                dataKey="x"
                type="number"
                name={chartResult.x_column}
                tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }}
                label={{ value: chartResult.x_column, position: "bottom", fill: CHART_COLORS.tickText, fontSize: 12 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name={chartResult.y_column}
                tick={{ fill: CHART_COLORS.tickText, fontSize: 12 }}
                label={{ value: chartResult.y_column, angle: -90, position: "insideLeft", fill: CHART_COLORS.tickText, fontSize: 12 }}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="custom-chart-tooltip">
                      <p className="tooltip-value" style={{ color: CHART_COLORS.cyan }}>
                        {chartResult.x_column}: <strong>{payload[0]?.value}</strong>
                      </p>
                      <p className="tooltip-value" style={{ color: CHART_COLORS.purple }}>
                        {chartResult.y_column}: <strong>{payload[1]?.value}</strong>
                      </p>
                    </div>
                  );
                }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter 
                data={data} 
                fill={CHART_COLORS.cyan} 
                fillOpacity={0.35} 
                stroke={CHART_COLORS.cyan}
                strokeWidth={1.5}
                strokeOpacity={0.8}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "heatmap":
        return <HeatmapChart data={data} columns={chartResult.columns} />;

      case "boxplot":
        return <BoxPlotChart data={data} column={chartResult.column} />;

      default:
        return <p style={{ color: CHART_COLORS.tickText }}>Unsupported chart type: {chart_type}</p>;
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
                  { id: "heatmap", label: "Heatmap" },
                  { id: "boxplot", label: "Box Plot" }
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
                  {/* Histogram, Bar & Box Plot Options */}
                  {(plotType === "histogram" || plotType === "bar" || plotType === "boxplot") && (
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
                      {(plotType === "histogram" || plotType === "boxplot") && (
                        <span className="field-hint">Note: This chart type requires numeric features.</span>
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
              <p>Aggregating records and building interactive chart.</p>
            </div>
          ) : chartResult ? (
            <div className="render-output page-enter">
              <div className="chart-wrapper">
                {renderChart()}
              </div>

              <div className="chart-metadata">
                <div className="meta-headline">
                  <TrendingUp size={16} className="trend-ico" />
                  <h4>Chart Attributes & Insights</h4>
                </div>

                <div className="meta-stats-list">
                  <div className="meta-stat-row">
                    <span>Chart Type</span>
                    <strong>{chartResult.chart_type?.toUpperCase()}</strong>
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
                  {chartResult.chart_type === "histogram" && chartResult.data && (
                    <div className="meta-stat-row">
                      <span>Total Records</span>
                      <strong>{chartResult.data.reduce((s, d) => s + d.count, 0).toLocaleString()}</strong>
                    </div>
                  )}
                  {chartResult.chart_type === "scatter" && chartResult.data && (
                    <div className="meta-stat-row">
                      <span>Data Points</span>
                      <strong>{chartResult.data.length.toLocaleString()}</strong>
                    </div>
                  )}
                  {chartResult.chart_type === "heatmap" && chartResult.columns && (
                    <div className="meta-stat-row">
                      <span>Numeric Columns</span>
                      <strong>{chartResult.columns.length}</strong>
                    </div>
                  )}
                  {chartResult.chart_type === "boxplot" && chartResult.data && (
                    <>
                      <div className="meta-stat-row">
                        <span>IQR (Q3 − Q1)</span>
                        <strong>{(chartResult.data.q3 - chartResult.data.q1).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="meta-stat-row">
                        <span>Range</span>
                        <strong>{(chartResult.data.max - chartResult.data.min).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                      </div>
                    </>
                  )}
                </div>

                {chartResult.chart_type === "bar" && chartResult.data && (
                  <div className="bar-chart-stats">
                    <h5>Top Category Counts</h5>
                    <div className="bar-stat-table">
                      {chartResult.data.map((item) => (
                        <div key={item.label} className="bar-stat-row">
                          <span className="bar-lbl">{item.label || "[empty]"}</span>
                          <div className="bar-bar-track">
                            <div
                              className="bar-bar-fill"
                              style={{
                                width: `${(item.count / Math.max(...chartResult.data.map(d => d.count))) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="bar-cnt">{item.count}</span>
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
