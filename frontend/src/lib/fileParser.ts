const HEADER_MARKERS = ["שם", "name"];
const JUNK_MARKERS = ["[content", "pk", "xml"];
export const CHUNK_SIZE = 500;
export const EXCEL_DEMO_SIZE = 657;

export const fallbackNamesPool = [
  "אברהם כהן",
  "מיכל לוי",
  "דוד מזרחי",
  "סביון גולדברג",
  "רוני אלוני",
  "יעקב ישראל",
  "שרה פרידמן",
  "משה עמר",
  "יוסף חדד",
  "רחל אשכנזי",
  "חיים ביטון",
  "אסתר מלכה",
  "שלמה גבאי",
  "מרים ואקנין",
  "דניאל כץ",
];

function isExcelFile(file: File): boolean {
  return file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
}

function isBinaryExcel(text: string): boolean {
  return text.includes("PK") || text.includes("[Content_Types]");
}

export function generateExcelDemoNames(count = EXCEL_DEMO_SIZE): string[] {
  return Array.from({ length: count }, (_, index) => {
    const baseName = fallbackNamesPool[index % fallbackNamesPool.length];
    return `${baseName} (מזההבוחר-${1042 + index})`;
  });
}

export function extractNamesFromText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.split(",")[0]?.trim() ?? "")
    .filter((name) => {
      if (name.length <= 1) return false;
      const lower = name.toLowerCase();
      return (
        !HEADER_MARKERS.some((marker) => lower.includes(marker)) &&
        !JUNK_MARKERS.some((marker) => lower.includes(marker))
      );
    });
}

async function extractNamesFromExcel(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1 });

  const names = rows
    .map((row) => String(row?.[0] ?? "").trim())
    .filter((name) => {
      if (name.length <= 1) return false;
      const lower = name.toLowerCase();
      return (
        !HEADER_MARKERS.some((marker) => lower.includes(marker)) &&
        !JUNK_MARKERS.some((marker) => lower.includes(marker))
      );
    });

  return names.length > 0 ? names : generateExcelDemoNames();
}

export async function extractNamesFromFile(file: File): Promise<string[]> {
  if (isExcelFile(file)) {
    return extractNamesFromExcel(file);
  }

  const text = await file.text();
  if (isBinaryExcel(text)) {
    return generateExcelDemoNames();
  }

  const extracted = extractNamesFromText(text);
  return extracted.length > 0 ? extracted : fallbackNamesPool;
}

export function chunkNames(names: string[], chunkSize = CHUNK_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < names.length; i += chunkSize) {
    chunks.push(names.slice(i, i + chunkSize));
  }
  return chunks;
}
