import { useCallback, useRef, useState } from "react";
import * as fabric from "fabric";

interface HistoryState {
  json: string;
  timestamp: number;
}

interface UseCanvasHistoryOptions {
  maxHistory?: number;
}

export function useCanvasHistory(options: UseCanvasHistoryOptions = {}) {
  const { maxHistory = 50 } = options;

  const historyStack = useRef<HistoryState[]>([]);
  const historyIndex = useRef(-1);
  const isPerformingAction = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateButtonStates = useCallback(() => {
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < historyStack.current.length - 1);
  }, []);

  const saveState = useCallback(
    (canvas: fabric.Canvas) => {
      // Don't save state if we're performing undo/redo
      if (isPerformingAction.current) return;

      const json = JSON.stringify(canvas.toJSON());

      // Remove any redo states if we're not at the end of the history
      if (historyIndex.current < historyStack.current.length - 1) {
        historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
      }

      // Add new state
      historyStack.current.push({
        json,
        timestamp: Date.now(),
      });

      // Limit history size
      if (historyStack.current.length > maxHistory) {
        historyStack.current.shift();
      } else {
        historyIndex.current++;
      }

      updateButtonStates();
    },
    [maxHistory, updateButtonStates]
  );

  const undo = useCallback(
    async (canvas: fabric.Canvas) => {
      if (historyIndex.current <= 0) return;

      isPerformingAction.current = true;
      historyIndex.current--;

      const state = historyStack.current[historyIndex.current];
      if (state) {
        await loadState(canvas, state.json);
      }

      isPerformingAction.current = false;
      updateButtonStates();
    },
    [updateButtonStates]
  );

  const redo = useCallback(
    async (canvas: fabric.Canvas) => {
      if (historyIndex.current >= historyStack.current.length - 1) return;

      isPerformingAction.current = true;
      historyIndex.current++;

      const state = historyStack.current[historyIndex.current];
      if (state) {
        await loadState(canvas, state.json);
      }

      isPerformingAction.current = false;
      updateButtonStates();
    },
    [updateButtonStates]
  );

  const clear = useCallback(() => {
    historyStack.current = [];
    historyIndex.current = -1;
    updateButtonStates();
  }, [updateButtonStates]);

  const initialize = useCallback(
    (canvas: fabric.Canvas) => {
      // Save initial state
      saveState(canvas);
    },
    [saveState]
  );

  return {
    saveState,
    undo,
    redo,
    clear,
    initialize,
    canUndo,
    canRedo,
  };
}

async function loadState(canvas: fabric.Canvas, json: string) {
  const data = JSON.parse(json);

  // Clear current canvas
  canvas.clear();

  // Load from JSON - Fabric.js v6 returns a Promise
  await canvas.loadFromJSON(data);
  canvas.renderAll();
}
