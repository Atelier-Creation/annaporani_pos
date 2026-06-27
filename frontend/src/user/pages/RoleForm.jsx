import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Space, Select } from "antd";
import userService from "../service/userService";
import permissionService from "../service/permissionService";

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchPermissionsFlat();
    if (id) {
      fetchRole();
    }
  }, [id]);

  const fetchPermissionsFlat = async () => {
    try {
      const response = await permissionService.getAllPermissionsFlat();
      setPermissions(response.data.data);
    } catch (error) {
      message.error("Failed to fetch permissions list");
    }
  };

  const fetchRole = async () => {
    setLoading(true);
    try {
      const response = await userService.getRoleById(id);
      const role = response.data.data || response.data;

      // Extract existing permission IDs
      const pIds = role.permissions ? role.permissions.map(p => p.id) : [];

      form.setFieldsValue({
        name: role.role_name,
        description: role.description,
        permission_ids: pIds,
      });
    } catch (error) {
      message.error("Failed to fetch role");
      console.error('Fetch role error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        role_name: values.name,
        description: values.description,
        permission_ids: values.permission_ids || [],
      };

      if (id) {
        await userService.updateRole(id, payload);
        messageApi.success("Role updated successfully");
      } else {
        await userService.createRole(payload);
        messageApi.success("Role created successfully");
      }
      navigate("/user/roles");
    } catch (error) {
      messageApi.error(error.response?.data?.error || error.response?.data?.message || "Operation failed");
      console.error('Save role error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="p-6">
        <Card title={id ? "Edit Role" : "Add Role"}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              label="Role Name"
              name="name"
              rules={[{ required: true, message: "Please enter role name" }]}
            >
              <Input placeholder="e.g., Admin, Manager, Staff" disabled={id ? true : false} />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={4} placeholder="Role description..." />
            </Form.Item>

            <Form.Item label="Permissions" name="permission_ids">
              <Select
                mode="multiple"
                placeholder="Select permissions for this role"
                style={{ width: '100%' }}
                optionFilterProp="children"
                showSearch
              >
                {permissions.map((perm) => (
                  <Select.Option key={perm.id} value={perm.id}>
                    {perm.code} <span style={{ color: '#888' }}>({perm.category || 'Uncategorized'})</span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>


            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {id ? "Update" : "Create"}
                </Button>
                <Button onClick={() => navigate("/user/roles")}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default RoleForm;
