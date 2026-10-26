/**
 * OS Nexus : Application Bootstrap & Route Registration
 */
import { register, navigate, initRouter } from './app/router.js';
import { getState, setState } from './app/state.js';

// Module views
import { renderOverview } from './modules/dashboard/overview.js';
import { renderCPULab } from './modules/cpu/cpu-lab.js';
import { renderConcurrencyLab } from './modules/concurrency/concurrency-lab.js';
import { renderMemoryLab } from './modules/memory/memory-lab.js';
import { renderDiskLab } from './modules/disk/disk-lab.js';
import { renderResourcesLab } from './modules/resources/resources-lab.js';
import { renderFilesystem } from './modules/filesystem/filesystem-lab.js';
import { renderCatalogue } from './modules/catalogue/catalogue.js';
import { renderVivaLab } from './modules/viva/viva-lab.js';
import { renderIntegratedLab } from './modules/integrated/integrated-lab.js';
import { renderAbout } from './modules/about/about.js';

// Register all routes
register('overview', renderOverview);
register('cpu', renderCPULab);
register('concurrency', renderConcurrencyLab);
register('memory', renderMemoryLab);
register('disk', renderDiskLab);
register('resources', renderResourcesLab);
register('filesystem', renderFilesystem);
register('catalogue', renderCatalogue);
register('viva', renderVivaLab);
register('integrated', renderIntegratedLab);
register('about', renderAbout);

// Initialize Theme (Default to modern Light theme as requested)
const currentTheme = getState('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme') || 'light';
    const next = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setState('theme', next);
  });
}

// Navigation item clicks
document.querySelectorAll('a[data-route]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const route = link.dataset.route;
    if (route) {
      navigate(route);
      // Close mobile menu if open
      document.getElementById('sidebar')?.classList.remove('mobile-open');
    }
  });
});

// Sidebar search bar filtering
const navSearch = document.getElementById('nav-search');
if (navSearch) {
  navSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.nav-menu li:not(.nav-section-label)').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'block' : 'none';
    });
  });

  navSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstVisible = document.querySelector('.nav-menu li:not(.nav-section-label)[style*="display: block"] a, .nav-menu li:not(.nav-section-label):not([style*="display: none"]) a');
      if (firstVisible?.dataset.route) {
        navigate(firstVisible.dataset.route);
        navSearch.blur();
      }
    }
  });
}

// Mobile sidebar toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

if (mobileMenuBtn && sidebar) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });
}

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const expanded = !sidebar.classList.contains('collapsed');
    sidebarToggle.setAttribute('aria-expanded', String(expanded));
  });
}

// Command Palette Integration
import { initCommandPalette, openCommandPalette, toggleCommandPalette } from './shared/command-palette.js';
import { toggleAudio, isAudioMuted, playTick } from './shared/workstation-audio.js';
import { animatePageIn } from './shared/animations.js';

initCommandPalette();

document.getElementById('cmd-palette-btn')?.addEventListener('click', () => {
  openCommandPalette();
});

const audioBtn = document.getElementById('audio-toggle');
function updateAudioBtnUI() {
  if (!audioBtn) return;
  const muted = isAudioMuted();
  audioBtn.setAttribute('aria-pressed', String(!muted));
  audioBtn.title = muted ? 'Audio FX: Muted (Click to enable)' : 'Audio FX: Active (Click to mute)';
  audioBtn.innerHTML = muted
    ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 3L4 5.5H2V10.5H4L7 13V3Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 6L15 10M15 6L11 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 3L4 5.5H2V10.5H4L7 13V3Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6C10.7 6.8 11 7.4 11 8C11 8.6 10.7 9.2 10 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M12 4C13.2 5.2 14 6.5 14 8C14 9.5 13.2 10.8 12 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  audioBtn.style.color = muted ? 'var(--text-disabled)' : 'var(--accent-teal)';
}
if (audioBtn) {
  updateAudioBtnUI();
  audioBtn.addEventListener('click', () => {
    toggleAudio();
    updateAudioBtnUI();
    playTick();
  });
}

// Global Modal handlers
const modalOverlay = document.getElementById('modal-overlay');
if (modalOverlay) {
  modalOverlay.querySelector('.modal-close')?.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.add('hidden');
    }
  });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Esc to close modal
  if (e.key === 'Escape') {
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
      modalOverlay.classList.add('hidden');
    }
  }
});

// Start router
initRouter();

// Initialize GSAP page transitions and subtle 3D interactions
import { initUnicorn3D, setup3DCardTilt } from './shared/unicorn-3d.js';
import { onNavigate } from './app/router.js';

initUnicorn3D();
onNavigate((route) => {
  const container = document.getElementById('view-container');
  if (container) animatePageIn(container);
  setTimeout(setup3DCardTilt, 60);
});

