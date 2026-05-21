'use client';

import { useEffect } from 'react';

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  returnFocusRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    const container = ref.current;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const triggerElement = returnFocusRef?.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    first?.focus();
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (triggerElement) {
        triggerElement.focus();
      }
    };
  }, [isActive, ref, returnFocusRef]);
}
