
import { useAuth } from '@/hooks/auth';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // Ou um spinner
  }

  // Se o usuário não tem um perfil ou a função dele não está na lista de permitidas
  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redireciona para uma página de "não autorizado" ou para o dashboard principal
    return <Navigate to="/login" replace />;
  }

  // Se estiver tudo certo, renderiza a rota filha
  return <Outlet />;
}