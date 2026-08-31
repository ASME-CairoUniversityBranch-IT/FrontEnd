import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MainSegmentRegistrationSubmission,
  RegistrationSchema,
  RegistrationSchemaApiResponse,
  RegistrationQuestionType,
  RegistrationSubmissionResponse,
} from '../models/registration.model';

export const DEFAULT_REGISTRATION_SCHEMA: RegistrationSchema = {
  id: '00000000-0000-0000-0000-000000000001',
  schemaId: '00000000-0000-0000-0000-000000000001',
  version: 1,
  consentNoticeVersion: 'main-segment-2026-v1',
  questions: [
    {
      id: 'q-source',
      key: 'referral_source',
      title: 'How did you hear about Main Segment 2026?',
      description: 'Let us know how you discovered this edition.',
      type: 'SingleChoice',
      isRequired: true,
      options: [
        { id: 'opt-fb', label: 'Facebook / Social Media', value: 'SocialMedia' },
        { id: 'opt-friends', label: 'University Friends / Colleagues', value: 'Friends' },
        { id: 'opt-prof', label: 'Faculty Professors / Teaching Assistants', value: 'Professors' },
        { id: 'opt-booth', label: 'On-Campus ASME Booth', value: 'OnCampusBooth' },
        { id: 'opt-other', label: 'Other', value: 'Other' },
      ],
    },
    {
      id: 'q-track',
      key: 'primary_interest',
      title: 'What is your primary engineering interest area?',
      description: 'Helps us tailor session capacity and recommendations.',
      type: 'SingleChoice',
      isRequired: true,
      options: [
        { id: 'track-design', label: 'Mechanical & CAD Design', value: 'MechanicalDesign' },
        { id: 'track-thermal', label: 'Thermal & Fluid Systems', value: 'ThermalFluids' },
        { id: 'track-mechatronics', label: 'Robotics & Mechatronics', value: 'Mechatronics' },
        { id: 'track-mfg', label: 'Manufacturing & Materials', value: 'Manufacturing' },
        { id: 'track-energy', label: 'Renewable & Power Energy', value: 'Energy' },
        { id: 'track-auto', label: 'Automotive & Aerospace', value: 'Automotive' },
      ],
    },
    {
      id: 'q-join-asme',
      key: 'join_asme_cu',
      title: 'Would you like to join the ASME Cairo University Student Branch team?',
      description: 'Open to undergraduate engineering students who want to develop leadership and technical skills.',
      type: 'YesNo',
      isRequired: true,
    },
    {
      id: 'q-team-interest',
      key: 'asme_team_preference',
      title: 'Which ASME committee or team are you interested in joining?',
      description: 'Select your preferred branch team.',
      type: 'SingleChoice',
      isRequired: true,
      conditionalOnKey: 'join_asme_cu',
      conditionalValue: true,
      options: [
        { id: 'team-tech', label: 'Technical Projects & Workshops', value: 'Technical' },
        { id: 'team-it', label: 'IT & Software Development', value: 'IT' },
        { id: 'team-pr', label: 'Public Relations & Partnerships', value: 'PR' },
        { id: 'team-media', label: 'Media, Graphic Design & Marketing', value: 'Media' },
        { id: 'team-hr', label: 'Human Resources & Logistics', value: 'HR' },
      ],
    },
    {
      id: 'q-expectations',
      key: 'expectations_goals',
      title: 'What are your core expectations for Main Segment 2026?',
      description: 'Share any specific talks, companies, or workshops you hope to engage with.',
      type: 'LongText',
      isRequired: false,
      placeholder: 'Describe what you hope to gain from this experience...',
    },
  ],
};

