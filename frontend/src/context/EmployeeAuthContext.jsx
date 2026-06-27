import { createContext, useContext, useState, useEffect } from 'react';

const EmployeeAuthContext = createContext(null);

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('emp_token');
    const empStr = localStorage.getItem('emp_user');
    if (token && empStr) {
      try {
        setEmployee(JSON.parse(empStr));
      } catch {
        localStorage.removeItem('emp_token');
        localStorage.removeItem('emp_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, employeeData) => {
    localStorage.setItem('emp_token', token);
    localStorage.setItem('emp_user', JSON.stringify(employeeData));
    setEmployee(employeeData);
  };

  const logout = () => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    setEmployee(null);
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, login, logout, loading }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error('useEmployeeAuth must be used within EmployeeAuthProvider');
  return ctx;
};
