import { create } from 'zustand';

export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'hexagon' | 'diamond' | 'line' | 'arrow' | 'text' | 'sticky' | 'image' | 'eraser' | 'hand' | 'kanban';

export interface BoardState {
  // Active tool
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Canvas settings
  zoom: number;
  setZoom: (zoom: number) => void;

  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;

  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;

  snapToGrid: boolean;
  setSnapToGrid: (enabled: boolean) => void;

  // Drawing state
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  // Selected objects
  selectedObjects: string[];
  setSelectedObjects: (ids: string[]) => void;

  // Sticky note color
  stickyNoteColor: string;
  setStickyNoteColor: (color: string) => void;

  // Pen/brush settings
  penColor: string;
  setPenColor: (color: string) => void;

  penWidth: number;
  setPenWidth: (width: number) => void;

  // Shape settings
  fillColor: string;
  setFillColor: (color: string) => void;

  strokeColor: string;
  setStrokeColor: (color: string) => void;

  strokeWidth: number;
  setStrokeWidth: (width: number) => void;

  // Shape size preset
  shapeSize: 'small' | 'medium' | 'large';
  setShapeSize: (size: 'small' | 'medium' | 'large') => void;

  // Text formatting
  fontSize: number;
  setFontSize: (size: number) => void;

  fontFamily: string;
  setFontFamily: (family: string) => void;

  fontWeight: 'normal' | 'bold';
  setFontWeight: (weight: 'normal' | 'bold') => void;

  fontStyle: 'normal' | 'italic';
  setFontStyle: (style: 'normal' | 'italic') => void;

  textDecoration: 'none' | 'underline' | 'line-through';
  setTextDecoration: (decoration: 'none' | 'underline' | 'line-through') => void;

  textAlign: 'left' | 'center' | 'right';
  setTextAlign: (align: 'left' | 'center' | 'right') => void;

  textColor: string;
  setTextColor: (color: string) => void;

  // Board settings
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  backgroundColor: string;
  setBackgroundColor: (color: string) => void;

  canvasWidth: number;
  setCanvasWidth: (width: number) => void;

  canvasHeight: number;
  setCanvasHeight: (height: number) => void;

  showGrid: boolean;
  setShowGrid: (show: boolean) => void;

  gridSize: number;
  setGridSize: (size: number) => void;

  // Undo/Redo
  historyIndex: number;
  history: any[];
  pushHistory: (state: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Reset
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  // Active tool
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Canvas settings
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  pan: { x: 0, y: 0 },
  setPan: (pan) => set({ pan }),

  gridEnabled: true,
  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),

  snapToGrid: false,
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),

  // Drawing state
  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  // Selected objects
  selectedObjects: [],
  setSelectedObjects: (ids) => set({ selectedObjects: ids }),

  // Sticky note color
  stickyNoteColor: '#FFEB3B',
  setStickyNoteColor: (color) => set({ stickyNoteColor: color }),

  // Pen/brush settings
  penColor: '#000000',
  setPenColor: (color) => set({ penColor: color }),

  penWidth: 2,
  setPenWidth: (width) => set({ penWidth: width }),

  // Shape settings
  fillColor: '#3B82F6',
  setFillColor: (color) => set({ fillColor: color }),

  strokeColor: '#1E40AF',
  setStrokeColor: (color) => set({ strokeColor: color }),

  strokeWidth: 2,
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  // Shape size preset
  shapeSize: 'medium',
  setShapeSize: (size) => set({ shapeSize: size }),

  // Text formatting
  fontSize: 16,
  setFontSize: (size) => set({ fontSize: size }),

  fontFamily: 'Arial',
  setFontFamily: (family) => set({ fontFamily: family }),

  fontWeight: 'normal',
  setFontWeight: (weight) => set({ fontWeight: weight }),

  fontStyle: 'normal',
  setFontStyle: (style) => set({ fontStyle: style }),

  textDecoration: 'none',
  setTextDecoration: (decoration) => set({ textDecoration: decoration }),

  textAlign: 'left',
  setTextAlign: (align) => set({ textAlign: align }),

  textColor: '#000000',
  setTextColor: (color) => set({ textColor: color }),

  // Board settings
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  backgroundColor: '#ffffff',
  setBackgroundColor: (color) => set({ backgroundColor: color }),

  canvasWidth: 1920,
  setCanvasWidth: (width) => set({ canvasWidth: width }),

  canvasHeight: 1080,
  setCanvasHeight: (height) => set({ canvasHeight: height }),

  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),

  gridSize: 20,
  setGridSize: (size) => set({ gridSize: size }),

  // Undo/Redo
  historyIndex: -1,
  history: [],

  pushHistory: (state) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { historyIndex, history } = get();
    return historyIndex < history.length - 1;
  },

  // Reset
  reset: () => set({
    activeTool: 'select',
    zoom: 1,
    pan: { x: 0, y: 0 },
    gridEnabled: true,
    snapToGrid: false,
    isDrawing: false,
    selectedObjects: [],
    stickyNoteColor: '#FFEB3B',
    penColor: '#000000',
    penWidth: 2,
    fillColor: '#3B82F6',
    strokeColor: '#1E40AF',
    strokeWidth: 2,
    shapeSize: 'medium',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    textColor: '#000000',
    theme: 'light',
    backgroundColor: '#ffffff',
    canvasWidth: 1920,
    canvasHeight: 1080,
    showGrid: true,
    gridSize: 20,
    historyIndex: -1,
    history: [],
  }),
}));
