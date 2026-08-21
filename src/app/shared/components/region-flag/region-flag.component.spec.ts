import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegionFlagComponent } from './region-flag.component';

describe('RegionFlagComponent', () => {
  let fixture: ComponentFixture<RegionFlagComponent>;

  function render(region: string, size?: number) {
    fixture = TestBed.createComponent(RegionFlagComponent);
    fixture.componentRef.setInput('region', region);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RegionFlagComponent] }).compileComponents();
  });

  it('renders the country flag for a known region', () => {
    const img = render('France').querySelector('img');
    expect(img?.getAttribute('src')).toBe('assets/flags/fr.svg');
  });

  it('lazy-loads the image so long lists do not fetch every flag upfront', () => {
    expect(render('France').querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  // The region name is always rendered beside the flag, so announcing it twice
  // would just make the row noisier to listen to.
  it('hides the flag from screen readers', () => {
    const img = render('France').querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows a coin mark for crypto instead of a flag', () => {
    const el = render('Crypto');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('falls back to a neutral mark for an unknown region', () => {
    const el = render('Atlantis');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
  });

  // A deployed file that 404s must degrade, not leave a broken-image glyph.
  it('degrades to the neutral mark when the SVG fails to load', () => {
    const el = render('France');
    el.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('honours the requested size', () => {
    const img = render('France', 24).querySelector('img');
    expect(img?.getAttribute('width')).toBe('24');
  });
});
