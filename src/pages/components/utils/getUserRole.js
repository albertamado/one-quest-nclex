// src/pages/components/utils/getUserRole.js
export function getUserRole(user) {
  if (!user) return 'guest';
  if (typeof user.role === 'string' && user.role.length) return user.role;

  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();

  if (email.includes('admin') || name.includes('admin')) return 'admin';
  if (email.includes('teacher') || name.includes('teacher')) return 'teacher';
  if (email.includes('instructor')) return 'teacher';

  return 'student';
}
