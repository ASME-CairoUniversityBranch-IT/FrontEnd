export type RegistrationQuestionType =
  'ShortText' | 'LongText' | 'SingleChoice' | 'MultipleChoice' | 'YesNo' | 'ConditionalTeam';

export interface RegistrationQuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface RegistrationQuestion {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: RegistrationQuestionType;
  isRequired: boolean;
  options?: RegistrationQuestionOption[] | null;
  placeholder?: string | null;
  conditionalOnKey?: string | null;
  conditionalValue?: string | boolean | null;
}

export interface RegistrationSchema {
  version: number;
  consentNoticeVersion: string;
  questions: RegistrationQuestion[];
}

export interface RegistrationAnswerSubmission {
  questionId: string;
  questionKey: string;
  answerText?: string | null;
  selectedOptions?: string[] | null;
  booleanAnswer?: boolean | null;
}

export interface MainSegmentRegistrationSubmission {
  // Step 1: Details
  nameEnglish: string;
  nameArabic: string;
  email: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | string;
  nationalId: string;

  // Step 2: Education
  universityId: string;
  universityName?: string | null;
  universityOtherName?: string | null;
  isUniversityOther?: boolean;

  facultyOfferingId?: string | null;
  facultyName?: string | null;
  facultyOtherName?: string | null;
  isFacultyOther?: boolean;

  departmentId?: string | null;
  departmentName?: string | null;
  departmentOtherName?: string | null;
  isDepartmentOther?: boolean;

  graduationYear: number;

  // Step 3: Questions
  schemaVersion: number;
  consentNoticeVersion: string;
  answers: RegistrationAnswerSubmission[];

  // Files
  nationalIdPhoto: File;
  cvFile: File;
  universityIdPhoto: File;
}

export interface RegistrationSubmissionResponse {
  referenceNumber: string;
  status: 'Received' | 'UnderReview' | 'Confirmed' | 'Accepted' | string;
  submittedAt: string;
  editionYear: number;
  message?: string;
}

export type SubmissionWorkflowType = 'InstantConfirmation' | 'ReviewFirst';

export interface RegistrationSettings {
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  availabilityOverride?: boolean | null;
  capacity?: number | null;
  minGraduationYear: number;
  maxGraduationYear: number;
  eligibilityText?: string | null;
  privacyNoticeVersion: string;
  privacyNoticeUrl?: string | null;
  submissionWorkflow: SubmissionWorkflowType;
}

export interface AdminRegistrationQuestion {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: RegistrationQuestionType;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  placeholder?: string | null;
  maxLength?: number | null;
  options?: RegistrationQuestionOption[] | null;
  allowOther?: boolean;
  conditionalOnKey?: string | null;
  conditionalValue?: string | boolean | null;
}

export interface AdminRegistrationSchemaResponse {
  version: number;
  isPublished: boolean;
  publishedVersion?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  settings: RegistrationSettings;
  questions: AdminRegistrationQuestion[];
}

export interface UpdateRegistrationSchemaRequest {
  settings: RegistrationSettings;
  questions: AdminRegistrationQuestion[];
}

