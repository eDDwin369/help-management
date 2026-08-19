import { useState, useRef, type ReactNode } from "react";
import {
  type WidgetConfig,
  type WidgetWidth,
  type UserWidgetState,
  getWidgetGridClass,
  getWidgetWidthLabel,
  WIDTH_STEPS,
} from "@/lib/widget-registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GripVertical,
  Settings,
  EyeOff,
  Maximize2,
  Minimize2,
  Columns,
  Scaling,
  Info,
} from "lucide-react";

interface WidgetCardProps {
  widget: WidgetConfig;
  userState: UserWidgetState;
  onWidthChange: (id: string, width: WidgetWidth) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  children: ReactNode;
}

export function WidgetCard({
  widget,
  userState,
  onWidthChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  children,
}: WidgetCardProps) {
  const Icon = widget.icon;
  const gridSpanClass = getWidgetGridClass(userState.width);

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const initialWidthIndex = useRef<number>(0);

  // Handle right-edge mouse drag resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    initialWidthIndex.current = WIDTH_STEPS.indexOf(userState.width);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX.current;
      // Change step per 120px drag distance
      const stepDelta = Math.round(deltaX / 120);
      let newIndex = initialWidthIndex.current + stepDelta;
      newIndex = Math.max(0, Math.min(WIDTH_STEPS.length - 1, newIndex));

      const newWidth = WIDTH_STEPS[newIndex];
      if (newWidth !== userState.width) {
        onWidthChange(widget.id, newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      draggable={!isResizing}
      onDragStart={(e) => onDragStart(e, widget.id)}
      onDragOver={(e) => onDragOver(e, widget.id)}
      onDrop={(e) => onDrop(e, widget.id)}
      className={`group relative rounded-2xl bg-card text-card-foreground border border-border/80 shadow-xs transition-all duration-200 flex flex-col justify-between ${gridSpanClass} ${
        isDragging ? "opacity-40 scale-[0.98] border-indigo-500 border-dashed" : "hover:border-border/90"
      } ${isResizing ? "ring-2 ring-indigo-500 shadow-xl" : ""}`}
    >
      {/* Widget Header Bar */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Drag to reorder widget position"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Icon */}
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>

          {/* Title & Info Icon */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold tracking-tight text-foreground truncate">
                {widget.title}
              </h3>

              {/* Info Icon with Hover Tooltip for Subheading */}
              {widget.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none shrink-0"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                    {widget.description}
                  </TooltipContent>
                </Tooltip>
              )}

              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 text-muted-foreground bg-muted/30 border-border/60 shrink-0 ml-1">
                {userState.width === "third" && "1/3 Width"}
                {userState.width === "half" && "1/2 Width"}
                {userState.width === "two-thirds" && "2/3 Width"}
                {userState.width === "full" && "Full Width"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Widget Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Widget Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 text-xs">
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Resize Widget Width
              </DropdownMenuLabel>

              {WIDTH_STEPS.map((wStep) => (
                <DropdownMenuItem
                  key={wStep}
                  onClick={() => onWidthChange(widget.id, wStep)}
                  className="gap-2 cursor-pointer"
                >
                  <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{getWidgetWidthLabel(wStep)}</span>
                  {userState.width === wStep && (
                    <span className="ml-auto text-xs text-primary font-bold">✓</span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onRemove(widget.id)}
                className="gap-2 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide Widget</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Direct Hide Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemove(widget.id)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide widget</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="p-4 flex-1">{children}</div>

      {/* Interactive Right Edge Drag-Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 w-2.5 h-full cursor-col-resize hover:bg-primary/20 group-hover:bg-primary/10 transition-colors z-20 flex items-center justify-center rounded-r-2xl"
        title="Drag right/left to resize widget width"
      >
        <div className="w-1 h-8 rounded-full bg-border group-hover:bg-primary/60 transition-colors opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}
