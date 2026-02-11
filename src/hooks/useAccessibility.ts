import { useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for accessibility enhancements.
 * Handles focus management on route changes and provides aria-live announcements.
 */
export function useAccessibility() {
    const { pathname } = useLocation();
    const mainRef = useRef<HTMLElement>(null);
    const announcerRef = useRef<HTMLDivElement>(null);

    // Manage focus on route change
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.focus();
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    // Announce messages to screen readers
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (announcerRef.current) {
            const element = document.createElement('div');
            element.innerText = message;
            // Clear previous message after a short delay to ensure screen readers pick it up
            // but don't clear immediately to avoid cutting off.
            // A simple implementation is to just append.
            if (announcerRef.current.hasChildNodes()) {
                announcerRef.current.innerHTML = '';
            }
            announcerRef.current.setAttribute('aria-live', priority);
            announcerRef.current.appendChild(element);

            // Clean up after announcement is likely read (3 seconds)
            setTimeout(() => {
                if (announcerRef.current && announcerRef.current.contains(element)) {
                    announcerRef.current.removeChild(element);
                }
            }, 3000);
        }
    }, []);

    return { mainRef, announcerRef, announce };
}

/**
 * Hook to trap focus within a specific element (e.g., modal).
 * @param isActive - Whether the trap should be active
 * @returns ref to attach to the container
 */
export function useFocusTrap(isActive: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        // const handleEscape = (e: KeyboardEvent) => {
        //     if (e.key === 'Escape') {
        //         // Optional: trigger close callback if provided
        //     }
        // };

        // Focus the first element when activated
        if (firstElement) {
            firstElement.focus();
        }

        container.addEventListener('keydown', handleTabKey);

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isActive]);

    return containerRef;
}
