import { Component, OnInit, input, inject, signal, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TickerSearchService, TickerSearchResult } from '../../../core/services/ticker-search.service';

@Component({
  selector: 'app-ticker-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ticker-autocomplete.component.html',
})
export class TickerAutocompleteComponent implements OnInit {
  label = input<string>('Ticker');
  placeholder = input<string>('Search (e.g. AAPL, Bitcoin...)');
  controlName = input.required<string>();
  parentForm = input.required<FormGroup>();

  protected readonly searchControl = new FormControl('');
  protected readonly results = signal<TickerSearchResult[]>([]);
  protected readonly isOpen = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly selectedTicker = signal<TickerSearchResult | null>(null);
  protected readonly dropdownPosition =
    signal<{ top: number; left: number; width: number } | null>(null);
  protected readonly highlightedIndex = signal(-1);

  @ViewChild('inputEl') private readonly inputElRef?: ElementRef<HTMLInputElement>;

  private readonly tickerSearch = inject(TickerSearchService);
  private readonly destroyRef = inject(DestroyRef);

  protected openDropdown(inputEl: HTMLElement): void {
    const rect = inputEl.getBoundingClientRect();
    this.dropdownPosition.set({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
    });
    if (this.results().length > 0) {
      this.isOpen.set(true);
    }
  }

  ngOnInit(): void {
    const existing = this.parentForm().get(this.controlName())?.value;
    if (existing) {
      this.searchControl.setValue(existing, { emitEvent: false });
    }

    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 1) {
          this.results.set([]);
          this.isLoading.set(false);
          return of([]);
        }
        this.isLoading.set(true);
        return this.tickerSearch.search(query).pipe(
          catchError(() => {
            this.isLoading.set(false);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.results.set(results);
      this.highlightedIndex.set(-1);
      this.isLoading.set(false);
      if (results.length > 0) {
        const inputEl = this.inputElRef?.nativeElement;
        if (inputEl) {
          this.openDropdown(inputEl);
        } else {
          this.isOpen.set(true);
        }
      }
    });
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const results = this.results();
    if (!this.isOpen() || results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => Math.min(i + 1, results.length - 1));
        this.scrollHighlightedIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => Math.max(i - 1, 0));
        this.scrollHighlightedIntoView();
        break;
      case 'Enter': {
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < results.length) {
          this.selectTicker(results[idx]);
        }
        break;
      }
      case 'Escape':
        this.close();
        break;
    }
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      const el = document.getElementById('ticker-option-' + this.highlightedIndex());
      el?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }, 0);
  }

  protected selectTicker(ticker: TickerSearchResult): void {
    this.selectedTicker.set(ticker);
    this.searchControl.setValue(ticker.symbol, { emitEvent: false });
    this.parentForm().get(this.controlName())?.setValue(ticker.symbol);
    this.isOpen.set(false);
    this.results.set([]);
  }

  protected clearSelection(): void {
    this.selectedTicker.set(null);
    this.searchControl.setValue('');
    this.parentForm().get(this.controlName())?.setValue('');
    this.isOpen.set(false);
  }

  protected close(): void {
    this.isOpen.set(false);
  }
}
