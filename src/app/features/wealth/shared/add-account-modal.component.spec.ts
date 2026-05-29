import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AddAccountModalComponent } from './add-account-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

describe('AddAccountModalComponent', () => {
  let fixture: ComponentFixture<AddAccountModalComponent>;
  let mockAccountService: Partial<AccountService>;
  let modalLoadingSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    modalLoadingSignal = signal(false);
    mockAccountService = {
      modalLoading: modalLoadingSignal,
      modalError: signal<string | null>(null),
      createAccount: jest.fn().mockReturnValue(of({ id: 'new-id' })),
    };

    await TestBed.configureTestingModule({
      imports: [AddAccountModalComponent],
      providers: [{ provide: AccountService, useValue: mockAccountService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAccountModalComponent);
    fixture.detectChanges();
  });

  it('renders the form', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('submit button is disabled while modalLoading is true on step 2', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo' });
    fixture.componentInstance['step'].set(2);
    modalLoadingSignal.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
  });

  it('emits closed when cancel is clicked', () => {
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    // Step 1 buttons: [X (type=button), Cancel (type=button), Next (type=button)]
    const cancelBtn = fixture.nativeElement.querySelectorAll('button[type="button"]')[1];
    cancelBtn.click();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('calls createAccount and emits created on valid submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);

    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo' });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
  });
});
