export type RegistrationQuestionType =
  | 'ShortText'
  | 'LongText'
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'YesNo'
  | 'ConditionalTeam';

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
