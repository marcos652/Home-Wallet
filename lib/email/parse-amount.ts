// "R$ 1.234,56" / "1.234,56" / "45,90" -> 1234.56 | 45.9
export function parseBrlAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  // Brazilian format uses "." for thousands and "," for decimals.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}
