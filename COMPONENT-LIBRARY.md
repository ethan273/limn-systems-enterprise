# Limn Systems Enterprise Component Library

**Version**: 1.0.0
**Last Updated**: 2025-10-04
**Purpose**: Canonical patterns for consistent architecture across all modules

---

## 🚨 ARCHITECTURAL PRINCIPLES

### Prime Directive: Global CSS Only
**ALL styling MUST exist in `/src/app/globals.css`**

❌ **FORBIDDEN:**
```tsx
// NEVER use inline Tailwind utilities
<div className="bg-purple-50 text-white p-4 rounded-lg">
```

✅ **REQUIRED:**
```tsx
// ALWAYS use semantic CSS classes from globals.css
<div className="badge-style">
```

### ESLint Enforcement
The `no-restricted-syntax` rule will ERROR on any inline Tailwind utilities:
- `bg-*`, `text-*`, `border-*`, `p-*`, `m-*`, `w-*`, `h-*`, `flex`, `grid`, `rounded`

---

## 📊 TABLE PATTERNS

### Canonical Pattern: Data Table Container

**ALWAYS use this pattern for tables:**

```tsx
<div className="data-table-container">
  {isLoading ? (
    <div className="loading-state">Loading...</div>
  ) : data.length === 0 ? (
    <div className="empty-state">No data found</div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
</div>
```

**CSS Classes Used:**
- `.data-table-container` - Wrapper with borders extending to edges
- `.loading-state` - Centered loading message
- `.empty-state` - Centered empty state message

### Table with Header

```tsx
<div className="data-table-container">
  <div className="data-table-header">
    <h3 className="data-table-title">Order History</h3>
    <p className="data-table-description">Recent orders containing this product</p>
  </div>
  <Table>
    {/* Table content */}
  </Table>
</div>
```

**CSS Classes Used:**
- `.data-table-header` - Header section with title and description
- `.data-table-title` - Table title styling
- `.data-table-description` - Muted description text

### ❌ FORBIDDEN PATTERNS

**NEVER nest tables in cards:**
```tsx
// ❌ WRONG - Creates double borders and gaps
<Card>
  <CardContent className="pt-6">
    <Table>...</Table>
  </CardContent>
</Card>
```

**NEVER use direct table without wrapper:**
```tsx
// ❌ WRONG - No border container
<Table>...</Table>
```

---

## 📄 DETAIL PAGE PATTERNS

### Canonical Pattern: Detail Header

**ALWAYS use this 3-column grid layout:**

```tsx
<div className="detail-header-card">
  <div className="detail-header">
    {/* Column 1: Avatar */}
    <div className="detail-avatar">
      <Building2 className="detail-avatar-icon" />
    </div>

    {/* Column 2: Info */}
    <div className="detail-info">
      <h2 className="detail-title">{record.name}</h2>
      <div className="detail-meta">
        <span className="detail-meta-item">{record.company}</span>
        <Badge className={`badge-${record.status}`}>{record.status}</Badge>
      </div>
      <div className="detail-contact-info">
        <a href={`mailto:${record.email}`} className="detail-contact-link">
          <Mail className="icon-sm" />
          {record.email}
        </a>
        <a href={`tel:${record.phone}`} className="detail-contact-link">
          <Phone className="icon-sm" />
          {record.phone}
        </a>
      </div>
    </div>

    {/* Column 3: Actions */}
    <div className="detail-actions">
      <button className="btn btn-primary">Edit</button>
      <button className="btn btn-secondary">Delete</button>
    </div>
  </div>
</div>
```

**CSS Classes Used:**
- `.detail-header-card` - Card wrapper for header section
- `.detail-header` - 3-column grid (auto 1fr auto)
- `.detail-avatar` - Avatar/icon container (4rem × 4rem)
- `.detail-avatar-icon` - Icon styling within avatar
- `.detail-info` - Main information column
- `.detail-title` - Record name/title
- `.detail-meta` - Metadata row (company, badges)
- `.detail-meta-item` - Individual metadata items
- `.detail-contact-info` - Contact links section
- `.detail-contact-link` - Individual contact link
- `.detail-actions` - Action buttons column

### Stats Grid Pattern

```tsx
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-card-header">
      <DollarSign className="stat-card-icon" />
      <span className="stat-card-label">Total Revenue</span>
    </div>
    <div className="stat-card-value">$125,430</div>
    <div className="stat-card-change positive">+12.5%</div>
  </div>

  <div className="stat-card">
    <div className="stat-card-header">
      <Package className="stat-card-icon" />
      <span className="stat-card-label">Active Orders</span>
    </div>
    <div className="stat-card-value">24</div>
    <div className="stat-card-change negative">-3.2%</div>
  </div>
</div>
```

