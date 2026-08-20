import { TestBed } from '@angular/core/testing';
import { DonutChartComponent, DonutSlice } from './donut-chart.component';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const data: DonutSlice[] = [
  { label: 'Investments', value: 60, color: '#0E5C56' },
  { label: 'Crypto', value: 40, color: '#8A6D3B' },
];

describe('DonutChartComponent', () => {
  function createComponent() {
    const fixture = TestBed.createComponent(DonutChartComponent);
    useTestTranslations();
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('total', 100);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent],
      providers: [provideTestTranslations()],
    }).compileComponents();
  });

  it('computes stroke-dasharray/offset proportional to each slice weight', () => {
    const fixture = createComponent();
    const slices = fixture.componentInstance['slices']();
    expect(slices[0].pct).toBeCloseTo(0.6, 5);
    expect(slices[1].pct).toBeCloseTo(0.4, 5);
  });

  it('hoveredSlice is null by default', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance['hoveredSlice']()).toBeNull();
  });

  it('hovering a circle sets hoveredSlice to that slice', () => {
    const fixture = createComponent();
    const circles = fixture.nativeElement.querySelectorAll('circle');
    circles[1].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.componentInstance['hoveredSlice']()?.label).toBe('Crypto');
  });

  it('leaving a circle clears hoveredSlice', () => {
    const fixture = createComponent();
    const circles = fixture.nativeElement.querySelectorAll('circle');
    circles[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    circles[0].dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(fixture.componentInstance['hoveredSlice']()).toBeNull();
  });

  it('renders the total in the center by default', () => {
    const fixture = createComponent();
    expect(fixture.nativeElement.textContent).toContain('€100');
  });

  it('renders the hovered slice label and value in the center on hover', () => {
    const fixture = createComponent();
    const circles = fixture.nativeElement.querySelectorAll('circle');
    circles[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Investments');
    expect(fixture.nativeElement.textContent).toContain('60.0%');
  });
});
