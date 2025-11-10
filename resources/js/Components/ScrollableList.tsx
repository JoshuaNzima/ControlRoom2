import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollableListProps {
    children: React.ReactNode;
    onLoadMore?: () => void;
    isLoading?: boolean;
    hasMore?: boolean;
    className?: string;
    containerClassName?: string;
    loadingClassName?: string;
}

export default function ScrollableList({
    children,
    onLoadMore,
    isLoading = false,
    hasMore = false,
    className = '',
    containerClassName = '',
    loadingClassName = '',
}: ScrollableListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!onLoadMore || isLoading || !hasMore) return;

        const options = {
            root: scrollRef.current,
            // Preload earlier so UI stays smooth
            rootMargin: '200px',
            // trigger when a small portion of the sentinel is visible
            threshold: 0.1,
        };

        // Clean up any previous observer
        if (observer.current) {
            observer.current.disconnect();
            observer.current = null;
        }

        observer.current = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target && target.isIntersecting && !isLoading && hasMore) {
                onLoadMore();
            }
        }, options);

        const currentLoading = loadingRef.current;
        if (currentLoading) {
            observer.current.observe(currentLoading);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [onLoadMore, isLoading, hasMore]);

    return (
        <div 
            ref={scrollRef} 
            className={cn(
                'relative h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                containerClassName
            )}
        >
            <div className={cn('space-y-4', className)}>
                {children}
            </div>
            {(hasMore || isLoading) && (
                <div 
                    ref={loadingRef}
                    className={cn(
                        'flex justify-center p-4',
                        loadingClassName
                    )}
                >
                    {isLoading && (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100" />
                    )}
                </div>
            )}
        </div>
    );
}