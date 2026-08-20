import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { DEPOSIT_LIMITS } from '../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

interface Row { labelKey: string; amount: number; pct: number }

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  function securities(): Row[] {
    return fixture.componentInstance['securitiesCeilings'] as Row[];
  }
  function passbooks(): Row[] {
    return fixture.componentInstance['passbookCeilings'] as Row[];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([]), provideTestTranslations()],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    useTestTranslations();
  });

  // The whole point of the ceiling sheet is that it cannot drift from what the
  // app actually enforces, so assert the figures against the model constants
  // rather than against copies of the numbers.
  it('quotes the deposit ceilings the app enforces, never its own copy', () => {
    const byKey = (rows: Row[], key: string) => rows.find(r => r.labelKey === key)?.amount;

    expect(byKey(securities(), 'landing.ceilingPea')).toBe(DEPOSIT_LIMITS.PEA);
    expect(byKey(securities(), 'landing.ceilingPeaPme')).toBe(DEPOSIT_LIMITS.PEA_PME);
    expect(byKey(passbooks(), 'landing.ceilingLivretA')).toBe(DEPOSIT_LIMITS.LIVRET_A);
    expect(byKey(passbooks(), 'landing.ceilingLdds')).toBe(DEPOSIT_LIMITS.LDDS);
    expect(byKey(passbooks(), 'landing.ceilingLep')).toBe(DEPOSIT_LIMITS.LEP);
    expect(byKey(passbooks(), 'landing.ceilingLivretJeune')).toBe(DEPOSIT_LIMITS.LIVRET_JEUNE);
  });

  it('scales each group against its own maximum, not a shared one', () => {
    // Securities and passbooks differ by an order of magnitude; a shared scale
    // would flatten every Livret into an unreadable sliver.
    expect(Math.max(...securities().map(r => r.pct))).toBe(100);
    expect(Math.max(...passbooks().map(r => r.pct))).toBe(100);

    // Derived from the same constants, so a change in the law updates the
    // expectation with the code instead of failing this spec spuriously.
    const pea = securities().find(r => r.labelKey === 'landing.ceilingPea')!;
    expect(pea.pct).toBeCloseTo((DEPOSIT_LIMITS.PEA! / DEPOSIT_LIMITS.PEA_PME!) * 100, 5);

    const ldds = passbooks().find(r => r.labelKey === 'landing.ceilingLdds')!;
    expect(ldds.pct).toBeCloseTo((DEPOSIT_LIMITS.LDDS! / DEPOSIT_LIMITS.LIVRET_A!) * 100, 5);
  });

  it('holds the bars at zero until the reveal runs', () => {
    expect(fixture.componentInstance['barsReady']()).toBe(false);
  });

  it('releases the bars once the view is initialised', async () => {
    fixture.detectChanges();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    expect(fixture.componentInstance['barsReady']()).toBe(true);
  });

  it('renders the real ceiling figures in the sheet', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('€225,000');
    expect(text).toContain('€150,000');
    expect(text).toContain('€22,950');
  });

  it('makes no claim about products the app does not support', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // REAL_ESTATE is in the enum but has no sub-types and no deposit limit;
    // the previous page advertised it as supported. Guard against a relapse.
    expect(text).not.toMatch(/real estate/i);
    expect(text).not.toMatch(/coming soon/i);
  });
});
