import { Component, input, output, inject, signal } from '@angular/core';
import { AccountService } from '../../../core/services/account.service';
import {
  CsvBroker, CsvMode, CsvImportResponse
} from '../../../core/models/account.model';

@Component({
  selector: 'app-csv-import-modal',
  standalone: true,
  imports: [],
  templateUrl: './csv-import-modal.component.html',
})
export class CsvImportModalComponent {
  accountId = input.required<string>();
  closed    = output<void>();
  imported  = output<CsvImportResponse>();

  private readonly accountService = inject(AccountService);

  protected readonly step =
    signal<'select' | 'result'>('select');
  protected readonly selectedBroker = signal<CsvBroker>('BOURSOBANK');
  protected readonly selectedMode   = signal<CsvMode>('OPERATIONS');
  protected readonly selectedFile   = signal<File | null>(null);
  protected readonly loading        = signal(false);
  protected readonly error          = signal<string | null>(null);
  protected readonly result         = signal<CsvImportResponse | null>(null);

  protected readonly brokers: { value: CsvBroker; label: string }[] = [
    { value: 'BOURSOBANK', label: 'BoursoBank' },
  ];

  protected readonly modes: {
    value: CsvMode; label: string; description: string
  }[] = [
    {
      value: 'OPERATIONS',
      label: 'Operations history',
      description: 'Import all transactions (deposits, buys, sells...) — recommended'
    },
    {
      value: 'POSITIONS',
      label: 'Current positions',
      description: 'Import current holdings as synthetic BUY transactions'
    },
  ];

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.error.set(null);
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
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
        this.error.set(err.error ?? err.message ?? 'Import failed');
        this.loading.set(false);
      },
    });
  }
}
