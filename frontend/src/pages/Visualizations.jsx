import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Image,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp
} from "lucide-react";
import API from "../utils/api";
import { useToast } from "../components/ToastContext";
import "./Visualizations.css";

const ReactECharts = lazy(() => import("echarts-for-react"));

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

/* ─── Heatmap (ECharts) ─── */
const HeatmapChart = ({ data, columns }) => {
  const heatmapData = data.reduce((acc, item) => {
    const xIndex = columns.indexOf(item.x);
    const yIndex = columns.indexOf(item.y);
    if (xIndex !== -1 && yIndex !== -1) {
      acc.push([xIndex, yIndex, Number(item.value.toFixed(2))]);
    }
    return acc;
  }, []);

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: CHART_COLORS.tooltipBg,
      borderColor: CHART_COLORS.tooltipBorder,
      borderWidth: 1,
      padding: 10,
      textStyle: { color: CHART_COLORS.tickText, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 },
      formatter: function (params) {
        const xName = columns[params.value[0]];
        const yName = columns[params.value[1]];
        const val = params.value[2];
        return `<div style="margin-bottom:4px;color:${CHART_COLORS.cyan}">${xName} × ${yName}</div>
                <div style="color:#fff;font-weight:bold">Correlation: ${val}</div>`;
      }
    },
    grid: { top: 40, bottom: 100, left: 120, right: 80 },
    xAxis: {
      type: 'category',
      data: columns,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0)'] } },
      axisLabel: { color: CHART_COLORS.tickText, interval: 0, rotate: 45, fontSize: 11 },
      axisLine: { lineStyle: { color: CHART_COLORS.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: columns,
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0)'] } },
      axisLabel: { color: CHART_COLORS.tickText, fontSize: 11 },
      axisLine: { lineStyle: { color: CHART_COLORS.gridLine } }
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      realtime: false,
      hoverLink: false,
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemHeight: 200,
      inRange: {
        color: [CHART_COLORS.purple, '#0c1020', CHART_COLORS.cyan]
      },
      textStyle: { color: CHART_COLORS.tickText }
    },
    series: [{
      name: 'Correlation',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: columns.length < 15,
        color: '#fff',
        fontSize: 10
      },
      itemStyle: {
        borderRadius: 6,
        borderColor: '#0c1020',
        borderWidth: 2
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 14,
          shadowColor: 'rgba(0, 240, 255, 0.6)'
        }
      }
    }]
  };

  const chartHeight = Math.max(500, columns.length * 40 + 150);

  return (
    <div style={{ width: '100%', height: `${chartHeight}px`, display: 'flex', justifyContent: 'center' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%', maxWidth: '1000px' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

/* ─── Chart Renderer ─── */
const ChartRenderer = ({ chartResult }) => {
  if (!chartResult) return null;
  const { chart_type, data } = chartResult;

  switch (chart_type) {
    case "histogram": {
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: CHART_COLORS.tooltipBg,
          borderColor: CHART_COLORS.tooltipBorder,
          borderWidth: 1,
          textStyle: { color: CHART_COLORS.tickText, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 },
          axisPointer: { type: 'shadow' }
        },
        grid: { top: 20, right: 30, left: 50, bottom: 80 },
        xAxis: {
          type: 'category',
          data: data.map(d => d.bin),
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 11, rotate: 35, interval: 0 },
          axisLine: { lineStyle: { color: CHART_COLORS.gridLine } }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: CHART_COLORS.gridLine, type: 'dashed' } },
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 12 }
        },
        series: [{
          name: 'Count',
          type: 'bar',
          data: data.map(d => d.count),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: CHART_COLORS.cyan }, { offset: 1, color: CHART_COLORS.purpleDim }]
            },
            borderRadius: [4, 4, 0, 0]
          },
          large: true
        }]
      };
      return (
        <div style={{ width: '100%', height: '550px' }}>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
        </div>
      );
    }

    case "bar": {
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: CHART_COLORS.tooltipBg,
          borderColor: CHART_COLORS.tooltipBorder,
          borderWidth: 1,
          textStyle: { color: CHART_COLORS.tickText, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 },
          axisPointer: { type: 'shadow' }
        },
        grid: { top: 20, right: 30, left: 130, bottom: 40 },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: CHART_COLORS.gridLine, type: 'dashed' } },
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 12 }
        },
        yAxis: {
          type: 'category',
          data: data.map(d => d.label),
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 11, width: 120, overflow: 'truncate' },
          axisLine: { lineStyle: { color: CHART_COLORS.gridLine } }
        },
        series: [{
          name: 'Count',
          type: 'bar',
          data: data.map(d => d.count),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [{ offset: 0, color: CHART_COLORS.purpleDim }, { offset: 1, color: CHART_COLORS.cyan }]
            },
            borderRadius: [0, 4, 4, 0]
          },
          large: true
        }]
      };
      return (
        <div style={{ width: '100%', height: '550px' }}>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
        </div>
      );
    }

    case "scatter": {
      const scatterData = data.map(d => [d.x, d.y]);

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: CHART_COLORS.tooltipBg,
          borderColor: CHART_COLORS.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          textStyle: { color: CHART_COLORS.tickText, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 },
          formatter: function (params) {
            return `<div style="margin-bottom:4px;color:${CHART_COLORS.cyan}">${chartResult.x_column}: <strong>${params.value[0]}</strong></div>
                    <div style="color:${CHART_COLORS.purple}">${chartResult.y_column}: <strong>${params.value[1]}</strong></div>`;
          }
        },
        grid: { top: 20, right: 30, left: 60, bottom: 40 },
        xAxis: {
          name: chartResult.x_column,
          nameLocation: 'middle',
          nameGap: 25,
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: CHART_COLORS.gridLine, type: 'dashed' } },
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 11 },
          nameTextStyle: { color: CHART_COLORS.tickText, fontSize: 12 }
        },
        yAxis: {
          name: chartResult.y_column,
          nameLocation: 'middle',
          nameGap: 40,
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: CHART_COLORS.gridLine, type: 'dashed' } },
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 11 },
          nameTextStyle: { color: CHART_COLORS.tickText, fontSize: 12 }
        },
        series: [{
          symbolSize: 6,
          data: scatterData,
          type: 'scatter',
          itemStyle: {
            color: CHART_COLORS.cyanDim,
            opacity: 0.8,
            borderColor: CHART_COLORS.cyan,
            borderWidth: 1.5
          },
          large: true, // Enables Canvas optimization for large data points
          largeThreshold: 1000
        }]
      };

      return (
        <div style={{ width: '100%', height: '550px' }}>
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      );
    }

    case "heatmap":
      return <HeatmapChart data={data} columns={chartResult.columns} />;

    case "boxplot": {
      const { min, q1, median, q3, max, mean } = data;
      const boxData = [[min, q1, median, q3, max]];

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: CHART_COLORS.tooltipBg,
          borderColor: CHART_COLORS.tooltipBorder,
          borderWidth: 1,
          textStyle: { color: CHART_COLORS.tickText, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 },
          formatter: function (params) {
            if (params.componentType === 'series' && params.seriesName === 'Boxplot') {
              return `<div style="color:${CHART_COLORS.cyan};margin-bottom:4px">Box Plot Statistics</div>
                      Min: <strong>${min.toFixed(2)}</strong><br/>
                      Q1: <strong>${q1.toFixed(2)}</strong><br/>
                      Median: <strong style="color:${CHART_COLORS.pink}">${median.toFixed(2)}</strong><br/>
                      Q3: <strong>${q3.toFixed(2)}</strong><br/>
                      Max: <strong>${max.toFixed(2)}</strong>`;
            }
            return params.name;
          }
        },
        grid: { top: 60, right: 30, left: 30, bottom: 60 },
        xAxis: {
          type: 'value',
          min: Math.floor(min - (max - min) * 0.1),
          max: Math.ceil(max + (max - min) * 0.1),
          splitLine: { lineStyle: { color: CHART_COLORS.gridLine, type: 'dashed' } },
          axisLabel: { color: CHART_COLORS.tickText, fontSize: 12 }
        },
        yAxis: {
          type: 'category',
          data: [''],
          axisLabel: { show: false },
          axisLine: { show: false },
          splitLine: { show: false }
        },
        series: [
          {
            name: 'Boxplot',
            type: 'boxplot',
            data: boxData,
            itemStyle: {
              color: 'rgba(0,240,255,0.08)',
              borderColor: CHART_COLORS.cyan,
              borderWidth: 2
            },
            boxWidth: [30, 80]
          },
          {
            name: 'Mean',
            type: 'scatter',
            data: [[mean, 0]],
            symbol: 'circle',
            symbolSize: 12,
            itemStyle: {
              color: CHART_COLORS.amber,
              borderColor: 'rgba(0,0,0,0.5)',
              borderWidth: 1
            },
            tooltip: {
              formatter: `Mean: <strong>${mean.toFixed(2)}</strong>`
            }
          }
        ]
      };

      return (
        <div style={{ width: '100%', height: '350px' }}>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
        </div>
      );
    }

    default:
      return <p style={{ color: CHART_COLORS.tickText }}>Unsupported chart type: {chart_type}</p>;
  }
};

/* ═══════════════════════════════════════════════════════
   Main Visualizations Page
   ═══════════════════════════════════════════════════════ */
const Visualizations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
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
      addToast(
        "Visualization Rendered",
        "Your data graphics have been compiled successfully.",
        "success"
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to generate visualization. Verify input columns datatype compatibility."
      );
    } finally {
      setLoadingChart(false);
    }
  };

  /* ─── Render functions ─── */

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
                <Suspense fallback={
                  <div className="rendering-placeholder" style={{ height: '550px' }}>
                    <Loader2 className="animate-spin render-spin-ico" size={40} />
                    <h3>Loading Chart Engine…</h3>
                  </div>
                }>
                  <ChartRenderer chartResult={chartResult} />
                </Suspense>
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
