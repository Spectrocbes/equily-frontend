import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DeleteAccountModalComponent } from './delete-account-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { FinancialAccount } from '../../../core/models/account.model';

const mockAccount: FinancialAccount = {
  id: 'acc-1', name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 5000, currency: 'EUR', transactionCount: 3,
  broker: 'Fortuneo', depositLimit: 150000, totalDeposits: 5000, remainingCapacity: 145000,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

describe('DeleteAccountModalComponent', () => {
  let fixture: ComponentFixture<DeleteAccountModalComponent>;
  let comp: DeleteAccountModalComponent;

  async function setup(loading = false, account: FinancialAccount = mockAccount): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountModalComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccountModalComponent);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('account', account);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  it('renders account name and broker', async () => {
    await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Mon PEA');
    expect(text).toContain('Fortuneo');
  });

  it('shows permanent deletion warning', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('permanently deleted');
  });

  it('emits confirmed when Delete account button clicked', async () => {
    await setup();
    const spy = jest.fn();
    comp.confirmed.subscribe(spy);
    const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const deleteBtn = btns.find(b => b.textContent?.trim() === 'Delete account');
    deleteBtn!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits closed when Cancel button clicked', async () => {
    await setup();
    const spy = jest.fn();
    comp.closed.subscribe(spy);
    const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const cancelBtn = btns.find(b => b.textContent?.trim() === 'Cancel');
    cancelBtn!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits closed when mousedown and mouseup both on backdrop', async () => {
    await setup();
    const spy = jest.fn();
    comp.closed.subscribe(spy);
    const fakeTarget = {};
    comp.onBackdropMouseDown({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    comp.onBackdropMouseUp({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit closed when mousedown was not on backdrop', async () => {
    await setup();
    const spy = jest.fn();
    comp.closed.subscribe(spy);
    const backdrop = {};
    const inner = {};
    comp.onBackdropMouseDown({ target: inner, currentTarget: backdrop } as unknown as MouseEvent);
    comp.onBackdropMouseUp({ target: backdrop, currentTarget: backdrop } as unknown as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows "Deleting..." when loading=true', async () => {
    await setup(true);
    expect(fixture.nativeElement.textContent).toContain('Deleting...');
  });

  it('delete button disabled when loading=true', async () => {
    await setup(true);
    const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const loadingBtn = btns.find(b => b.textContent?.includes('Deleting'));
    expect(loadingBtn!.disabled).toBe(true);
  });

  it('renders subType label when present', async () => {
    await setup(false, { ...mockAccount, subType: 'PEA' });
    expect(fixture.nativeElement.textContent).toContain('PEA');
  });
});
