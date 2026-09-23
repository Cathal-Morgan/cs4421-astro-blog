export function formatDate(value: string | Date): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function isSameDay(first: string | Date, second: string | Date): boolean {
  const left = new Date(first);
  const right = new Date(second);

  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}
