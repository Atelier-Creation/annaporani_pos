import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Input, Tag, Grid, List, Card } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
      });

      const usersData = response.data.data || [];

      // Map backend field names to frontend field names
      const mappedUsers = usersData.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        Role: user.role ? { name: user.role.role_name } : { name: 'N/A' },
        isActive: user.is_active,
        isDeleted: user.deleted_by !== null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      setUsers(mappedUsers);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      message.error("Failed to fetch users");
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on search
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      messageApi.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      messageApi.error("Failed to delete user");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Role",
      dataIndex: ["Role", "name"],
      key: "role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isDeleted",
      key: "status",
      render: (isDeleted) => (
        <Tag color={isDeleted ? "red" : "green"}>
          {isDeleted ? "Inactive" : "Active"}
        </Tag>
      ),
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
              onClick={() => navigate(`/user/users/edit/${record.id}`)}
            />
            {/* <Popconfirm
            title="Delete user?"
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

  /* ... inside UserList component ... */
  const screens = Grid.useBreakpoint();

  /* ... return block ... */
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold m-0">Users</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by name, email, or phone..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-[300px]"
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/user/users/add")}
            className="w-full sm:w-auto"
          >
            Add User
          </Button>
        </div>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={users}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
            // showSizeChanger: true, // List pagination is simpler usually
          }}
          renderItem={(item) => (
            <List.Item>
              <Card
                title={item.name}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/user/users/edit/${item.id}`)}>
                    Edit
                  </Button>,
                  /* 
                  <Popconfirm title="Delete user?" onConfirm={() => handleDelete(item.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />}>Delete</Button>
                  </Popconfirm> 
                  */
                ]}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium break-all">{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{item.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Role:</span>
                    <Tag color="blue">{item.Role?.name}</Tag>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <Tag color={item.isDeleted ? "red" : "green"}>
                      {item.isDeleted ? "Inactive" : "Active"}
                    </Tag>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default UserList;
