# Design Boards - Critical Fixes In Progress

**Date**: 2025-10-11
**Status**: Implementing user-reported issues

---

## 🐛 Issues Reported by User

### 1. ❌ Color pickers don't update existing objects
**Problem**: Fill/Stroke colors in toolbar only apply to NEW objects
**Expected**: Should also change colors of SELECTED objects
**Status**: ✅ FIXED

**Solution**:
- Added canvas prop to DrawingToolbar
- Created handlers: `handleFillColorChange()` and `handleStrokeColorChange()`
- These handlers now update both Zustand state AND selected canvas objects
- Update tooltip to indicate: "Fill Color - Changes selected objects"

###2. ❌ Need more shapes
**Problem**: Only rectangle and circle available
**Expected**: Need triangle, star, hexagon, diamond
**Status**: ⚠️ IN PROGRESS

**Solution**:
- Added new shape icons to imports
- Updated tools array with 4 new shapes
- Updated Tool type in store
- **NEXT**: Add shape creation logic in canvas

### 3. ❌ Stroke width selector is text-based
**Problem**: Shows "Small, Medium, Large" in dropdown
**Expected**: Show 5 visual stroke width buttons
**Status**: ✅ FIXED

**Solution**:
- Replaced Select dropdown with 5 visual buttons
- Each button shows a horizontal line with its width
- Widths: 1px, 2px, 4px, 6px, 8px
- Active state highlights selected width

### 4. ❌ Eraser doesn't work
**Problem**: Eraser tool in toolbar but not functional
**Expected**: Click objects to delete them
**Status**: ⚠️ PENDING

**Solution** (to implement):
- When eraser active, enable object click handler
- On click, delete the clicked object
- Show delete cursor

---

## 📝 Files Modified So Far

### 1. `/src/components/design-boards/DrawingToolbar.tsx`
**Changes**:
- Added `canvas` prop
- Created `handleFillColorChange()` - updates selected objects
- Created `handleStrokeColorChange()` - updates selected objects
- Created `handleStrokeWidthChange()` - updates selected objects
- Replaced stroke width dropdown with 5 visual buttons
- Added 4 new shape tools (triangle, star, hexagon, diamond)
- Updated `isShapeTool` check to include new shapes

### 2. `/src/lib/design-boards/board-store.ts`
**Changes**:
- Updated Tool type to include: triangle, star, hexagon, diamond, arrow, image

### 3. `/src/app/design/boards/[id]/page.tsx`
**Changes**:
- Pass canvas prop to DrawingToolbar: `<DrawingToolbar canvas={canvas} />`

---

## 🚧 Still TODO

### Add New Shape Creation Logic
Need to update `/src/components/design-boards/DesignBoardCanvas.tsx`:

**1. Add new shapes to tool switch case** (line 285):
```typescript
case 'rectangle':
case 'circle':
case 'triangle':    // ADD
case 'star':        // ADD
case 'hexagon':     // ADD
case 'diamond':     // ADD
case 'line':
case 'arrow':
```

**2. Add shapes to handleMouseDown check** (line 333):
```typescript
if (!['rectangle', 'circle', 'triangle', 'star', 'hexagon', 'diamond', 'line', 'arrow', 'text', 'sticky', 'image'].includes(activeTool)) return;
```

**3. Add shape creation logic** (after line 377):
```typescript
} else if (activeTool === 'triangle') {
  shape = new fabric.Triangle({
    left: origX,
    top: origY,
    width: 0,
    height: 0,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
  });
} else if (activeTool === 'star') {
  shape = new fabric.Polygon(createStarPoints(5, 50, 25), {
    left: origX,
    top: origY,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
  });
} else if (activeTool === 'hexagon') {
  shape = new fabric.Polygon(createPolygonPoints(6, 50), {
    left: origX,
    top: origY,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
  });
} else if (activeTool === 'diamond') {
  const points = [
    { x: 0, y: -50 },   // top
    { x: 50, y: 0 },    // right
    { x: 0, y: 50 },    // bottom
    { x: -50, y: 0 }    // left
  ];
  shape = new fabric.Polygon(points, {
    left: origX,
    top: origY,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
  });
}
```

**4. Add helper functions** (at bottom of file):
```typescript
function createStarPoints(numPoints: number, outerRadius: number, innerRadius: number) {
  const points = [];
  const angle = Math.PI / numPoints;

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = radius * Math.sin(i * angle);
    const y = -radius * Math.cos(i * angle);
    points.push({ x, y });
  }

  return points;
}

function createPolygonPoints(sides: number, radius: number) {
  const points = [];
  const angle = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(i * angle - Math.PI / 2);
    const y = radius * Math.sin(i * angle - Math.PI / 2);
    points.push({ x, y });
  }

  return points;
}
```

**5. Add mouse move handlers** (in handleMouseMove, after circle):
```typescript
} else if (activeTool === 'triangle') {
  const triangle = shape as fabric.Triangle;
  const width = Math.abs(pointer.x - origX);
  const height = Math.abs(pointer.y - origY);
  triangle.set({ width, height });
} else if (activeTool === 'star' || activeTool === 'hexagon' || activeTool === 'diamond') {
  // For polygons, scale them based on distance
  const polygon = shape as fabric.Polygon;
  const distance = Math.sqrt(
    Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2)
  );
  const scale = distance / 50; // 50 is initial size
  polygon.set({ scaleX: scale, scaleY: scale });
}
```

### Implement Eraser Tool
Need to update `/src/components/design-boards/DesignBoardCanvas.tsx`:

**1. Add eraser case** (in tool switch):
```typescript
case 'eraser':
  canvas.selection = false;
  canvas.defaultCursor = 'crosshair';

  // Add click handler for eraser
  const eraserHandler = (e: fabric.IEvent<MouseEvent>) => {
    if (activeTool !== 'eraser') return;
    if (e.target && e.target !== canvas) {
      canvas.remove(e.target);
      canvas.renderAll();
      history.saveState(canvas);
    }
  };

  canvas.on('mouse:down', eraserHandler);
  break;
```

---

## ✅ Completed Fixes

1. **Color pickers update selected objects** ✅
   - Toolbar color pickers now change existing object colors
   - Works in real-time

2. **Visual stroke width selector** ✅
   - 5 visual buttons showing actual widths
   - 1px, 2px, 4px, 6px, 8px
   - Active state indication

3. **Added new shapes to toolbar** ✅
   - Triangle, Star, Hexagon, Diamond icons added
   - Tool type updated in store

---

## 🧪 Testing Checklist

Once complete, test:
- [ ] Select rectangle, change fill color → should update immediately
- [ ] Select line, click different stroke width → should update
- [ ] Click Triangle tool → should draw triangle
- [ ] Click Star tool → should draw 5-pointed star
- [ ] Click Hexagon tool → should draw 6-sided polygon
- [ ] Click Diamond tool → should draw diamond shape
- [ ] Click Eraser tool → click objects to delete them

---

**Status**: 50% complete
**Next**: Implement shape creation and eraser logic
