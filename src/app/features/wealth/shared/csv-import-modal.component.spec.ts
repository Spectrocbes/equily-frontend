import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CsvImportModalComponent } from './csv-import-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { of, throwError } from 'rxjs';
import { CsvImportResponse } from '../../../core/models/account.model';

const mockResult: CsvImportResponse = {
  imported: 2, skipped: 1, errors: 0, errorDetails: []
};

describe('CsvImportModalComponent', () => {
  let fixture: ComponentFixture<CsvImportModalComponent>;
  let mockService: Partial<AccountService>;
  let mockToast: { error: jest.Mock };

  beforeEach(async () => {
    mockService = {
      importCsv: jest.fn().mockReturnValue(of(mockResult)),
    };
    mockToast = { error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [CsvImportModalComponent],
      providers: [
        { provide: AccountService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CsvImportModalComponent);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.detectChanges();
  });

  it('renders select step by default', () => {
    expect(fixture.componentInstance.step()).toBe('select');
  });

  it('import button is disabled when no file selected', () => {
    expect(fixture.componentInstance.canImport()).toBe(false);
  });

  it('emits closed when cancel clicked', () => {
    const spy = jest.fn();
    fixture.componentInstance.closed.subscribe(spy);
    // button order: [0] X-close, [1] broker, [2] mode-ops, [3] mode-pos, [4] Cancel, [5] Import
    const cancelBtn = fixture.nativeElement
      .querySelectorAll('button[type="button"]')[4];
    cancelBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('shows result step after successful import', () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    fixture.componentInstance['selectedFile'].set(file);
    fixture.componentInstance.doImport();
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe('result');
    expect(fixture.componentInstance['result']()).toEqual(mockResult);
  });

  it('shows error toast when import fails', () => {
    (mockService.importCsv as jest.Mock).mockReturnValue(
      throwError(() => ({ message: 'Server error' }))
    );
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    fixture.componentInstance['selectedFile'].set(file);
    fixture.componentInstance.doImport();
    fixture.detectChanges();
    expect(mockToast.error).toHaveBeenCalled();
    expect(fixture.componentInstance.step()).toBe('select');
  });

  it('emits imported event on success', () => {
    const spy = jest.fn();
    fixture.componentInstance.imported.subscribe(spy);
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    fixture.componentInstance['selectedFile'].set(file);
    fixture.componentInstance.doImport();
    expect(spy).toHaveBeenCalledWith(mockResult);
  });
});
