/** Maps Persian/Arabic-Indic digits to ASCII for bank account / national ID inputs. */
export function normalizePersianDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - '۰'.charCodeAt(0)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - '٠'.charCodeAt(0)),
    );
}
