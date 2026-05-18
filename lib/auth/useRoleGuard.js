'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Checks token + role on mount. Redirects if not authenticated or wrong role.
export function useRoleGuard(requiredRole) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('kaamsetu_token');
    if (!token) { router.replace('/auth/login'); return; }

    let role = null;
    try {
      const user = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
      role = user.role || null;
    } catch {
      router.replace('/auth/login');
      return;
    }

    if (role === requiredRole) return; // correct role — allow

    // Wrong role — redirect to their own dashboard
    if (role === 'worker') router.replace('/worker/dashboard');
    else if (role === 'client') router.replace('/client/dashboard');
    else if (role === 'shop') router.replace('/shop/dashboard');
    else router.replace('/auth/login');
  }, []);
}
