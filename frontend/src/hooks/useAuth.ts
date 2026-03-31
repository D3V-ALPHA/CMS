import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; role: 'teacher' | 'student' }) =>
      api.post('/auth/register', data).then(res => res.data),
  });
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then(res => res.data),
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken);
      try {
        const profile = await api.get('/auth/profile').then(res => res.data);
        setUser({ id: profile.id, email: profile.email, role: profile.role });
      } catch (error) {
        console.error('Failed to fetch profile', error);
        // Optional: clear tokens if profile fetch fails
        //setTokens(null, null);
      }
    },
  });
}