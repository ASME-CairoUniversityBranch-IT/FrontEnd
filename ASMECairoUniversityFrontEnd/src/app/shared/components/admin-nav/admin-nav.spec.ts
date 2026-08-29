import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminNavComponent } from './admin-nav';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminNavComponent', () => {
  let component: AdminNavComponent;
  let fixture: ComponentFixture<AdminNavComponent>;
  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ name: 'Admin User' }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminNavComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNavComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct breadcrumb for main-segment', () => {
    component.active = 'main-segment';
    fixture.detectChanges();
    expect(component.breadcrumb).toBe('MAIN SEGMENT');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.nav-breadcrumb')?.textContent).toContain('MAIN SEGMENT');
  });

  it('should render main segment sidebar item with active class', () => {
    component.active = 'main-segment';
    fixture.detectChanges();
    const activeItem = fixture.nativeElement.querySelector('.sidebar-item.active');
    expect(activeItem?.textContent).toContain('MAIN SEGMENT');
  });
});
