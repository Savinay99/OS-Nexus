/**
 * OS Nexus : Technical Workstation Interactive Engine
 * Clean, distraction-free workstation interaction without sci-fi particles or ambient node clutter.
 */

export function initUnicorn3D() {
  // Remove decorative ambient canvas if previously injected
  const oldCanvas = document.getElementById('os-3d-canvas');
  if (oldCanvas) {
    oldCanvas.remove();
  }
}

/**
 * Subtle Workstation Elevation Feedback
 * Stable, high-precision panel focus without distracting 3D tilt distortion or neon sheen.
 */
export function setup3DCardTilt() {
  const oldCanvas = document.getElementById('os-3d-canvas');
  if (oldCanvas) {
    oldCanvas.remove();
  }
  // Remove any legacy shine overlays
  document.querySelectorAll('.uiverse-shine').forEach(el => el.remove());
}
