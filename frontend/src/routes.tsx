/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthScreen } from '@/pages/AuthScreen';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { useAuthStore } from '@/stores/authStore';
import type { JSX } from 'react';

// Protected route component
function ProtectedRoute({ children, allowedRole }: { children: JSX.Element; allowedRole: 'student' | 'teacher' }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthScreen />,
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRole="student">
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRole="teacher">
        <TeacherDashboard />
      </ProtectedRoute>
    ),
  },
]);