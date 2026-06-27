import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Space, Popconfirm, Tag, message, Select, Alert, Grid, List, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import inwardService from "../service/inwardService.js";
import { useBranch } from "../../context/BranchContext";
import debounce from "lodash.debounce";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const { Search } = Input;
const { Option } = Select;

const InwardList = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [sorter, setSorter] = useState({ field: null, order: null });
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchFilter, setShowBranchFilter] = useState(false);

  // Get branch context to listen for changes
  const { selectedBranch: contextBranch } = useBranch();

  const fetchInwards = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const data = await inwardService.getAll({
          page: params.current || pagination.current,
          limit: params.pageSize || pagination.pageSize,
          search: params.search || searchText,
          sortField: params.sortField || sorter.field,
          sortOrder: params.sortOrder || sorter.order,
          branch_id: params.branch_id !== undefined ? params.branch_id : selectedBranch,
        });

        setInwards(data.data || []);
        setPagination((prev) => ({
          ...prev,
          current: data.page || params.current || 1,
          total: data.total || 0,
          pageSize: data.limit || params.pageSize || 10,
        }));
      } catch (err) {
        console.error(err);

        // Check if error is about multiple branches
        if (err?.response?.data?.availableBranches) {
          setAvailableBranches(err.response.data.availableBranches);
          setShowBranchFilter(true);
          message.info("Please select a branch to view inwards");
        } else {
          message.error("Failed to fetch inwards");
        }
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, searchText, sorter, selectedBranch]
  );

  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchText(value);
  }, 500);

  const screens = Grid.useBreakpoint();

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  useEffect(() => {
    fetchInwards();
  }, [fetchInwards]);

  // Refresh data when branch changes in header
  useEffect(() => {
    if (contextBranch) {
      console.log("Branch changed in header:", contextBranch);
      // Reset pagination and fetch new data
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchInwards({ current: 1 });
    }
  }, [contextBranch?.id]); // Only trigger when branch ID changes

  const handleTableChange = (pag, filters, sort) => {
    setPagination(pag);
    setSorter({
      field: sort.field,
      order:
        sort.order === "ascend"
          ? "asc"
          : sort.order === "descend"
            ? "desc"
            : null,
    });
  };

  const handleDelete = async (id) => {
    try {
      await inwardService.remove(id);
      messageApi.success("Inward deleted successfully");
      fetchInwards();
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to delete inward");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inward List", 14, 10);

    const tableData = inwards.map((inward) => [
      inward.inward_no,
      inward.supplier_name,
      new Date(inward.received_date).toLocaleDateString(),
      inward.total_quantity,
      inward.total_amount,
      inward.status,
    ]);

    doc.autoTable({
      head: [
        ["Inward No", "Supplier", "Date", "Quantity", "Amount", "Status"],
      ],
      body: tableData,
    });

    doc.save("inwards.pdf");
  };

  const columns = [
    {
      title: "Inward No",
      dataIndex: "inward_no",
      key: "inward_no",
      sorter: true,
    },
    {
      title: "Branch",
      key: "branch",
      render: (_, record) => (
        <div>
          <div>{record.branch?.branch_name || "-"}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {record.branch?.branch_code || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Supplier",
      dataIndex: "supplier_name",
      key: "supplier_name",
      sorter: true,
    },
    {
      title: "Received Date",
      dataIndex: "received_date",
      key: "received_date",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: "Quantity",
      dataIndex: "total_quantity",
      key: "total_quantity",
      sorter: true,
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => `₹${amount}`,
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "completed" ? "green" : "orange"}>{status}</Tag>
      ),
    },
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
              onClick={() => navigate(`/inward/edit/${record.id}`)}
            >
              Edit
            </Button>
            {/* <Popconfirm
            title="Are you sure to delete this inward?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm> */}
          </Space>
        </>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      {showBranchFilter && availableBranches.length > 0 && (
        <Alert
          message="Multiple Branches Access"
          description="You have access to multiple branches. Select a branch to filter or view all."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <Search
            placeholder="Search inwards..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            enterButton
            allowClear
            className="w-full sm:w-[300px]"
          />

          {showBranchFilter && availableBranches.length > 0 && (
            <Select
              placeholder="Filter by Branch"
              className="w-full sm:w-[250px]"
              onChange={handleBranchChange}
              value={selectedBranch}
              allowClear
              onClear={() => setSelectedBranch(null)}
            >
              {availableBranches.map((branch) => (
                <Option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name} ({branch.branch_code})
                </Option>
              ))}
            </Select>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/inward/add")}
            className="flex-1 sm:flex-none"
          >
            Add Inward
          </Button>
          <Button type="default" onClick={exportPDF} className="flex-1 sm:flex-none">
            Export PDF
          </Button>
        </div>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={inwards}
          loading={loading}
          pagination={{ ...pagination, onChange: (page) => setPagination({ ...pagination, current: page }) }}
          renderItem={(item) => (
            <List.Item>
              <Card
                title={item.inward_no}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                extra={
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/inward/edit/${item.id}`)}
                  />
                }
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="font-medium">{item.supplier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">{new Date(item.received_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">₹{item.total_amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <Tag color={item.status === "completed" ? "green" : "orange"}>{item.status}</Tag>
                  </div>
                  {item.branch && (
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <span className="text-gray-500">Branch:</span>
                      <span className="text-xs text-gray-700">{item.branch.branch_name}</span>
                    </div>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={inwards}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={[
                  { title: "Product", dataIndex: ["product", "product_name"], key: "product_name" },
                  { title: "Code", dataIndex: ["product", "product_code"], key: "product_code" },
                  { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                  { title: "Unit Price", dataIndex: "unit_price", key: "unit_price", render: (v) => `₹${v}` },
                  { title: "Total", dataIndex: "total_price", key: "total_price", render: (v) => `₹${v}` },
                  { title: "Batch", dataIndex: "batch_number", key: "batch_number" },
                  {
                    title: "Expiry Date",
                    dataIndex: "expiry_date",
                    key: "expiry_date",
                    render: (date) =>
                      date ? new Date(date).toLocaleDateString() : "-",
                  },
                ]}
                dataSource={record.items || []}
                pagination={false}
                rowKey={(item) => item.id}
                size="small"
              />
            ),
          }}
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default InwardList;
