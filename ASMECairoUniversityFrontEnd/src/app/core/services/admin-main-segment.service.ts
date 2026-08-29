import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateMainSegmentEditionRequest,
  MainSegmentAdminPersonResponse,
  MainSegmentAdminResponse,
  MainSegmentEditionStatus,
  MainSegmentEditionSummary,
  MainSegmentOrganizationRequest,
  MainSegmentPersonRequest,
  MainSegmentProgramItemRequest,
  MainSegmentSectionRequest,
  UpdateMainSegmentEditionRequest,
} from '../models/main-segment.model';
import {
  AdminRegistrationDetailResponse,
  AdminRegistrationListResponse,
  AdminRegistrationSchemaResponse,
  AdminRegistrationAnswerDetail,
  DEFAULT_ADMIN_SCHEMA,
  PrivateDocumentType,
  RegistrationAnswerApiResponse,
  RegistrationDetailApiResponse,
  RegistrationListApiResponse,
  RegistrationListFilterParams,
  RegistrationStatus,
  RegistrationStatusUpdateApiResponse,
  RegistrationSummaryApiResponse,
  UpdateRegistrationSchemaRequest,
  UpdateRegistrationStatusRequest,
} from '../models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class AdminMainSegmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/main-segments`;

  /* ── Edition-level Operations ── */
  getAdminEditions(): Observable<MainSegmentEditionSummary[]> {
    return this.http.get<MainSegmentEditionSummary[]>(this.baseUrl);
  }

  getAdminByYear(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .get<MainSegmentAdminResponse>(`${this.baseUrl}/${year}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  getPreview(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .get<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/preview`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  createEdition(request: CreateMainSegmentEditionRequest): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(this.baseUrl, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateEdition(
    year: number,
    request: UpdateMainSegmentEditionRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateSections(
    year: number,
    sections: MainSegmentSectionRequest[],
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/sections`, sections)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  setStatus(year: number, status: MainSegmentEditionStatus): Observable<MainSegmentAdminResponse> {
    return this.http
      .patch<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/status`, {
        status,
      })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  setRegistrationAvailability(
    year: number,
    availabilityOverride: boolean | null,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .patch<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration`, {
        availabilityOverride,
      })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  openRegistration(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration/open`, {})
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  closeRegistration(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/registration/close`, {})
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadHeroImage(year: number, file: File): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/hero-image`, formData)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteHeroImage(year: number): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/hero-image`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Program Items ── */
  createProgramItem(
    year: number,
    request: MainSegmentProgramItemRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/program-items`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateProgramItem(
    year: number,
    programItemId: string,
    request: MainSegmentProgramItemRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/program-items/${programItemId}`,
        request,
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteProgramItem(year: number, programItemId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/program-items/${programItemId}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderProgramItems(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/program-items/order`, { ids })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── People / Speakers ── */
  getPeople(year: number): Observable<MainSegmentAdminPersonResponse[]> {
    return this.http.get<MainSegmentAdminPersonResponse[]>(`${this.baseUrl}/${year}/people`).pipe(
      map((people) =>
        people.map((p) => ({
          ...p,
          photoUrl: this.resolveImageUrl(p.photoUrl),
        })),
      ),
    );
  }

  createPerson(
    year: number,
    request: MainSegmentPersonRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updatePerson(
    year: number,
    personId: string,
    request: MainSegmentPersonRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deletePerson(year: number, personId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderPeople(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/order`, {
        ids,
      })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  assignPerson(
    year: number,
    personId: string,
    programItemIds: string[],
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}/assignments`, {
        programItemIds,
      })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadPersonPhoto(
    year: number,
    personId: string,
    file: File,
  ): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}/photo`, formData)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deletePersonPhoto(year: number, personId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/people/${personId}/photo`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Organizations ── */
  createOrganization(
    year: number,
    request: MainSegmentOrganizationRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .post<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/organizations`, request)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  updateOrganization(
    year: number,
    organizationId: string,
    request: MainSegmentOrganizationRequest,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}`,
        request,
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteOrganization(year: number, organizationId: string): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/organizations/${organizationId}`)
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  reorderOrganizations(year: number, ids: string[]): Observable<MainSegmentAdminResponse> {
    return this.http
      .put<MainSegmentAdminResponse>(`${this.baseUrl}/${year}/organizations/order`, { ids })
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  uploadOrganizationLogo(
    year: number,
    organizationId: string,
    file: File,
  ): Observable<MainSegmentAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}/logo`,
        formData,
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  deleteOrganizationLogo(
    year: number,
    organizationId: string,
  ): Observable<MainSegmentAdminResponse> {
    return this.http
      .delete<MainSegmentAdminResponse>(
        `${this.baseUrl}/${year}/organizations/${organizationId}/logo`,
      )
      .pipe(map((res) => this.normalizeAdminResponse(res)));
  }

  /* ── Registration Form & Question Builder Schema (Milestone 6) ── */
  getRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http
      .get<AdminRegistrationSchemaResponse>(`${this.baseUrl}/${year}/schema`)
      .pipe(catchError(() => of(DEFAULT_ADMIN_SCHEMA)));
  }

  updateRegistrationSchema(
    year: number,
    request: UpdateRegistrationSchemaRequest,
  ): Observable<AdminRegistrationSchemaResponse> {
    return this.http.put<AdminRegistrationSchemaResponse>(
      `${this.baseUrl}/${year}/schema`,
      request,
    );
  }

  publishRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http.post<AdminRegistrationSchemaResponse>(
      `${this.baseUrl}/${year}/schema/publish`,
      {},
    );
  }

  seedDefaultRegistrationSchema(year: number): Observable<AdminRegistrationSchemaResponse> {
    return this.http
      .post<AdminRegistrationSchemaResponse>(`${this.baseUrl}/${year}/schema/seed-defaults`, {})
      .pipe(catchError(() => of(DEFAULT_ADMIN_SCHEMA)));
  }

  /* ── Registration Review, Detail, Documents & Export (Milestone 7) ── */
  getRegistrations(
    year: number,
    params: RegistrationListFilterParams,
  ): Observable<AdminRegistrationListResponse> {
    const listParams = this.buildRegistrationParams(params, true);
    const summaryParams = this.buildRegistrationParams({ ...params, status: 'All' }, false);
    return forkJoin({
      list: this.http.get<RegistrationListApiResponse>(`${this.baseUrl}/${year}/registrations`, {
        params: listParams,
      }),
      summary: this.http.get<RegistrationSummaryApiResponse>(
        `${this.baseUrl}/${year}/registrations/summary`,
        { params: summaryParams },
      ),
    }).pipe(map(({ list, summary }) => this.normalizeRegistrationList(list, summary)));
  }

  getRegistrationDetail(
    year: number,
    registrationId: string,
  ): Observable<AdminRegistrationDetailResponse> {
    return this.http
      .get<RegistrationDetailApiResponse>(`${this.baseUrl}/${year}/registrations/${registrationId}`)
      .pipe(map((response) => this.normalizeRegistrationDetail(response)));
  }

  updateRegistrationStatus(
    year: number,
    registrationId: string,
    request: UpdateRegistrationStatusRequest,
  ): Observable<RegistrationStatusUpdateApiResponse> {
    return this.http.patch<RegistrationStatusUpdateApiResponse>(
      `${this.baseUrl}/${year}/registrations/${registrationId}/status`,
      request,
    );
  }

  getPrivateDocument(
    year: number,
    registrationId: string,
    docType: PrivateDocumentType,
  ): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${year}/registrations/${registrationId}/documents/${docType}`,
      { responseType: 'blob' },
    );
  }

  exportRegistrationsCsv(
    year: number,
    params: Partial<RegistrationListFilterParams>,
  ): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${year}/registrations/export`, {
      params: this.buildRegistrationParams(params, false),
      responseType: 'blob',
    });
  }

  private buildRegistrationParams(
    params: Partial<RegistrationListFilterParams>,
    includePagination: boolean,
  ): HttpParams {
    let httpParams = new HttpParams();
    if (includePagination) {
      httpParams = httpParams
        .set('page', String(params.page ?? 1))
        .set('pageSize', String(params.pageSize ?? 25));
    }
    if (params.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.status && params.status !== 'All')
      httpParams = httpParams.set('status', params.status);
    if (params.universityId) httpParams = httpParams.set('universityId', params.universityId);
    if (params.facultyId) httpParams = httpParams.set('facultyId', params.facultyId);
    if (params.graduationYear != null) {
      httpParams = httpParams.set('graduationYear', String(params.graduationYear));
    }
    if (params.submittedFrom) httpParams = httpParams.set('submittedFrom', params.submittedFrom);
    if (params.submittedTo) httpParams = httpParams.set('submittedTo', params.submittedTo);
    return httpParams;
  }

  private normalizeRegistrationList(
    list: RegistrationListApiResponse,
    summary: RegistrationSummaryApiResponse,
  ): AdminRegistrationListResponse {
    const count = (status: RegistrationStatus): number =>
      summary.counts?.[status] ??
      summary.statusCounts?.find((item) => item.status === status)?.count ??
      0;
    return {
      items: (list.items ?? []).map((item) => ({
        id: item.id,
        referenceNumber: item.reference,
        nameEnglish: item.nameEnglish,
        nameArabic: item.nameArabic,
        email: item.email,
        phoneNumber: item.phoneNumber,
        universityName: item.university,
        facultyName: item.faculty,
        graduationYear: item.graduationYear,
        status: item.status,
        submittedAt: item.submittedAt,
      })),
      totalCount: list.totalCount,
      page: list.page,
      pageSize: list.pageSize,
      totalPages: list.totalPages,
      statusCounts: {
        all: summary.total ?? summary.totalCount ?? 0,
        submitted: count('Submitted'),
        underReview: count('UnderReview'),
        accepted: count('Accepted'),
        rejected: count('Rejected'),
        waitlisted: count('Waitlisted'),
        cancelled: count('Cancelled'),
      },
    };
  }

  private normalizeRegistrationDetail(
    response: RegistrationDetailApiResponse,
  ): AdminRegistrationDetailResponse {
    const documents = response.documents ?? [];
    const history = (response.statusHistory ?? []).map((entry, index) => ({
      id: `${entry.createdAt}-${index}`,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedBy: entry.actorAdminName?.trim() || (entry.actorAdminId ? 'Admin' : 'System'),
      changedAt: entry.createdAt,
      note: entry.note,
    }));
    return {
      id: response.id,
      editionYear: response.editionYear,
      referenceNumber: response.reference,
      status: response.status,
      submittedAt: response.submittedAt,
      updatedAt: history.at(-1)?.changedAt ?? response.submittedAt,
      nameEnglish: response.nameEnglish,
      nameArabic: response.nameArabic,
      email: response.email,
      phoneNumber: response.phoneNumber,
      gender: response.gender,
      maskedNationalId: response.nationalIdMasked,
      academicSnapshot: {
        universityName: response.universityOtherValue?.trim() || response.university,
        facultyName: response.facultyOtherValue?.trim() || response.faculty,
        departmentName: response.departmentOtherValue?.trim() || response.department || null,
        isUniversityOther: Boolean(response.universityOtherValue),
        isFacultyOther: Boolean(response.facultyOtherValue),
        isDepartmentOther: Boolean(response.departmentOtherValue),
        graduationYear: response.graduationYear,
      },
      answers: (response.answers ?? []).map((answer) => this.normalizeRegistrationAnswer(answer)),
      hasNationalIdPhoto: documents.some((item) => item.documentType === 'NationalIdPhoto'),
      hasUniversityIdPhoto: documents.some((item) => item.documentType === 'UniversityIdPhoto'),
      hasCvFile: documents.some((item) => item.documentType === 'Cv'),
      documents,
      statusHistory: history,
    };
  }

  private normalizeRegistrationAnswer(
    answer: RegistrationAnswerApiResponse,
  ): AdminRegistrationAnswerDetail {
    let parsed: unknown;
    try {
      parsed = JSON.parse(answer.answerJson);
    } catch {
      parsed = answer.answerJson;
    }

    const normalized: AdminRegistrationAnswerDetail = {
      questionId: answer.questionId,
      questionKey: answer.questionKey,
      questionTitle: answer.prompt,
      questionType: answer.type,
    };
    const optionLabels = this.registrationAnswerOptionLabels(answer.optionsSnapshotJson);
    if (
      typeof parsed === 'boolean' ||
      (answer.type === 'YesNo' && typeof parsed === 'string' && ['yes', 'no'].includes(parsed))
    ) {
      normalized.booleanAnswer = typeof parsed === 'boolean' ? parsed : parsed === 'yes';
    } else if (Array.isArray(parsed)) {
      normalized.selectedOptions = parsed.map((value) =>
        this.registrationChoiceAnswerToText(value, optionLabels),
      );
    } else if (answer.type === 'SingleChoice') {
      normalized.answerText = this.registrationChoiceAnswerToText(parsed, optionLabels);
    } else {
      normalized.answerText = this.answerValueToText(parsed);
    }
    return normalized;
  }

  private registrationAnswerOptionLabels(snapshotJson: string): Map<string, string> {
    try {
      const options = JSON.parse(snapshotJson);
      if (!Array.isArray(options)) return new Map();
      return new Map(
        options
          .filter(
            (option) => typeof option?.value === 'string' && typeof option?.label === 'string',
          )
          .map((option) => [option.value, option.label] as const),
      );
    } catch {
      return new Map();
    }
  }

  private registrationChoiceAnswerToText(
    value: unknown,
    optionLabels: ReadonlyMap<string, string>,
  ): string {
    if (typeof value === 'string') return optionLabels.get(value) ?? value;
    if (value && typeof value === 'object' && 'value' in value) {
      const choice = String((value as { value: unknown }).value ?? '');
      const label = optionLabels.get(choice) ?? choice;
      const otherText =
        'otherText' in value
          ? String((value as { otherText?: unknown }).otherText ?? '').trim()
          : '';
      return otherText ? `${label}: ${otherText}` : label;
    }
    return this.answerValueToText(value);
  }

  private answerValueToText(value: unknown): string {
    if (value == null) return 'No answer';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    try {
      return JSON.stringify(value);
    } catch {
      return 'Unable to display this answer';
    }
  }

  /* ── Helper Normalization ── */
  private normalizeAdminResponse(res: MainSegmentAdminResponse): MainSegmentAdminResponse {
    if (!res) return res;
    return {
      ...res,
      heroImageUrl: this.resolveImageUrl(res.heroImageUrl),
      people: (res.people || []).map((p) => ({
        ...p,
        photoUrl: this.resolveImageUrl(p.photoUrl),
      })),
      organizations: (res.organizations || []).map((o) => ({
        ...o,
        logoUrl: this.resolveImageUrl(o.logoUrl),
      })),
    };
  }

  private resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendOrigin}${cleanPath}`;
  }
}
