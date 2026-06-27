import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, Button, Space, message, Input, Grid, List, Card,
  Modal, Upload, Tag, Divider, Progress, Tooltip,
} from "antd";
import {
  EditOutlined, PlusOutlined, SearchOutlined, EyeOutlined,
  UploadOutlined, DownloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, MinusCircleOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import customerService from "../service/customerService";

// ── Template columns ──────────────────────────────────────────────────────────
const TEMPLATE_COLS = [
  "customer_name", "customer_phone", "customer_email",
  "address", "city", "state", "pincode",
  "gender", "source", "notes",
];

const SAMPLE_ROWS = [
  { customer_name: "Priya Sharma", customer_phone: "9876543210", customer_email: "priya@example.com", address: "12 MG Road", city: "Coimbatore", state: "Tamil Nadu", pincode: "641001", gender: "Female", source: "Walk-in", notes: "" },
  { customer_name: "Ravi Kumar",   customer_phone: "9123456780", customer_email: "",                  address: "",             city: "Chennai",     state: "Tamil Nadu", pincode: "600001", gender: "Male",   source: "Instagram", notes: "VIP" },
];

// ── Download template ─────────────────────────────────────────────────────────
const downloadTemplate = () => {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: TEMPLATE_COLS });
  // Style header row
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, "customer_bulk_upload_template.xlsx");
};

// ── Parse uploaded file ───────────────────────────────────────────────────────
const parseFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

