import { useEffect } from 'react';

let lockCount = 0;
let lockedScrollY = 0;
let lastTouchY = 0;
let originalBodyStyles = null;
let originalDocumentStyles = null;

const getAllowedScrollElement = (target) => {
  if (!target || target.nodeType !== 1 || typeof target.closest !== 'function') {
    return null;
  }

  return target.closest('[data-scroll-lock-allow="true"]');
};

const canScrollVertically = (element) => element && element.scrollHeight > element.clientHeight + 1;

const shouldPreventTouchMove = (event) => {
  const allowedScrollElement = getAllowedScrollElement(event.target);

  if (!allowedScrollElement || !canScrollVertically(allowedScrollElement)) {
    return true;
  }

  const currentTouchY = event.touches?.[0]?.clientY ?? lastTouchY;
  const touchDeltaY = currentTouchY - lastTouchY;
  const isAtTop = allowedScrollElement.scrollTop <= 0;
  const isAtBottom =
    allowedScrollElement.scrollTop + allowedScrollElement.clientHeight >= allowedScrollElement.scrollHeight - 1;

  lastTouchY = currentTouchY;

  return (isAtTop && touchDeltaY > 0) || (isAtBottom && touchDeltaY < 0);
};

const restoreStyles = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const { body, documentElement } = document;

  if (originalBodyStyles) {
    Object.entries(originalBodyStyles).forEach(([property, value]) => {
      body.style[property] = value;
    });
  }

  if (originalDocumentStyles) {
    Object.entries(originalDocumentStyles).forEach(([property, value]) => {
      documentElement.style[property] = value;
    });
  }

  window.scrollTo(0, lockedScrollY);
  originalBodyStyles = null;
  originalDocumentStyles = null;
};

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const { body, documentElement } = document;

    if (lockCount === 0) {
      lockedScrollY = window.scrollY || documentElement.scrollTop || 0;
      const scrollbarWidth = Math.max(window.innerWidth - documentElement.clientWidth, 0);

      originalBodyStyles = {
        overflow: body.style.overflow,
        overscrollBehavior: body.style.overscrollBehavior,
        paddingRight: body.style.paddingRight,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
      };
      originalDocumentStyles = {
        overflow: documentElement.style.overflow,
        overscrollBehavior: documentElement.style.overscrollBehavior,
      };

      documentElement.style.overflow = 'hidden';
      documentElement.style.overscrollBehavior = 'none';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      body.style.position = 'fixed';
      body.style.top = `-${lockedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    const handleTouchStart = (event) => {
      lastTouchY = event.touches?.[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event) => {
      if (shouldPreventTouchMove(event)) {
        event.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    lockCount += 1;

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);

      lockCount = Math.max(lockCount - 1, 0);

      if (lockCount === 0) {
        restoreStyles();
      }
    };
  }, [isLocked]);
}
