import * as React from 'react';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return <div className={`skeleton rounded-lg ${className}`} {...props} />;
}

export default Skeleton;
