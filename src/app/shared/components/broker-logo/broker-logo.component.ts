import { Component, input, computed, signal, effect } from '@angular/core';
import { getBrokerLogoPath, getBrokerInitials } from '../../../core/constants/broker-logos';

/**
 * Broker logo in a round frame, falling back to the broker's initials.
 *
 * Purely decorative: the broker name is rendered next to it at every call site,
 * so this is hidden from screen readers instead of repeating that name.
 */
@Component({
  selector: 'app-broker-logo',
  standalone: true,
  templateUrl: './broker-logo.component.html',
})
export class BrokerLogoComponent {
  readonly broker = input.required<string>();
  readonly size   = input<number>(32);

  /** Set when the file 404s or is unreadable, so a bad asset degrades to initials. */
  protected readonly failed = signal(false);

  protected readonly logoPath = computed(() => getBrokerLogoPath(this.broker()));
  protected readonly initials = computed(() => getBrokerInitials(this.broker()));
  protected readonly showLogo = computed(() => !!this.logoPath() && !this.failed());

  constructor() {
    // A recycled row (@for reusing a DOM node for a different broker) must retry
    // the new logo instead of inheriting the previous one's failure.
    effect(() => {
      this.broker();
      this.failed.set(false);
    }, { allowSignalWrites: true });
  }
}
