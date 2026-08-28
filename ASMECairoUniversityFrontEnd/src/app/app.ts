import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { MainFooter } from '../components/main-footer/main-footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, MainFooter],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('ASMECairoUniversityFrontEnd');

  constructor(private readonly router: Router) {}

  protected get showPublicChrome(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0];
    return path !== '/login' && !path.startsWith('/admin');
  }
}
