/**
 * Lazy-loaded Component Exports
 * Phase 4: Bundle Optimization
 *
 * Centralized exports for all lazy-loaded components
 * Use these instead of direct imports to reduce bundle size
 */

// PDF Viewer (lazy loads PDF.js)
export { LazyPDFViewer } from './LazyPDFViewer';

// 3D Viewer (lazy loads Three.js)
export { Lazy3DViewer } from './Lazy3DViewer';

// Charts (lazy loads Chart.js) - for future chart components
export {
  LazyLineChart,
  LazyBarChart,
  LazyPieChart,
  LazyAreaChart,
} from './LazyCharts';

// Recharts (lazy loads recharts library) - for current implementation
export {
  LazyPieChart as LazyRechartsPie,
  LazyPie,
  LazyLineChart as LazyRechartsLine,
  LazyLine,
  LazyBarChart as LazyRechartsBar,
  LazyBar,
  LazyAreaChart as LazyRechartsArea,
  LazyArea,
  LazyXAxis,
  LazyYAxis,
  LazyCartesianGrid,
  LazyTooltip,
  LazyLegend,
  LazyResponsiveContainer,
  LazyCell,
  LazyComposedChart,
  LazyRadarChart,
  LazyRadar,
  LazyPolarGrid,
  LazyPolarAngleAxis,
  LazyPolarRadiusAxis,
} from './LazyRecharts';

// Data Tables (lazy loads table libraries)
export {
  LazyDataTable,
  LazyAdvancedTable,
} from './LazyDataTable';
