import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useCourses(params: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () =>
      api.get('/courses', { params }).then(res => res.data),
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      api.post(`/courses/${courseId}/enroll`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
    },
  });
}

export function useStudentProgress() {
  const user = useAuthStore(s => s.user);

  return useQuery({
    queryKey: ['student-progress'],
    queryFn: () =>
      api.get('/students/me/progress').then(res => res.data),
    // ✅ Only fetch when a student is actually logged in
    // Was permanently set to `false` — so it never loaded on page entry,
    // only ran after invalidation triggered by a new enrollment
    enabled: !!user && user.role === 'student',
    staleTime: 0, // always refetch when component mounts or query is invalidated
  });
}