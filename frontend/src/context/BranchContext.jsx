import { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import userService from '../user/service/userService';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
  const { user } = useAuth(); // Get auth state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch branches if user is authenticated
    if (user) {
      fetchUserBranches();
    } else {
      // Clear branch data when user logs out
      setBranches([]);
      setSelectedBranch(null);
      setUserRole(null);
    }
  }, [user]);

  const fetchUserBranches = async () => {
    setLoading(true);
    try {
      const response = await userService.getMyBranches();
      const userBranches = response.data.data || [];
      setBranches(userBranches);

      // Auto-select if only one branch
      if (userBranches.length === 1) {
        const branch = userBranches[0];
        setSelectedBranch({
          id: branch.branch_id,
          name: branch.branch?.branch_name || branch.branch?.name,
          code: branch.branch?.branch_code || branch.branch?.code,
        });
        setUserRole(branch.role?.role_name || branch.role?.name);
        localStorage.setItem('selectedBranchId', branch.branch_id);
        localStorage.setItem('userRole', branch.role?.role_name || branch.role?.name);
      } else if (userBranches.length > 1) {
        // Check if there's a previously selected branch
        const savedBranchId = localStorage.getItem('selectedBranchId');
        if (savedBranchId) {
          if (savedBranchId === 'all') {
            // Restore "All" selection
            setSelectedBranch({
              id: 'all',
              name: 'All Branches',
              code: 'ALL',
            });
            setUserRole(null);
          } else {
            const savedBranch = userBranches.find(b => b.branch_id === savedBranchId);
            if (savedBranch) {
              setSelectedBranch({
                id: savedBranch.branch_id,
                name: savedBranch.branch?.branch_name || savedBranch.branch?.name,
                code: savedBranch.branch?.branch_code || savedBranch.branch?.code,
              });
              setUserRole(savedBranch.role?.role_name || savedBranch.role?.name);
            } else {
              // Default to "All" if saved branch not found
              setSelectedBranch({
                id: 'all',
                name: 'All Branches',
                code: 'ALL',
              });
              setUserRole(null);
            }
          }
        } else {
          // Default to "All" for multi-branch users
          setSelectedBranch({
            id: 'all',
            name: 'All Branches',
            code: 'ALL',
          });
          setUserRole(null);
          localStorage.setItem('selectedBranchId', 'all');
        }
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      // Only show error if it's not a 401 (unauthorized)
      if (error.response?.status !== 401) {
        message.error('Failed to load branches');
      }
    } finally {
      setLoading(false);
    }
  };

  const changeBranch = (branchId) => {
    // Handle "All" option
    if (branchId === 'all') {
      setSelectedBranch({
        id: 'all',
        name: 'All Branches',
        code: 'ALL',
      });
      setUserRole(null); // No specific role when viewing all branches
      localStorage.setItem('selectedBranchId', 'all');
      localStorage.removeItem('userRole');
      message.success('Viewing all branches');
      return;
    }

    const branch = branches.find(b => b.branch_id === branchId);
    if (branch) {
      setSelectedBranch({
        id: branch.branch_id,
        name: branch.branch?.branch_name || branch.branch?.name,
        code: branch.branch?.branch_code || branch.branch?.code,
      });
      setUserRole(branch.role?.role_name || branch.role?.name);
      localStorage.setItem('selectedBranchId', branchId);
      localStorage.setItem('userRole', branch.role?.role_name || branch.role?.name);
      message.success(`Switched to ${branch.branch?.branch_name || branch.branch?.name}`);
    }
  };

  const hasRole = (roles) => {
    if (!userRole) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userRole.toLowerCase());
    }
    return userRole.toLowerCase() === roles.toLowerCase();
  };

  const canEdit = () => hasRole(['admin', 'manager']);
  const canDelete = () => hasRole(['admin']);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        userRole,
        loading,
        changeBranch,
        hasRole,
        canEdit,
        canDelete,
        refreshBranches: fetchUserBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
