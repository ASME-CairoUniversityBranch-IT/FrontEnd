import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AcademicDirectoryPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

export interface AcademicUniversityItem {
  id: string;
  englishName: string;
  arabicName?: string | null;
  category: string;
  isOther: boolean;
  isActive: boolean;
}

export interface AcademicFacultyItem {
  offeringId: string;
  facultyId: string;
  universityId: string;
  universityName?: string | null;
  englishName: string;
  arabicName?: string | null;
  isOther: boolean;
  isActive: boolean;
}

export interface AcademicDepartmentItem {
  id: string;
  offeringId: string;
  universityId: string;
  englishName: string;
  arabicName?: string | null;
  isOther: boolean;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AcademicDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/academic-directory`;

  getUniversities(
    search?: string,
    page = 1,
    pageSize = 20
  ): Observable<AcademicDirectoryPage<AcademicUniversityItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<AcademicDirectoryPage<AcademicUniversityItem>>(
      `${this.baseUrl}/universities`,
      { params }
    );
  }

  getFaculties(
    universityId: string,
    search?: string,
    page = 1,
    pageSize = 20
  ): Observable<AcademicDirectoryPage<AcademicFacultyItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<AcademicDirectoryPage<AcademicFacultyItem>>(
      `${this.baseUrl}/universities/${universityId}/faculties`,
      { params }
    );
  }

  getDepartments(
    offeringId: string,
    search?: string,
    page = 1,
    pageSize = 20
  ): Observable<AcademicDirectoryPage<AcademicDepartmentItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<AcademicDirectoryPage<AcademicDepartmentItem>>(
      `${this.baseUrl}/university-faculties/${offeringId}/departments`,
      { params }
    );
  }
}
