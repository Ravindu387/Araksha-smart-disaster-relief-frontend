import { Component, Input } from '@angular/core';

/**
 * Tiny dependency-free icon set (24x24, stroke-based) so the rest of the app
 * doesn't need an icon package. Usage: <app-icon name="grid" class="w-5 h-5" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="block"
    >
      @switch (name) {
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        }
        @case ('alert') {
          <path d="M12 3.5 21 19.5H3z" />
          <path d="M12 9.5v4.5" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
          <path d="M16 8.2c1.4.3 2.5 1.5 2.5 2.8" />
          <path d="M14.8 14.6c2 .3 4.7 1.7 4.7 4.9" />
        }
        @case ('pin') {
          <path d="M12 21s7-6.1 7-11.4A7 7 0 0 0 5 9.6C5 14.9 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.3" />
        }
        @case ('box') {
          <path d="M3.5 8 12 3.5 20.5 8 12 12.5 3.5 8Z" />
          <path d="M3.5 8v8.5L12 21l8.5-4.5V8" />
          <path d="M12 12.5V21" />
        }
        @case ('truck') {
          <rect x="2.5" y="7" width="11" height="9" rx="1" />
          <path d="M13.5 10.5h3.6L20 13.4V16h-6.5" />
          <circle cx="6.2" cy="17.3" r="1.6" />
          <circle cx="15.8" cy="17.3" r="1.6" />
        }
        @case ('map') {
          <path d="M9 4.5 4 6.3v13.2l5-1.8 6 1.8 5-1.8V4.5l-5 1.8-6-1.8Z" />
          <path d="M9 4.5v13.2M15 6.3v13.2" />
        }
        @case ('bell') {
          <path d="M6 10.5a6 6 0 0 1 12 0c0 3 1 4.5 1.6 5.3H4.4C5 15 6 13.5 6 10.5Z" />
          <path d="M9.7 18.8a2.3 2.3 0 0 0 4.6 0" />
        }
        @case ('chart') {
          <path d="M4 20V10M11 20V4M18 20v-7" />
          <path d="M3 20h18" />
        }
        @case ('shield') {
          <path d="M12 3.5 19 6v6c0 4.5-3.1 7.6-7 8.5-3.9-.9-7-4-7-8.5V6Z" />
          <path d="M9 12.2l2.1 2.1L15.3 10" />
        }
        @case ('radio') {
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <path d="M8.8 15.2a4.5 4.5 0 0 1 0-6.4M15.2 8.8a4.5 4.5 0 0 1 0 6.4" />
          <path d="M5.8 18.2a8.7 8.7 0 0 1 0-12.4M18.2 5.8a8.7 8.7 0 0 1 0 12.4" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.3-4.3" />
        }
        @case ('chevron-down') {
          <path d="M5.5 8.5 12 15l6.5-6.5" />
        }
        @case ('trend-up') {
          <path d="M4 16.5 10 10l4 4 6.5-7" />
          <path d="M14.5 7h6v6" />
        }
        @case ('trend-down') {
          <path d="M4 8 10 14.5l4-4 6.5 7" />
          <path d="M14.5 17.5h6v-6" />
        }
        @case ('eye') {
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        }
        @case ('arrow-right') {
          <path d="M4.5 12h15" />
          <path d="M13.5 6l6 6-6 6" />
        }
        @case ('activity') {
          <path d="M3 12h3.5l2.3-6.5L13 18l2.3-6h5.7" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 3.5v2.1M12 18.4v2.1M5.4 6.6l1.5 1.5M17.1 15.9l1.5 1.5M3.5 12h2.1M18.4 12h2.1M5.4 17.4l1.5-1.5M17.1 8.1l1.5-1.5"
          />
        }
      }
    </svg>
  `,
})
export class Icon {
  @Input() name = '';
}
