export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(date: Date | string, locale = 'en-IN'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function generateAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month >= 6
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`;
}

export function paginateArray<T>(array: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return { data: array.slice(start, start + limit), total: array.length };
}
