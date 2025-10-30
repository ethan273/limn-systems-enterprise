"use client";
import { log } from '@/lib/logger';

// Fabric.js v6 uses named exports instead of a default namespace export
import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { useBoardStore } from "@/lib/design-boards/board-store";
import { useCanvasHistory } from "@/lib/design-boards/use-canvas-history";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { debounce } from "lodash";
import { createKanbanBoard } from "@/components/design-boards/KanbanColumn";

interface DesignBoardCanvasProps {
  boardId: string;
  userId: string;
  board: any;
  onCanvasReady?: (_canvas: fabric.Canvas) => void;
}

export function DesignBoardCanvas({ boardId, userId, board, onCanvasReady }: DesignBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    activeTool,
    setActiveTool,
    zoom,
    gridEnabled,
    // Unused: snapToGrid,
    penColor,
    penWidth,
    fillColor,
    strokeColor,
    strokeWidth,
    shapeSize,
    stickyNoteColor,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    textDecoration,
    textAlign,
    textColor,
    backgroundColor,
    gridSize,
    showGrid,
    // Unused: isDrawing,
    // Unused: setIsDrawing,
    // Unused: selectedObjects,
    setSelectedObjects,
  } = useBoardStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Canvas history for undo/redo
  const history = useCanvasHistory({ maxHistory: 50 });

  // Fetch board objects
  const { data: objectsData } = api.designBoards.objects.getByBoardId.useQuery(
    { board_id: boardId },
    { enabled: !!boardId }
  );

  // Mutations for saving objects
  const createObjectMutation = api.designBoards.objects.create.useMutation();
  const updateObjectMutation = api.designBoards.objects.update.useMutation();
  // Unused: const deleteObjectMutation = api.designBoards.objects.delete.useMutation();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 100, // Account for toolbars
      backgroundColor: board?.background_color || '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    setIsInitialized(true);

    // Call onCanvasReady callback
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Set up event listeners
    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        canvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Undo (Cmd/Ctrl + Z)
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo(canvas);
        return;
      }

      // Redo (Cmd/Ctrl + Shift + Z)
      if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        history.redo(canvas);
        return;
      }

      // Delete (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault();
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          history.saveState(canvas);
        }
        return;
      }

      // Copy (Cmd/Ctrl + C)
      if (isCtrlOrCmd && e.key === 'c') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault();
          // Store in a ref for paste
          (canvas as any)._clipboard = activeObjects;
        }
        return;
      }

      // Paste (Cmd/Ctrl + V)
      if (isCtrlOrCmd && e.key === 'v') {
        e.preventDefault();
        const clipboard = (canvas as any)._clipboard;
        if (clipboard && clipboard.length > 0) {
          clipboard.forEach(async (obj: fabric.Object) => {
            const cloned = await obj.clone();
            cloned.set({
              left: (cloned.left || 0) + 10,
              top: (cloned.top || 0) + 10,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            history.saveState(canvas);
          });
        }
        return;
      }

      // Duplicate (Cmd/Ctrl + D)
      if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault();
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach(async (obj: fabric.Object) => {
            const cloned = await obj.clone();
            cloned.set({
              left: (cloned.left || 0) + 10,
              top: (cloned.top || 0) + 10,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            history.saveState(canvas);
          });
        }
        return;
      }

      // Select All (Cmd/Ctrl + A)
      if (isCtrlOrCmd && e.key === 'a') {
        e.preventDefault();
        canvas.discardActiveObject();
        const selection = new fabric.ActiveSelection(canvas.getObjects(), {
          canvas: canvas,
        });
        canvas.setActiveObject(selection);
        canvas.renderAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIXED: Removed 'history' from dependencies to prevent infinite loop

  // Load existing objects from database
  useEffect(() => {
    if (!fabricCanvasRef.current || !objectsData || !isInitialized) return;

    const canvas = fabricCanvasRef.current;

    // Clear canvas
    canvas.clear();

    // Load objects asynchronously
    const loadObjects = async () => {
      for (const obj of objectsData) {
        try {
          const fabricObject = await deserializeFabricObject(obj);
          if (fabricObject) {
            canvas.add(fabricObject);
          }
        } catch (error) {
          log.error("Failed to load object:", { error });
        }
      }
      canvas.renderAll();

      // Initialize history after objects are loaded
      history.initialize(canvas);
    };

    loadObjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectsData, isInitialized]); // FIXED: Removed 'history' to prevent infinite loop

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Reset drawing mode
    canvas.isDrawingMode = false;

    switch (activeTool) {
      case 'select':
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        break;

      case 'pen':
        canvas.isDrawingMode = true;
        // Initialize brush if it doesn't exist (Fabric.js v6)
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = penColor;
          canvas.freeDrawingBrush.width = penWidth;
        } else {
          // Create a new PencilBrush if it doesn't exist
          const brush = new fabric.PencilBrush(canvas);
          brush.color = penColor;
          brush.width = penWidth;
          canvas.freeDrawingBrush = brush;
        }
        break;

      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        // Create a simple eraser brush using PencilBrush with white color
        const eraserBrush = new fabric.PencilBrush(canvas);
        eraserBrush.color = backgroundColor || '#ffffff';
        eraserBrush.width = strokeWidth * 5;
        canvas.freeDrawingBrush = eraserBrush;
        canvas.defaultCursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'><path d=\'m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\'/><path d=\'M22 21H7\'/><path d=\'m5 11 9 9\'/></svg>") 12 12, crosshair';
        break;

      case 'hand':
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        break;

      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'star':
      case 'hexagon':
      case 'diamond':
      case 'line':
      case 'arrow':
      case 'text':
      case 'sticky':
      case 'image':
      case 'kanban':
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        break;

      default:
        canvas.selection = true;
        canvas.defaultCursor = 'default';
    }

    canvas.renderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, penColor, penWidth]); // backgroundColor and strokeWidth used in eraser case

  // Handle zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);

  // Update canvas background color
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.backgroundColor = backgroundColor;
    canvas.renderAll();
  }, [backgroundColor]);

  // Mouse down handler for drawing shapes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let isDown = false;
    let origX = 0;
    let origY = 0;
    let shape: fabric.Object | null = null;

    const handleMouseDown = (options: any) => {
      if (!['rectangle', 'circle', 'triangle', 'star', 'hexagon', 'diamond', 'line', 'arrow', 'text', 'sticky', 'image', 'kanban'].includes(activeTool)) return;

      isDown = true;
      const pointer = canvas.getPointer(options.e);
      origX = pointer.x;
      origY = pointer.y;

      // Handle image upload
      if (activeTool === 'image') {
        log.info('Image tool clicked, calling handleImageUpload...');
        handleImageUpload(canvas, origX, origY);
        setActiveTool('select');
        isDown = false;
        return;
      }

      // Handle kanban board creation
      if (activeTool === 'kanban') {
        createKanbanBoard(canvas, origX, origY, ['To Do', 'In Progress', 'Done']);
        setActiveTool('select');
        canvas.renderAll();
        history.saveState(canvas);
        isDown = false;
        return;
      }

      // Unused: Get base size for shapes based on preset
      // const getBaseSize = () => {
      //   switch (shapeSize) {
      //     case 'small': return 50;
      //     case 'medium': return 100;
      //     case 'large': return 200;
      //     default: return 100;
      //   }
      // };

      // Create shape based on tool
      if (activeTool === 'rectangle') {
        shape = new fabric.Rect({
          left: origX,
          top: origY,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
      } else if (activeTool === 'circle') {
        shape = new fabric.Circle({
          left: origX,
          top: origY,
          radius: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
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
      } else if (activeTool === 'line') {
        shape = new fabric.Line([origX, origY, origX, origY], {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
      } else if (activeTool === 'arrow') {
        shape = createArrow(origX, origY, origX, origY, strokeColor, strokeWidth);
      } else if (activeTool === 'text') {
        const text = new fabric.IText('Double-click to edit', {
          left: origX,
          top: origY,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          underline: textDecoration === 'underline',
          linethrough: textDecoration === 'line-through',
          textAlign: textAlign,
          fill: textColor,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        // Switch to select tool so user can edit the text
        setActiveTool('select');
        // Enter editing mode immediately
        text.enterEditing();
        canvas.renderAll();
        isDown = false;
        return;
      } else if (activeTool === 'sticky') {
        const sticky = createStickyNote(origX, origY, stickyNoteColor);
        canvas.add(sticky);
        canvas.setActiveObject(sticky);
        // Switch to select tool so user can move/edit the sticky note
        setActiveTool('select');
        canvas.renderAll();
        isDown = false;
        return;
      }

      if (shape) {
        canvas.add(shape);
      }
    };

    const handleMouseMove = (options: any) => {
      if (!isDown || !shape) return;

      const pointer = canvas.getPointer(options.e);

      if (activeTool === 'rectangle') {
        const rect = shape as fabric.Rect;
        const width = pointer.x - origX;
        const height = pointer.y - origY;

        if (width < 0) {
          rect.set({ left: pointer.x });
        }
        if (height < 0) {
          rect.set({ top: pointer.y });
        }

        rect.set({
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (activeTool === 'circle') {
        const circle = shape as fabric.Circle;
        const radius = Math.sqrt(
          Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2)
        ) / 2;
        circle.set({ radius });
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
      } else if (activeTool === 'line') {
        const line = shape as fabric.Line;
        line.set({ x2: pointer.x, y2: pointer.y });
      } else if (activeTool === 'arrow') {
        // Remove old arrow and create new one with updated coordinates
        canvas.remove(shape!);
        shape = createArrow(origX, origY, pointer.x, pointer.y, strokeColor, strokeWidth);
        canvas.add(shape);
      }

      canvas.renderAll();
    };

    const handleMouseUp = (_e: any) => {
      isDown = false;
      shape = null;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
    // Note: setActiveTool is a stable Zustand function and should not be in the dependency array
    // history methods are also stable and should not be in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, fillColor, strokeColor, strokeWidth, shapeSize, penColor, stickyNoteColor, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, textColor]);

  // Double-click handler for editing sticky notes and grouped text
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    const handleDoubleClick = (e: any) => {
      const target = e.target;
      if (!target) return;

      // Handle sticky note double-click to edit text
      if (target.type === 'group') {
        const group = target as fabric.Group;
        const objects = group.getObjects();

        // Find the text object in the group (sticky note has text as second item)
        const textObj = objects.find(obj => obj.type === 'i-text' || obj.type === 'textbox');

        if (textObj && textObj.type === 'i-text') {
          const itext = textObj as fabric.IText;

          // Ungroup to make text editable
          const items = group.getObjects();
          const groupLeft = group.left || 0;
          const groupTop = group.top || 0;

          canvas.remove(group);

          items.forEach(item => {
            const itemLeft = (item.left || 0) + groupLeft;
            const itemTop = (item.top || 0) + groupTop;
            item.set({ left: itemLeft, top: itemTop });
            canvas.add(item);
          });

          // Make text editable
          canvas.setActiveObject(itext);
          itext.enterEditing();
          canvas.renderAll();
        }
      }
    };

    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, []);

  // Update eraser brush color when background changes
  useEffect(() => {
    if (!fabricCanvasRef.current || activeTool !== 'eraser') return;

    const canvas = fabricCanvasRef.current;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = backgroundColor || '#ffffff';
    }
  }, [backgroundColor, activeTool]);

  // Selection handlers
  const handleSelectionChange = (_e: any) => {
    const selected = fabricCanvasRef.current?.getActiveObjects() || [];
    setSelectedObjects(selected.map((obj: any) => obj.id || ''));
  };

  const handleSelectionCleared = () => {
    setSelectedObjects([]);
  };

  // Object modified handler (for auto-save)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleObjectModified = useCallback(
    debounce((e: any) => {
      if (!e.target || !fabricCanvasRef.current) return;

      const obj = e.target;
      const canvas = fabricCanvasRef.current;

      // Save to history
      history.saveState(canvas);

      const objectData = serializeFabricObject(obj);

      // Update object in database
      if (obj.id) {
        updateObjectMutation.mutate({
          id: obj.id as string,
          data: objectData,
        });
      }
    }, 1000),
    [] // FIXED: Removed 'history' to prevent infinite loop - history methods are stable
  );

  // Object added handler (for auto-save)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleObjectAdded = useCallback(
    debounce((e: any) => {
      if (!e.target || e.target.id || !fabricCanvasRef.current) return; // Skip if already has ID

      const obj = e.target;
      const canvas = fabricCanvasRef.current;

      // Save to history
      history.saveState(canvas);

      const objectData = serializeFabricObject(obj);

      // Create object in database
      createObjectMutation.mutate(
        {
          ...objectData,
          board_id: boardId,
          created_by: userId,
        },
        {
          onSuccess: (newObject) => {
            // Assign ID to Fabric object
            obj.set({ id: newObject.id } as any);
          },
        }
      );
    }, 1000),
    [boardId, userId] // FIXED: Removed 'history' to prevent infinite loop
  );

  return (
    <div ref={containerRef} className="w-full h-full bg-background relative">
      {/* Grid overlay */}
      {showGrid && gridEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(204, 204, 204, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(204, 204, 204, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} />
    </div>
  );
}

// Helper functions
function createStickyNote(x: number, y: number, color: string): fabric.Group {
  const rect = new fabric.Rect({
    width: 200,
    height: 200,
    fill: color,
    stroke: '#000',
    strokeWidth: 1,
    rx: 5,
    ry: 5,
  });

  const text = new fabric.IText('Double-click to edit', {
    fontSize: 16,
    fill: '#000000', // Black text for visibility
    textAlign: 'center',
    width: 180,
  });

  const group = new fabric.Group([rect, text], {
    left: x,
    top: y,
  });

  return group;
}

function serializeFabricObject(obj: fabric.Object): any {
  return {
    object_type: obj.type || 'unknown',
    object_data: obj.toJSON(),
    position_x: obj.left || 0,
    position_y: obj.top || 0,
    width: obj.width || 0,
    height: obj.height || 0,
    rotation: obj.angle || 0,
    scale_x: obj.scaleX || 1,
    scale_y: obj.scaleY || 1,
  };
}

async function deserializeFabricObject(obj: any): Promise<fabric.Object | null> {
  try {
    // In Fabric.js v6, enlivenObjects returns a Promise
    const objects = await fabric.util.enlivenObjects([obj.object_data]);
    const fabricObj = objects[0];

    // Restore the ID so we can update the object later
    if (fabricObj && obj.id) {
      (fabricObj as any).id = obj.id;
    }

    return (fabricObj as any) || null;
  } catch (error) {
    log.error("Failed to deserialize object:", { error });
    return null;
  }
}

function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): fabric.Group {
  // Calculate angle
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Arrow head size
  const headLength = 15;
  const headWidth = 10;

  // Line
  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke: color,
    strokeWidth: width,
  });

  // Arrow head (triangle)
  const arrowHead = new fabric.Triangle({
    left: x2,
    top: y2,
    width: headWidth,
    height: headLength,
    fill: color,
    angle: (angle * 180) / Math.PI + 90,
    originX: 'center',
    originY: 'center',
  });

  // Group line and arrowhead
  const arrow = new fabric.Group([line, arrowHead], {
    selectable: true,
  });

  return arrow;
}

function handleImageUpload(canvas: fabric.Canvas, x: number, y: number) {
  // Create a hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';

  log.info('File input created, setting up handlers...');

  input.onchange = async (e) => {
    log.info('File input changed, file selected');
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      document.body.removeChild(input);
      return;
    }

    toast.info('Loading image...');

    try {
      // Create a FileReader to read the image
      const reader = new FileReader();

      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;

        // Create Fabric image directly
        fabric.FabricImage.fromURL(imgUrl).then((img) => {
          // Calculate scale to fit within reasonable size (max 400px)
          const maxSize = 400;
          const scale = Math.min(
            maxSize / img.width!,
            maxSize / img.height!,
            1 // Don't scale up
          );

          img.set({
            left: x,
            top: y,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();

          toast.success('Image added successfully');

          // Clean up
          document.body.removeChild(input);
        }).catch((error) => {
          log.error('Failed to load image:', { error });
          toast.error('Failed to load image');
          document.body.removeChild(input);
        });
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        document.body.removeChild(input);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      log.error('Image upload error:', { error });
      toast.error('Failed to upload image');
      document.body.removeChild(input);
    }
  };

  // Append to body (required for some browsers)
  document.body.appendChild(input);
  log.info('File input appended to body');

  // Trigger the file input
  log.info('Attempting to click file input...');
  input.click();
  log.info('File input clicked');
}

// Helper function to create star points
function createStarPoints(numPoints: number, outerRadius: number, innerRadius: number) {
  const points: { x: number; y: number }[] = [];
  const angle = Math.PI / numPoints;

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = radius * Math.sin(i * angle);
    const y = -radius * Math.cos(i * angle);
    points.push({ x, y });
  }

  return points;
}

// Helper function to create polygon points
function createPolygonPoints(sides: number, radius: number) {
  const points: { x: number; y: number }[] = [];
  const angle = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(i * angle - Math.PI / 2);
    const y = radius * Math.sin(i * angle - Math.PI / 2);
    points.push({ x, y });
  }

  return points;
}
