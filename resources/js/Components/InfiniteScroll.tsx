import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  onIntersect: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function InfiniteScroll({ 
  onIntersect, 
  isLoading = false, 
  hasMore = false, 
  children,
  className = ""
}: InfiniteScrollProps) {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onIntersect, hasMore, isLoading]);

  return (
    <div className={className}>
      {children}
      <div ref={observerTarget} className="h-4 w-full">
        {isLoading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        )}
      </div>
    </div>
  );
}