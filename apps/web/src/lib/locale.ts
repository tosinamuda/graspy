/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Countries and Languages supported by graspy
 * Uses Intl API to support all countries while prioritizing crisis zones
 */

export interface Country {
  code: string;
  languages: string[];
}

/**
 * Supported language codes - names generated dynamically via Intl API
 */
export const SUPPORTED_LANGUAGES = [
  "ar", // Arabic
  "en", // English
  "fr", // French
  "es", // Spanish
  "yo", // Yoruba
  "ha", // Hausa
  "ig", // Igbo
  "ps", // Pashto
  "fa", // Dari/Persian
  "so", // Somali
  "sw", // Swahili
  "am", // Amharic
  "ku", // Kurdish
  "ur", // Urdu
  "bn", // Bengali
  "pt", // Portuguese
  "hi", // Hindi
  "zh", // Chinese
  "ru", // Russian
  "de", // German
  "it", // Italian
  "ja", // Japanese
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Get all available countries from Intl API
 * Returns crisis zones first, then all other countries alphabetically
 */
export function getAllCountries(): Country[] {
  // Get all country codes from Intl.supportedValuesOf (if available) or fallback to common ISO codes
  let allCountryCodes: string[] = [];

  try {
    // @ts-ignore - supportedValuesOf is not in all TypeScript versions yet
    if (Intl.supportedValuesOf) {
      // @ts-ignore
      allCountryCodes = Intl.supportedValuesOf("region");
    } else {
      // Fallback: comprehensive list of ISO 3166-1 alpha-2 country codes
      allCountryCodes = getAllCountryCodesFallback();
    }
  } catch {
    allCountryCodes = getAllCountryCodesFallback();
  }

  // Create country objects for all countries with default language mapping
  const countries: Country[] = allCountryCodes.map((code) => ({
    code,
    languages: getDefaultLanguagesForCountry(code),
  }));

  // Sort all countries alphabetically by name
  countries.sort((a, b) => {
    const nameA = getCountryName(a.code);
    const nameB = getCountryName(b.code);
    return nameA.localeCompare(nameB);
  });

  return countries;
}

/**
 * Fallback list of ISO 3166-1 alpha-2 country codes
 */
function getAllCountryCodesFallback(): string[] {
  return [
    "AD",
    "AE",
    "AF",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AQ",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BT",
    "BV",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CK",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "EH",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FK",
    "FM",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GF",
    "GG",
    "GH",
    "GI",
    "GL",
    "GM",
    "GN",
    "GP",
    "GQ",
    "GR",
    "GS",
    "GT",
    "GU",
    "GW",
    "GY",
    "HK",
    "HM",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IM",
    "IN",
    "IO",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JE",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KY",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MF",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MP",
    "MQ",
    "MR",
    "MS",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NC",
    "NE",
    "NF",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NU",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PF",
    "PG",
    "PH",
    "PK",
    "PL",
    "PM",
    "PN",
    "PR",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SX",
    "SY",
    "SZ",
    "TC",
    "TD",
    "TF",
    "TG",
    "TH",
    "TJ",
    "TK",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "UM",
    "US",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VG",
    "VI",
    "VN",
    "VU",
    "WF",
    "WS",
    "YE",
    "YT",
    "ZA",
    "ZM",
    "ZW",
  ];
}

/**
 * Get default languages for a country based on common mappings
 */
function getDefaultLanguagesForCountry(countryCode: string): string[] {
  // Common country -> language mappings
  // Defaulting to English ('en') as a secondary option for most
  const countryLanguageMap: Record<string, string[]> = {
    // North America
    US: ["en", "es"],
    CA: ["en", "fr"],
    MX: ["es", "en"],

    // Europe
    GB: ["en"],
    IE: ["en", "ga"],
    FR: ["fr", "en"],
    DE: ["de", "en"],
    IT: ["it", "en"],
    ES: ["es", "en"],
    PT: ["pt", "en"],
    NL: ["nl", "en"],
    BE: ["nl", "fr", "en"],
    LU: ["fr", "de", "lb", "en"],
    CH: ["de", "fr", "it", "en"],
    AT: ["de", "en"],
    SE: ["sv", "en"],
    NO: ["no", "en"],
    DK: ["da", "en"],
    FI: ["fi", "sv", "en"],
    IS: ["is", "en"],
    PL: ["pl", "en"],
    CZ: ["cs", "en"],
    SK: ["sk", "en"],
    HU: ["hu", "en"],
    RO: ["ro", "en"],
    BG: ["bg", "en"],
    GR: ["el", "en"],
    RU: ["ru", "en"],
    UA: ["uk", "ru", "en"],
    BY: ["be", "ru", "en"],
    EE: ["et", "en"],
    LV: ["lv", "en"],
    LT: ["lt", "en"],
    HR: ["hr", "en"],
    RS: ["sr", "en"],
    SI: ["sl", "en"],
    BA: ["bs", "hr", "sr", "en"],
    MK: ["mk", "en"],
    AL: ["sq", "en"],
    TR: ["tr", "en"],

    // Asia
    CN: ["zh", "en"],
    TW: ["zh", "en"],
    JP: ["ja", "en"],
    KR: ["ko", "en"],
    IN: ["hi", "en", "bn", "te", "mr", "ta", "ur", "gu", "kn", "ml"],
    PK: ["ur", "en"],
    BD: ["bn", "en"],
    LK: ["si", "ta", "en"],
    NP: ["ne", "en"],
    ID: ["id", "en"],
    PH: ["en", "fil"],
    VN: ["vi", "en"],
    TH: ["th", "en"],
    MY: ["ms", "en", "zh", "ta"],
    SG: ["en", "zh", "ms", "ta"],
    MM: ["my", "en"],
    KH: ["km", "en"],
    LA: ["lo", "en"],
    MN: ["mn", "en"],
    AF: ["ps", "fa", "en"],
    IR: ["fa", "en"],
    IQ: ["ar", "ku", "en"],
    SY: ["ar", "en", "ku"],
    LB: ["ar", "en", "fr"],
    JO: ["ar", "en"],
    IL: ["he", "ar", "en"],
    SA: ["ar", "en"],
    AE: ["ar", "en"],
    QA: ["ar", "en"],
    KW: ["ar", "en"],
    BH: ["ar", "en"],
    OM: ["ar", "en"],
    YE: ["ar", "en"],
    KZ: ["kk", "ru", "en"],
    UZ: ["uz", "ru", "en"],
    TM: ["tk", "ru", "en"],
    KG: ["ky", "ru", "en"],
    TJ: ["tg", "ru", "en"],
    AZ: ["az", "ru", "en"],
    AM: ["hy", "en"],
    GE: ["ka", "en"],

    // South America
    BR: ["pt", "en"],
    AR: ["es", "en"],
    CO: ["es", "en"],
    PE: ["es", "en"],
    VE: ["es", "en"],
    CL: ["es", "en"],
    EC: ["es", "en"],
    BO: ["es", "qu", "ay", "en"],
    PY: ["es", "gn", "en"],
    UY: ["es", "en"],

    // Central America & Caribbean
    CR: ["es", "en"],
    PA: ["es", "en"],
    GT: ["es", "en"],
    HN: ["es", "en"],
    SV: ["es", "en"],
    NI: ["es", "en"],
    CU: ["es", "en"],
    DO: ["es", "en"],
    HT: ["fr", "ht", "en"],
    JM: ["en"],
    TT: ["en"],
    BB: ["en"],

    // Oceania
    AU: ["en"],
    NZ: ["en", "mi"],
    FJ: ["en", "fj", "hi"],
    PG: ["en", "tpi", "ho"], // Papua New Guinea

    // Africa
    EG: ["ar", "en"],
    LY: ["ar", "en"],
    TN: ["ar", "fr", "en"],
    DZ: ["ar", "fr", "en"],
    MA: ["ar", "fr", "en"],
    SD: ["ar", "en"],
    SS: ["en", "ar"],
    ET: ["am", "en"],
    SO: ["so", "ar", "en"],
    KE: ["sw", "en"],
    TZ: ["sw", "en"],
    UG: ["en", "sw"],
    RW: ["rw", "en", "fr"],
    BI: ["fr", "rn", "en"],
    NG: ["en", "yo", "ha", "ig"],
    GH: ["en"],
    ZA: ["en", "af", "zu", "xh"],
    CM: ["fr", "en"],
    TD: ["fr", "ar", "en"],
    SN: ["fr", "wo", "en"],
    CI: ["fr", "en"],
    BJ: ["fr", "en"],
    TG: ["fr", "en"],
    BF: ["fr", "en"], // Burkina Faso
    NE: ["fr", "en"],
    ML: ["fr", "en"],
    GN: ["fr", "en"],
    CD: ["fr", "sw", "ln", "en"],
    CG: ["fr", "ln", "en"],
    GA: ["fr", "en"],
    AO: ["pt", "en"],
    MZ: ["pt", "en"],
    ZW: ["en", "sn", "nd"],
    ZM: ["en"],
    MW: ["en", "ny"],
    BW: ["en", "tn"],
    NA: ["en", "af"],
    MG: ["mg", "fr", "en"],
    MU: ["en", "fr"], // Mauritius
    SC: ["en", "fr", "crs"], // Seychelles
    CV: ["pt", "en"],

    // Default fallback is handled below
    // Additional Countries
    AD: ["ca", "es", "fr", "en"], // Andorra
    AG: ["en"], // Antigua
    AI: ["en"], // Anguilla
    AQ: ["en"], // Antarctica
    AS: ["en", "sm"], // American Samoa
    AW: ["nl", "en"], // Aruba
    AX: ["sv", "fi", "en"], // Aland
    BL: ["fr", "en"], // St Barthelemy
    BM: ["en"], // Bermuda
    BN: ["ms", "en"], // Brunei
    BQ: ["nl", "en"], // Bonaire
    BS: ["en"], // Bahamas
    BT: ["dz", "en"], // Bhutan
    BV: ["no"], // Bouvet
    BZ: ["en", "es"], // Belize
    CC: ["en"], // Cocos
    CF: ["fr", "sg", "en"], // Central African Republic
    CK: ["en", "rar"], // Cook Islands
    CW: ["nl", "en"], // Curacao
    CX: ["en"], // Christmas Is
    CY: ["el", "tr", "en"], // Cyprus
    DJ: ["fr", "ar", "en"], // Djibouti
    DM: ["en"], // Dominica
    EH: ["ar", "es", "fr", "en"], // Western Sahara
    ER: ["ti", "ar", "en"], // Eritrea
    FK: ["en"], // Falkland
    FM: ["en"], // Micronesia
    FO: ["fo", "da", "en"], // Faroe
    GD: ["en"], // Grenada
    GF: ["fr"], // French Guiana
    GG: ["en"], // Guernsey
    GI: ["en"], // Gibraltar
    GL: ["kl", "da", "en"], // Greenland
    GM: ["en"], // Gambia
    GP: ["fr"], // Guadeloupe
    GQ: ["es", "fr", "pt", "en"], // Equatorial Guinea
    GS: ["en"], // S. Georgia
    GU: ["en", "ch"], // Guam
    GW: ["pt", "en"], // Guinea-Bissau
    GY: ["en"], // Guyana
    HK: ["zh", "en"], // Hong Kong
    HM: ["en"], // Heard Is
    IM: ["en"], // Isle of Man
    IO: ["en"], // British Indian Ocean
    JE: ["en", "fr"], // Jersey
    KI: ["en", "gil"], // Kiribati
    KM: ["ar", "fr"], // Comoros
    KN: ["en"], // St Kitts
    KP: ["ko"], // North Korea
    KY: ["en"], // Cayman
    LC: ["en"], // St Lucia
    LI: ["de", "en"], // Liechtenstein
    LR: ["en"], // Liberia
    LS: ["en", "st"], // Lesotho
    MC: ["fr", "en"], // Monaco
    MD: ["ro", "ru", "en"], // Moldova
    ME: ["sr", "en"], // Montenegro
    MF: ["fr", "en"], // St Martin
    MH: ["en", "mh"], // Marshall Is
    MO: ["zh", "pt", "en"], // Macau
    MP: ["en"], // Northern Mariana
    MQ: ["fr"], // Martinique
    MR: ["ar", "fr"], // Mauritania
    MS: ["en"], // Montserrat
    MT: ["mt", "en"], // Malta
    MV: ["dv", "en"], // Maldives
    NC: ["fr"], // New Caledonia
    NF: ["en"], // Norfolk
    NR: ["en"], // Nauru
    NU: ["en"], // Niue
    PF: ["fr"], // French Polynesia
    PM: ["fr"], // St Pierre
    PN: ["en"], // Pitcairn
    PR: ["es", "en"], // Puerto Rico
    PS: ["ar", "en"], // Palestine
    PW: ["en", "pau"], // Palau
    RE: ["fr"], // Reunion
    SB: ["en"], // Solomon Is
    SH: ["en"], // St Helena
    SJ: ["no"], // Svalbard
    SL: ["en"], // Sierra Leone
    SM: ["it", "en"], // San Marino
    SR: ["nl", "en"], // Suriname
    ST: ["pt"], // Sao Tome
    SX: ["nl", "en"], // Sint Maarten
    SZ: ["en", "ss"], // Eswatini
    TC: ["en"], // Turks Caicos
    TF: ["fr"], // French Southern
    TK: ["en"], // Tokelau
    TL: ["pt", "tet", "en"], // Timor-Leste
    TO: ["en", "to"], // Tonga
    TV: ["en"], // Tuvalu
    UM: ["en"], // US Minor Outlying
    VA: ["it", "la", "en"], // Vatican
    VC: ["en"], // St Vincent
    VG: ["en"], // British Virgin
    VI: ["en"], // US Virgin
    VU: ["bi", "fr", "en"], // Vanuatu
    WF: ["fr"], // Wallis
    WS: ["sm", "en"], // Samoa
    YT: ["fr"], // Mayotte
  };

  return countryLanguageMap[countryCode] || ["en"];
}

/**
 * Get language name in English using Intl API
 */
export function getLanguageName(
  languageCode: string,
  displayLang: string = "en"
): string {
  try {
    const displayNames = new Intl.DisplayNames([displayLang], {
      type: "language",
    });
    return displayNames.of(languageCode) || languageCode;
  } catch {
    return languageCode;
  }
}

/**
 * Get language name in its native script using Intl API
 */
export function getLanguageNativeName(languageCode: string): string {
  try {
    const displayNames = new Intl.DisplayNames([languageCode], {
      type: "language",
    });
    return displayNames.of(languageCode) || languageCode;
  } catch {
    return languageCode;
  }
}

/**
 * Get country name using Intl API
 */
export function getCountryName(
  countryCode: string,
  displayLang: string = "en"
): string {
  // Custom overrides for consistency
  const customNames: Record<string, string> = {
    OTHER: "Other",
    PS: "Palestine",
  };

  if (customNames[countryCode]) {
    return customNames[countryCode];
  }

  try {
    const displayNames = new Intl.DisplayNames([displayLang], {
      type: "region",
    });
    return displayNames.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

/**
 * Get formatted language info for display
 */
export function getLanguageInfo(languageCode: string) {
  return {
    code: languageCode,
    name: getLanguageName(languageCode),
    nativeName: getLanguageNativeName(languageCode),
  };
}
