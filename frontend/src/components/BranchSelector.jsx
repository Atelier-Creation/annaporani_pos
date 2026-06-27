import { Select, Spin } from 'antd';
import { useBranch } from '../context/BranchContext';

const BranchSelector = ({ className = '' }) => {
  const { branches, selectedBranch, loading, changeBranch } = useBranch();

  if (loading) {
    return <Spin size="small" />;
  }

  if (branches.length <= 1) {
    // Don't show selector if user has only one branch
    return null;
  }

  return (
    <Select
      value={selectedBranch?.id}
      onChange={changeBranch}
      className={`w-32 sm:w-48 ${className}`}
      placeholder="Select Branch"
    >
      {/* Add "All" option for multi-branch users */}
      <Select.Option key="all" value="all">
        All Branches
      </Select.Option>

      {branches.map((branch) => (
        <Select.Option key={branch.branch_id} value={branch.branch_id}>
          {branch.branch?.branch_name || branch.branch?.name} ({branch.branch?.branch_code || branch.branch?.code})
        </Select.Option>
      ))}
    </Select>
  );
};

export default BranchSelector;
