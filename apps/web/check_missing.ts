import { getAllCountries } from "./src/lib/locale";

const countries = getAllCountries();
// We need to access the internal map or just check the result of getAllCountries which uses the map.
// Actually getAllCountries uses the map.
// Wait, getAllCountries implementation:
/*
  const countries: Country[] = allCountryCodes.map((code) => ({
    code,
    languages: getDefaultLanguagesForCountry(code),
  }));
*/
// getDefaultLanguagesForCountry returns ["en"] if not found.
// So I can check which countries have only ["en"] AND are not natively English speaking (hard to tell script-wise easily, but I can list them).

// Better yet: I will read the file content of constants.ts and parse the keys of the map using regex in this script, and compare with the list in fallback.

import * as fs from "fs";
import * as path from "path";

const constantsPath = path.join(process.cwd(), "src/lib/constants.ts");
const content = fs.readFileSync(constantsPath, "utf-8");

// Extract the fallback list
const fallbackMatch = content.match(
  /function getAllCountryCodesFallback\(\): string\[\] \{[\s\S]*?return \[([\s\S]*?)\];/
);
if (!fallbackMatch) {
  console.error("Could not find fallback list");
  process.exit(1);
}
const fallbackList = fallbackMatch[1]
  .split(",")
  .map((s) => s.trim().replace(/"/g, ""))
  .filter((s) => s.length === 2);

// Extract the map keys
const mapMatch = content.match(
  /const countryLanguageMap: Record<string, string\[\]> = \{([\s\S]*?)\};/
);
if (!mapMatch) {
  console.error("Could not find map");
  process.exit(1);
}
const mapContent = mapMatch[1];
const mapKeys = new Set();
const mapKeyRegex = /([A-Z]{2}):/g;
let match;
while ((match = mapKeyRegex.exec(mapContent)) !== null) {
  mapKeys.add(match[1]);
}

const missing = fallbackList.filter((code) => !mapKeys.has(code));

console.log("Missing codes:", missing.join(", "));
console.log("Total missing:", missing.length);
