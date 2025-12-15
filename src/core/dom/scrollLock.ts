/**
 * scrollLock - Simple ref-counted body scroll lock utility
 * 
 * Phase 14C: Prevents conflict when multiple components (Sidebar, Modal) 
 * need to lock body scroll simultaneously.
 * 
 * Uses ref-counting: only unlocks when all lockers have released.
 */

let lockCount = 0;
let prevOverflow: string | null = null;

/**
 * Lock body scroll. Can be called multiple times (ref-counted).
 */
export function lockBodyScroll(): void {
    if (lockCount === 0) {
        prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    lockCount++;
}

/**
 * Unlock body scroll. Only actually unlocks when all lockers have released.
 */
export function unlockBodyScroll(): void {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
        document.body.style.overflow = prevOverflow ?? '';
        prevOverflow = null;
    }
}
