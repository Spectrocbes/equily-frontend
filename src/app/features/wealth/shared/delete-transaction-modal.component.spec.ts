import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DeleteTransactionModalComponent } from './delete-transaction-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

describe('DeleteTransactionModalComponent', () => {
  let fixture: ComponentFixture<DeleteTransactionModalComponent>;
  let comp: DeleteTransactionModalComponent;

  async function setup(loading = false): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DeleteTransactionModalComponent],
      providers: [provideRouter([]), provideHttpClient(), provideTestTranslations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteTransactionModalComponent);
    useTestTranslations();
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('transactionType', 'BUY');
    fixture.componentRef.setInput('transactionDate', '2026-01-15');
    fixture.componentRef.setInput('transactionAmount', 1500);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  it('renders transaction type and title', async () => {
    await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Delete transaction');
    expect(text).toContain('Buy');
  });

  it('shows permanent deletion warning', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('permanently deleted');
  });

  it('emits confirmed when Delete button clicked', async () => {
    await setup();
    const spy = jest.fn();
    comp.confirmed.subscribe(spy);
    const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const deleteBtn = btns.find(b => b.textContent?.trim() === 'Delete');
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

  it('Delete button is disabled when loading', async () => {
    await setup(true);
    const btns: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const loadingBtn = btns.find(b => b.textContent?.includes('Deleting'));
    expect(loadingBtn!.disabled).toBe(true);
  });

  it('shows Deleting... text when loading', async () => {
    await setup(true);
    expect(fixture.nativeElement.textContent).toContain('Deleting...');
  });

  it('emits closed when mousedown and mouseup both on backdrop', async () => {
    await setup();
    const spy = jest.fn();
    comp.closed.subscribe(spy);
    const c = comp as unknown as {
      onBackdropMouseDown: (e: MouseEvent) => void;
      onBackdropMouseUp: (e: MouseEvent) => void;
    };
    const fakeTarget = {};
    c.onBackdropMouseDown({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    c.onBackdropMouseUp({ target: fakeTarget, currentTarget: fakeTarget } as unknown as MouseEvent);
    expect(spy).toHaveBeenCalled();
  });

  it('does not emit closed when mousedown was not on backdrop', async () => {
    await setup();
    const spy = jest.fn();
    comp.closed.subscribe(spy);
    const c = comp as unknown as {
      onBackdropMouseDown: (e: MouseEvent) => void;
      onBackdropMouseUp: (e: MouseEvent) => void;
    };
    const backdrop = {};
    const inner = {};
    c.onBackdropMouseDown({ target: inner, currentTarget: backdrop } as unknown as MouseEvent);
    c.onBackdropMouseUp({ target: backdrop, currentTarget: backdrop } as unknown as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });
});
