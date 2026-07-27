import { Component, OnInit, inject, input, computed, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent implements OnInit {
  label        = input<string>('Date');
  minDate      = input<string | null>(null);
  maxDate      = input<string | null>(null);
  controlName  = input.required<string>();
  parentForm   = input.required<FormGroup>();
  value        = input<string | null>(null);

  private readonly translate = inject(TranslateService);

  protected readonly today = new Date();

  protected readonly MONTHS = signal<string[]>(this.translate.instant('datePicker.months'));
  protected readonly MONTHS_SHORT = signal<string[]>(this.translate.instant('datePicker.monthsShort'));
  protected readonly DAYS = signal<string[]>(this.translate.instant('datePicker.days'));

  protected readonly isOpen       = signal(false);
  protected readonly headerMode   = signal<'calendar' | 'month' | 'year'>('calendar');
  protected readonly viewYear     = signal(new Date().getFullYear());
  protected readonly viewMonth    = signal(new Date().getMonth());
  protected readonly selectedDate = signal<Date | null>(null);

  protected readonly calendarPosition =
    signal<{ top?: number; bottom?: number; left: number } | null>(null);

  constructor() {
    effect(() => {
      const v = this.value();
      if (v === null || v === undefined) return;
      const d = new Date(v + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        const current = this.selectedDate();
        if (!current || this.toISODate(current) !== v) {
          this.selectedDate.set(d);
          this.viewYear.set(d.getFullYear());
          this.viewMonth.set(d.getMonth());
        }
      }
    }, { allowSignalWrites: true });

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.MONTHS.set(this.translate.instant('datePicker.months'));
      this.MONTHS_SHORT.set(this.translate.instant('datePicker.monthsShort'));
      this.DAYS.set(this.translate.instant('datePicker.days'));
    });
  }

  protected readonly yearRange = computed(() => {
    const years: number[] = [];
    for (let y = 1950; y <= new Date().getFullYear() + 1; y++) {
      years.push(y);
    }
    return years;
  });

  protected readonly calendarDays = computed(() => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: {
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    const now = new Date();

    // Previous month padding days — Fix 4: correct formula + add isSelected/isToday
    for (let i = startDow; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: d, day: d.getDate(),
        isCurrentMonth: false,
        isDisabled: this.isDisabled(d),
        isSelected: this.isSameDay(d, this.selectedDate()),
        isToday: this.isSameDay(d, now),
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date, day: d,
        isCurrentMonth: true,
        isDisabled: this.isDisabled(date),
        isSelected: this.isSameDay(date, this.selectedDate()),
        isToday: this.isSameDay(date, now),
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        date, day: d,
        isCurrentMonth: false,
        isDisabled: this.isDisabled(date),
        isSelected: false,
        isToday: false,
      });
    }

    return days;
  });

  protected readonly displayValue = computed(() => {
    const d = this.selectedDate();
    if (!d) return '';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  });

  public resetToDate(isoDate: string): void {
    const d = new Date(isoDate + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      this.selectedDate.set(d);
      this.viewYear.set(d.getFullYear());
      this.viewMonth.set(d.getMonth());
      this.parentForm().get(this.controlName())?.setValue(isoDate);
    }
  }

  ngOnInit(): void {
    const val = this.parentForm().get(this.controlName())?.value;
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        this.selectedDate.set(d);
        this.viewYear.set(d.getFullYear());
        this.viewMonth.set(d.getMonth());
      }
    }
  }

  protected selectDate(day: { date: Date; isDisabled: boolean }): void {
    if (day.isDisabled) return;
    this.selectedDate.set(day.date);
    const iso = this.toISODate(day.date);
    this.parentForm().get(this.controlName())?.setValue(iso);
    this.parentForm().get(this.controlName())?.markAsDirty();
    this.isOpen.set(false);
  }

  protected selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.headerMode.set('calendar');
  }

  protected selectYear(year: number): void {
    this.viewYear.set(year);
    this.headerMode.set('month');
  }

  // Fix 2: jump to the selected year after entering year mode (no animation, so it's visible immediately)
  protected switchToYearMode(): void {
    this.headerMode.set('year');
    this.scrollYearListToSelected();
  }

  protected goBackToYearMode(): void {
    this.headerMode.set('year');
    this.scrollYearListToSelected();
  }

  private scrollYearListToSelected(): void {
    // Double rAF ensures DOM is fully laid out before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = document.querySelector(
          '.year-scroll-container'
        ) as HTMLElement;
        const selected = document.getElementById(
          'year-' + this.viewYear()
        ) as HTMLElement;
        if (!container || !selected) return;

        const containerHeight = container.clientHeight;
        const itemTop        = selected.offsetTop;
        const itemHeight     = selected.clientHeight;

        // Instant scroll — no animation
        container.scrollTop =
          itemTop - (containerHeight / 2) + (itemHeight / 2);
      });
    });
  }

  protected selectToday(): void {
    const t = new Date();
    if (!this.isDisabled(t)) {
      this.selectDate({ date: t, isDisabled: false });
    }
  }

  protected prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  protected nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  // Fix 1: compute fixed position from button rect so calendar doesn't clip inside modal
  protected open(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect   = button.getBoundingClientRect();
    const calendarHeight = 380;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow >= calendarHeight) {
      this.calendarPosition.set({ top: rect.bottom + 4, left: rect.left });
    } else {
      this.calendarPosition.set({
        bottom: window.innerHeight - rect.top + 4,
        left:   rect.left,
      });
    }
    this.isOpen.set(true);
    this.headerMode.set('calendar');
  }

  protected close(): void {
    this.isOpen.set(false);
    this.headerMode.set('calendar');
  }

  private isDisabled(date: Date): boolean {
    const iso = this.toISODate(date);
    if (this.minDate() && iso < this.minDate()!) return true;
    if (this.maxDate() && iso > this.maxDate()!) return true;
    return false;
  }

  private isSameDay(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
