'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Checks token + roles on mount. Redirects if not authenticated or the user
// doesn't hold the required role. Multi-role users (e.g. someone who is both
// Client and Worker) pass as long as `requiredRole` is among their roles.
export function useRoleGuard(requiredRole) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('kaamsetu_token');
    if (!token) { router.replace('/auth/login'); return; }

    let roles = [];
    let primaryRole = null;
    try {
      const user = JSON.parse(localStorage.getItem('kaamsetu_user') || '{}');
      roles = Array.isArray(user.roles) ? user.roles : [];
      // Legacy fallback for users in localStorage from before the multi-role rollout.
      if (!roles.length && user.role) roles = [user.role];
      primaryRole = user.activeRole || user.role || roles[0] || null;
    } catch {
      router.replace('/auth/login');
      return;
    }

    if (roles.includes(requiredRole)) return; // user holds this role — allow

    // User doesn't hold the required role — redirect to their dashboard
    if (primaryRole === 'worker') router.replace('/worker/dashboard');
    else if (primaryRole === 'client') router.replace('/client/dashboard');
    else if (primaryRole === 'shop') router.replace('/shop/dashboard');
    else router.replace('/auth/login');
  }, []);
}
