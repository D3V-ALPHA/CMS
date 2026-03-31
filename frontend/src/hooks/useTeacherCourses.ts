import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => api.get('/courses/teacher/dashboard').then(res => res.data),
  });
}

export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: () => api.get(`/courses/${courseId}/lessons`).then(res => res.data),
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) => api.post('/courses', data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] }),
  });
}

export function useAddLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content?: string; order: number }) =>
      api.post(`/courses/${courseId}/lessons`, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] }),
  });
}

export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { lessonId: string; newOrder: number }[]) =>
      api.patch(`/courses/${courseId}/lessons/reorder`, updates).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] }),
  });
}