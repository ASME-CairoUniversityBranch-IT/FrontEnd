import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const VALID_GOVERNORATE_CODES = new Set([
  '01',
  '02',
  '03',
  '04',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '31',
  '32',
  '33',
  '34',
  '35',
  '88',
]);

/** Validates the documented century, birth-date, and governorate structure of an Egyptian ID. */
export const egyptianNationalIdValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!/^\d{14}$/.test(value)) return { egyptianNationalId: true };

  const century = value[0] === '2' ? 1900 : value[0] === '3' ? 2000 : null;
  if (century === null || !VALID_GOVERNORATE_CODES.has(value.slice(7, 9))) {
    return { egyptianNationalId: true };
  }

  const year = century + Number(value.slice(1, 3));
  const month = Number(value.slice(3, 5));
  const day = Number(value.slice(5, 7));
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return { egyptianNationalId: true };
  }

  return null;
};