**CSS Classes Used:**
- `.stats-grid` - Responsive grid for stat cards
- `.stat-card` - Individual stat card
- `.stat-card-header` - Icon and label row
- `.stat-card-icon` - Icon styling
- `.stat-card-label` - Stat label text
- `.stat-card-value` - Large value display
- `.stat-card-change.positive` - Positive change indicator (green)
- `.stat-card-change.negative` - Negative change indicator (red)

---

## 🎨 BADGE PATTERNS

### Semantic Badge Classes

**ALWAYS use semantic badge classes with WCAG AA compliance:**

```tsx
{/* Material badges */}
<Badge className="badge-material">Wood</Badge>

{/* Style badges */}
<Badge className="badge-style">Modern</Badge>

{/* Info badges */}
<Badge className="badge-info">In Stock</Badge>

{/* Active/success badges */}
<Badge className="badge-active">Active</Badge>

{/* Status badges */}
<Badge className="badge-pending">Pending</Badge>
<Badge className="badge-in-progress">In Progress</Badge>
<Badge className="badge-completed">Completed</Badge>

{/* Priority badges */}
<Badge className="badge-priority-low">Low</Badge>
<Badge className="badge-priority-medium">Medium</Badge>
<Badge className="badge-priority-high">High</Badge>
```

**CSS Classes Available:**
- `.badge-material` - Gray background for material types
- `.badge-style` - Purple background for style types
- `.badge-info` - Blue background for informational badges
- `.badge-active` - Green background for active/success states
- `.badge-pending` - Yellow background for pending states
- `.badge-in-progress` - Blue background for in-progress states
- `.badge-completed` - Green background for completed states
- `.badge-priority-low` - Gray for low priority
- `.badge-priority-medium` - Yellow for medium priority
- `.badge-priority-high` - Red for high priority

**All badge classes:**
- Use CSS variables for theming
- WCAG AA compliant (4.5:1+ contrast)
- Responsive to light/dark mode
- Defined in `/src/app/globals.css`

---

## 📝 MODAL PATTERNS

### Canonical Pattern: Modal Dialog

```tsx
{isModalOpen && (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Create New Record</h2>
        <button onClick={onClose} className="modal-close">
          <X className="icon-sm" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

**CSS Classes Used:**
- `.modal-overlay` - Full-screen backdrop with transparency
- `.modal-content` - Centered modal container
- `.modal-header` - Header with title and close button
- `.modal-title` - Modal title text
- `.modal-close` - Close button (top-right)
- `.modal-form` - Form wrapper
- `.modal-body` - Main content area
- `.modal-footer` - Action buttons row
- `.form-group` - Form field wrapper
- `.form-label` - Field label
- `.form-input` - Text input styling
- `.form-textarea` - Textarea styling

---

## 🔘 BUTTON PATTERNS

### Semantic Button Classes

```tsx
{/* Primary action */}
<button className="btn btn-primary">Save Changes</button>

{/* Secondary action */}
<button className="btn btn-secondary">Cancel</button>

{/* Ghost/subtle action */}
<button className="btn btn-ghost">
  <ArrowLeft className="icon-sm" />
  Back
</button>

{/* Destructive action */}
<button className="btn btn-destructive">Delete</button>

{/* Icon-only button */}
<button className="btn-icon">
  <Plus className="icon-sm" />
</button>
```

**CSS Classes Available:**
- `.btn` - Base button styling
- `.btn-primary` - Primary action (filled, accent color)
- `.btn-secondary` - Secondary action (outlined)
- `.btn-ghost` - Ghost/subtle action (transparent)
- `.btn-destructive` - Destructive action (red)
- `.btn-icon` - Icon-only button (square)

**Icon Size Classes:**
- `.icon-sm` - Small icon (16px)
- `.icon-md` - Medium icon (20px)
- `.icon-lg` - Large icon (24px)

---

## 📋 FORM PATTERNS

### Standard Form Layout

```tsx
<form onSubmit={handleSubmit} className="form-container">
  <div className="form-grid-2col">
    <div className="form-group">
      <label htmlFor="firstName" className="form-label">
        First Name <span className="form-required">*</span>
      </label>
      <input
        id="firstName"
        type="text"
        className="form-input"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="lastName" className="form-label">
        Last Name <span className="form-required">*</span>
      </label>
      <input
        id="lastName"
        type="text"
        className="form-input"
        required
      />
    </div>
  </div>

  <div className="form-group">
    <label htmlFor="email" className="form-label">Email</label>
    <input
      id="email"
      type="email"
      className="form-input"
    />
    <p className="form-hint">We'll never share your email</p>
  </div>

  <div className="form-group">
    <label htmlFor="status" className="form-label">Status</label>
    <Select>
      <SelectTrigger className="form-select">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="form-actions">
    <button type="button" className="btn btn-secondary">Cancel</button>
    <button type="submit" className="btn btn-primary">Submit</button>
  </div>
