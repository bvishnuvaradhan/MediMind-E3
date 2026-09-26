# MediMind Frontend Data Visualization System

## 1. Executive Summary & Architectural Overview

The MediMind Data Visualization System is a purpose-built, responsive, pure-SVG analytical charting engine designed for clinical healthcare and administrative intelligence across all five MediMind stakeholder tiers:
- **Chairman / Platform Executive**
- **Hospital Administrator**
- **Department Head**
- **Doctor / Clinician**
- **Family / Patient**

### Core Architectural Principles
1. **Data-Driven Semantic Mapping**: Every visualization is chosen based on the underlying mathematical relationship in the centralized dataset (`src/data/medimindData.js`), transitioning away from decorative progress bars into genuine analytical graphics (time series, distributions, paired bivariate observations, workflow funnels, qualitative target comparisons, temporal density matrices, and multidimensional attribute polygons).
2. **Pure SVG React Architecture**: Built directly with React SVG primitives (`<svg>`, `<path>`, `<circle>`, `<polygon>`, `<rect>`) without external heavy charting libraries (e.g., Chart.js, Recharts, D3). This guarantees zero runtime bundle bloat, zero version conflicts with React 19, responsive viewBox scaling, and CSS variable styling integration.
3. **Single Source of Truth**: All charts strictly derive and compute their metrics from the centralized dataset (`src/data/medimindData.js`) and role-specific selectors without separate mock datasets.

---

## 2. Component Library Catalog (`frontend/src/components/common/charts/`)

The charting library is housed in `frontend/src/components/common/charts/` with clean unified re-exports in `index.js`.

| Component | File Path | Supported Layouts / Modes | Key Features |
| :--- | :--- | :--- | :--- |
| **LineChart** | `LineChart.jsx` | Multi-series, Area Gradient, Smooth Bézier / Linear | Auto Y-axis step calculation, dynamic viewBox, hover point tooltips, interactive legend, smooth cubic Bézier curves (`C` control points). |
| **BarChart** | `BarChart.jsx` | Grouped Vertical, Stacked Vertical, Horizontal | Multi-metric series grouping, horizontal comparison layout, hover callouts, value labels, accessible SVGs. |
| **DonutChart** | `DonutChart.jsx` | Donut, Pie | Trigonometric arc calculations (`sin`/`cos`), animated hover offsets, center summary badge, custom legends. |
| **ScatterPlot** | `ScatterPlot.jsx` | 2D Cartesian Numerical Plane | Dual continuous axes ($X, Y$), reference/benchmark lines (e.g. 95% on-time benchmark), categorical color coding, interactive point tooltips. |
| **FunnelChart** | `FunnelChart.jsx` | Multi-Stage Workflow Pipeline | Trapezoidal stage projection, stage-to-stage conversion rates, bottleneck drop-off indicators, step count metrics. |
| **RadialGauge** | `RadialGauge.jsx` | 180° Half-Arc, 240° Swept Arc | Calibration zones (Normal/Moderate/High), central numeric display, gradient sweep paths, status color coding. |
| **BulletChart** | `BulletChart.jsx` | Stephen Few Quantitative Bullet | Qualitative background ranges (e.g. Optimal, Warning, Critical), actual performance bar, comparative target indicator line. |
| **HeatmapChart** | `HeatmapChart.jsx` | 2D Matrix Grid (e.g. Days $\times$ Time Slots) | Quantized intensity heat scale, cell value tooltips, flexible row/column axis labels, high-density visualization. |
| **RadarChart** | `RadarChart.jsx` | Multidimensional Polygonal Spider Chart | Concentric polygonal grid webs, multi-attribute axis spokes (Accuracy, Sensitivity, Specificity, Latency, Uptime), overlaid translucent polygons. |

---

## 3. Role-by-Role Visualization Inventory

### A. Chairman / Platform Executive
| View File | Visualization | Chart Component | Data Source (`medimindData.js`) | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `PlatformDashboard.jsx` | AI Engine Volume Distribution | `DonutChart` | `aiAggregateMetrics` (Fracture CNN, Diabetes ML, Heart ML) | Part-to-whole share of clinical AI workload across models. |
| `PlatformAnalyticsView.jsx` | User Account Composition | `DonutChart` | `platformStats.usersByRole` | Proportional split of active user accounts by role. |
| `PlatformAnalyticsView.jsx` | Platform Telemetry & Uptime | `RadialGauge` | Platform System Health (99.9%) | System reliability gauge with threshold indicator. |
| `PlatformAnalyticsView.jsx` | Appointment Resolution Share | `DonutChart` | Aggregated appointment status counts | Breakdown of completed, scheduled, cancelled, and pending appointments. |
| `AiAnalyticsView.jsx` | Monthly AI Volume Trajectory | `LineChart` (Area) | `aiAggregateMetrics.monthlyVolume` | Multi-month volume trends across Fracture, Diabetes, and Heart models. |
| `AiAnalyticsView.jsx` | Diagnostic Model Calibration | `RadarChart` | `aiAggregateMetrics` (Accuracy, Sensitivity, Specificity, Latency, Uptime) | Multi-attribute performance radar comparing clinical AI models. |
| `HospitalPerformanceView.jsx` | Comparative Network Throughput | `BarChart` (Grouped) | `hospitals` (Visits, AI Scans, Active Doctors) | Side-by-side grouped multi-metric comparison across the 3 network hospitals. |
| `HospitalPerformanceView.jsx` | Inpatient Capacity vs Target | `BulletChart` | `hospitals[].bedCapacity` & occupancy targets | Actual bed utilization against capacity thresholds. |

