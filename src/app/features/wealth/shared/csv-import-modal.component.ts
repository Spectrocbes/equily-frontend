import { Component, input, output, inject, signal, computed } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import {
  CsvBroker, CsvMode, CsvImportResponse
} from '../../../core/models/account.model';

@Component({
  selector: 'app-csv-import-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './csv-import-modal.component.html',
})
export class CsvImportModalComponent {
  accountId = input.required<string>();
  closed    = output<void>();
  imported  = output<CsvImportResponse>();

  private readonly accountService = inject(AccountService);
  private readonly toastService   = inject(ToastService);
  private readonly translate      = inject(TranslateService);

  protected readonly step =
    signal<'select' | 'result'>('select');
  protected readonly selectedBroker = signal<CsvBroker>('BOURSOBANK');
  protected readonly selectedMode   = signal<CsvMode>('OPERATIONS');
  protected readonly selectedFile   = signal<File | null>(null);
  protected readonly loading        = signal(false);
  protected readonly error          = signal<string | null>(null);
  protected readonly result         = signal<CsvImportResponse | null>(null);

  protected readonly displayedImported = computed(() => {
    const result = this.result();
    if (!result) return 0;
    if (this.selectedMode() === 'POSITIONS' && result.imported > 0) {
      return result.imported - 1;
    }
    return result.imported;
  });

  protected readonly autoDepositAdded = computed(() =>
    this.selectedMode() === 'POSITIONS' &&
    (this.result()?.imported ?? 0) > 0
  );

  protected readonly brokers: { value: CsvBroker; label: string }[] = [
    { value: 'BOURSOBANK', label: 'BoursoBank' },
  ];

  protected readonly modes: {
    value: CsvMode; labelKey: string; descriptionKey: string
  }[] = [
    {
      value: 'OPERATIONS',
      labelKey: 'csvImport.operationsLabel',
      descriptionKey: 'csvImport.operationsDescription',
    },
    {
      value: 'POSITIONS',
      labelKey: 'csvImport.positionsLabel',
      descriptionKey: 'csvImport.positionsDescription',
    },
  ];

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.error.set(null);
    }
  }

  protected mouseDownOnBackdrop = false;

  protected onBackdropMouseDown(event: MouseEvent): void {
    this.mouseDownOnBackdrop = event.target === event.currentTarget;
  }

  protected onBackdropMouseUp(event: MouseEvent): void {
    if (this.mouseDownOnBackdrop && event.target === event.currentTarget) {
      this.closed.emit();
    }
    this.mouseDownOnBackdrop = false;
  }

  protected canImport(): boolean {
    return this.selectedFile() !== null && !this.loading();
  }

  protected doImport(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.error.set(null);
    this.accountService.importCsv(
      this.accountId(),
      file,
      this.selectedBroker(),
      this.selectedMode()
    ).subscribe({
      next: (res) => {
        this.result.set(res);
        this.step.set('result');
        this.loading.set(false);
        this.imported.emit(res);
      },
      error: (err) => {
        let message = this.translate.instant('csvImport.importFailed');
        if (err.error && typeof err.error === 'string') {
          message = err.error;
        } else if (err.error?.message && typeof err.error.message === 'string') {
          message = err.error.message;
        } else if (err.status === 400) {
          message = this.translate.instant('csvImport.invalidFile');
        }
        this.toastService.error(message);
        this.loading.set(false);
      },
    });
  }
}
