export interface ParsedCampaignPrompt {
  productName?: string;
  totalUnits?: number;
  kgPerUnit?: number;
  valuePerUnit?: number;
  originText?: string;
  namedCities: string[];
  countryHints: string[];
  cityCount?: number;
  windowStart?: string;
  windowEnd?: string;
  budgetCap?: number;
  preferSharedTrucks?: boolean;
  requireInsurance?: boolean;
  fundOnEscrow?: boolean;
  currencyCode?: string;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const splitList = (value: string): string[] =>
  value
    .split(/\s*(?:,|;|\band\b|\+)\s*/i)
    .map((part) => part.replace(/^(?:in|the|to)\s+/i, '').trim())
    .filter((part) => part.length > 1 && !/^\d+$/.test(part));

const nextMonthWindow = (from = new Date()) => {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 12));
  const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 2, 0, 12));
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
};

const thisMonthWindow = (from = new Date()) => {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12));
  const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0, 12));
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
};

const monthNamedWindow = (monthName: string, from = new Date()) => {
  const month = MONTHS[monthName.toLowerCase()];
  if (month == null) return nextMonthWindow(from);
  let year = from.getUTCFullYear();
  if (month < from.getUTCMonth()) year += 1;
  const start = new Date(Date.UTC(year, month, 1, 12));
  const end = new Date(Date.UTC(year, month + 1, 0, 12));
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
};

export function parseCampaignPrompt(prompt: string): ParsedCampaignPrompt {
  const text = (prompt || '').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const parsed: ParsedCampaignPrompt = { namedCities: [], countryHints: [] };

  const unitsMatch = text.match(/([\d,]{1,12})\s*(?:units?|pcs|pieces|cartons|crates|bags|pallets|bottles)/i);
  if (unitsMatch) parsed.totalUnits = Math.round(Number(unitsMatch[1].replace(/,/g, '')));

  const kgMatch = text.match(/([\d.]+)\s*kg(?:s)?(?:\s+per\s+unit)?/i);
  if (kgMatch) parsed.kgPerUnit = Number(kgMatch[1]);

  const valueMatch = text.match(/(?:value|worth)\s*(?:of\s*)?(?:USD|\$)?\s*([\d.]+)\s*(?:per\s+unit)?/i);
  if (valueMatch) parsed.valuePerUnit = Number(valueMatch[1]);

  const budgetMatch = text.match(/budget(?:\s+cap)?(?:\s+of)?\s*(?:USD|\$)?\s*([\d,]+)/i);
  if (budgetMatch) parsed.budgetCap = Number(budgetMatch[1].replace(/,/g, ''));

  const productMatch = text.match(
    /(?:units?|pcs|pieces)\s+of\s+(.+?)\s+(?:delivered|to be delivered|from|to|next|this|in\s+\d)/i,
  ) || text.match(/deliver(?:ing)?\s+(.+?)\s+(?:from|to)\b/i);
  if (productMatch) parsed.productName = productMatch[1].replace(/^\d[\d,]*\s*/, '').trim();

  const fromMatch = text.match(/\bfrom\s+([A-Za-z][A-Za-z .'-]{1,48}?)(?=\s+to\b|\s+warehouse\b|,|\.|$)/i);
  if (fromMatch) parsed.originText = fromMatch[1].replace(/\s+warehouse$/i, '').trim();

  const citiesInMatch = text.match(/(\d+)\s+cities?\s+in\s+(.+?)(?=\s+next|\s+this|\s+from|\s+by|\s+budget|\.|$)/i);
  const cityCountMatch = text.match(/(\d+)\s+cities/i);
  if (citiesInMatch) {
    parsed.cityCount = Number(citiesInMatch[1]);
    parsed.countryHints = splitList(citiesInMatch[2]);
  } else if (cityCountMatch) {
    parsed.cityCount = Number(cityCountMatch[1]);
  }

  const toNamed = text.match(
    /\bto\s+((?:[A-Za-z][A-Za-z .'-]{1,32}(?:,\s*|\s+and\s+))+[A-Za-z][A-Za-z .'-]{1,32})/i,
  );
  if (toNamed && !/cities?/i.test(toNamed[1])) {
    parsed.namedCities = splitList(toNamed[1]);
  }

  if (/\bnext month\b/.test(lower)) {
    Object.assign(parsed, nextMonthWindow());
  } else if (/\bthis month\b/.test(lower)) {
    Object.assign(parsed, thisMonthWindow());
  } else {
    const monthMatch = lower.match(/\bin\s+(january|february|march|april|may|june|july|august|september|october|november|december)/);
    if (monthMatch) Object.assign(parsed, monthNamedWindow(monthMatch[1]));
    else Object.assign(parsed, nextMonthWindow());
  }

  if (/\b(exclusive|ftl only|full truck)\b/.test(lower)) parsed.preferSharedTrucks = false;
  if (/\bno insurance|uninsured\b/.test(lower)) parsed.requireInsurance = false;
  if (/\bno escrow|no advance\b/.test(lower)) parsed.fundOnEscrow = false;
  if (/\b(rwf|kes|ugx|tzs|eur)\b/.test(lower)) parsed.currencyCode = lower.match(/\b(rwf|kes|ugx|tzs|eur)\b/)![1].toUpperCase();

  return parsed;
}

export { nextMonthWindow };
