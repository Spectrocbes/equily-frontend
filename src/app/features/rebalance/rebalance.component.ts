import { Component } from '@angular/core';

@Component({
  selector: 'app-rebalance',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-white">Rebalance</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Actionable rebalancing orders based on your target allocation</p>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 p-8 text-center">
        <p class="text-slate-400 dark:text-slate-500 text-sm">Rebalancing engine will appear here</p>
      </div>
    </div>
  `,
})
export class RebalanceComponent {}
