import { Component, OnInit, input, computed, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent implements OnInit {
  label        = input<string>('Date');
  minDate      = input<string | null>(null);
  maxDate      = input<string | null>(null);
  controlName  = input.required<string>();
  parentForm   = input.required<FormGroup>();

  protected readonly today = new Date();

  protected readonly isOpen        = signal(false);
  protected readonly viewYear      = signal(new Date().getFullYear());
  protected readonly viewMonth     = signal(new Date().getMonth());
  protected readonly selectedDate  = signal<Date | null>(null);

  protected readonly MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  protected readonly DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d, day: d.getDate(),
        isCurrentMonth: false,
        isDisabled: this.isDisabled(d),
        isSelected: false,
        isToday: false,
      });
    }

    const today = new Date();
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date, day: d,
        isCurrentMonth: true,
        isDisabled: this.isDisabled(date),
        isSelected: this.isSameDay(date, this.selectedDate()),
        isToday: this.isSameDay(date, today),
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

  protected close(): void { this.isOpen.set(false); }
  protected open():  void { this.isOpen.set(true);  }

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
