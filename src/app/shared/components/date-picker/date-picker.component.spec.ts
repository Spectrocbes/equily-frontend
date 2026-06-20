import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    form = new FormGroup({ date: new FormControl('') });
    fixture.componentRef.setInput('controlName', 'date');
    fixture.componentRef.setInput('parentForm', form);
  });

  it('renders trigger button with placeholder when no date', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Select a date');
  });

  it('renders selected date in fr-FR format', () => {
    form.get('date')!.setValue('2026-03-15');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('15/03/2026');
  });

  it('opens calendar on button click', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="button"]');
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(true);
  });

  it('closes calendar on backdrop click', () => {
    fixture.detectChanges();
    fixture.componentInstance['isOpen'].set(true);
    fixture.detectChanges();
    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.fixed.inset-0.z-40');
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('prevMonth navigates backward and wraps from January to December', () => {
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2026);
    fixture.componentInstance['viewMonth'].set(0);
    fixture.componentInstance['prevMonth']();
    expect(fixture.componentInstance['viewMonth']()).toBe(11);
    expect(fixture.componentInstance['viewYear']()).toBe(2025);
  });

  it('nextMonth navigates forward and wraps from December to January', () => {
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2025);
    fixture.componentInstance['viewMonth'].set(11);
    fixture.componentInstance['nextMonth']();
    expect(fixture.componentInstance['viewMonth']()).toBe(0);
    expect(fixture.componentInstance['viewYear']()).toBe(2026);
  });

  it('selectDate updates form control value and marks dirty', () => {
    fixture.detectChanges();
    const date = new Date(Date.UTC(2026, 5, 15)); // June 15, 2026 UTC
    fixture.componentInstance['selectDate']({ date, isDisabled: false });
    expect(form.get('date')!.value).toBe('2026-06-15');
    expect(form.get('date')!.dirty).toBe(true);
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('disabled dates cannot be selected', () => {
    fixture.detectChanges();
    const initialValue = form.get('date')!.value;
    const date = new Date(Date.UTC(2026, 5, 15));
    fixture.componentInstance['selectDate']({ date, isDisabled: true });
    expect(form.get('date')!.value).toBe(initialValue);
  });

  it('minDate disables dates before it and not the minDate itself', () => {
    fixture.componentRef.setInput('minDate', '2026-06-15');
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2026);
    fixture.componentInstance['viewMonth'].set(5); // June
    const days = fixture.componentInstance['calendarDays']();
    const june14 = days.find(d => d.isCurrentMonth && d.day === 14);
    const june15 = days.find(d => d.isCurrentMonth && d.day === 15);
    expect(june14!.isDisabled).toBe(true);
    expect(june15!.isDisabled).toBe(false);
  });

  it('calendarDays handles Sunday-starting month (startDow wraps to 6, fills 6 prev-month days)', () => {
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2026);
    fixture.componentInstance['viewMonth'].set(1); // Feb 2026 starts on Sunday (getDay()=0 → startDow=-1 → 6)
    const days = fixture.componentInstance['calendarDays']();
    expect(days.length).toBe(42);
    const prevMonthPadding = days.filter((d, i) => i < 6 && !d.isCurrentMonth);
    expect(prevMonthPadding.length).toBe(6);
  });

  it('prevMonth decrements without wrapping for non-January months', () => {
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2026);
    fixture.componentInstance['viewMonth'].set(5); // June
    fixture.componentInstance['prevMonth']();
    expect(fixture.componentInstance['viewMonth']()).toBe(4); // May
    expect(fixture.componentInstance['viewYear']()).toBe(2026);
  });

  it('nextMonth increments without wrapping for non-December months', () => {
    fixture.detectChanges();
    fixture.componentInstance['viewYear'].set(2026);
    fixture.componentInstance['viewMonth'].set(5); // June
    fixture.componentInstance['nextMonth']();
    expect(fixture.componentInstance['viewMonth']()).toBe(6); // July
    expect(fixture.componentInstance['viewYear']()).toBe(2026);
  });

  it('Today button selects today', () => {
    fixture.detectChanges();
    fixture.componentInstance['isOpen'].set(true);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button[type="button"]') as NodeListOf<HTMLButtonElement>
    );
    const todayBtn = buttons.find(b => b.textContent?.trim() === 'Today');
    expect(todayBtn).toBeTruthy();
    todayBtn!.click();
    fixture.detectChanges();
    const t = new Date();
    const todayLocal = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    expect(form.get('date')!.value).toBe(todayLocal);
  });
});
