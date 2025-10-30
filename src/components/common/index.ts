// Phase 1 Foundation Components - UI Component Library
export { DataTable } from './DataTable';
export type { DataTableColumn, DataTableFilter, DataTableProps, DataTableRowAction } from './DataTable';

export { PageHeader } from './PageHeader';
export type { PageHeaderAction, PageHeaderBreadcrumb, PageHeaderProps } from './PageHeader';

export { EntityDetailHeader } from './EntityDetailHeader';
export type { EntityMetadataItem, EntityDetailHeaderAction, EntityDetailHeaderProps, EntityMetadata } from './EntityDetailHeader';

export { InfoCard } from './InfoCard';
export type { InfoCardProps, InfoCardItem } from './InfoCard';

export { StatsGrid } from './StatsGrid';
export type { StatItem, StatsGridProps } from './StatsGrid';

export { FormDialog } from './FormDialog';
export type { FormDialogProps, FormField, FormFieldType, FormFieldValidation, SelectOption } from './FormDialog';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export {
  LoadingState,
  LoadingSpinner,
  LoadingDots,
  LoadingBars,
  FullPageLoading,
} from './LoadingState';

export { LoadingStateDemo } from './LoadingStateDemo';

export { StatusBadge, PriorityBadge, DepartmentBadge } from './StatusBadge';

export { EditableField, EditableFieldGroup } from './EditableField';
export type { EditableFieldProps, EditableFieldGroupProps } from './EditableField';

export { SpecificationsManager } from './SpecificationsManager';

export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs';

export { Breadcrumb, PageBreadcrumb } from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem as BreadcrumbItemSingle } from './Breadcrumb';

export { ErrorBoundary } from './ErrorBoundary';
export { ErrorState } from './ErrorState';

export { TableFilters, SearchFilter, SelectFilter, DateRangeFilter, FilterBar } from './TableFilters';
export type { SearchFilterProps, SelectFilterProps, SelectOption as TableSelectOption, DateRangeFilterProps, FilterBarProps } from './TableFilters';
