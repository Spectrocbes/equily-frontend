import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, KeyValuePipe, PercentPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { UserCurrencyPipe } from '../../shared/pipes/user-currency.pipe';
import { AnalyticsDashboardService } from '../../core/services/analytics-dashboard.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  PerformanceSummary,
  AllocationBreakdown,
  RevenueEntry,
  FeesSummary,
  PortfolioIndicators,
} from '../../core/models/analytics.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    TranslatePipe, CurrencyPipe, DecimalPipe,
    PercentPipe, KeyValuePipe, UserCurrencyPipe,
  ],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  private readonly dashboardService = inject(AnalyticsDashboardService);
  protected readonly preferencesService = inject(PreferencesService);
  private readonly translate = inject(TranslateService);

  protected readonly performance = signal<PerformanceSummary | null>(null);
  protected readonly allocationByType = signal<AllocationBreakdown[]>([]);
  protected readonly geoAllocation = signal<AllocationBreakdown[]>([]);
  protected readonly revenue = signal<RevenueEntry[]>([]);
  protected readonly fees = signal<FeesSummary | null>(null);
  protected readonly indicators = signal<PortfolioIndicators | null>(null);
  protected readonly loading = signal(true);

  // Period labels for display
  protected readonly periodLabels: Partial<Record<string, string>> = {
    ONE_MONTH: '1M',
    THREE_MONTHS: '3M',
    SIX_MONTHS: '6M',
    YTD: 'YTD',
    ONE_YEAR: '1Y',
  };

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);

    forkJoin({
      performance: this.dashboardService.getPerformance(),
      allocationType: this.dashboardService.getAllocationByType(),
      geoAllocation: this.dashboardService.getGeoAllocation(),
      revenue: this.dashboardService.getRevenue(),
      fees: this.dashboardService.getFees(),
      indicators: this.dashboardService.getIndicators(),
    }).subscribe({
      next: result => {
        this.performance.set(result.performance);
        this.allocationByType.set(result.allocationType);
        this.geoAllocation.set(result.geoAllocation);
        this.revenue.set(result.revenue);
        this.fees.set(result.fees);
        this.indicators.set(result.indicators);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected barHeight(value: number): number {
    const maxRevenue = Math.max(
      ...this.revenue().map(r => r.total), 1);
    return Math.max((value / maxRevenue) * 160, 4);
  }

  protected feeBarWidth(fees: number): number {
    const maxFees = Math.max(
      ...this.fees()!.feesByAccount.map(a => a.fees), 1);
    return Math.max((fees / maxFees) * 100, 4);
  }

  protected formatMonth(month: string): string {
    // "2024-01" → "Jan 24"
    const [year, m] = month.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(m, 10) - 1] + ' ' + year.slice(2);
  }
}
