import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EvolutionChartComponent } from './evolution-chart.component';
import { PortfolioHistoryPoint, ChartPeriod } from '../../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const twoPoints: PortfolioHistoryPoint[] = [
  { date: '2026-01-01', value: 10000, invested: 9000, pnl: 1000 },
  { date: '2026-02-01', value: 11000, invested: 9000, pnl: 2000 },
];

const negativePoints: PortfolioHistoryPoint[] = [
  { date: '2026-01-01', value: 11000, invested: 9000, pnl: 2000 },
  { date: '2026-02-01', value: 10000, invested: 9000, pnl: 1000 },
];

describe('EvolutionChartComponent', () => {
  let fixture: ComponentFixture<EvolutionChartComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvolutionChartComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    const prefReqs = httpMock.match('/api/v1/preferences');
    prefReqs.forEach(r => r.flush({
      currency: 'EUR', locale: 'fr',
      supportedCurrencies: ['EUR'], eurToTargetRate: 1,
    }));

    fixture = TestBed.createComponent(EvolutionChartComponent);
    useTestTranslations();
  });

  afterEach(() => httpMock.verify());

  it('renders loading spinner when loading=true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('points', []);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('renders "Not enough data" message when points has fewer than 2 items', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', [twoPoints[0]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Not enough data');
  });

  it('renders SVG when points has 2 or more items (D3 creates svg element)', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();
    jest.runAllTimers();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    jest.useRealTimers();
  });

  it('selectPeriod emits periodChanged and resets hoveredPoint', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();

    // Simulate a hovered state
    fixture.componentInstance['hoveredPoint'].set(twoPoints[0]);

    const emitted: ChartPeriod[] = [];
    fixture.componentInstance.periodChanged.subscribe((p: ChartPeriod) => emitted.push(p));

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[type="button"]');
    const ytdBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'YTD');
    ytdBtn?.click();
    fixture.detectChanges();

    expect(emitted).toContain('YTD');
    expect(fixture.componentInstance['selectedPeriod']()).toBe('YTD');
    expect(fixture.componentInstance['hoveredPoint']()).toBeNull();
  });

  it('isPositive is true when last value >= first value', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();
    expect(fixture.componentInstance['isPositive']()).toBe(true);
  });

  it('isPositive is false when last value < first value', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', negativePoints);
    fixture.detectChanges();
    expect(fixture.componentInstance['isPositive']()).toBe(false);
  });

  it('latestValue returns last point value', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();
    expect(fixture.componentInstance['latestValue']()).toBe(11000);
  });

  it('changeValue returns difference between last and first value', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();
    expect(fixture.componentInstance['changeValue']()).toBe(1000);
  });

  it('changePct returns percentage change', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.detectChanges();
    expect(fixture.componentInstance['changePct']()).toBeCloseTo(10, 5);
  });

  it('currentValue input overrides last point value in effectivePoints', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.componentRef.setInput('currentValue', 15000);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      effectivePoints: () => PortfolioHistoryPoint[];
    };
    const pts = comp.effectivePoints();
    expect(pts[pts.length - 1].value).toBe(15000);
    expect(pts[0].value).toBe(10000);
  });

  it('effectivePoints returns original points when currentValue is null', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.componentRef.setInput('currentValue', null);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      effectivePoints: () => PortfolioHistoryPoint[];
    };
    const pts = comp.effectivePoints();
    expect(pts[pts.length - 1].value).toBe(11000);
  });

  it('latestValue reflects currentValue override', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('points', twoPoints);
    fixture.componentRef.setInput('currentValue', 12500);
    fixture.detectChanges();
    expect(fixture.componentInstance['latestValue']()).toBe(12500);
  });
});
