import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MainSegmentRegistrationSubmission,
  RegistrationSchema,
  RegistrationSubmissionResponse,
} from '../models/registration.model';

export const DEFAULT_REGISTRATION_SCHEMA: RegistrationSchema = {
  version: 1,
  consentNoticeVersion: '2026.1',
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
  private readonly baseUrl = `${environment.apiUrl}/main-segments`;

  getRegistrationSchema(year: number): Observable<RegistrationSchema> {
    return this.http
      .get<RegistrationSchema>(`${this.baseUrl}/${year}/registration-schema`)
      .pipe(catchError(() => of(DEFAULT_REGISTRATION_SCHEMA)));
  }

  submitRegistration(
    year: number,
    submission: MainSegmentRegistrationSubmission
  ): Observable<RegistrationSubmissionResponse> {
    const formData = new FormData();

    // Append structured payload as JSON
    const payloadData = {
      nameEnglish: submission.nameEnglish,
      nameArabic: submission.nameArabic,
      email: submission.email,
      phoneNumber: submission.phoneNumber,
      gender: submission.gender,
      nationalId: submission.nationalId,
      universityId: submission.universityId,
      universityName: submission.universityName,
      universityOtherName: submission.universityOtherName,
      isUniversityOther: Boolean(submission.isUniversityOther),
      facultyOfferingId: submission.facultyOfferingId,
      facultyName: submission.facultyName,
      facultyOtherName: submission.facultyOtherName,
      isFacultyOther: Boolean(submission.isFacultyOther),
      departmentId: submission.departmentId,
      departmentName: submission.departmentName,
      departmentOtherName: submission.departmentOtherName,
      isDepartmentOther: Boolean(submission.isDepartmentOther),
      graduationYear: submission.graduationYear,
      schemaVersion: submission.schemaVersion,
      consentNoticeVersion: submission.consentNoticeVersion,
      answers: submission.answers,
    };

    formData.append('data', JSON.stringify(payloadData));

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
      formData
    );
  }
}
