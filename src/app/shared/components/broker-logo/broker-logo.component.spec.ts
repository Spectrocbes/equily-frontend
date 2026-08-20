import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BrokerLogoComponent } from './broker-logo.component';

describe('BrokerLogoComponent', () => {
  let fixture: ComponentFixture<BrokerLogoComponent>;

  function render(broker: string, size?: number) {
    fixture = TestBed.createComponent(BrokerLogoComponent);
    fixture.componentRef.setInput('broker', broker);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BrokerLogoComponent] }).compileComponents();
  });

  it('renders the logo for a known broker', () => {
    const img = render('Boursobank').querySelector('img');
    expect(img?.getAttribute('src')).toBe('assets/logos/brokers/boursobank.png');
  });

  it('lazy-loads the image so long account lists do not fetch every logo upfront', () => {
    expect(render('Boursobank').querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  // The broker name is rendered next to the logo everywhere it is used.
  it('hides the logo from screen readers', () => {
    const el = render('Boursobank');
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows initials when no logo is on file', () => {
    const el = render('My Local Credit Union');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('ML');
  });

  it('degrades to initials when the file fails to load', () => {
    const el = render('Boursobank');
    el.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('BO');
  });

  // @for reuses DOM nodes, so a row that failed for one broker must not poison
  // the next broker rendered into the same node.
  it('retries the image when the broker changes after a failure', () => {
    const el = render('Boursobank');
    el.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('img')).toBeNull();

    fixture.componentRef.setInput('broker', 'Kraken');
    fixture.detectChanges();
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/logos/brokers/kraken.png');
  });

  it('honours the requested size', () => {
    const img = render('Boursobank', 48).querySelector('img');
    expect(img?.getAttribute('width')).toBe('48');
  });
});
