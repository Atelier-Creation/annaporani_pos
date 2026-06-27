import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Space, Popconfirm, message, Grid, List, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import subcategoryService from "../services/subcategoryService";
import debounce from "lodash.debounce";

const { Search } = Input;

const SubCategoryList = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [sorter, setSorter] = useState({ field: null, order: null });
  const [messageApi, contextHolder] = message.useMessage();
  const fetchSubcategories = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await subcategoryService.getAll({
          page: params.current || pagination.current,
          limit: params.pageSize || pagination.pageSize,
          search: params.search || searchText,
          sortField: params.sortField || sorter.field,
          sortOrder: params.sortOrder || sorter.order,
        });

        // Backend returns: { total, page, limit, data: [...] }
        // Axios returns this in response.data
        const result = response.data;

        setSubcategories(Array.isArray(result.data) ? result.data : []);
        setPagination((prev) => ({
          ...prev,
          current: result.page || 1,
          total: result.total || 0,
          pageSize: result.limit || 10,
        }));
      } catch (err) {
        console.error('Fetch subcategories error:', err);
        message.error("Failed to fetch subcategories");
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, searchText, sorter]
  );

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handleTableChange = (pag, filters, sort) => {
    setPagination(pag);
    setSorter({
      field: sort.field,
      order: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null,
    });
  };

  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchText(value);
  }, 500);

  const handleDelete = async (id) => {
    try {
      console.log(id)
      await subcategoryService.remove(id);
      messageApi.success("Subcategory deleted successfully");
      fetchSubcategories();
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to delete subcategory");
    }
  };

  const columns = [
    { title: "Subcategory Name", dataIndex: "subcategory_name", key: "name", sorter: true },
    { title: "Category", dataIndex: "category_name", key: "category", sorter: true },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <>
          {contextHolder}
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/Product/subcategories/edit/${record.id}`)}
            >
              Edit
            </Button>
            {/* <Popconfirm title="Are you sure to delete this subcategory?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm> */}
          </Space>
        </>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <Search
          placeholder="Search subcategories..."
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          enterButton
          allowClear
          className="w-full md:w-[300px]"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/Product/subcategories/add")} className="w-full md:w-auto">
          Add Subcategory
        </Button>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={subcategories}
          loading={loading}
          pagination={{ ...pagination, onChange: (page) => setPagination({ ...pagination, current: page }) }}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card
                title={item.subcategory_name}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                extra={
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/Product/subcategories/edit/${item.id}`)}
                  />
                }
              >
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: "#888", marginRight: 8 }}>Category:</span>
                  <span style={{ fontWeight: 500 }}>{item.category_name}</span>
                </div>
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
          dataSource={subcategories}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default SubCategoryList;
