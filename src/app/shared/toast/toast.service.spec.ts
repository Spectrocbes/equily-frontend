import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('show() adds a toast to the list', () => {
    service.show('Hello', 'info');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hello');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('dismiss() removes a toast by id', () => {
    service.show('First', 'info');
    service.show('Second', 'success');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Second');
  });

  it('error() adds a toast with type "error"', () => {
    service.error('Something went wrong');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('Something went wrong');
  });

  it('success() adds a toast with type "success"', () => {
    service.success('Done!');
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Done!');
  });

  it('toast is auto-dismissed after its duration', fakeAsync(() => {
    service.show('Auto gone', 'warning', 2000);
    expect(service.toasts().length).toBe(1);
    tick(2000);
    expect(service.toasts().length).toBe(0);
  }));
});
