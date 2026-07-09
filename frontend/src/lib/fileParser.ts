const HEADER_MARKERS = ["שם", "name"];
const CHUNK_SIZE = 500;

export function extractNamesFromText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.split(",")[0]?.trim() ?? "")
    .filter((name) => name.length > 1 && !HEADER_MARKERS.some((marker) => name.toLowerCase().includes(marker)));
}

export async function extractNamesFromFile(file: File): Promise<string[]> {
  const text = await file.text();
  return extractNamesFromText(text);
}

export function chunkNames(names: string[], chunkSize = CHUNK_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < names.length; i += chunkSize) {
    chunks.push(names.slice(i, i + chunkSize));
  }
  return chunks;
}

export { CHUNK_SIZE };
