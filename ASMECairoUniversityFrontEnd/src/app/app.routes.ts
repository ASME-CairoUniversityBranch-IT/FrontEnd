import { Routes } from '@angular/router';
import { OurValues } from '../components/our-values/our-values';

export const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: '/our-values',component: OurValues},
];
