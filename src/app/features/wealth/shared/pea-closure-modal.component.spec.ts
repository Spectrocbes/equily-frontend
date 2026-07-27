import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PeaClosureModalComponent } from './pea-closure-modal.component';
import { FinancialAccount, PeaWithdrawalSimulation } from '../../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const simBase: PeaWithdrawalSimulation = {
  liquidationValue: 12000,
  totalDeposits: 10000,
  netGain: 2000,
  gainRatio: 1,
  taxableGain: 2000,
  irTax: 256,
  psTax: 372,
  totalTax: 628,
  netAmount: 11372,
  withdrawalAmount: 12000,
  atLoss: false,
  peaOlderThan5Years: false,
};

describe('PeaClosureModalComponent', () => {
  let fixture: ComponentFixture<PeaClosureModalComponent>;

  function create(sim: PeaWithdrawalSimulation): void {
    fixture = TestBed.createComponent(PeaClosureModalComponent);
    useTestTranslations();
    fixture.componentRef.setInput('simulation', sim);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeaClosureModalComponent],
      providers: [provideHttpClient(), provideTestTranslations()],
    }).compileComponents();
  });

  it('renders simulation data correctly', () => {
    create(simBase);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PEA Closure Simulation');
    expect(text).toContain('Liquidation value');
    expect(text).toContain('Total deposits');
    expect(text).toContain('Net gain');
    expect(text).toContain('You will receive');
  });

  it('shows closure simulation title for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    expect(fixture.nativeElement.textContent).toContain('PEA Closure Simulation');
  });

  it('shows flat tax label for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('< 5 years — Flat tax 31.4% (IR + PS)');
    expect(text).toContain('Flat tax 31.4%');
  });

  it('shows closure simulation title for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    expect(fixture.nativeElement.textContent).toContain('PEA Closure Simulation');
  });

  it('shows PS only label for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('≥ 5 years — PS 18.6% only (IR exempt)');
    expect(text).toContain('PS 18.6%');
  });

  it('shows no tax message when en perte', () => {
    create({ ...simBase, atLoss: true, netGain: -500, totalTax: 0 });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No tax due — your PEA is at a loss.');
  });

  it('shows linked checking account name when provided', () => {
    create(simBase);
    const linkedAccount: FinancialAccount = {
      id: 'cash-1', name: 'Mon Compte Courant', accountType: 'CASH_ACCOUNT',
      subType: 'CASH_ACCOUNT', balance: 2000, currency: 'EUR', transactionCount: 0,
      broker: 'BNP', depositLimit: null, totalDeposits: null, remainingCapacity: null,
      openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
      linkedCheckingAccountId: null,
    };
    fixture.componentRef.setInput('linkedCheckingAccount', linkedAccount);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Destination account');
    expect(fixture.nativeElement.textContent).toContain('Mon Compte Courant');
  });

  it('hides destination account section when linked checking account is not provided', () => {
    create(simBase);
    expect(fixture.nativeElement.textContent).not.toContain('Destination account');
  });

  it('emits confirmed on confirm button click', () => {
    create(simBase);
    const spy = jest.fn();
    fixture.componentInstance.confirmed.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const confirmBtn = Array.from(buttons).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Confirm closure')
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

  it('toggles tax details accordion for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    expect(fixture.componentInstance.taxDetailsOpen()).toBe(false);
    const accordionBtn = fixture.nativeElement.querySelector('button[type="button"]');
    accordionBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.taxDetailsOpen()).toBe(true);
  });

  it('shows IR line when PEA under 5 years and tax details open', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    fixture.componentInstance.taxDetailsOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('IR (12.8%)');
  });

  it('shows IR exempt note always for PEA over 5 years without accordion', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('IR exempt ✓');
    expect(text).not.toContain('IR (12.8%)');
  });

  it('shows taxable gain in tax details when expanded for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    fixture.componentInstance.taxDetailsOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Taxable gain');
  });

  it('shows gain ratio breakdown always for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true, gainRatio: 0.5 });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tax calculation');
    expect(text).toContain('Gain ratio');
    expect(text).toContain('Taxable gain in withdrawal');
  });

  it('shows net amount subtitle for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    expect(fixture.nativeElement.textContent).toContain('PS');
  });

  it('shows Closing... when loading', () => {
    fixture = TestBed.createComponent(PeaClosureModalComponent);
    useTestTranslations();
    fixture.componentRef.setInput('simulation', simBase);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Closing...');
  });

  it('shows Confirm closure button for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    expect(fixture.nativeElement.textContent).toContain('Confirm closure');
  });

  it('shows Confirm withdrawal button for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    expect(fixture.nativeElement.textContent).toContain('Confirm withdrawal');
  });

  it('shows irreversible warning for PEA under 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: false });
    expect(fixture.nativeElement.textContent).toContain('irreversible');
  });

  it('hides irreversible warning for PEA over 5 years', () => {
    create({ ...simBase, peaOlderThan5Years: true });
    expect(fixture.nativeElement.textContent).not.toContain('irreversible');
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
