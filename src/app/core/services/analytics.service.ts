import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChartPeriod,
  GeographicExposure,
  PortfolioHistoryPoint,
  TopPerformer,
} from '../models/account.model';
import { PreferencesService } from './preferences.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly preferencesService = inject(PreferencesService);

  getPortfolioHistory(
    period: ChartPeriod,
    accountType?: string
  ): Observable<PortfolioHistoryPoint[]> {
    const currency = this.preferencesService.currency();
    const params: Record<string, string> = { period, currency };
    if (accountType) params['accountType'] = accountType;
    return this.http.get<PortfolioHistoryPoint[]>('/api/v1/analytics/history', { params });
  }

  getAccountHistory(
    accountId: string,
    period: ChartPeriod
  ): Observable<PortfolioHistoryPoint[]> {
    const currency = this.preferencesService.currency();
    return this.http.get<PortfolioHistoryPoint[]>(
      `/api/v1/analytics/accounts/${accountId}/history`,
      { params: { period, currency } }
    );
  }

  getGeographicExposure(accountId: string): Observable<GeographicExposure[]> {
    const currency = this.preferencesService.currency();
    return this.http.get<GeographicExposure[]>(
      `/api/v1/analytics/accounts/${accountId}/geographic-exposure`,
      { params: { currency } }
    );
  }

  getTopPerformers(limit = 5): Observable<TopPerformer[]> {
    const currency = this.preferencesService.currency();
    return this.http.get<TopPerformer[]>('/api/v1/analytics/top-performers', {
      params: { currency, limit: limit.toString() },
    });
  }
}
