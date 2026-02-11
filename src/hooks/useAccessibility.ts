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
