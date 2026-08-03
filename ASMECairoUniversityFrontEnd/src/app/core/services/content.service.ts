import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { SiteContent } from '../models/site-content.model';

/**
 * Loads the site's static homepage copy from `public/content.json`.
 *
 * This is plain static text/config — not backend data — so it's fetched once
 * as a build asset and cached in memory (`shareReplay`) for the lifetime of the
 * app; every component that needs a slice of it (hero banner, about section,
 * values, achievements, committees) shares the same single HTTP request.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private content$?: Observable<SiteContent>;

  constructor(private http: HttpClient) {}

  getContent(): Observable<SiteContent> {
    if (!this.content$) {
      this.content$ = this.http
        .get<SiteContent>('/content.json')
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.content$;
  }
}
