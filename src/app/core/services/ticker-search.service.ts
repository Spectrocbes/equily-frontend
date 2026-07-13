import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TickerSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class TickerSearchService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<TickerSearchResult[]> {
    if (!query || query.trim().length < 1) {
      return of([]);
    }
    return this.http.get<TickerSearchResult[]>(
      '/api/v1/market-data/search',
      { params: { q: query.trim() } }
    ).pipe(
      catchError(() => of([]))
    );
  }
}
