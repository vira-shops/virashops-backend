export function requestLang(lang?: string): string {
  const value = (lang ?? 'en').trim().toLowerCase();
  return value.startsWith('fa') ? 'fa' : 'en';
}
