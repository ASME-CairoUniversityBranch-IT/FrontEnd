import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  submitting = false;
  errorMessage = '';

  /** Where to send the admin back to once they're authenticated. Defaults to the create-project page,
   *  since that's the only place this form is ever linked from. */
  private returnUrl = '/projects/create';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    if (requested) this.returnUrl = requested;
  }

  onSubmit(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter both an email and a password.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage = this.resolveErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private resolveErrorMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        // Prefer whatever validation message the API sent back, if any.
        return err.error?.message ?? 'Please check your email and password and try again.';
      case 401:
        return 'Incorrect email or password.';
      case 0:
        return 'Could not reach the server. Check your connection and try again.';
      case 500:
      case 502:
      case 503:
        return 'The server ran into a problem. Please try again in a moment.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