export const DEFAULT_ADMIN_SCHEMA: AdminRegistrationSchemaResponse = {
  version: 1,
  isPublished: true,
  publishedVersion: 1,
  publishedAt: new Date().toISOString(),
  settings: {
    registrationOpensAt: '2026-09-01T00:00:00Z',
    registrationClosesAt: '2026-10-10T23:59:59Z',
    availabilityOverride: null,
    capacity: 500,
    minGraduationYear: 2020,
    maxGraduationYear: 2035,
    eligibilityText:
      'Undergraduate and recent graduate engineering students across Egyptian universities.',
    privacyNoticeVersion: '2026.1',
    privacyNoticeUrl: 'https://asme-cu.org/privacy',
    submissionWorkflow: 'ReviewFirst',
  },
  questions: [
    {
      id: 'q-source',
      key: 'referral_source',
      title: 'How did you hear about Main Segment 2026?',
      description: 'Let us know how you discovered this edition.',
      type: 'SingleChoice',
      isRequired: true,
      isActive: true,
      displayOrder: 1,
      allowOther: true,
      options: [
        {
          id: 'opt-fb',
          label: 'Facebook / Social Media',
          value: 'SocialMedia',
        },
        {
          id: 'opt-friends',
          label: 'University Friends / Colleagues',
          value: 'Friends',
        },
        {
          id: 'opt-prof',
          label: 'Faculty Professors / Teaching Assistants',
          value: 'Professors',
        },
        {
          id: 'opt-booth',
          label: 'On-Campus ASME Booth',
          value: 'OnCampusBooth',
        },
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
      isActive: true,
      displayOrder: 2,
      options: [
        {
          id: 'track-design',
          label: 'Mechanical & CAD Design',
          value: 'MechanicalDesign',
        },
        {
          id: 'track-thermal',
          label: 'Thermal & Fluid Systems',
          value: 'ThermalFluids',
        },
        {
          id: 'track-mechatronics',
          label: 'Robotics & Mechatronics',
          value: 'Mechatronics',
        },
        {
          id: 'track-mfg',
          label: 'Manufacturing & Materials',
          value: 'Manufacturing',
        },
        {
          id: 'track-energy',
          label: 'Renewable & Power Energy',
          value: 'Energy',
        },
        {
          id: 'track-auto',
          label: 'Automotive & Aerospace',
          value: 'Automotive',
        },
      ],
    },
    {
      id: 'q-prev-attended',
      key: 'previous_attendance',
      title: 'Have you attended a previous ASME Cairo University Main Segment edition?',
      description: 'Helps us understand returning audience demographics.',
      type: 'YesNo',
      isRequired: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 'q-join-asme',
      key: 'join_asme_cu',
      title: 'Would you like to join the ASME Cairo University Student Branch team?',
      description:
        'Open to undergraduate engineering students who want to develop leadership and technical skills.',
      type: 'YesNo',
      isRequired: true,
      isActive: true,
      displayOrder: 4,
    },
    {
      id: 'q-team-interest',
      key: 'asme_team_preference',
      title: 'Which ASME committee or team are you interested in joining?',
      description: 'Select your preferred branch team.',
      type: 'SingleChoice',
      isRequired: true,
      isActive: true,
      displayOrder: 5,
      conditionalOnKey: 'join_asme_cu',
      conditionalValue: true,
      options: [
        {
          id: 'team-tech',
          label: 'Technical Projects & Workshops',
          value: 'Technical',
        },
        { id: 'team-it', label: 'IT & Software Development', value: 'IT' },
        {
          id: 'team-pr',
          label: 'Public Relations & Partnerships',
          value: 'PR',
        },
        {
          id: 'team-media',
          label: 'Media, Graphic Design & Marketing',
          value: 'Media',
        },
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
      isActive: true,
      displayOrder: 6,
      placeholder: 'Describe what you hope to gain from this experience...',
    },
  ],
};

/* ── Milestone 7: Registration Review, Document & Export Models ── */
export type RegistrationStatus =
  'Submitted' | 'UnderReview' | 'Accepted' | 'Waitlisted' | 'Rejected' | 'Cancelled';

export interface RegistrationListFilterParams {
  search?: string;
  status?: RegistrationStatus | 'All';
  universityId?: string;
  facultyId?: string;
  graduationYear?: number | null;
  submittedFrom?: string | null;
  submittedTo?: string | null;
  page: number;
  pageSize: number;
}

export interface AdminRegistrationListItem {
  id: string;
  referenceNumber: string;
  nameEnglish: string;
  nameArabic: string;
  email: string;
  phoneNumber: string;
  universityName: string;
  facultyName: string;
  graduationYear: number;
  status: RegistrationStatus;
  submittedAt: string;
}

export interface RegistrationStatusCount {
  all: number;
  submitted: number;
  underReview: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
  cancelled: number;
}

export interface AdminRegistrationListResponse {
  items: AdminRegistrationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: RegistrationStatusCount;
}

export interface RegistrationStatusHistoryEntry {
  id: string;
  fromStatus: RegistrationStatus | null;
  toStatus: RegistrationStatus | null;
  changedBy: string;
  changedAt: string;
  note?: string | null;
}

export interface AdminRegistrationAnswerDetail {
  questionId: string;
  questionKey: string;
  questionTitle: string;
  questionType: string;
  answerText?: string | null;
  selectedOptions?: string[] | null;
  booleanAnswer?: boolean | null;
}

export interface AdminRegistrationAcademicSnapshot {
  universityName: string;
  facultyName: string;
  departmentName?: string | null;
  isUniversityOther: boolean;
  isFacultyOther: boolean;
  isDepartmentOther: boolean;
  graduationYear: number;
}

export interface AdminRegistrationDetailResponse {
  id: string;
  editionYear: number;
  referenceNumber: string;
  status: RegistrationStatus;
  submittedAt: string;
  updatedAt: string;
  nameEnglish: string;
  nameArabic: string;
  email: string;
  phoneNumber: string;
  gender: string;
  maskedNationalId: string;
  academicSnapshot: AdminRegistrationAcademicSnapshot;
  answers: AdminRegistrationAnswerDetail[];
  hasNationalIdPhoto: boolean;
  hasUniversityIdPhoto: boolean;
  hasCvFile: boolean;
  documents: AdminRegistrationDocumentDetail[];
  statusHistory: RegistrationStatusHistoryEntry[];
}

export type RegistrationDocumentType = 'NationalIdPhoto' | 'UniversityIdPhoto' | 'Cv';

export interface AdminRegistrationDocumentDetail {
  documentType: RegistrationDocumentType;
  displayName: string;
  contentType: string;
  byteSize: number;
  storedAt: string;
}

export interface UpdateRegistrationStatusRequest {
  status: RegistrationStatus;
  note?: string | null;
}

export type PrivateDocumentType = 'national-id' | 'university-id' | 'cv';

/* Exact wire contracts returned by Backend#8. Keep private object metadata out of these types. */
export interface RegistrationListApiItem {
  id: string;
  registrationId: string;
  reference: string;
  status: RegistrationStatus;
  submittedAt: string;
  nameEnglish: string;
  nameArabic: string;
  email: string;
  phoneNumber: string;
  universityId?: string | null;
  university: string;
  facultyId?: string | null;
  facultyOfferingId?: string | null;
  faculty: string;
  departmentId?: string | null;
  department: string;
  graduationYear: number;
  documentCount: number;
  answerCount: number;
}

export interface RegistrationListApiResponse {
  items: RegistrationListApiItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RegistrationSummaryApiResponse {
  total: number;
  totalCount: number;
  counts: Partial<Record<RegistrationStatus, number>>;
  statusCounts: Array<{ status: RegistrationStatus; count: number }>;
}

export interface RegistrationAnswerApiResponse {
  questionId: string;
  questionKey: string;
  prompt: string;
  type: string;
  isRequired: boolean;
  answerJson: string;
  optionsSnapshotJson: string;
}

export interface RegistrationStatusHistoryApiResponse {
  fromStatus: RegistrationStatus | null;
  toStatus: RegistrationStatus | null;
  note?: string | null;
  actorAdminId?: string | null;
  actorAdminName?: string | null;
  createdAt: string;
}

export interface RegistrationDetailApiResponse {
  id: string;
  registrationId: string;
  editionYear: number;
  editionId: string;
  schemaId: string;
  schemaVersion: number;
  reference: string;
  status: RegistrationStatus;
  submittedAt: string;
  nameEnglish: string;
  nameArabic: string;
  email: string;
  phoneNumber: string;
  gender: string;
  nationalIdMasked: string;
  universityId?: string | null;
  university: string;
  universityArabicName?: string | null;
  universityOtherValue?: string | null;
  facultyOfferingId?: string | null;
  facultyId?: string | null;
  faculty: string;
  facultyArabicName?: string | null;
  facultyOtherValue?: string | null;
  departmentId?: string | null;
  department: string;
  departmentArabicName?: string | null;
  departmentOtherValue?: string | null;
  graduationYear: number;
  privacyNoticeVersion: string;
  privacyNoticeAccepted: boolean;
  privacyNoticeAcknowledgedAt: string;
  answers: RegistrationAnswerApiResponse[];
  documents: AdminRegistrationDocumentDetail[];
  statusHistory: RegistrationStatusHistoryApiResponse[];
}

export interface RegistrationStatusUpdateApiResponse {
  id: string;
  reference: string;
  status: RegistrationStatus;
  changedAt: string;
  note?: string | null;
}