@Injectable({
  providedIn: 'root',
})
export class MainSegmentRegistrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/main-segments`;
  private readonly questionTypes: readonly RegistrationQuestionType[] = [
    'ShortText',
    'LongText',
    'SingleChoice',
    'MultipleChoice',
    'YesNo',
    'ConditionalTeam',
  ];

  getRegistrationSchema(year: number): Observable<RegistrationSchema> {
    return this.http
      .get<RegistrationSchemaApiResponse>(`${this.baseUrl}/${year}/registration-schema`)
      .pipe(map((response) => this.normalizeSchema(response)));
  }

  submitRegistration(
    year: number,
    submission: MainSegmentRegistrationSubmission
  ): Observable<RegistrationSubmissionResponse> {
    const formData = new FormData();

    // Append structured payload as JSON
    const payloadData = {
      schemaId: submission.schemaId,
      schemaVersion: submission.schemaVersion,
      personal: {
        nameEnglish: submission.nameEnglish,
        nameArabic: submission.nameArabic,
        email: submission.email,
        phoneNumber: submission.phoneNumber,
        gender: submission.gender,
        nationalIdNumber: submission.nationalId,
      },
      academic: {
        universityId: submission.isUniversityOther ? null : submission.universityId,
        universityOtherValue: submission.isUniversityOther
          ? submission.universityOtherName
          : null,
        facultyOfferingId: submission.isFacultyOther ? null : submission.facultyOfferingId,
        facultyOtherValue: submission.isFacultyOther ? submission.facultyOtherName : null,
        departmentId: submission.isDepartmentOther ? null : submission.departmentId,
        departmentOtherValue: submission.isDepartmentOther
          ? submission.departmentOtherName
          : null,
        graduationYear: submission.graduationYear,
      },
      answers: Object.fromEntries(
        submission.answers.map((answer) => [
          answer.questionKey,
          answer.choiceAnswer ?? answer.booleanAnswer ?? answer.selectedOptions ?? answer.answerText ?? null,
        ])
      ),
      privacyNoticeVersion: submission.consentNoticeVersion,
      privacyNoticeAccepted: true,
    };

    formData.append('payload', JSON.stringify(payloadData));

    // Append file binaries
    if (submission.nationalIdPhoto) {
      formData.append('nationalIdPhoto', submission.nationalIdPhoto, submission.nationalIdPhoto.name);
    }
    if (submission.cvFile) {
      formData.append('cvFile', submission.cvFile, submission.cvFile.name);
    }
    if (submission.universityIdPhoto) {
      formData.append('universityIdPhoto', submission.universityIdPhoto, submission.universityIdPhoto.name);
    }

    return this.http.post<RegistrationSubmissionResponse>(
      `${this.baseUrl}/${year}/registrations`,
      formData,
      {
        headers: new HttpHeaders({ 'Idempotency-Key': submission.idempotencyKey }),
      }
    );
  }

  private normalizeSchema(response: RegistrationSchemaApiResponse): RegistrationSchema {
    const orderedQuestions = [...(response.questions ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const normalizedTypes = new Map(
      orderedQuestions.map((question) => [
        question.id,
        this.mapEnum(this.questionTypes, question.type, 'ShortText'),
      ])
    );
    const questionKeyById = new Map(orderedQuestions.map((question) => [question.id, question.key]));

    return {
      id: response.id,
      schemaId: response.schemaId,
      version: response.version,
      consentNoticeVersion: environment.mainSegmentPrivacyNoticeVersion,
      questions: orderedQuestions.map((question) => {
        const conditionQuestionId = question.condition?.dependsOnQuestionId;
        const conditionQuestionType = conditionQuestionId
          ? normalizedTypes.get(conditionQuestionId)
          : undefined;
        let conditionalValue: string | boolean | null =
          question.condition?.expectedValue ?? null;
        if (conditionQuestionType === 'YesNo') {
          conditionalValue = question.condition?.expectedValue.toLowerCase() === 'yes';
        }
        return {
          id: question.id,
          key: question.key,
          title: question.prompt,
          description: question.helperText,
          type: normalizedTypes.get(question.id) ?? 'ShortText',
          isRequired: question.isRequired,
          minLength: question.minLength ?? null,
          maxLength: question.maxLength ?? null,
          minSelections: question.minSelections ?? null,
          maxSelections: question.maxSelections ?? null,
          options: [...(question.options ?? [])]
            .filter((option) => option.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((option) => ({
              id: option.id,
              label: option.label,
              value: option.value,
              isOther: option.isOther,
            })),
          conditionalOnKey: conditionQuestionId
            ? questionKeyById.get(conditionQuestionId) ?? null
            : null,
          conditionalValue,
        };
      }),
    };
  }

  private mapEnum<T extends string>(values: readonly T[], raw: unknown, fallback: T): T {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
      return values[raw] ?? fallback;
    }

    return typeof raw === 'string' && values.includes(raw as T) ? (raw as T) : fallback;
  }
}
