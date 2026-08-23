export async function readJsonFileAsync<T>(filePath: string): Promise<T> {
  return JSON.parse(await Bun.file(filePath).text()) as T;
}
