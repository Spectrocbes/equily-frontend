import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-crypto-account-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './crypto-account-detail.component.html',
})
export class CryptoAccountDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly accountId = signal<string | null>(null);

  ngOnInit(): void {
    this.accountId.set(this.route.snapshot.paramMap.get('id'));
  }
}
