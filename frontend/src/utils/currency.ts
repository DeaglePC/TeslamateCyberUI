// TeslaMate stores charging costs as plain numbers with no currency attached,
// so the currency used for display is a CyberUI setting.

/** ISO 4217 codes offered in Settings. */
export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CNY', 'CAD', 'AUD', 'NZD', 'CHF', 'NOK', 'SEK', 'DKK', 'ISK',
  'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'ILS', 'AED', 'SAR', 'ZAR', 'INR', 'JPY', 'KRW',
  'HKD', 'TWD', 'SGD', 'MYR', 'THB', 'MXN', 'BRL', 'CLP',
] as const;

const EURO_REGIONS = [
  'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
];

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CN: 'CNY', CA: 'CAD', AU: 'AUD', NZ: 'NZD', CH: 'CHF', LI: 'CHF',
  NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  TR: 'TRY', IL: 'ILS', AE: 'AED', SA: 'SAR', ZA: 'ZAR', IN: 'INR', JP: 'JPY', KR: 'KRW',
  HK: 'HKD', TW: 'TWD', SG: 'SGD', MY: 'MYR', TH: 'THB', MX: 'MXN', BR: 'BRL', CL: 'CLP',
  ...Object.fromEntries(EURO_REGIONS.map((region) => [region, 'EUR'])),
};

// For locales without a region part, e.g. "zh" or "de"
const LANGUAGE_CURRENCY: Record<string, string> = {
  zh: 'CNY', ja: 'JPY', ko: 'KRW', de: 'EUR', fr: 'EUR', es: 'EUR', it: 'EUR', nl: 'EUR',
  nb: 'NOK', no: 'NOK', sv: 'SEK', da: 'DKK', pl: 'PLN', cs: 'CZK', hu: 'HUF', tr: 'TRY',
};

export function isValidCurrency(code: unknown): code is string {
  if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) return false;
  try {
    new Intl.NumberFormat(undefined, { style: 'currency', currency: code });
    return true;
  } catch {
    return false;
  }
}

/** Best guess from the browser locale; only used until the user picks one. */
export function guessCurrency(): string {
  const locale = typeof navigator !== 'undefined' ? navigator.language : '';
  if (locale) {
    const [language, ...rest] = locale.split('-');
    const region = rest.find((part) => /^[A-Za-z]{2}$/.test(part))?.toUpperCase();
    if (region && REGION_CURRENCY[region]) return REGION_CURRENCY[region];
    const byLanguage = LANGUAGE_CURRENCY[language.toLowerCase()];
    if (byLanguage) return byLanguage;
  }
  return 'USD';
}

/** "GBP (£)" style label for the picker. */
export function currencyLabel(code: string): string {
  try {
    const symbol = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value;
    return symbol && symbol !== code ? `${code} (${symbol})` : code;
  } catch {
    return code;
  }
}
