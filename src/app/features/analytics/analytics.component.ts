import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent {}
