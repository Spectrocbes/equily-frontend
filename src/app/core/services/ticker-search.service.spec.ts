import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TickerSearchService, TickerSearchResult } from './ticker-search.service';

const mockResults: TickerSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', exchange: 'NMS', currency: 'USD' },
];

describe('TickerSearchService', () => {
  let service: TickerSearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TickerSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('search returns results for valid query', () => {
    let result: TickerSearchResult[] | undefined;
    service.search('AAPL').subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === '/api/v1/market-data/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('AAPL');
    req.flush(mockResults);

    expect(result).toEqual(mockResults);
  });

  it('search returns empty for blank query', () => {
    let result: TickerSearchResult[] | undefined;
    service.search('   ').subscribe(r => (result = r));

    httpMock.expectNone(() => true);
    expect(result).toEqual([]);
  });

  it('search returns empty on HTTP error', () => {
    let result: TickerSearchResult[] | undefined;
    service.search('AAPL').subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === '/api/v1/market-data/search');
    req.error(new ProgressEvent('error'));

    expect(result).toEqual([]);
  });
});