---

### B. Hospital Administrator
| View File | Visualization | Chart Component | Data Source (`medimindData.js`) | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `HospitalAnalyticsView.jsx` | 5-Month Patient Trajectory | `LineChart` (Multi-series) | Hospital monthly analytics (OPD Visits, Inpatient, Emergency) | Continuous trend tracking across clinical admission channels. |
| `HospitalAnalyticsView.jsx` | Weekly OPD Patient Flow | `BarChart` (Vertical) | Weekly daily encounter logs (Mon-Sun) | Day-of-week patient volume pattern. |
| `HospitalAnalyticsView.jsx` | Weekly Peak Activity Density | `HeatmapChart` | Day $\times$ Time slot consultation matrix | High-density temporal matrix identifying rush hours. |
| `HospitalAnalyticsView.jsx` | Clinical Modality Mix | `DonutChart` | Departmental appointment split | Proportion of patient flow across clinical modalities. |
| `HospitalAnalyticsView.jsx` | Facility Bed Occupancy | `BulletChart` | Bed count, current occupancy, safe target | Qualitative capacity rating (Optimal/Caution/Critical). |
| `DepartmentAnalyticsView.jsx` | Departmental Patient & AI Flow | `BarChart` (Grouped) | Hospital departments (Patient volume & AI scans) | Cross-department operational comparison. |
| `DepartmentAnalyticsView.jsx` | Patient Volume Allocation | `DonutChart` | Department patient share | Departmental contribution to total hospital load. |
| `DepartmentAnalyticsView.jsx` | Ward Bed Utilization | `BulletChart` | Department ward capacities vs targets | Individual department inpatient occupancy. |
| `AiAnalyticsView.jsx` | AI Model Utilization Share | `DonutChart` | Hospital AI analytics | Share of inference requests per clinical AI module. |
| `AiAnalyticsView.jsx` | Model Reliability Radar | `RadarChart` | AI accuracy, sensitivity, specificity, speed, uptime | Multi-dimensional evaluation of AI model safety. |

---

### C. Department Head
| View File | Visualization | Chart Component | Data Source (`medimindData.js`) | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DepartmentAnalyticsView.jsx` | Daily Patient Encounters | `BarChart` (Vertical) | Department 7-day encounter history | Daily throughput comparison against target capacity. |
| `DepartmentAnalyticsView.jsx` | Case Distribution by Subspecialty | `DonutChart` | Department subspecialty case logs | Proportional distribution of subspecialty cases. |
| `DepartmentAnalyticsView.jsx` | Hourly Shift Activity Density | `HeatmapChart` | Day $\times$ Shift consultation intensity | Identification of clinical bottleneck hours. |
| `DoctorPerformanceView.jsx` | Caseload vs On-Time Rate | `ScatterPlot` | Department doctors (Active Cases vs On-Time %) | 2D bivariate analysis with 95% clinical benchmark line. |
| `DoctorPerformanceView.jsx` | Scheduled vs Completed Encounters | `BarChart` (Grouped) | Department doctors throughput logs | Direct comparison of scheduled appointments vs completions. |
| `AiAnalyticsView.jsx` | Anatomical Anomaly Distribution | `DonutChart` | Orthopedic/department anomaly classifications | Categorical distribution of diagnosed clinical anomalies. |
| `AiAnalyticsView.jsx` | AI Detection Speed by Modality | `BarChart` (Horizontal) | Inference latency per clinical examination type | Latency benchmark comparison. |
| `AiAnalyticsView.jsx` | Diagnostic Algorithm Performance | `RadarChart` | Precision, recall, F1, latency, uptime metrics | Multi-attribute algorithm safety profile. |
| `WorkloadView.jsx` | Doctor Active Caseload vs Completed | `BarChart` (Grouped) | Workload allocation across department physicians | Physician workload balancing visualization. |

---

### D. Doctor / Clinician
| View File | Visualization | Chart Component | Data Source (`medimindData.js`) | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DashboardView.jsx` | Clinical Encounter Pipeline | `FunnelChart` | Daily appointments (Waiting $\rightarrow$ AI Screened $\rightarrow$ In Consultation $\rightarrow$ Rx Formulated $\rightarrow$ Completed) | Multi-stage clinical workflow tracking with drop-off analysis. |
| `AiExplainabilityView.jsx` | Diagnostic Confidence Arc | `RadialGauge` | AI inference confidence score (e.g. 96.4%) | Calibrated arc readout of prediction certainty. |
| `AiExplainabilityView.jsx` | Biomarker / Feature Activation | `BarChart` (Horizontal) | AI explainability feature importance weights | Contribution ranking of radiological/biomarker features. |

