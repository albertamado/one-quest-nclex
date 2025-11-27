// src/pages/components/utils/getUserRole.js
// Minimal helper used by Layout.jsx to determine a user's role.
// Adjust logic if your app uses different user object shape.

export function getUserRole(user) {
  if (!user) return 'guest';

  // Prefer an explicit role field if present
  if (typeof user.role === 'string' && user.role.length) return user.role;

  // Common conventions
  // Adjust these checks to match your real user data properties
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();

  if (email.includes('admin') || name.includes('admin')) return 'admin';
  if (email.includes('teacher') || name.includes('teacher')) return 'teacher';
  if (email.includes('instructor')) return 'teacher';

  // default fallback
  return 'student';
}
