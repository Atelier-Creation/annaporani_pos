import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, Select, message, Card, Space } from "antd";
import userService from "../service/userService";

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    fetchRoles();
    fetchBranches();
    if (id) {
      fetchUser();
      fetchUserBranches();
    }
  }, [id]);

  const fetchRoles = async () => {
    try {
      const response = await userService.getRoles();
      const rolesData = response.data.data || response.data || [];
      
      // Map backend field names to frontend field names
      const mappedRoles = rolesData.map(role => ({
        id: role.id,
        name: role.role_name,
        description: role.description,
      }));
      
      setRoles(mappedRoles);
    } catch (error) {
      message.error("Failed to fetch roles");
      console.error('Fetch roles error:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await userService.getBranches();
      const branchesData = response.data.data || response.data || [];
      
      // Map backend field names to frontend field names
      const mappedBranches = branchesData.map(branch => ({
        id: branch.id,
        name: branch.branch_name,
        code: branch.branch_code,
      }));
      
      setBranches(mappedBranches);
    } catch (error) {
      message.error("Failed to fetch branches");
      console.error('Fetch branches error:', error);
    }
  };

  const fetchUserBranches = async () => {
    if (!id) return;
    try {
      const response = await userService.getUserBranches(id);
      const userBranches = response.data.data || [];
      const branchIds = userBranches.map(ub => ub.branch_id);
      setSelectedBranches(branchIds);
      form.setFieldsValue({ branches: branchIds });
    } catch (error) {
      console.error('Fetch user branches error:', error);
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      console.log('Fetching user with ID:', id);
      const response = await userService.getUserById(id);
      console.log('User response:', response);
      
      const user = response.data;
      console.log('User data:', user);
      
      // Map backend field names to frontend field names
      const formValues = {
        name: user.username,
        email: user.email,
        phone: user.phone,
        roleId: user.role_id,
      };
      
      console.log('Setting form values:', formValues);
      form.setFieldsValue(formValues);
      
      console.log('Form values after set:', form.getFieldsValue());
    } catch (error) {
      message.error("Failed to fetch user");
      console.error('Fetch user error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Form values:', values);
      
      // Map frontend field names to backend field names
      const payload = {
        username: values.name,
        email: values.email,
        phone: values.phone,
        role_id: values.roleId, // Map roleId to role_id
      };

      console.log('Payload to send:', payload);

      if (!id && values.password) {
        payload.password = values.password;
      }

      let userId = id;

      if (id) {
        await userService.updateUser(id, payload);
        messageApi.success("User updated successfully");
      } else {
        const response = await userService.createUser(payload);
        userId = response.data.user?.id || response.data.id;
        messageApi.success("User created successfully");
      }

      // Assign branches to user
      if (values.branches && values.branches.length > 0 && userId) {
        const roleId = values.roleId;
        
        if (!roleId) {
          messageApi.error("Role is required to assign branches");
          return;
        }

        console.log('Assigning branches:', {
          userId,
          roleId,
          branches: values.branches,
          selectedBranches
        });
        
        // If editing, remove old branches first
        if (id && selectedBranches.length > 0) {
          for (const branchId of selectedBranches) {
            if (!values.branches.includes(branchId)) {
              try {
                await userService.removeUserFromBranch({ 
                  user_id: userId, 
                  branch_id: branchId 
                });
                console.log('Removed branch:', branchId);
              } catch (error) {
                console.error('Error removing branch:', error);
              }
            }
          }
        }

        // Assign new branches
        for (const branchId of values.branches) {
          if (!selectedBranches.includes(branchId)) {
            try {
              const assignPayload = {
                user_id: userId,
                branch_id: branchId,
                role_id: roleId,
              };
              console.log('Assigning branch with payload:', assignPayload);
              
              await userService.assignUserToBranch(assignPayload);
              console.log('Assigned branch:', branchId);
            } catch (error) {
              console.error('Error assigning branch:', error);
              messageApi.error(`Failed to assign branch: ${error.response?.data?.message || error.message}`);
            }
          }
        }
        messageApi.success("Branches assigned successfully");
      }

      navigate("/user/users");
    } catch (error) {
      console.error('Save user error:', error);
      console.error('Error response:', error.response?.data);
      messageApi.error(error.response?.data?.error || error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {contextHolder}
    <div className="p-6">
      <Card title={id ? "Edit User" : "Add User"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: "Please enter phone" }]}
          >
            <Input />
          </Form.Item>

          {!id && (
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select placeholder="Select role">
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Branches"
            name="branches"
            tooltip="Assign user to one or more branches"
          >
            <Select
              mode="multiple"
              placeholder="Select branches"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {branches.map((branch) => (
                <Select.Option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "Update" : "Create"}
              </Button>
              <Button onClick={() => navigate("/user/users")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
};

export default UserForm;