// ── Bulk Upload Modal ─────────────────────────────────────────────────────────
function BulkUploadModal({ open, onClose, onDone }) {
  const [step, setStep]         = useState("upload"); // upload | preview | result
  const [rows, setRows]         = useState([]);
  const [result, setResult]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const reset = () => { setStep("upload"); setRows([]); setResult(null); setFileName(""); };

  const handleFile = async (file) => {
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) { message.warning("File is empty"); return false; }
      if (parsed.length > 1000) { message.error("Max 1000 rows per upload"); return false; }
      setRows(parsed);
      setFileName(file.name);
      setStep("preview");
    } catch { message.error("Failed to parse file. Use the template."); }
    return false; // prevent auto-upload
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const res = await customerService.bulkUploadCustomers(rows);
      setResult(res.data.data);
      setStep("result");
      onDone();
    } catch (err) {
      message.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const previewColumns = [
    { title: "#", key: "idx", width: 50, render: (_, __, i) => i + 1 },
    { title: "Name",  dataIndex: "customer_name",  key: "name",  ellipsis: true },
    { title: "Phone", dataIndex: "customer_phone", key: "phone" },
    { title: "Email", dataIndex: "customer_email", key: "email", ellipsis: true, render: v => v || "—" },
    { title: "City",  dataIndex: "city",           key: "city",  render: v => v || "—" },
    { title: "Source",dataIndex: "source",         key: "source",render: v => v || "—" },
  ];

  return (
    <Modal
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={step === "preview" ? 800 : 480}
      title={
        step === "upload"  ? "Bulk Upload Customers" :
        step === "preview" ? `Preview — ${rows.length} rows from "${fileName}"` :
        "Upload Complete"
      }
      destroyOnClose
    >
      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="flex flex-col gap-5 pt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-[13px] text-blue-700">
            <p className="font-semibold mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1 text-[12px]">
              <li>Download the template below</li>
              <li>Fill in customer data (Name & Phone are required)</li>
              <li>Upload the filled file (.xlsx or .csv)</li>
              <li>Review the preview and confirm</li>
            </ol>
          </div>

          <Button icon={<DownloadOutlined />} onClick={downloadTemplate} block>
            Download Template (.xlsx)
          </Button>

          <Divider className="!my-1">or upload your file</Divider>

          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleFile}
            showUploadList={false}
            multiple={false}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 32, color: "#6366f1" }} /></p>
            <p className="ant-upload-text text-[14px]">Click or drag file here</p>
            <p className="ant-upload-hint text-[12px] text-gray-400">.xlsx, .xls, .csv — max 1000 rows</p>
          </Upload.Dragger>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === "preview" && (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Tag color="blue">{rows.length} rows to upload</Tag>
            <span className="text-[12px] text-gray-400">Duplicates (same phone) will be skipped automatically</span>
          </div>
          <Table
            dataSource={rows}
            columns={previewColumns}
            rowKey={(_, i) => i}
            size="small"
            scroll={{ x: true, y: 320 }}
            pagination={false}
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button onClick={reset}>Back</Button>
            <Button type="primary" loading={uploading} onClick={handleUpload}
              icon={<UploadOutlined />}>
              Upload {rows.length} Customers
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === "result" && result && (
        <div className="flex flex-col gap-4 pt-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Created",  count: result.success.length, color: "#52c41a", icon: <CheckCircleOutlined />, bg: "#f6ffed", border: "#b7eb8f" },
              { label: "Skipped",  count: result.skipped.length, color: "#faad14", icon: <MinusCircleOutlined />, bg: "#fffbe6", border: "#ffe58f" },
              { label: "Failed",   count: result.failed.length,  color: "#ff4d4f", icon: <CloseCircleOutlined />, bg: "#fff2f0", border: "#ffccc7" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 text-center border"
                style={{ background: s.bg, borderColor: s.border }}>
                <div style={{ color: s.color, fontSize: 22 }}>{s.icon}</div>
                <div className="text-[28px] font-bold mt-1" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[12px] font-medium" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>

          <Progress
            percent={Math.round((result.success.length / (result.success.length + result.skipped.length + result.failed.length)) * 100)}
            strokeColor="#52c41a"
            format={p => `${p}% success`}
          />

          {/* Skipped / Failed details */}
          {(result.skipped.length > 0 || result.failed.length > 0) && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Row</th>
                    <th className="px-3 py-2 text-left text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left text-gray-500">Phone</th>
                    <th className="px-3 py-2 text-left text-gray-500">Reason</th>
                    <th className="px-3 py-2 text-left text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.skipped.map(r => ({ ...r, type: "skipped" })),
                    ...result.failed.map(r => ({ ...r, type: "failed" }))].map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-gray-500">{r.row}</td>
                      <td className="px-3 py-1.5">{r.name || "—"}</td>
                      <td className="px-3 py-1.5">{r.phone || "—"}</td>
                      <td className="px-3 py-1.5 text-gray-500">{r.reason}</td>
                      <td className="px-3 py-1.5">
                        <Tag color={r.type === "skipped" ? "orange" : "red"} className="text-[10px]">
                          {r.type}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button onClick={reset}>Upload More</Button>
            <Button type="primary" onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Main CustomerList ─────────────────────────────────────────────────────────
const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searchText, setSearchText]   = useState("");
  const [bulkModal, setBulkModal]     = useState(false);
  const [messageApi, contextHolder]   = message.useMessage();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getAllCustomers();
      setCustomers(response.data.data || []);
    } catch { message.error("Failed to fetch customers"); }
    finally { setLoading(false); }
  };

  const columns = [
    { title: "Name",  dataIndex: "customer_name",  key: "customer_name",
      filteredValue: [searchText],
      onFilter: (v, r) =>
        r.customer_name?.toLowerCase().includes(v.toLowerCase()) ||
        r.customer_phone?.toLowerCase().includes(v.toLowerCase()) ||
        r.customer_email?.toLowerCase().includes(v.toLowerCase()),
    },
    { title: "Phone", dataIndex: "customer_phone", key: "customer_phone" },
    { title: "Email", dataIndex: "customer_email", key: "customer_email", render: v => v || "—" },
    { title: "City",  dataIndex: "city",           key: "city",           render: v => v || "—" },
    { title: "Source",dataIndex: "source",         key: "source",         render: v => v || "—" },
    { title: "Created", dataIndex: "createdAt",    key: "createdAt",
      render: d => new Date(d).toLocaleDateString() },
    {
      title: "Actions", key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="default" icon={<EyeOutlined />}
            onClick={() => navigate(`/customer/details/${record.id}`)} />
          <Button type="primary" icon={<EditOutlined />}
            onClick={() => navigate(`/customer/edit/${record.id}`)} />
        </Space>
      ),
    },
  ];

  const screens = Grid.useBreakpoint();

  const filteredCustomers = customers.filter(c =>
    (c.customer_name?.toLowerCase() || "").includes(searchText.toLowerCase()) ||
    (c.customer_phone?.toLowerCase() || "").includes(searchText.toLowerCase()) ||
    (c.customer_email?.toLowerCase() || "").includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      {contextHolder}

      <BulkUploadModal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        onDone={fetchCustomers}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold m-0">Customers</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search customers..."
            prefix={<SearchOutlined />}
            onChange={e => setSearchText(e.target.value)}
            className="w-full sm:w-[260px]"
          />
          <Tooltip title="Upload multiple customers from Excel/CSV">
            <Button icon={<UploadOutlined />} onClick={() => setBulkModal(true)}>
              Bulk Upload
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => navigate("/customer/add")}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Mobile card list */}
      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={filteredCustomers}
          loading={loading}
          pagination={{ pageSize: 10 }}
          renderItem={item => (
            <List.Item>
              <Card
                title={item.customer_name}
                bordered={false}
                style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                actions={[
                  <Button type="text" icon={<EyeOutlined />}
                    onClick={() => navigate(`/customer/details/${item.id}`)}>View</Button>,
                  <Button type="text" icon={<EditOutlined />}
                    onClick={() => navigate(`/customer/edit/${item.id}`)}>Edit</Button>,
                ]}
              >
                <div className="flex flex-col gap-2 text-sm">
                  {[["Phone", item.customer_phone], ["Email", item.customer_email],
                    ["City", item.city], ["Source", item.source]].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-gray-500">{l}:</span>
                      <span className="font-medium">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={customers}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      )}
    </div>
  );
};

export default CustomerList;
