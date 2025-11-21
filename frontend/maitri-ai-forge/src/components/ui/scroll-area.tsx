import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

// Main ScrollArea with horizontal and vertical scrollbars
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-auto w-full h-full", className)}
    {...props}
    type="auto"
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    {/* Render both scrollbars */}
    <ScrollBar orientation="vertical" />
    <div className="!sticky left-0 bottom-0 w-full z-50">
      <ScrollBar orientation="horizontal" />
    </div>
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

// ScrollBar supporting orientation
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 sticky flex-col !position-sticky border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// Example usage: wide table inside scroll area
export default function ScrollableTable({ mappings, renderKeyCell, renderDropdownCell, targetMessage }) {
  return (
    <ScrollArea className="rounded-lg border-2 border-border shadow-lg w-full h-[500px]">
      <table className="min-w-max border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-primary/20 to-accent/20">
            <th className="px-3 py-4 text-left font-bold border-r-2 border-border bg-gradient-to-r from-primary/10 to-primary/5">
              Destination Key
            </th>
            <th className="px-6 py-4 text-center font-bold border-r-2 border-border bg-gradient-to-r from-accent/10 to-accent/5" colSpan={3}>
              Best three Mappings (tap to select)
            </th>
            <th className="px-6 py-4 text-center font-bold bg-gradient-to-r from-primary/5 to-accent/5">
              All Keys
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(mappings).map(([targetKey, keys], index) => (
            <tr key={targetKey} className={cn(
              "border-t-2 border-border transition-all",
              index % 2 === 0 ? "bg-card hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"
            )}>
              <td className="px-2 py-4 font-bold border-r-1 text-center border-border bg-white text-black">
                {targetKey}
              </td>
              {renderKeyCell(targetMessage, targetKey, 'key1', keys.key1)}
              {renderKeyCell(targetMessage, targetKey, 'key2', keys.key2)}
              {renderKeyCell(targetMessage, targetKey, 'key3', keys.key3)}
              {renderDropdownCell(targetMessage, targetKey)}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

export { ScrollArea, ScrollBar };
