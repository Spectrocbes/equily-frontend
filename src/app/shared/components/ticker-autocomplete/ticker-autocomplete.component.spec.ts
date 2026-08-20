import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { TickerAutocompleteComponent } from './ticker-autocomplete.component';
import { TickerSearchService, TickerSearchResult } from '../../../core/services/ticker-search.service';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const mockResults: TickerSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', exchange: 'NMS', currency: 'USD' },
];

const mockMultiResults: TickerSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', exchange: 'NMS', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', exchange: 'NMS', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', exchange: 'NMS', currency: 'USD' },
];

function keyEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true });
}

describe('TickerAutocompleteComponent', () => {
  let fixture: ComponentFixture<TickerAutocompleteComponent>;
  let mockTickerSearch: { search: jest.Mock };
  let form: ReturnType<FormBuilder['group']>;

  beforeEach(async () => {
    mockTickerSearch = { search: jest.fn().mockReturnValue(of(mockResults)) };
    form = new FormBuilder().group({ ticker: [''] });

    await TestBed.configureTestingModule({
      imports: [TickerAutocompleteComponent],
      providers: [
        { provide: TickerSearchService, useValue: mockTickerSearch },
        provideTestTranslations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TickerAutocompleteComponent);
    useTestTranslations();
    fixture.componentRef.setInput('controlName', 'ticker');
    fixture.componentRef.setInput('parentForm', form);
    fixture.detectChanges();
  });

  it('renders search input when no ticker selected', () => {
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Change');
  });

  it('renders selected pill when ticker is selected', () => {
    fixture.componentInstance['selectTicker'](mockResults[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('AAPL');
    expect(fixture.nativeElement.textContent).toContain('Apple Inc.');
  });

  it('clearSelection resets form control', () => {
    fixture.componentInstance['selectTicker'](mockResults[0]);
    fixture.detectChanges();
    fixture.componentInstance['clearSelection']();
    fixture.detectChanges();
    expect(form.get('ticker')?.value).toBe('');
    expect(fixture.componentInstance['selectedTicker']()).toBeNull();
  });

  it('selectTicker sets form control value', () => {
    fixture.componentInstance['selectTicker'](mockResults[0]);
    expect(form.get('ticker')?.value).toBe('AAPL');
  });

  it('shows loading spinner while searching', () => {
    fixture.componentInstance['isLoading'].set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.animate-spin')).toBeTruthy();
  });

  it('closes dropdown on backdrop click', () => {
    fixture.componentInstance['results'].set(mockResults);
    fixture.componentInstance['isOpen'].set(true);
    fixture.detectChanges();

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  // ── keyboard navigation ─────────────────────────────────────────────────────

  it('onKeyDown does nothing when dropdown is closed', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(false);
    fixture.componentInstance['onKeyDown'](keyEvent('ArrowDown'));
    expect(fixture.componentInstance['highlightedIndex']()).toBe(-1);
  });

  it('ArrowDown moves highlightedIndex forward and clamps at the last result', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);

    fixture.componentInstance['onKeyDown'](keyEvent('ArrowDown'));
    expect(fixture.componentInstance['highlightedIndex']()).toBe(0);

    fixture.componentInstance['onKeyDown'](keyEvent('ArrowDown'));
    fixture.componentInstance['onKeyDown'](keyEvent('ArrowDown'));
    fixture.componentInstance['onKeyDown'](keyEvent('ArrowDown'));
    expect(fixture.componentInstance['highlightedIndex']()).toBe(2);
  });

  it('ArrowUp moves highlightedIndex backward and clamps at 0', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);
    fixture.componentInstance['highlightedIndex'].set(2);

    fixture.componentInstance['onKeyDown'](keyEvent('ArrowUp'));
    expect(fixture.componentInstance['highlightedIndex']()).toBe(1);

    fixture.componentInstance['onKeyDown'](keyEvent('ArrowUp'));
    fixture.componentInstance['onKeyDown'](keyEvent('ArrowUp'));
    expect(fixture.componentInstance['highlightedIndex']()).toBe(0);
  });

  it('Enter selects the highlighted result', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);
    fixture.componentInstance['highlightedIndex'].set(1);

    fixture.componentInstance['onKeyDown'](keyEvent('Enter'));

    expect(form.get('ticker')?.value).toBe('MSFT');
    expect(fixture.componentInstance['selectedTicker']()?.symbol).toBe('MSFT');
  });

  it('Enter does nothing when no result is highlighted', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);

    fixture.componentInstance['onKeyDown'](keyEvent('Enter'));

    expect(fixture.componentInstance['selectedTicker']()).toBeNull();
  });

  it('Escape closes the dropdown', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);

    fixture.componentInstance['onKeyDown'](keyEvent('Escape'));

    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('highlightedIndex resets to -1 whenever new results arrive', fakeAsync(() => {
    fixture.componentInstance['highlightedIndex'].set(2);

    fixture.componentInstance['searchControl'].setValue('MSFT');
    tick(300);

    expect(fixture.componentInstance['highlightedIndex']()).toBe(-1);
  }));

  it('highlighted result button gets the highlight class', () => {
    fixture.componentInstance['results'].set(mockMultiResults);
    fixture.componentInstance['isOpen'].set(true);
    fixture.componentInstance['highlightedIndex'].set(1);
    fixture.detectChanges();

    const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('#ticker-option-1'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].className).toContain('bg-accent/10');
  });
});