</form>
```

**CSS Classes Used:**
- `.form-container` - Form wrapper with spacing
- `.form-grid-2col` - 2-column grid for side-by-side fields
- `.form-group` - Individual field wrapper
- `.form-label` - Field label
- `.form-required` - Required asterisk (*) indicator
- `.form-input` - Text input styling
- `.form-select` - Select dropdown styling
- `.form-textarea` - Textarea styling
- `.form-hint` - Helper text below field
- `.form-actions` - Action buttons row (right-aligned)

---

## 🎴 CARD PATTERNS

### Data Display Cards

```tsx
<div className="card-grid">
  <div className="data-card">
    <div className="data-card-header">
      <h3 className="data-card-title">Recent Activity</h3>
      <button className="btn-icon">
        <MoreVertical className="icon-sm" />
      </button>
    </div>
    <div className="data-card-content">
      {/* Card content */}
    </div>
  </div>

  <div className="data-card">
    <div className="data-card-header">
      <h3 className="data-card-title">Quick Stats</h3>
    </div>
    <div className="data-card-content">
      {/* Card content */}
    </div>
  </div>
</div>
```

**CSS Classes Used:**
- `.card-grid` - Responsive grid for cards
- `.data-card` - Individual card container
- `.data-card-header` - Card header with title and actions
- `.data-card-title` - Card title
- `.data-card-content` - Card content area

---

## 🎨 DESIGN MODULE PATTERNS

### Mood Board Components

```tsx
<div className="mood-board-grid">
  <div className="mood-board-card">
    <div className="mood-board-preview">
      {images.length > 0 ? (
        <div className="mood-board-image-grid">
          {images.map((img) => (
            <img key={img.id} src={img.url} alt={img.name} />
          ))}
        </div>
      ) : (
        <div className="mood-board-empty">
          <ImageIcon className="mood-board-empty-icon" />
          <p>No images yet</p>
        </div>
      )}
    </div>

    <div className="mood-board-info">
      <h3 className="mood-board-title">{board.name}</h3>
      <p className="mood-board-description">{board.description}</p>
      <div className="mood-board-meta">
        <Badge className="badge-info">{board.board_type}</Badge>
        <span className="text-muted">{board.image_count} images</span>
      </div>
    </div>
  </div>
</div>
```

**CSS Classes Used:**
- `.mood-board-grid` - Responsive grid for mood boards
- `.mood-board-card` - Individual mood board card
- `.mood-board-preview` - Image preview area (16:9 aspect ratio)
- `.mood-board-image-grid` - Grid for multiple images
- `.mood-board-empty` - Empty state for no images
- `.mood-board-empty-icon` - Large icon for empty state
- `.mood-board-info` - Info section below preview
- `.mood-board-title` - Board title
- `.mood-board-description` - Board description
- `.mood-board-meta` - Metadata row (type, count)

### Design Progress Bar

```tsx
<div className="design-progress-container">
  <div className="design-progress-header">
    <span className="design-progress-label">Project Progress</span>
    <span className="design-progress-percentage">65%</span>
  </div>
  <div className="design-progress-bar">
    <div className="design-progress-fill" style={{ width: '65%' }} />
  </div>
</div>
```

**CSS Classes Used:**
- `.design-progress-container` - Progress bar wrapper
- `.design-progress-header` - Label and percentage row
- `.design-progress-label` - Progress label text
- `.design-progress-percentage` - Percentage display
- `.design-progress-bar` - Progress bar track
- `.design-progress-fill` - Progress bar fill (use inline width style)

---

## 🔍 FILTER PATTERNS

### Filter Section

```tsx
<div className="filters-section">
  <div className="filters-grid">
    <div className="filter-group">
      <label className="filter-label">Status</label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="filter-group">
      <label className="filter-label">Date Range</label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="All time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="filter-group">
      <label className="filter-label">Search</label>
      <input
        type="text"
        placeholder="Search..."
        className="filter-search"
      />
    </div>
  </div>

  <button className="filter-reset" onClick={handleReset}>
    Reset Filters
  </button>
