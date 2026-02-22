/**
 * Format a price in cents to a display string with currency.
 * Prices are stored as integers (cents): 1999 = 19.99 MAD
 */
export function formatPrice(priceInCents: number, currency = "MAD"): string {
  const amount = (priceInCents / 100).toFixed(2);

  if (currency === "MAD") {
    return `${amount} د.م.`;
  }

  return `${amount} ${currency}`;
}

/**
 * Format a price for input fields (just the number).
 */
export function formatPriceNumber(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2);
}

/**
 * Validate a Moroccan phone number.
 * Accepts: +212XXXXXXXXX or 0XXXXXXXXX
 */
export function isValidMoroccanPhone(phone: string): boolean {
  return /^(\+212|0)[0-9]{9}$/.test(phone);
}

/**
 * Format a Moroccan phone number for display.
 */
export function formatMoroccanPhone(phone: string): string {
  if (phone.startsWith("+212")) {
    const digits = phone.slice(4);

    return `+212 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  if (phone.startsWith("0")) {
    const digits = phone.slice(1);

    return `0${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  return phone;
}
