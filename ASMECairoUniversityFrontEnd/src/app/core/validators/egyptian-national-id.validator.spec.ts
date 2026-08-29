import { FormControl } from '@angular/forms';
import { egyptianNationalIdValidator } from './egyptian-national-id.validator';

describe('egyptianNationalIdValidator', () => {
  it('accepts a structurally valid Egyptian National ID', () => {
    expect(egyptianNationalIdValidator(new FormControl('30101011234567'))).toBeNull();
  });

  it.each([
    '40101011234567',
    '30113311234567',
    '30101019934567',
    '3010101123456',
    '3010101123456A',
  ])('rejects invalid structure: %s', (value) => {
    expect(egyptianNationalIdValidator(new FormControl(value))).toEqual({
      egyptianNationalId: true,
    });
  });
});
