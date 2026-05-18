export function getUserRole() {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
    return user.role || null;
  } catch {
    return null;
  }
}

export function redirectByRole(router) {
  const role = getUserRole();
  if (role === 'worker') router.replace('/worker/dashboard');
  else if (role === 'client') router.replace('/client/dashboard');
  else if (role === 'shop') router.replace('/shop/dashboard');
  else router.replace('/auth/login');
}
