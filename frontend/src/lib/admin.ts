export const ADMIN_EMAIL = '54551491mssa@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
