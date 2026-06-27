import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Tag, Grid, List, Card } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const BranchList = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await userService.getBranches();
      const branchesData = response.data.data || [];

      // Map backend field names to frontend field names
      const mappedBranches = branchesData.map(branch => ({
        id: branch.id,
        name: branch.branch_name,
        code: branch.branch_code,
        location: branch.city,
        contactNumber: branch.phone,
        email: branch.email,
        address: branch.address,
        isActive: branch.is_active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      }));

      setBranches(mappedBranches);
    } catch (error) {
      message.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteBranch(id);
      messageApi.success("Branch deleted successfully");
      fetchBranches();
    } catch (error) {
      messageApi.error("Failed to delete branch");
    }
  };

  const columns = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Contact",
      dataIndex: "contactNumber",
      key: "contactNumber",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
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
              onClick={() => navigate(`/user/branches/edit/${record.id}`)}
            />
            {/* <Popconfirm
            title="Delete branch?"
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

  const screens = Grid.useBreakpoint();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold m-0">Branches</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/user/branches/add")}
          className="w-full sm:w-auto"
        >
          Add Branch
        </Button>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={branches}
          loading={loading}
          pagination={{ pageSize: 10 }}
          renderItem={(item) => (
            <List.Item>
              <Card
                title={item.name}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                extra={
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/user/branches/edit/${item.id}`)}
                  />
                }
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Code:</span>
                    <Tag color="blue">{item.code}</Tag>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{item.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-medium">{item.contactNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <Tag color={item.isActive ? "green" : "red"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>

                  {/*
                  <div className="mt-2 text-right">
                    <Popconfirm title="Delete branch?" onConfirm={() => handleDelete(item.id)}>
                      <Button type="text" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                  </div>
                  */}
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={branches}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default BranchList;
