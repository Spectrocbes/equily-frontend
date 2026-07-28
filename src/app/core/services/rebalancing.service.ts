import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreferencesService } from './preferences.service';
import { TargetAllocation, RebalancingSuggestion } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class RebalancingService {
  private readonly http = inject(HttpClient);
  private readonly preferencesService = inject(PreferencesService);

  getAllocations(accountId: string): Observable<TargetAllocation[]> {
    return this.http.get<TargetAllocation[]>(
      `/api/v1/rebalancing/accounts/${accountId}/allocations`
    );
  }

  saveAllocations(accountId: string, allocations: TargetAllocation[]): Observable<void> {
    return this.http.put<void>(
      `/api/v1/rebalancing/accounts/${accountId}/allocations`,
      { allocations }
    );
  }

  saveDcaAmount(accountId: string, amount: number): Observable<void> {
    return this.http.put<void>(
      `/api/v1/accounts/${accountId}/dca-amount`,
      { amount }
    );
  }

  getSuggestions(accountId: string, dcaAmount: number): Observable<RebalancingSuggestion[]> {
    const currency = this.preferencesService.currency();
    return this.http.get<RebalancingSuggestion[]>(
      `/api/v1/rebalancing/accounts/${accountId}/suggestions`,
      { params: { dcaAmount: dcaAmount.toString(), currency } }
    );
  }
}
