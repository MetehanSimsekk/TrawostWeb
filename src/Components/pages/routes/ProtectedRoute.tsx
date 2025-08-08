// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/login" replace />;
}