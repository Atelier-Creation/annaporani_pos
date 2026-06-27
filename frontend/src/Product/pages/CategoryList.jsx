import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Input, Grid, List, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import categoryService from "../services/categoryService.js";
import debounce from "lodash.debounce";

const { Search } = Input;

const CategoryList = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await categoryService.getAll({
        page: params.current || pagination.current,
        limit: params.pageSize || pagination.pageSize,
        search: params.search || searchText,
      });

      // Backend returns: { total, page, limit, data: [...] }
      // Axios returns this in response.data
      const result = response.data;

      setCategories(Array.isArray(result.data) ? result.data : []);
      setPagination((prev) => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
        pageSize: result.limit || 10,
      }));
    } catch (err) {
      console.error('Fetch categories error:', err);
      message.error("Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText]);

  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchText(value);
  }, 500);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id) => {
    try {
      await categoryService.remove(id);
      messageApi.success("Category deleted successfully");
      fetchCategories();
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to delete category");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "category_name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          {contextHolder}
          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/Product/categories/edit/${record.id}`)}>
              Edit
            </Button>
            <Popconfirm title="Are you sure you want to delete this category?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          </Space>
        </>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <Search
          placeholder="Search categories..."
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          enterButton
          allowClear
          className="w-full md:w-[300px]"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/Product/categories/add")} className="w-full md:w-auto">
          Add Category
        </Button>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={categories}
          loading={loading}
          pagination={{ ...pagination, onChange: (page) => setPagination({ ...pagination, current: page }) }}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card
                title={item.category_name}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/Product/categories/edit/${item.id}`)}
                    />
                    <Popconfirm title="Are you sure you want to delete this category?" onConfirm={() => handleDelete(item.id)} okText="Yes" cancelText="No">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <div style={{ color: "#666" }}>
                  {item.description || "No description available"}
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={categories}
          pagination={pagination}
          loading={loading}
          onChange={(pag) => setPagination(pag)}
          bordered
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default CategoryList;
