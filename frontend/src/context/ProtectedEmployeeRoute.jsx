import { Navigate, useLocation } from 'react-router-dom';
import { useEmployeeAuth } from './EmployeeAuthContext';
import Loading from '../utils/Loading';

const ProtectedEmployeeRoute = ({ children }) => {
  const { employee, loading } = useEmployeeAuth();
  const location = useLocation();

  if (loading) return <div><Loading /></div>;
  if (!employee) return <Navigate to="/employee-login" state={{ from: location }} replace />;
  return children;
};

export default ProtectedEmployeeRoute;
