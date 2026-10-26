/**
 * OS Nexus : Centralized GSAP Purposeful Animation & Micro-interaction Engine
 * Professional, high-performance UI transitions strictly respecting prefers-reduced-motion.
 */
import { gsap } from 'gsap';

export function isReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate page entrance transition
 */
export function animatePageIn(container) {
  if (!container) return;
  if (isReducedMotion()) {
    container.style.opacity = '1';
    return;
  }

  gsap.killTweensOf(container);
  gsap.fromTo(
    container,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', clearProps: 'all' }
  );

  // Stagger reveal prominent cards if present
  const cards = container.querySelectorAll('.stat-card, .module-card, .exp-card, .card-stagger');
  if (cards.length > 0) {
    gsap.killTweensOf(cards);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.28,
        stagger: 0.03,
        ease: 'power2.out',
        delay: 0.04,
        clearProps: 'all'
      }
    );
  }
}

/**
 * Animate tab panel transitions
 */
export function animateTabSwitch(panel) {
  if (!panel) return;
  if (isReducedMotion()) {
    panel.style.opacity = '1';
    return;
  }

  gsap.killTweensOf(panel);
  gsap.fromTo(
    panel,
    { opacity: 0, y: 6 },
    { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out', clearProps: 'all' }
  );
}

/**
 * Tactile feedback on button click / simulation action
 */
export function animateButtonPress(element) {
  if (!element || isReducedMotion()) return;

  gsap.killTweensOf(element);
  gsap.timeline()
    .to(element, { scale: 0.96, duration: 0.07, ease: 'power1.in' })
    .to(element, { scale: 1, duration: 0.12, ease: 'back.out(2)', clearProps: 'transform' });
}

/**
 * Modal dialog entrance
 */
export function animateModalOpen(modalBox, overlay) {
  if (!modalBox) return;
  if (isReducedMotion()) {
    if (overlay) overlay.style.opacity = '1';
    modalBox.style.opacity = '1';
    return;
  }

  if (overlay) {
    gsap.killTweensOf(overlay);
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  }

  gsap.killTweensOf(modalBox);
  gsap.fromTo(
    modalBox,
    { opacity: 0, scale: 0.95, y: -10 },
    { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: 'power3.out', clearProps: 'transform' }
  );
}

/**
 * Modal dialog exit
 */
export function animateModalClose(modalBox, overlay, onComplete) {
  if (!modalBox) {
    if (onComplete) onComplete();
    return;
  }
  if (isReducedMotion()) {
    if (onComplete) onComplete();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set([modalBox, overlay], { clearProps: 'all' });
      if (onComplete) onComplete();
    }
  });

  tl.to(modalBox, { opacity: 0, scale: 0.96, duration: 0.15, ease: 'power2.in' }, 0);
  if (overlay) {
    tl.to(overlay, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0);
  }
}

/**
 * Subtle pulse for updated metrics or telemetry chips
 */
export function animateMetricUpdate(element) {
  if (!element || isReducedMotion()) return;

  gsap.killTweensOf(element);
  gsap.fromTo(
    element,
    { scale: 1.06 },
    { scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }
  );
}

/**
 * Page replacement / frame allocation feedback
 */
export function animateFrameAccess(frameEl, isHit = false) {
  if (!frameEl || isReducedMotion()) return;

  gsap.killTweensOf(frameEl);
  const flashColor = isHit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)';
  gsap.fromTo(
    frameEl,
    { backgroundColor: flashColor, scale: 1.04 },
    { backgroundColor: '', scale: 1, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
  );
}

/**
 * Disk actuator seek trajectory motion
 */
export function animateDiskHead(headEl, targetLeftPercent, durationSec = 0.3, onComplete = null) {
  if (!headEl) return;
  if (isReducedMotion()) {
    headEl.style.left = `${targetLeftPercent}%`;
    if (onComplete) onComplete();
    return;
  }

  gsap.killTweensOf(headEl);
  gsap.to(headEl, {
    left: `${targetLeftPercent}%`,
    duration: durationSec,
    ease: 'power2.inOut',
    onComplete
  });
}

/**
 * Gentle error feedback (horizontal shake)
 */
export function animateErrorFeedback(element) {
  if (!element || isReducedMotion()) return;

  gsap.killTweensOf(element);
  gsap.timeline()
    .to(element, { x: -4, duration: 0.05 })
    .to(element, { x: 4, duration: 0.05 })
    .to(element, { x: -3, duration: 0.05 })
    .to(element, { x: 3, duration: 0.05 })
    .to(element, { x: 0, duration: 0.05, clearProps: 'transform' });
}

/**
 * Gentle success pop
 */
export function animateSuccessFeedback(element) {
  if (!element || isReducedMotion()) return;

  gsap.killTweensOf(element);
  gsap.fromTo(
    element,
    { scale: 0.96, opacity: 0.8 },
    { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.7)', clearProps: 'all' }
  );
}

/**
 * Kill all active tweens on a node or container to prevent memory leaks
 */
export function killTweens(target) {
  if (target) {
    gsap.killTweensOf(target);
  }
}
