export function getUserRole(user) {
  if (!user) return 'student';
  return user.user_type || user.role || 'student';
}