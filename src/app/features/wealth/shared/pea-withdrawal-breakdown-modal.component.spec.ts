import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PeaWithdrawalBreakdownModalComponent } from './pea-withdrawal-breakdown-modal.component';
import { PeaWithdrawalSimulation } from '../../../core/models/account.model';

const simBase: PeaWithdrawalSimulation = {
  liquidationValue: 15000,
  totalDeposits: 10000,
  netGain: 5000,
  gainRatio: 0.5,
  taxableGain: 2500,
  irTax: 0,
  psTax: 465,
  totalTax: 465,
  netAmount: 9535,
  withdrawalAmount: 10000,
  atLoss: false,
  peaOlderThan5Years: true,
};

describe('PeaWithdrawalBreakdownModalComponent', () => {
  let fixture: ComponentFixture<PeaWithdrawalBreakdownModalComponent>;

  function create(sim: PeaWithdrawalSimulation): void {
    fixture = TestBed.createComponent(PeaWithdrawalBreakdownModalComponent);
    fixture.componentRef.setInput('simulation', sim);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeaWithdrawalBreakdownModalComponent],
    }).compileComponents();
  });

  it('renders withdrawal amount and net amount', () => {
    create(simBase);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Withdrawal amount');
    expect(text).toContain('You will receive');
  });

  it('shows gain ratio and taxable gain', () => {
    create(simBase);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Gain ratio');
    expect(text).toContain('Taxable gain');
  });

  it('shows no tax message when atLoss', () => {
    create({ ...simBase, atLoss: true, netGain: -500, totalTax: 0, psTax: 0 });
    expect(fixture.nativeElement.textContent).toContain('No tax due — your PEA is at a loss.');
  });

  it('emits confirmed on confirm button click', () => {
    create(simBase);
    const spy = jest.fn();
    fixture.componentInstance.confirmed.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const confirmBtn = Array.from(buttons).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Confirm withdrawal')
    ) as HTMLButtonElement;
    confirmBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits closed on cancel button click', () => {
    create(simBase);
    const spy = jest.fn();
    fixture.componentInstance.closed.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const cancelBtn = Array.from(buttons).find((b) =>
      (b as HTMLButtonElement).textContent?.trim() === 'Cancel'
    ) as HTMLButtonElement;
    cancelBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('shows PS tax and IR exempt note', () => {
    create(simBase);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PS (18.6%)');
    expect(text).toContain('IR exempt ✓');
  });

  it('shows Processing... when loading', () => {
    fixture = TestBed.createComponent(PeaWithdrawalBreakdownModalComponent);
    fixture.componentRef.setInput('simulation', simBase);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Processing...');
  });

  it('emits closed when mousedown and mouseup both on backdrop', () => {
    create(simBase);
    const spy = jest.fn();
    fixture.componentInstance.closed.subscribe(spy);
    const comp = fixture.componentInstance as unknown as {
      onBackdropMouseDown: (e: MouseEvent) => void;
      onBackdropMouseUp: (e: MouseEvent) => void;
    };
    const fakeTarget = {};
    comp.onBackdropMouseDown({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    comp.onBackdropMouseUp({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit closed when mousedown was not on backdrop', () => {
    create(simBase);
    const spy = jest.fn();
    fixture.componentInstance.closed.subscribe(spy);
    const comp = fixture.componentInstance as unknown as {
      onBackdropMouseDown: (e: MouseEvent) => void;
      onBackdropMouseUp: (e: MouseEvent) => void;
    };
    const backdrop = {};
    const inner = {};
    comp.onBackdropMouseDown({ target: inner, currentTarget: backdrop } as unknown as MouseEvent);
    comp.onBackdropMouseUp({ target: backdrop, currentTarget: backdrop } as unknown as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });
});
