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

  protected toastClasses(type: ToastType): string {
    const base = 'bg-white dark:bg-slate-800 ';
    const map: Record<ToastType, string> = {
      error:   'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      success: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      warning: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      info:    'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    };
    return base + map[type];
  }
}
