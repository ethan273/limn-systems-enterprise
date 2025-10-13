"use client";

import * as fabric from "fabric";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  color?: string;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

export function createKanbanColumn(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  title: string = "To Do",
  color: string = "#3b82f6"
): fabric.Group {
  const COLUMN_WIDTH = 280;
  const COLUMN_HEIGHT = 500;
  const HEADER_HEIGHT = 50;

  // Column background
  const columnBg = new fabric.Rect({
    width: COLUMN_WIDTH,
    height: COLUMN_HEIGHT,
    fill: '#f9fafb',
    stroke: '#e5e7eb',
    strokeWidth: 2,
    rx: 8,
    ry: 8,
  });

  // Header background
  const headerBg = new fabric.Rect({
    width: COLUMN_WIDTH,
    height: HEADER_HEIGHT,
    fill: color,
    rx: 8,
    ry: 8,
  });

  // Column title
  const titleText = new fabric.IText(title, {
    fontSize: 16,
    fontWeight: 'bold',
    fill: 'white',
    left: 15,
    top: 15,
  });

  // Card count badge
  const cardCountBg = new fabric.Circle({
    radius: 12,
    fill: 'white',
    left: COLUMN_WIDTH - 40,
    top: 18,
  });

  const cardCountText = new fabric.IText('0', {
    fontSize: 12,
    fontWeight: 'bold',
    fill: color,
    left: COLUMN_WIDTH - 34,
    top: 14,
  });

  // Cards container background
  const cardsArea = new fabric.Rect({
    width: COLUMN_WIDTH - 20,
    height: COLUMN_HEIGHT - HEADER_HEIGHT - 80,
    fill: 'transparent',
    left: 10,
    top: HEADER_HEIGHT + 10,
  });

  // Add card button
  const addButtonBg = new fabric.Rect({
    width: COLUMN_WIDTH - 20,
    height: 40,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 1,
    rx: 6,
    ry: 6,
    left: 10,
    top: COLUMN_HEIGHT - 50,
  });

  const addButtonText = new fabric.IText('+ Add Card', {
    fontSize: 14,
    fill: '#6b7280',
    left: COLUMN_WIDTH / 2 - 40,
    top: COLUMN_HEIGHT - 38,
  });

  const group = new fabric.Group([
    columnBg,
    headerBg,
    titleText,
    cardCountBg,
    cardCountText,
    cardsArea,
    addButtonBg,
    addButtonText,
  ], {
    left: x,
    top: y,
    selectable: true,
    hasControls: true,
  });

  // Store kanban data on the group
  (group as any).kanbanData = {
    type: 'kanban-column',
    title,
    cards: [],
    color,
  };

  return group;
}

export function createKanbanCard(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  title: string = "New Task",
  description: string = "Click to add description...",
  color: string = "white"
): fabric.Group {
  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 120;
  const PADDING = 12;

  // Card background
  const cardBg = new fabric.Rect({
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fill: color,
    stroke: '#e5e7eb',
    strokeWidth: 2,
    rx: 6,
    ry: 6,
    shadow: new fabric.Shadow({
      color: 'rgba(0, 0, 0, 0.1)',
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    }),
  });

  // Card title - using Textbox for word wrapping
  const titleText = new fabric.Textbox(title, {
    fontSize: 14,
    fontWeight: 'bold',
    fill: '#111827',
    left: PADDING,
    top: PADDING,
    width: CARD_WIDTH - (PADDING * 2),
    editable: true,
    splitByGrapheme: true, // Better word wrapping
  });

  // Card description - using Textbox for word wrapping
  const descText = new fabric.Textbox(description, {
    fontSize: 12,
    fill: '#6b7280',
    left: PADDING,
    top: PADDING + 30,
    width: CARD_WIDTH - (PADDING * 2),
    editable: true,
    splitByGrapheme: true, // Better word wrapping
  });

  const group = new fabric.Group([
    cardBg,
    titleText,
    descText,
  ], {
    left: x,
    top: y,
    selectable: true,
    hasControls: true,
  });

  // Store kanban card data
  (group as any).kanbanData = {
    type: 'kanban-card',
    title,
    description,
    color,
  };

  // Set up double-click to edit text
  group.on('mousedblclick', () => {
    // Ungroup to allow text editing
    const objects = group.getObjects();
    const groupLeft = group.left || 0;
    const groupTop = group.top || 0;

    canvas.remove(group);

    objects.forEach(obj => {
      const objLeft = (obj.left || 0) + groupLeft;
      const objTop = (obj.top || 0) + groupTop;
      obj.set({ left: objLeft, top: objTop });
      canvas.add(obj);
    });

    // Focus on title text for editing
    const titleObj = objects[1] as fabric.Textbox;
    canvas.setActiveObject(titleObj);
    titleObj.enterEditing();
    canvas.renderAll();
  });

  return group;
}

export function createKanbanBoard(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  columns: string[] = ['To Do', 'In Progress', 'Done']
): void {
  const colors = ['#ef4444', '#f59e0b', '#10b981'];
  const COLUMN_SPACING = 300;

  columns.forEach((title, index) => {
    const column = createKanbanColumn(
      canvas,
      x + (index * COLUMN_SPACING),
      y,
      title,
      colors[index] || '#3b82f6'
    );

    canvas.add(column);

    // Set up click event for adding cards
    column.on('mousedown', (e) => {
      if (!e.pointer) return;

      const pointer = e.pointer;
      const group = column as fabric.Group;
      const objects = group.getObjects();

      // Check if click is on the "Add Card" button area (last two objects in group)
      const addButtonBg = objects[objects.length - 2]; // add button background
      if (addButtonBg && isPointInObject(pointer, addButtonBg, group)) {
        // Add a new card to the column
        addCardToColumn(canvas, column, title);
      }
    });
  });

  canvas.renderAll();
}

// Helper function to add a card to a column
function addCardToColumn(canvas: fabric.Canvas, column: fabric.Group, columnTitle: string) {
  const kanbanData = (column as any).kanbanData;
  if (!kanbanData) return;

  const cardCount = kanbanData.cards?.length || 0;
  const columnBounds = column.getBoundingRect();

  // Position card inside the column's card area
  const cardX = columnBounds.left + 20;
  const cardY = columnBounds.top + 70 + (cardCount * 110); // Stack cards vertically

  const newCard = createKanbanCard(
    canvas,
    cardX,
    cardY,
    `Task ${cardCount + 1}`,
    'Click to add description...',
    'white'
  );

  canvas.add(newCard);

  // Update column's card count
  kanbanData.cards.push({
    id: `card-${Date.now()}`,
    title: `Task ${cardCount + 1}`,
    description: 'Click to add description...',
    color: 'white',
  });

  // Update card count badge in column
  const countText = column.getObjects()[4] as fabric.IText; // card count text
  if (countText) {
    countText.set({ text: String(kanbanData.cards.length) });
  }

  canvas.renderAll();
}

// Helper function to check if a point is inside an object within a group
function isPointInObject(pointer: { x: number; y: number }, obj: fabric.Object, group: fabric.Group): boolean {
  const groupMatrix = group.calcTransformMatrix();
  const objBounds = obj.getBoundingRect();

  // Transform object bounds by group transform
  const point = fabric.util.transformPoint(
    { x: pointer.x, y: pointer.y },
    fabric.util.invertTransform(groupMatrix)
  );

  return (
    point.x >= objBounds.left &&
    point.x <= objBounds.left + objBounds.width &&
    point.y >= objBounds.top &&
    point.y <= objBounds.top + objBounds.height
  );
}
