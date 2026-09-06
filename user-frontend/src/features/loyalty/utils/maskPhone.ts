// Masks an Iranian mobile number for display, keeping the first 4 and last 2
// digits visible (enough for the user to recognize their own number) while
// hiding the middle. Returns the raw value unchanged if it doesn't look like
// a normal 11-digit Iranian mobile number, so we never mangle unexpected input.
export function maskPhoneForDisplay(phone: string): { prefix: string; suffix: string; maskedDigitCount: number } | null {
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length !== 11) return null;

  return {
    prefix: digitsOnly.slice(0, 4),
    suffix: digitsOnly.slice(-2),
    maskedDigitCount: digitsOnly.length - 6,
  };
}