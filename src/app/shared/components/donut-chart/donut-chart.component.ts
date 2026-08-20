import { Component, input, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, TranslatePipe],
  templateUrl: './donut-chart.component.html',
})
export class DonutChartComponent {
  data  = input.required<DonutSlice[]>();
  total = input.required<number>();
  size  = input<number>(160);

  protected readonly hoveredIndex = signal<number | null>(null);

  protected readonly slices = computed(() => {
    const r = 54;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    return this.data().map(slice => {
      const pct  = this.total() > 0 ? slice.value / this.total() : 0;
      const dash = pct * circumference;
      const gap  = circumference - dash;

      const strokeDasharray  = `${dash} ${gap}`;
      const strokeDashoffset = circumference * (1 - offset);
      offset += pct;

      return { ...slice, strokeDasharray, strokeDashoffset, pct };
    });
  });

  protected readonly hoveredSlice = computed(() => {
    const i = this.hoveredIndex();
    return i === null ? null : this.slices()[i] ?? null;
  });
}
