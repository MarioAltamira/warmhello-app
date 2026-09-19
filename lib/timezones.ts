export type TimeZoneOption = {
  value: string;
  label: string;
};

export const timeZoneOptions: TimeZoneOption[] = [
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Toronto", label: "Eastern Time (Toronto)" },
  { value: "America/Halifax", label: "Atlantic Time (Halifax)" },
  { value: "America/St_Johns", label: "Newfoundland (St. John's)" },
  { value: "America/Sao_Paulo", label: "Brazil (Sao Paulo)" },
  { value: "Atlantic/Azores", label: "Azores" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Europe/Athens", label: "Eastern European Time (Athens)" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "UAE (Dubai)" },
  { value: "Asia/Karachi", label: "Pakistan (Karachi)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Dhaka", label: "Bangladesh (Dhaka)" },
  { value: "Asia/Bangkok", label: "Thailand (Bangkok)" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Australia/Sydney", label: "Eastern Australia (Sydney)" },
  { value: "Pacific/Auckland", label: "New Zealand (Auckland)" },
];

const legacyLabelToIana: Record<string, string> = {
  "Eastern Time (US/Canada), Peru, Colombia, Panama": "America/Toronto",
  "Central Time (US/Canada/Mexico), Central America": "America/Chicago",
  "Mountain Time (US/Canada/Mexico)": "America/Denver",
  "Pacific Time (US/Canada/Mexico)": "America/Los_Angeles",
  "Atlantic Time (Canada), Venezuela, Bolivia, Chile": "America/Halifax",
  "Newfoundland (Canada)": "America/St_Johns",
  "Greenwich Mean Time (UK), Portugal, Iceland, West Africa": "Europe/London",
  "Central European Time (Germany, France, Italy, etc.), Nigeria": "Europe/Paris",
  "Eastern European Time, South Africa, Israel, Egypt": "Europe/Athens",
  "Moscow, Saudi Arabia, East Africa (Kenya, Ethiopia)": "Europe/Moscow",
  "UAE, Azerbaijan, Armenia, Mauritius": "Asia/Dubai",
  "Pakistan, Uzbekistan, Maldives": "Asia/Karachi",
  "India, Sri Lanka": "Asia/Kolkata",
  "Bangladesh, Kazakhstan": "Asia/Dhaka",
  "Thailand, Indonesia (West), Vietnam": "Asia/Bangkok",
  "China, Singapore, Philippines, Western Australia": "Asia/Shanghai",
  "Japan, South Korea": "Asia/Tokyo",
  "Eastern Australia (Sydney/Melbourne), Papua New Guinea": "Australia/Sydney",
  "New Zealand, Fiji, Marshall Islands": "Pacific/Auckland",
};

export function normalizeTimeZone(timeZone?: string | null) {
  if (!timeZone) {
    return "America/Toronto";
  }

  if (timeZone.includes("/")) {
    return timeZone;
  }

  return legacyLabelToIana[timeZone] ?? "America/Toronto";
}

