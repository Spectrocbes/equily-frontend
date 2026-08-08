import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreferencesService } from './preferences.service';
import {
  PerformanceSummary,
  AllocationBreakdown,
  RevenueEntry,
  FeesSummary,
  PortfolioIndicators,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsDashboardService {
  private readonly http = inject(HttpClient);
  private readonly prefs = inject(PreferencesService);

  getPerformance(): Observable<PerformanceSummary> {
    return this.http.get<PerformanceSummary>(
      '/api/v1/analytics/dashboard/performance',
      { params: { currency: this.prefs.currency() } }
    );
  }

  getAllocationByType(): Observable<AllocationBreakdown[]> {
    return this.http.get<AllocationBreakdown[]>(
      '/api/v1/analytics/dashboard/allocation/account-type',
      { params: { currency: this.prefs.currency() } }
    );
  }

  getGeoAllocation(): Observable<AllocationBreakdown[]> {
    return this.http.get<AllocationBreakdown[]>(
      '/api/v1/analytics/dashboard/allocation/geographic',
      { params: { currency: this.prefs.currency() } }
    );
  }

  getRevenue(): Observable<RevenueEntry[]> {
    return this.http.get<RevenueEntry[]>(
      '/api/v1/analytics/dashboard/revenue',
      { params: { currency: this.prefs.currency() } }
    );
  }

  getFees(): Observable<FeesSummary> {
    return this.http.get<FeesSummary>(
      '/api/v1/analytics/dashboard/fees',
      { params: { currency: this.prefs.currency() } }
    );
  }

  getIndicators(): Observable<PortfolioIndicators> {
    return this.http.get<PortfolioIndicators>(
      '/api/v1/analytics/dashboard/indicators',
      { params: { currency: this.prefs.currency() } }
    );
  }
}
