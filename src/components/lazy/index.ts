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

// Charts (lazy loads Chart.js)
export {
  LazyLineChart,
  LazyBarChart,
  LazyPieChart,
  LazyAreaChart,
} from './LazyCharts';

// Data Tables (lazy loads table libraries)
export {
  LazyDataTable,
  LazyAdvancedTable,
} from './LazyDataTable';
