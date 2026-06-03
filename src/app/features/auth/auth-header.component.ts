import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a routerLink="/home"
       class="flex items-center gap-2 hover:opacity-80
              transition-opacity w-fit mb-12">
      <div class="w-8 h-8 rounded-lg bg-primary-500
                  flex items-center justify-center">
        <span class="text-white font-bold text-sm">E</span>
      </div>
      <span class="font-semibold text-lg tracking-tight
                   text-slate-900 dark:text-white">
        Equily
      </span>
    </a>
  `,
})
export class AuthHeaderComponent {}
