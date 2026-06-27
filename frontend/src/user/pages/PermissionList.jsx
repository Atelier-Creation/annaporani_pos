import { useState, useEffect } from "react";
import { Table, Button, Space, Card, Form, Input, Modal, message, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import permissionService from "../service/permissionService";

const PermissionList = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        fetchPermissions(pagination.current, pagination.pageSize);
    }, []);

    const fetchPermissions = async (page, limit) => {
        setLoading(true);
        try {
            const response = await permissionService.getPermissions({ page, limit });
            setPermissions(response.data.data);
            setPagination({
                ...pagination,
                current: response.data.page,
                total: response.data.total,
            });
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to fetch permissions");
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        fetchPermissions(newPagination.current, newPagination.pageSize);
    };

    const showModal = (record = null) => {
        setEditingId(record ? record.id : null);
        if (record) {
            form.setFieldsValue({
                code: record.code,
                description: record.description,
                category: record.category,
            });
        } else {
            form.resetFields();
        }
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await permissionService.deletePermission(id);
            messageApi.success("Permission deleted successfully");
            fetchPermissions(pagination.current, pagination.pageSize);
        } catch (error) {
            messageApi.error(error.response?.data?.error || "Failed to delete permission");
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            if (editingId) {
                await permissionService.updatePermission(editingId, values);
                messageApi.success("Permission updated successfully");
            } else {
                await permissionService.createPermission(values);
                messageApi.success("Permission created successfully");
            }
            setModalVisible(false);
            fetchPermissions(pagination.current, pagination.pageSize);
        } catch (error) {
            messageApi.error(error.response?.data?.error || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
            render: (cat) => <Tag color="blue">{cat || 'Uncategorized'}</Tag>
        },
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            render: (code) => <strong>{code}</strong>
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Permissions</h1>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                    >
                        Add Permission
                    </Button>
                </div>

                <Card>
                    <Table
                        columns={columns}
                        dataSource={permissions}
                        loading={loading}
                        rowKey="id"
                        pagination={pagination}
                        onChange={handleTableChange}
                    />
                </Card>

                <Modal
                    title={editingId ? "Edit Permission" : "Add Permission"}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="code"
                            label="Permission Code"
                            rules={[
                                { required: true, message: "Code is required" },
                                { pattern: /^[a-z0-9_.]+$/, message: "Lowercase, numbers, dots, and underscores only" }
                            ]}
                            extra="e.g. billing.create, user.delete"
                        >
                            <Input placeholder="Enter permission code" disabled={!!editingId} />
                        </Form.Item>

                        <Form.Item name="category" label="Category">
                            <Input placeholder="e.g. Billing, Inventory, Users" />
                        </Form.Item>

                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} placeholder="Describe this permission..." />
                        </Form.Item>

                        <Form.Item className="mb-0 text-right">
                            <Space>
                                <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    {editingId ? "Update" : "Create"}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
};

export default PermissionList;
