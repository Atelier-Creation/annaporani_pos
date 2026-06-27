import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await userService.getRoles();
      const rolesData = response.data.data || response.data || [];

      // Map backend field names to frontend field names
      const mappedRoles = rolesData.map(role => ({
        id: role.id,
        name: role.role_name,
        description: role.description,
        permissions: role.permissions || [],
        isActive: role.is_active,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      setRoles(mappedRoles);
    } catch (error) {
      message.error("Failed to fetch roles");
      console.error('Fetch roles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteRole(id);
      messageApi.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      messageApi.error("Failed to delete role");
    }
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <strong className="text-blue-600">{name}</strong>
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_, record) => (
        <Tag color="cyan">{record.permissions?.length || 0} Permissions</Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {contextHolder}
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/user/roles/edit/${record.id}`)}
            />
            {/* <Popconfirm
            title="Delete role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm> */}
          </Space>
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/user/roles/add")}
        >
          Add Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-3 bg-gray-50 rounded">
              <strong className="block mb-2 text-sm text-gray-500">Assigned Permissions:</strong>
              <div className="flex flex-wrap gap-2">
                {record.permissions?.length > 0 ? (
                  record.permissions.map(p => (
                    <Tag key={p.id} color="blue">{p.code}</Tag>
                  ))
                ) : (
                  <span className="text-gray-400">No permissions assigned</span>
                )}
              </div>
            </div>
          )
        }}
      />
    </div>
  );
};

export default RoleList;
