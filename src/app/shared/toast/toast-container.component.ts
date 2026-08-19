import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  templateUrl: './toast-container.component.html',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  // Status colors here are UI state (error/success/warning/info), not financial
  // values — deliberately not the gain/loss tokens, which are reserved for P&L.
  protected toastAccentClasses(type: ToastType): string {
    const map: Record<ToastType, string> = {
      error:   'border-l-rose-500',
      success: 'border-l-emerald-500',
      warning: 'border-l-amber-500',
      info:    'border-l-accent',
    };
    return map[type];
  }

  protected toastIconClasses(type: ToastType): string {
    const map: Record<ToastType, string> = {
      error:   'text-rose-500',
      success: 'text-emerald-500',
      warning: 'text-amber-500',
      info:    'text-accent',
    };
    return map[type];
  }
}