</div>
```

**CSS Classes Used:**
- `.filters-section` - Filter section container
- `.filters-grid` - Responsive grid for filter controls
- `.filter-group` - Individual filter wrapper
- `.filter-label` - Filter label text
- `.filter-search` - Search input styling
- `.filter-reset` - Reset button

---

## 🌐 PAGE LAYOUT PATTERNS

### Standard Page Layout

```tsx
<div className="page-container">
  <div className="page-header">
    <div className="page-header-left">
      <h1 className="page-title">Page Title</h1>
      <p className="page-description">Brief description of this page</p>
    </div>
    <div className="page-header-right">
      <button className="btn btn-primary">
        <Plus className="icon-sm" />
        Add New
      </button>
    </div>
  </div>

  {/* Filters */}
  <div className="filters-section">
    {/* Filters content */}
  </div>

  {/* Main content */}
  <div className="data-table-container">
    {/* Table content */}
  </div>
</div>
```

**CSS Classes Used:**
- `.page-container` - Main page wrapper
- `.page-header` - Page header section
- `.page-header-left` - Left side (title, description)
- `.page-header-right` - Right side (actions)
- `.page-title` - Page title (h1)
- `.page-description` - Page description text

---

## 📊 STATE PATTERNS

### Loading State

```tsx
{isLoading ? (
  <div className="loading-state">
    <Loader2 className="loading-spinner" />
    <p>Loading data...</p>
  </div>
) : (
  /* Content */
)}
```

**CSS Classes Used:**
- `.loading-state` - Centered loading container
- `.loading-spinner` - Spinning icon animation

### Empty State

```tsx
{data.length === 0 ? (
  <div className="empty-state">
    <Inbox className="empty-state-icon" />
    <h3 className="empty-state-title">No data found</h3>
    <p className="empty-state-description">
      Get started by creating your first record
    </p>
    <button className="btn btn-primary">
      <Plus className="icon-sm" />
      Create New
    </button>
  </div>
) : (
  /* Content */
)}
```

**CSS Classes Used:**
- `.empty-state` - Centered empty state container
- `.empty-state-icon` - Large icon for empty state
- `.empty-state-title` - Empty state title
- `.empty-state-description` - Empty state description

### Error State

```tsx
{error ? (
  <div className="error-state">
    <AlertCircle className="error-state-icon" />
    <h3 className="error-state-title">Something went wrong</h3>
    <p className="error-state-description">{error.message}</p>
    <button className="btn btn-secondary" onClick={retry}>
      Try Again
    </button>
  </div>
) : (
  /* Content */
)}
```

**CSS Classes Used:**
- `.error-state` - Centered error container
- `.error-state-icon` - Error icon (red)
- `.error-state-title` - Error title
- `.error-state-description` - Error message

---

## 🎯 TEXT PATTERNS

### Text Utilities

```tsx
{/* Muted text with WCAG AA compliance */}
<p className="text-muted">Secondary information</p>

{/* Small text */}
<p className="text-sm">Small helper text</p>

{/* Large text */}
<p className="text-lg">Large emphasis text</p>

{/* Truncated text */}
<p className="text-truncate">Very long text that will be truncated with ellipsis...</p>
```

**CSS Classes Available:**
- `.text-muted` - Muted text (WCAG AA: 4.5:1+ contrast)
- `.text-sm` - Small text (14px)
- `.text-lg` - Large text (18px)
- `.text-truncate` - Truncate with ellipsis

---

## ✅ USAGE CHECKLIST

Before creating any new component, verify:

- [ ] All styling uses semantic CSS classes from `globals.css`
- [ ] NO inline Tailwind utilities (`bg-*`, `text-*`, `p-*`, etc.)
- [ ] Tables use `.data-table-container` wrapper pattern
- [ ] Detail pages use `.detail-header` 3-column grid
- [ ] Badges use semantic classes (`.badge-style`, `.badge-info`, etc.)
- [ ] Modals use `.modal-overlay` and `.modal-content` pattern
- [ ] Forms use `.form-grid-2col` and `.form-group` structure
- [ ] Loading/empty/error states use semantic state classes
- [ ] Text contrast meets WCAG AA standards (4.5:1+)
- [ ] All patterns documented in this library are followed

---

## 🔄 MAINTENANCE

### Adding New Patterns

1. **Define CSS in globals.css first**
2. **Test WCAG compliance** (use WebAIM contrast checker)
3. **Document pattern in this file** with complete example
4. **Update ESLint rules** if new restrictions needed
5. **Add to usage checklist** if it's a common pattern

### Updating Existing Patterns

1. **Search codebase** for all uses of the pattern
2. **Update globals.css** with new styles
3. **Update documentation** with changes
4. **Verify no breakage** across all modules
5. **Run full lint and build** to ensure compliance

---

**Last Updated**: 2025-10-04
**Maintained By**: Development Team
**Questions**: Refer to `/CLAUDE.md` for architectural principles
