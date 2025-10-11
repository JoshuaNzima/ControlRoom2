import React from 'react';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
  gap?: number;
}

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, cols = 1, gap = 4, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`grid grid-cols-${cols} gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
Grid.displayName = 'Grid';

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, colSpan = 1, rowSpan = 1, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`col-span-${colSpan} row-span-${rowSpan} ${className}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
GridItem.displayName = 'GridItem';
