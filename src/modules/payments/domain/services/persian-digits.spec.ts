import { normalizePersianDigits } from './persian-digits';

describe('normalizePersianDigits', () => {
  it('maps Persian digits to ASCII', () => {
    expect(normalizePersianDigits('۰۰۱۳۵۴۲۴۱۹')).toBe('0013542419');
  });

  it('maps Arabic-Indic digits to ASCII', () => {
    expect(normalizePersianDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('leaves ASCII digits unchanged', () => {
    expect(normalizePersianDigits('0013542419')).toBe('0013542419');
  });
});