---

### E. Family / Patient
| View File | Visualization | Chart Component | Data Source (`medimindData.js`) | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DashboardView.jsx` | Family Health Index | `RadialGauge` | Composite family wellness metric (86/100) | Calibrated wellness gauge with clear qualitative banding. |
| `PersonalPredictionDetailView.jsx` | Personal Risk Index | `RadialGauge` | Patient AI assessment score | Individual health risk meter. |
| `PersonalPredictionDetailView.jsx` | Population Benchmark | `BulletChart` | Patient biomarker level vs optimal & critical ranges | Patient metric mapped against demographic ranges. |
| `PersonalPredictionDetailView.jsx` | Risk Factor Sensitivity | `BarChart` (Horizontal) | Key clinical indicators (BMI, Glucose, Blood Pressure) | Horizontal bar breakdown of personal risk drivers. |
| `MedicalRecordsView.jsx` | Health Portfolio Composition | `DonutChart` | Family medical records (Lab, Radiology, Rx, Tests) | Proportional distribution of record categories. |

---

## 4. Visualization Diversity Summary

| Chart Type | Primary Purpose | Instances in Platform |
| :--- | :--- | :---: |
| **LineChart / AreaChart** | Multi-month continuous time-series trends | 3 |
| **BarChart (Grouped Vertical)** | Multi-series comparative categorical throughput | 6 |
| **BarChart (Single Vertical)** | Daily/weekly periodic encounter volume | 2 |
| **BarChart (Horizontal)** | Ranked latency, feature importance, and risk sensitivities | 3 |
| **DonutChart / PieChart** | Part-to-whole categorical compositions | 9 |
| **ScatterPlot** | Bivariate continuous observations (Caseload vs On-Time Rate) | 1 |
| **FunnelChart** | Multi-stage clinical workflow throughput & conversion | 1 |
| **RadialGauge** | Calibrated single-metric confidence, wellness & health scores | 5 |
| **BulletChart** | Target-to-actual comparisons within qualitative ranges | 4 |
| **HeatmapChart** | 2D temporal intensity matrices (Days $\times$ Time Slots) | 2 |
| **RadarChart** | Multidimensional algorithm performance polygons | 3 |
| **Total Visualizations** | **Diverse, mathematically-sound clinical graphics** | **39** |

---

## 5. Architectural Justification for Intentionally Omitted Chart Types

During the system design audit, several chart types were deliberately evaluated and omitted based on data integrity and UX ergonomics:

1. **Frequency Polygon / Ogive (Cumulative Step)**:
   - *Reason*: The clinical data represents distinct discrete categories (departments, doctors, months) rather than continuous grouped frequency distributions with continuous interval bounds. Rendering an ogive or frequency polygon would imply continuous data density between discrete hospitals, introducing visual misleading interpolation.
2. **Venn / Euler Diagram**:
   - *Reason*: In the centralized clinical schema, entity memberships (e.g. a patient encounter or doctor belonging to a department) are strictly partitioned rather than partially overlapping mathematical sets. Using a Venn diagram would incorrectly imply shared multi-set intersections.
3. **Treemap**:
   - *Reason*: Departmental hierarchies within hospitals contain a maximum of 1–2 depth levels with relatively balanced distribution. A grouped bar chart or donut chart provides significantly clearer numerical label readability and contrast on standard screens than nested rectangular tiling.
4. **3D Charts**:
   - *Reason*: 3D perspectives introduce optical distortion and occlusion in clinical metric comparisons. All MediMind charts adhere strictly to 2D Cartesian and polar projections for maximum accuracy.

---

## 6. Verification & Quality Assurance

- **Code Quality**: Verified clean with `npx oxlint` (0 errors, 0 warnings across all modified components).
- **Bundle Compilation**: Production build verified clean with `vite build`.
- **Styling & Theming**: All SVG components inherit CSS variables from MediMind's design system (`var(--color-primary)`, `var(--color-background)`, etc.) ensuring full visual consistency across light and dark modes.
