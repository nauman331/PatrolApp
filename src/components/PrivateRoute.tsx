import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';
import { JSX } from 'react';

interface Props {
  children: JSX.Element;
  allowedRole: 'admin' | 'guard';
}

const PrivateRoute = ({ children, allowedRole }: Props) => {
  const { role, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role !== allowedRole) return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;