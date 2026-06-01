import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly features = [
    '🇫🇷 French regulatory limits (PEA, Livret A, LDDS, LEP)',
    '📥 Boursobank CSV import',
    '📊 Holdings, P&L, transactions',
    '🔒 Secure JWT authentication',
    '🌙 Dark mode',
  ];
}
