import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-investment-account-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './investment-account-detail.component.html',
})
export class InvestmentAccountDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly accountId = signal<string | null>(null);

  ngOnInit(): void {
    this.accountId.set(this.route.snapshot.paramMap.get('id'));
  }
}
