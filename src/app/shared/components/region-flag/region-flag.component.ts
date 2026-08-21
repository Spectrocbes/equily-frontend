import { Component, input, computed, signal } from '@angular/core';
import { flagPathForRegion, isCryptoRegion } from '../../../core/constants/country-flags';

/**
 * Circular flag for a geographic region.
 *
 * Purely decorative: every call site renders the region name next to it, so the
 * flag is hidden from screen readers rather than repeating that name.
 */
@Component({
  selector: 'app-region-flag',
  standalone: true,
  templateUrl: './region-flag.component.html',
})
export class RegionFlagComponent {
  readonly region = input.required<string>();
  readonly size   = input<number>(18);

  /** Set when the SVG fails to load, so a missing file degrades to the neutral mark. */
  protected readonly failed = signal(false);

  protected readonly isCrypto = computed(() => isCryptoRegion(this.region()));
  protected readonly flagPath = computed(() => flagPathForRegion(this.region()));
  protected readonly showFlag = computed(() => !this.isCrypto() && !!this.flagPath() && !this.failed());
}
