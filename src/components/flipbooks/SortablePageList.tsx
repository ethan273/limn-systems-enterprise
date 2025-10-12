"use client";

/**
 * Sortable Page List Component
 *
 * Drag-and-drop reorderable list of flipbook pages
 * Uses @dnd-kit for sorting
 */

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  page_number: number;
  thumbnail_url: string;
}

interface SortablePageListProps {
  pages: Page[];
  selectedPageId?: string | null;
  onPageSelect?: (pageId: string) => void;
  onPageReorder?: (pageIds: string[]) => void;
  onPageDelete?: (pageId: string) => void;
  className?: string;
}

// Individual sortable page item
function SortablePageItem({
  page,
  isSelected,
  onSelect,
  onDelete,
}: {
  page: Page;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-card border rounded-lg transition-all",
        isSelected && "ring-2 ring-blue-500",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Thumbnail */}
      <button
        onClick={onSelect}
        className={cn(
          "flex-1 flex items-center gap-2 text-left hover:bg-muted/50 rounded p-1 transition-colors"
        )}
      >
        <div
          className="w-12 h-16 rounded bg-cover bg-center border flex-shrink-0"
          style={{ backgroundImage: `url(${page.thumbnail_url})` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Page {page.page_number}</p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onSelect}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Main sortable list component
export function SortablePageList({
  pages: initialPages,
  selectedPageId,
  onPageSelect,
  onPageReorder,
  onPageDelete,
  className,
}: SortablePageListProps) {
  const [pages, setPages] = useState(initialPages);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);

      const newPages = arrayMove(pages, oldIndex, newIndex);
      setPages(newPages);

      // Call onPageReorder with new order
      onPageReorder?.(newPages.map((p) => p.id));
    }
  };

  // Sync with prop changes
  if (initialPages.length !== pages.length ||
      initialPages.some((p, i) => p.id !== pages[i]?.id)) {
    setPages(initialPages);
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={pages} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {pages.map((page) => (
              <SortablePageItem
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                onSelect={() => onPageSelect?.(page.id)}
                onDelete={() => onPageDelete?.(page.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
