import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal, Form, Select, DatePicker, Input, Spin } from "antd";
import {
  LogIn, LogOut, Plus, CalendarDays, FileText,
  CheckCircle, FolderOpen, User, LogOut as LogOutIcon,
} from "lucide-react";
import dayjs from "dayjs";
import empApi from "../api/employeeApi";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { employee, logout } = useEmployeeAuth();

  const [tab, setTab] = useState("attendance");
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Leave modal
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm] = Form.useForm();

  // Doc modal
  const [docModal, setDocModal] = useState(false);
  const [docForm] = Form.useForm();

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchAttendance = useCallback(async () => {
    try {
      const now = dayjs();
      const res = await empApi.get(`/employee/attendance?month=${now.month() + 1}&year=${now.year()}&limit=31`);
      const rows = res.data.data || [];
      setAttendance(rows);
      const today = now.format("YYYY-MM-DD");
      setTodayRecord(rows.find(r => r.date === today) || null);
    } catch { /* silent */ }
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await empApi.get("/employee/leaves?limit=20");
      setLeaves(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchLeaveBalance = useCallback(async () => {
    try {
      const res = await empApi.get("/employee/leaves/balance");
      setLeaveBalance(res.data.data || {});
    } catch { /* silent */ }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await empApi.get("/employee/documents");
      setDocuments(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!employee) { navigate("/employee-login"); return; }
    setLoading(true);
    Promise.all([fetchAttendance(), fetchLeaves(), fetchLeaveBalance(), fetchDocuments()])
      .finally(() => setLoading(false));
  }, [employee]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSignIn = async () => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-in");
      message.success("Signed in successfully");
      fetchAttendance();
    } catch (err) {
      message.error(err.response?.data?.message || "Sign in failed");
    } finally { setActionLoading(false); }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-out");
      message.success("Signed out successfully");
      fetchAttendance();
    } catch (err) {
      message.error(err.response?.data?.message || "Sign out failed");
    } finally { setActionLoading(false); }
  };

  const handleApplyLeave = async (values) => {
    setActionLoading(true);
    try {
      const [from, to] = values.dates;
      const days = to.diff(from, "day") + 1;
      await empApi.post("/employee/leaves", {
        leave_type: values.leave_type,
        from_date: from.format("YYYY-MM-DD"),
        to_date: to.format("YYYY-MM-DD"),
        days,
        reason: values.reason,
      });
      message.success("Leave applied successfully");
      leaveForm.resetFields();
      setLeaveModal(false);
      fetchLeaves();
      fetchLeaveBalance();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to apply leave");
    } finally { setActionLoading(false); }
  };

  const handleAddDocument = async (values) => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/documents", values);
      message.success("Document added");
      docForm.resetFields();
      setDocModal(false);
      fetchDocuments();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to add document");
    } finally { setActionLoading(false); }
  };

  const handleDeleteDoc = async (id) => {
    try {
      await empApi.delete(`/employee/documents/${id}`);
      message.success("Document removed");
      fetchDocuments();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to remove document");
    }
  };

  const handleLogout = async () => {
    try { await empApi.post("/employee/logout"); } catch { /* ignore */ }
    logout();
    navigate("/employee-login");
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const tabs = [
    { key: "attendance", label: "Attendance", icon: CalendarDays },
    { key: "leaves", label: "My Leaves", icon: FileText },
    { key: "balance", label: "Leave Balance", icon: CheckCircle },
    { key: "documents", label: "My Documents", icon: FolderOpen },
  ];

  const statusColor = {
    present: "bg-green-100 text-green-600",
    absent: "bg-red-100 text-red-600",
    half_day: "bg-yellow-100 text-yellow-600",
    holiday: "bg-blue-100 text-blue-600",
    leave: "bg-purple-100 text-purple-600",
  };

  const leaveStatusColor = {
    pending: "bg-yellow-100 text-yellow-600",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#f8fafc] min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 min-w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={18} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#0f172a]">{employee?.name || "Employee"}</h1>
            <p className="text-[13px] text-[#64748b]">{employee?.designation || "Employee"} · {employee?.employee_code}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSignIn}
            disabled={actionLoading || !!todayRecord?.sign_in}
            className="flex items-center gap-2 bg-[#6bc58b] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50"
          >
            <LogIn size={14} />
            {todayRecord?.sign_in ? `In: ${todayRecord.sign_in}` : "Sign In"}
          </button>

          <button
            onClick={handleSignOut}
            disabled={actionLoading || !todayRecord?.sign_in || !!todayRecord?.sign_out}
            className="flex items-center gap-2 bg-[#f0a76d] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50"
          >
            <LogOut size={14} />
            {todayRecord?.sign_out ? `Out: ${todayRecord.sign_out}` : "Sign Out"}
          </button>

          <button
            onClick={() => setLeaveModal(true)}
            className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
          >
            <Plus size={14} />
            Apply Leave
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-gray-300"
          >
            <LogOutIcon size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">{dayjs().format("DD MMM YYYY")}</h2>
          <span className={`text-[11px] px-2 py-1 rounded-full mt-2 inline-block ${todayRecord ? statusColor[todayRecord.status] : "bg-gray-100 text-gray-500"}`}>
            {todayRecord?.status ? todayRecord.status.replace("_", " ") : "Not marked"}
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">SIGN IN</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.sign_in || "--"}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">SIGN OUT</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.sign_out || "--"}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-[11px] text-gray-400">HOURS TODAY</p>
          <h2 className="text-[14px] font-semibold mt-2">{todayRecord?.hours_worked ? `${todayRecord.hours_worked}h` : "0.00h"}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-4 md:gap-6 border-b border-gray-200 pb-3 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 text-[14px] ${tab === key ? "text-blue-600 font-semibold" : "text-gray-500"}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "attendance" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-[13px]">
                <th className="p-4">Date</th>
                <th className="p-4">Sign In</th>
                <th className="p-4">Sign Out</th>
                <th className="p-4">Hours</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">No attendance records</td></tr>
              ) : attendance.map(row => (
                <tr key={row.id} className="border-t border-gray-100 text-[13px]">
                  <td className="p-4">{dayjs(row.date).format("DD MMM YYYY")}</td>
                  <td className="p-4">{row.sign_in || "--"}</td>
                  <td className="p-4">{row.sign_out || "--"}</td>
                  <td className="p-4">{row.hours_worked ? `${row.hours_worked}h` : "--"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[12px] ${statusColor[row.status] || "bg-gray-100 text-gray-500"}`}>
                      {row.status?.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "leaves" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-[13px]">
                <th className="p-4">Type</th>
                <th className="p-4">From</th>
                <th className="p-4">To</th>
                <th className="p-4">Days</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No leave records</td></tr>
              ) : leaves.map(l => (
                <tr key={l.id} className="border-t border-gray-100 text-[13px]">
                  <td className="p-4 capitalize">{l.leave_type}</td>
                  <td className="p-4">{dayjs(l.from_date).format("DD MMM YYYY")}</td>
                  <td className="p-4">{dayjs(l.to_date).format("DD MMM YYYY")}</td>
                  <td className="p-4">{l.days}</td>
                  <td className="p-4 max-w-[200px] truncate">{l.reason || "--"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[12px] ${leaveStatusColor[l.status] || "bg-gray-100 text-gray-500"}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "balance" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(leaveBalance).map(([type, bal]) => (
            <div key={type} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-[16px] mb-3 capitalize">{type} Leave</h2>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between"><span className="text-gray-500">Entitled</span><span>{bal.entitled} days</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Used</span><span className="text-red-500">{bal.used} days</span></div>
                <div className="flex justify-between font-semibold"><span>Balance</span><span className="text-green-600">{bal.remaining} days</span></div>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: bal.entitled > 0 ? `${Math.min(100, (bal.used / bal.entitled) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
          {Object.keys(leaveBalance).length === 0 && (
            <p className="text-gray-400 col-span-3 text-center py-8">No leave balance data</p>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDocModal(true)}
              className="flex items-center gap-2 bg-[#4f6ee8] text-white px-5 py-2 rounded-xl text-[13px] font-medium"
            >
              <Plus size={14} />
              Add Document
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center py-8">No documents uploaded</p>
            ) : documents.map(doc => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="font-semibold text-[16px]">{doc.document_name}</h2>
                <p className="text-gray-400 text-[13px] mt-1">{doc.file_name || "document"}</p>
                <span className="inline-block mt-3 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[12px] capitalize">
                  {doc.document_type?.replace("_", " ")}
                </span>
                <p className="text-gray-400 text-[13px] mt-3">{dayjs(doc.uploaded_at).format("DD MMM YYYY")}</p>
                <div className="flex gap-3 mt-3">
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[13px]">View / Download</a>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-400 text-[13px]">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        title="Apply Leave"
        open={leaveModal}
        onCancel={() => setLeaveModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleApplyLeave}>
          <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="paid">Paid</Option>
              <Option value="unpaid">Unpaid</Option>
              <Option value="sick">Sick</Option>
              <Option value="casual">Casual</Option>
              <Option value="maternity">Maternity</Option>
              <Option value="paternity">Paternity</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dates" label="Date Range" rules={[{ required: true }]}>
            <RangePicker className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <TextArea rows={3} placeholder="Reason for leave" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLeaveModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">
              {actionLoading ? "Submitting..." : "Apply"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        title="Add Document"
        open={docModal}
        onCancel={() => setDocModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={docForm} layout="vertical" onFinish={handleAddDocument}>
          <Form.Item name="document_name" label="Document Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Aadhar Card" />
          </Form.Item>
          <Form.Item name="document_type" label="Document Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="id_proof">ID Proof</Option>
              <Option value="address_proof">Address Proof</Option>
              <Option value="education">Education</Option>
              <Option value="experience">Experience</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="file_url" label="File URL" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="file_name" label="File Name">
            <Input placeholder="document.pdf" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDocModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">
              {actionLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
