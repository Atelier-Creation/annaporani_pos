import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table, Button, Modal, Form, Input, Select, DatePicker,
  Tag, Tabs, message, Popconfirm, Drawer, Descriptions, Divider, TimePicker, InputNumber
} from "antd";
import {
  Plus, Users, CalendarDays, FileText, Search,
  UserCheck, Clock, AlertCircle, IndianRupee, Eye, Download, Settings
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// ── Selfie URL helper — works both locally (proxied) and on hosted servers ────
const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const getSelfieUrl = (selfie_url) =>
  selfie_url ? `${BACKEND_BASE}${selfie_url}` : null;
import api from "../api/api";
import PayslipTemplate from "./components/PayslipTemplate";

const { Option } = Select;
const { TabPane } = Tabs;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-[12px] text-gray-400">{label}</p>
      <p className="text-[22px] font-bold text-gray-800 leading-tight">{value ?? "--"}</p>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function HRMSAdmin() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [attLoading, setAttLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [leaveFilter, setLeaveFilter] = useState("");
  const [attMonth, setAttMonth] = useState(dayjs());
  const [attEmpFilter, setAttEmpFilter] = useState("");

  // Employee modal
  const [empModal, setEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm] = Form.useForm();

  // Employee detail drawer
  const [drawerEmp, setDrawerEmp] = useState(null);
  const [drawerTab, setDrawerTab] = useState("info");
  const [drawerAttendance, setDrawerAttendance] = useState([]);
  const [drawerLeaves, setDrawerLeaves] = useState([]);
  const [drawerDocs, setDrawerDocs] = useState([]);

  // Mark attendance modal
  const [attModal, setAttModal] = useState(false);
  const [attForm] = Form.useForm();

  // Attendance grid (new)
  const [attGrid, setAttGrid] = useState({}); // { "empId-day": status }
  const [attRecords, setAttRecords] = useState({}); // { "empId-day": full record }
  const originalGridRef = useRef({}); // snapshot of what was loaded from DB

  // Payslip
  const [payslips, setPayslips] = useState([]);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [genForm] = Form.useForm();
  const [viewPayslip, setViewPayslip] = useState(null);
  const [payslipModal, setPayslipModal] = useState(false);
  const [psMonth, setPsMonth] = useState(dayjs().month() + 1);
  const [psYear, setPsYear] = useState(dayjs().year());
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkPF, setBulkPF] = useState(true);
  const [bulkESI, setBulkESI] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Shift Rules
  const [shiftRules, setShiftRules] = useState([]);
  const [shiftModal, setShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm] = Form.useForm();

  // Attendance edit
  const [attEditModal, setAttEditModal] = useState(false);
  const [attEditData, setAttEditData] = useState(null); // { emp, day, date, existing }
  const [attEditForm] = Form.useForm();

  // Leave Policies
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [policyModal, setPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyForm] = Form.useForm();

  // Advances
  const [advances, setAdvances] = useState([]);
  const [advLoading, setAdvLoading] = useState(false);
  const [advFilter, setAdvFilter] = useState("");
  const [advModal, setAdvModal] = useState(false);
  const [selectedAdv, setSelectedAdv] = useState(null);
  const [advForm] = Form.useForm();

  // Add Advance by Admin
  const [addAdvModal, setAddAdvModal] = useState(false);
  const [addAdvForm] = Form.useForm();
  const [addAdvLoading, setAddAdvLoading] = useState(false);

  // Sign-in proof viewer
  const [proofRecord, setProofRecord] = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async (page = 1, limit = 10, q = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/hrms/employees?page=${page}&limit=${limit}&search=${q}`);
      setEmployees(res.data.data || []);
      setPagination(p => ({ ...p, total: res.data.pagination?.total || 0 }));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchLeaves = useCallback(async (status = "") => {
    setLeaveLoading(true);
    try {
      const q = status ? `&status=${status}` : "";
      const res = await api.get(`/hrms/leaves?limit=100${q}`);
      setLeaves(res.data.data || []);
    } catch { /* silent */ } finally { setLeaveLoading(false); }
  }, []);

  const fetchAttendance = useCallback(async (month = dayjs(), empId = "") => {
    setAttLoading(true);
    try {
      const m = month.month() + 1;
      const y = month.year();
      const empQ = empId ? `&employee_id=${empId}` : "";
      const res = await api.get(`/hrms/attendance?month=${m}&year=${y}&limit=200${empQ}`);
      setAttendance(res.data.data || []);
    } catch { /* silent */ } finally { setAttLoading(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/hrms/attendance/summary");
      setSummary(res.data.data || {});
    } catch { /* silent */ }
  }, []);

  const fetchDrawerData = useCallback(async (emp) => {
    try {
      const now = dayjs();
      const [attRes, leaveRes, docRes] = await Promise.all([
        api.get(`/hrms/employees/${emp.id}/attendance?month=${now.month() + 1}&year=${now.year()}&limit=31`),
        api.get(`/hrms/leaves?limit=20`),
        api.get(`/hrms/employees/${emp.id}/documents`),
      ]);
      setDrawerAttendance(attRes.data.data || []);
      // filter leaves for this employee from the full list
      const allLeaves = leaveRes.data.data || [];
      setDrawerLeaves(allLeaves.filter(l => l.employee_id === emp.id));
      setDrawerDocs(docRes.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchLeaves();
    fetchAttendanceGrid(attMonth);
    fetchSummary();
    fetchPayslips();
    fetchShiftRules();
    fetchLeavePolicies();
    fetchAdvances();
  }, []);

  const fetchPayslips = useCallback(async (month = psMonth, year = psYear, empId = "") => {
    setPayslipLoading(true);
    try {
      const q = `month=${month}&year=${year}${empId ? `&employee_id=${empId}` : ""}`;
      const res = await api.get(`/hrms/payslips?${q}&limit=100`);
      setPayslips(res.data.data || []);
    } catch { /* silent */ } finally { setPayslipLoading(false); }
  }, [psMonth, psYear]);

  const fetchShiftRules = useCallback(async () => {    try {
      const res = await api.get('/hrms/shift-rules');
      setShiftRules(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  // Open attendance edit modal for a specific employee + day
  const openAttEdit = (emp, day) => {
    const m = attMonth.month() + 1;
    const y = attMonth.year();
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${emp.id}-${day}`;
    const existingStatus = attGrid[key] || null;
    const existingRecord = attRecords[key] || null;
    setAttEditData({ emp, day, date, existingStatus, existingRecord });
    attEditForm.setFieldsValue({
      status: existingStatus || 'present',
      sign_in: null,
      sign_out: null,
      notes: '',
    });
    setAttEditModal(true);
  };

  const handleSaveAttEdit = async (values) => {
    if (!attEditData) return;
    const { emp, day, date } = attEditData;
    try {
      const payload = {
        employee_id: emp.id,
        date,
        status: values.status,
        sign_in: values.sign_in ? values.sign_in.format('HH:mm:ss') : null,
        sign_out: values.sign_out ? values.sign_out.format('HH:mm:ss') : null,
        notes: values.notes || '',
      };
      await api.post('/hrms/attendance', payload);
      const key = `${emp.id}-${day}`;
      setAttGrid(prev => ({ ...prev, [key]: values.status }));
      originalGridRef.current = { ...originalGridRef.current, [key]: values.status };
      message.success(`Attendance updated for ${emp.name}`);
      setAttEditModal(false);
      attEditForm.resetFields();
      fetchSummary();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const handleSaveShiftRule = async (values) => {
    try {
      const payload = {
        ...values,
        working_days: values.working_days || [1,2,3,4,5],
      };
      if (editingShift) {
        await api.put(`/hrms/shift-rules/${editingShift.id}`, payload);
        message.success('Shift rule updated');
      } else {
        await api.post('/hrms/shift-rules', payload);
        message.success('Shift rule created');
      }
      setShiftModal(false); shiftForm.resetFields(); setEditingShift(null);
      fetchShiftRules();
    } catch (err) { message.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDeleteShiftRule = async (id) => {
    try {
      await api.delete(`/hrms/shift-rules/${id}`);
      message.success('Shift rule removed');
      fetchShiftRules();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const openEditShift = (rule) => {
    setEditingShift(rule);
    shiftForm.setFieldsValue(rule);
    setShiftModal(true);
  };

  const fetchLeavePolicies = useCallback(async () => {
    try {
      const res = await api.get('/hrms/leave-policies');
      setLeavePolicies(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const handleSavePolicy = async (values) => {
    try {
      if (editingPolicy) {
        await api.put(`/hrms/leave-policies/${editingPolicy.id}`, values);
        message.success('Leave policy updated');
      } else {
        await api.post('/hrms/leave-policies', values);
        message.success('Leave policy created');
      }
      setPolicyModal(false); policyForm.resetFields(); setEditingPolicy(null);
      fetchLeavePolicies();
    } catch (err) { message.error(err.response?.data?.message || 'Failed to save'); }
  };

  const openEditPolicy = (p) => {
    setEditingPolicy(p);
    policyForm.setFieldsValue(p);
    setPolicyModal(true);
  };

  const fetchAdvances = useCallback(async (status = "") => {
    setAdvLoading(true);
    try {
      const q = status ? `status=${status}&limit=100` : 'limit=100';
      const res = await api.get(`/hrms/advances?${q}`);
      setAdvances(res.data.data || []);
    } catch { /* silent */ } finally { setAdvLoading(false); }
  }, []);

  const handleAdvanceAction = async (values) => {
    try {
      await api.put(`/hrms/advances/${selectedAdv.id}/status`, {
        status: values.status,
        admin_notes: values.admin_notes,
        rejection_reason: values.rejection_reason,
        paid_date: values.paid_date?.format('YYYY-MM-DD'),
        deduct_month: values.deduct_month,
        deduct_year: values.deduct_year,
      });
      message.success('Advance updated');
      setAdvModal(false); advForm.resetFields(); setSelectedAdv(null);
      fetchAdvances(advFilter);
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAddAdvance = async (values) => {
    setAddAdvLoading(true);
    try {
      await api.post('/hrms/advances', {
        employee_id: values.employee_id,
        amount: values.amount,
        reason: values.reason,
        requested_date: values.requested_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        status: values.status || 'approved',
        admin_notes: values.admin_notes,
        paid_date: values.paid_date?.format('YYYY-MM-DD'),
        deduct_month: values.deduct_month,
        deduct_year: values.deduct_year,
      });
      message.success('Advance created successfully');
      setAddAdvModal(false);
      addAdvForm.resetFields();
      fetchAdvances(advFilter);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create advance');
    } finally {
      setAddAdvLoading(false);
    }
  };  // Load existing attendance into grid format
  const fetchAttendanceGrid = useCallback(async (month = attMonth) => {
    setAttLoading(true);
    try {
      const m = month.month() + 1;
      const y = month.year();
      const res = await api.get(`/hrms/attendance?month=${m}&year=${y}&limit=500`);
      const rows = res.data.data || [];
      const grid = {};
      const recordMap = {};
      rows.forEach(r => {
        const day = parseInt(r.date.split('-')[2]);
        grid[`${r.employee_id}-${day}`] = r.status;
        recordMap[`${r.employee_id}-${day}`] = r; // store full record
      });
      setAttGrid(grid);
      setAttRecords(recordMap);
      originalGridRef.current = { ...grid };
    } catch { /* silent */ } finally { setAttLoading(false); }
  }, [attMonth]);

  const handleAttCellClick = async (empId, day) => {
    const key = `${empId}-${day}`;
    const cycle = ['present', 'absent', 'leave', 'holiday', null];
    const current = attGrid[key] ?? null;
    const idx = cycle.indexOf(current);
    const next = cycle[(idx + 1) % cycle.length];

    // Optimistic UI update immediately
    setAttGrid(prev => {
      const updated = { ...prev };
      if (next === null) delete updated[key];
      else updated[key] = next;
      return updated;
    });

    // Auto-save to backend
    const m = attMonth.month() + 1;
    const y = attMonth.year();
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      await api.post('/hrms/attendance', {
        employee_id: empId,
        date,
        status: next || 'absent',
      });
      // Keep original in sync so dirty indicator clears
      originalGridRef.current = {
        ...originalGridRef.current,
        [key]: next ?? undefined,
      };
      if (next === null) delete originalGridRef.current[key];
    } catch (err) {
      // Revert on failure
      setAttGrid(prev => {
        const reverted = { ...prev };
        if (current === null) delete reverted[key];
        else reverted[key] = current;
        return reverted;
      });
      message.error('Failed to save attendance');
    }
  };
  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveEmployee = async (values) => {
    try {
      const payload = { ...values };
      if (payload.date_of_joining) payload.date_of_joining = payload.date_of_joining.format("YYYY-MM-DD");
      if (payload.date_of_birth) payload.date_of_birth = payload.date_of_birth.format("YYYY-MM-DD");
      if (editingEmp) {
        await api.put(`/hrms/employees/${editingEmp.id}`, payload);
        message.success("Employee updated");
      } else {
        await api.post("/hrms/employees", payload);
        message.success("Employee created");
      }
      setEmpModal(false); empForm.resetFields(); setEditingEmp(null);
      fetchEmployees(pagination.current, pagination.pageSize, search);
      fetchSummary();
    } catch (err) { message.error(err.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hrms/employees/${id}`);
      message.success("Employee deactivated");
      fetchEmployees(1, pagination.pageSize, search);
      fetchSummary();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const handleLeaveStatus = async (id, status) => {
    try {
      await api.put(`/hrms/leaves/${id}/status`, { status });
      message.success(`Leave ${status}`);
      fetchLeaves(leaveFilter);
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const handleMarkAttendance = async (values) => {
    try {
      const payload = {
        ...values,
        sign_in: values.sign_in ? values.sign_in.format("HH:mm:ss") : null,
        sign_out: values.sign_out ? values.sign_out.format("HH:mm:ss") : null,
        date: values.date.format("YYYY-MM-DD"),
      };
      await api.post("/hrms/attendance", payload);
      message.success("Attendance marked");
      setAttModal(false); attForm.resetFields();
      fetchAttendance(attMonth, attEmpFilter);
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const openEdit = (emp) => {
    setEditingEmp(emp);
    empForm.setFieldsValue({
      ...emp,
      date_of_joining: emp.date_of_joining ? dayjs(emp.date_of_joining) : null,
      date_of_birth: emp.date_of_birth ? dayjs(emp.date_of_birth) : null,
    });
    setEmpModal(true);
  };

  const openDrawer = (emp) => {
    setDrawerEmp(emp); setDrawerTab("info");
    fetchDrawerData(emp);
  };

  const handleGeneratePayslip = async (values) => {
    try {
      await api.post("/hrms/payslips/generate", {
        ...values,
        month: values.period.month() + 1,
        year: values.period.year(),
      });
      message.success("Payslip generated from attendance data");
      setGenModal(false); genForm.resetFields();
      fetchPayslips(psMonth, psYear);
    } catch (err) { message.error(err.response?.data?.message || "Failed to generate"); }
  };

  const handleBulkGenerate = async () => {
    setBulkLoading(true);
    try {
      const res = await api.post("/hrms/payslips/bulk-generate", {
        month: psMonth, year: psYear,
        include_pf: bulkPF,
        include_esi: bulkESI,
      });
      const { success, failed } = res.data.data;
      message.success(`${success.length} payslips generated`);
      if (failed.length > 0) message.warning(`${failed.length} failed: ${failed.map(f => f.name).join(", ")}`);
      setBulkModal(false);
      fetchPayslips(psMonth, psYear);
    } catch (err) {
      message.error(err.response?.data?.message || "Bulk generate failed");
    } finally { setBulkLoading(false); }
  };
  const handleViewPayslip = async (id) => {
    try {
      const res = await api.get(`/hrms/payslips/${id}`);
      setViewPayslip(res.data.data);
      setPayslipModal(true);
    } catch { /* silent */ }
  };

  const handlePayslipStatus = async (id, status) => {
    try {
      await api.put(`/hrms/payslips/${id}/status`, { status, payment_date: status === 'paid' ? dayjs().format("YYYY-MM-DD") : null });
      message.success(`Marked as ${status}`);
      fetchPayslips(psMonth, psYear);
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const handleDeletePayslip = async (id) => {
    try {
      await api.delete(`/hrms/payslips/${id}`);
      message.success("Payslip deleted");
      fetchPayslips(psMonth, psYear);
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const handlePrintPayslip = () => {
    const content = document.getElementById("admin-payslip-print");
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Payslip - ${viewPayslip?.employee?.name}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;}@media print{body{background:#fff;padding:0;}}</style>
      </head><body>${content.outerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const empColumns = [
    { title: "Code", dataIndex: "employee_code", key: "employee_code", width: 110 },
    { title: "Name", dataIndex: "name", key: "name", render: (v, r) => <a onClick={() => openDrawer(r)} className="text-blue-600 cursor-pointer">{v}</a> },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Designation", dataIndex: "designation", key: "designation" },
    { title: "Type", dataIndex: "employment_type", key: "employment_type", render: v => <Tag>{v?.replace("_", " ")}</Tag> },
    { title: "Status", dataIndex: "is_active", key: "is_active", render: v => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag> },
    {
      title: "Actions", key: "actions", render: (_, rec) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEdit(rec)}>Edit</Button>
          <Popconfirm title="Deactivate?" onConfirm={() => handleDelete(rec.id)}>
            <Button size="small" danger>Remove</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const leaveColumns = [
    { title: "Employee", key: "employee", render: (_, r) => r.employee ? `${r.employee.name} (${r.employee.employee_code})` : "--" },
    { title: "Type", dataIndex: "leave_type", key: "leave_type", render: v => <Tag>{v}</Tag> },
    { title: "From", dataIndex: "from_date", key: "from_date", render: v => dayjs(v).format("DD MMM YYYY") },
    { title: "To", dataIndex: "to_date", key: "to_date", render: v => dayjs(v).format("DD MMM YYYY") },
    { title: "Days", dataIndex: "days", key: "days" },
    { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
    { title: "Status", dataIndex: "status", key: "status", render: v => <Tag color={{ pending: "orange", approved: "green", rejected: "red", cancelled: "default" }[v]}>{v}</Tag> },
    {
      title: "Actions", key: "actions", render: (_, r) => r.status === "pending" ? (
        <div className="flex gap-2">
          <Button size="small" type="primary" onClick={() => handleLeaveStatus(r.id, "approved")}>Approve</Button>
          <Button size="small" danger onClick={() => handleLeaveStatus(r.id, "rejected")}>Reject</Button>
        </div>
      ) : "--",
    },
  ];

  const attColumns = [
    { title: "Employee", key: "employee", render: (_, r) => r.employee ? `${r.employee.name} (${r.employee.employee_code})` : "--" },
    { title: "Date", dataIndex: "date", key: "date", render: v => dayjs(v).format("DD MMM YYYY") },
    { title: "Sign In", dataIndex: "sign_in", key: "sign_in", render: v => v || "--" },
    { title: "Sign Out", dataIndex: "sign_out", key: "sign_out", render: v => v || "--" },
    { title: "Hours", dataIndex: "hours_worked", key: "hours_worked", render: v => v ? `${v}h` : "--" },
    { title: "Status", dataIndex: "status", key: "status", render: v => <Tag color={{ present: "green", absent: "red", half_day: "orange", holiday: "blue", leave: "purple" }[v]}>{v?.replace("_", " ")}</Tag> },
    {
      title: "Proof", key: "proof", render: (_, r) => r.selfie_url ? (
        <Button size="small" icon={<Eye size={12} />} onClick={() => setProofRecord(r)}>View</Button>
      ) : <span className="text-gray-300 text-[11px]">—</span>,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 bg-[#f8fafc] min-h-screen">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">HRMS — Human Resource Management</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Employees" value={summary.total_employees} icon={Users} color="bg-blue-500" />
        <StatCard label="Present Today" value={summary.present_today} icon={UserCheck} color="bg-green-500" />
        <StatCard label="On Leave Today" value={summary.on_leave_today} icon={Clock} color="bg-orange-400" />
        <StatCard label="Absent Today" value={summary.absent_today} icon={AlertCircle} color="bg-red-400" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full px-5 py-3">
        <Tabs
          defaultActiveKey="employees"
  className="responsive-tabs"
          tabBarStyle={{ marginBottom: 0, paddingBottom: 0 }}
          style={{ '--ant-tabs-tab-padding': '20px 16px' }}
        >

          {/* ── Employees Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><Users size={14} />Employees</span>} key="employees">
            <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); fetchEmployees(1, pagination.pageSize, e.target.value); }}
                  placeholder="Search name, email, code..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <Button type="primary" icon={<Plus size={14} />}
                onClick={() => { setEditingEmp(null); empForm.resetFields(); setEmpModal(true); }}>
                Add Employee
              </Button>
            </div>
            {/* MOBILE VIEW */}
<div className="mobile-view">

  {employees.map((emp) => (

    <div key={emp.id} className="mobile-card">

      <div className="flex justify-between items-start mb-3">

        <div>
          <h3 className="font-bold text-[15px]">
            {emp.name}
          </h3>

          <p className="text-[11px] text-gray-400">
            {emp.employee_code}
          </p>
        </div>

        <Tag color={emp.is_active ? "green" : "red"}>
          {emp.is_active ? "Active" : "Inactive"}
        </Tag>

      </div>

      <div className="space-y-2">

        <div>
          <p className="mobile-label">Email</p>
          <p className="mobile-value">{emp.email}</p>
        </div>

        <div>
          <p className="mobile-label">Department</p>
          <p className="mobile-value">{emp.department}</p>
        </div>

      </div>

      <div className="flex gap-2 mt-4">

        <Button
          size="small"
          onClick={() => openEdit(emp)}
        >
          Edit
        </Button>

        <Button
          size="small"
          type="primary"
          onClick={() => openDrawer(emp)}
        >
          View
        </Button>

      </div>

    </div>

  ))}

</div>

{/* DESKTOP TABLE */}
<div className="desktop-table overflow-x-auto">

<Table
  scroll={{ x: 800 }}
  columns={empColumns}
  dataSource={employees}
  rowKey="id"
  loading={loading}
  size="small"
  pagination={{
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    onChange: (page, size) => {
      setPagination(p => ({
        ...p,
        current: page,
        pageSize: size
      }));
      fetchEmployees(page, size, search);
    },
  }}
/>

</div>
            </div>
          </TabPane>

          {/* ── Attendance Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><CalendarDays size={14} />Attendance</span>} key="attendance">
            <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 flex-wrap">
              <DatePicker.MonthPicker
                value={attMonth}
                onChange={m => { setAttMonth(m); setAttGrid({}); fetchAttendanceGrid(m); }}
                allowClear={false}
              />
              <span className="text-[11px] text-gray-400 flex flex-wrap items-center gap-2">
                Click to cycle:
                {[['P','#dcfce7','#16a34a'],['A','#fee2e2','#dc2626'],['L','#ffedd5','#ea580c'],['H','#dbeafe','#2563eb']].map(([l,bg,c]) => (
                  <span key={l} className="inline-flex items-center justify-center rounded-lg text-[11px] font-bold w-6 h-6"
                    style={{ background: bg, color: c, border: `1.5px solid ${c}40` }}>{l}</span>
                ))}
                <span className="text-gray-300 text-[11px]">· = empty</span>
              </span>            </div>
            <div className="overflow-x-auto">

{/* MOBILE VIEW */}
<div className="mobile-view">

  {employees.map((emp) => (

    <div key={emp.id} className="mobile-card">

      <div className="flex items-center justify-between mb-3">

        <div>
          <h3 className="font-bold text-[14px]">
            {emp.name}
          </h3>

          <p className="text-[11px] text-gray-400">
            {emp.employee_code}
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-[11px] font-bold
          ${
            Object.values(attGrid).includes("present")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {Object.values(attGrid).includes("present")
            ? "Present"
            : "Absent"}
        </div>

      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">

        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {

          const key = `${emp.id}-${day}`;
          const status = attGrid[key];

          const colors = {
            present: "bg-green-100 text-green-700",
            absent: "bg-red-100 text-red-700",
            leave: "bg-orange-100 text-orange-700",
            holiday: "bg-blue-100 text-blue-700",
          };

          return (
            <div
              key={day}
              onClick={() => handleAttCellClick(emp.id, day)}
              className={`h-9 rounded-lg flex items-center justify-center text-[11px] font-bold cursor-pointer
              ${colors[status] || "bg-gray-100 text-gray-400"}`}
            >
              {status?.charAt(0)?.toUpperCase() || "-"}
            </div>
          );

        })}

      </div>

    </div>

  ))}

</div>

{/* DESKTOP VIEW */}
<div className="desktop-table overflow-x-auto">

  <AttendanceGrid
    employees={employees}
    month={attMonth}
    grid={attGrid}
    originalGrid={originalGridRef.current}
    onCellClick={handleAttCellClick}
    onCellEdit={openAttEdit}
    loading={attLoading}
  />

</div>
</div>

            {/* ── Sign-In Proofs Panel ── */}
            {(() => {
              const proofs = Object.values(attRecords).filter(r => r.selfie_url);
              if (proofs.length === 0) return null;
              return (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">Sign-In Proofs — {attMonth.format("MMM YYYY")}</span>
                    <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">{proofs.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {proofs.map(r => {
                      const emp = employees.find(e => e.id === r.employee_id);
                      const selfieUrl = getSelfieUrl(r.selfie_url);
                      const mapsUrl = r.latitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : null;
                      const expiresIn = r.selfie_expires_at
                        ? Math.max(0, Math.ceil((new Date(r.selfie_expires_at) - Date.now()) / (1000 * 60 * 60)))
                        : null;
                      return (
                        <div key={r.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Selfie */}
                          <div className="relative cursor-pointer" style={{ height: 140 }}
                            onClick={() => setProofRecord({ ...r, employee: emp })}>
                            <img src={selfieUrl} alt="selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                              <div>
                                <p className="text-white text-[12px] font-bold leading-tight">{emp?.name || "—"}</p>
                                <p className="text-white/70 text-[10px]">{emp?.employee_code} · {dayjs(r.date).format("DD MMM")}</p>
                              </div>
                              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">{r.sign_in}</span>
                            </div>
                            {/* Expand icon */}
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                            </div>
                          </div>
                          {/* Location */}
                          <div className="p-3">
                            {r.location_address ? (
                              <div className="flex items-start gap-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-snug">{r.location_address}</p>
                                  {mapsUrl && (
                                    <a href={mapsUrl} target="_blank" rel="noreferrer"
                                      className="text-[10px] text-blue-500 underline mt-0.5 inline-block">
                                      Open Map →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400">No location data</p>
                            )}
                            {expiresIn !== null && (
                              <div className={`mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block font-medium ${expiresIn < 12 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                                Expires in {expiresIn}h
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </div>
          </TabPane>

          {/* ── Leave Requests Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><FileText size={14} />Leave Requests</span>} key="leaves">
            <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: 180 }}
                onChange={v => { setLeaveFilter(v || ""); fetchLeaves(v || ""); }}
              >
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </div>
{/* MOBILE */}
<div className="mobile-view">

  {leaves.map((leave) => (

    <div key={leave.id} className="mobile-card">

      <h3 className="font-bold text-[14px] mb-2">
        {leave.employee?.name}
      </h3>

      <div className="space-y-2">

        <div>
          <p className="mobile-label">Leave Type</p>
          <p className="mobile-value">{leave.leave_type}</p>
        </div>

        <div>
          <p className="mobile-label">Status</p>
          <Tag>{leave.status}</Tag>
        </div>

      </div>

    </div>

  ))}

</div>

{/* DESKTOP */}
<div className="desktop-table overflow-x-auto">

<Table
  scroll={{ x: 800 }}
  columns={leaveColumns}
  dataSource={leaves}
  rowKey="id"
  loading={leaveLoading}
  size="small"
/>

</div>
            </div>
          </TabPane>

          {/* ── Payslips Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><IndianRupee size={14} />Payslips</span>} key="payslips">
            <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3 flex-wrap">
              <Select value={psMonth} onChange={v => { setPsMonth(v); fetchPayslips(v, psYear); }} style={{ width: 120 }}>
                {MONTHS.map((m, i) => <Option key={i+1} value={i+1}>{m}</Option>)}
              </Select>
              <Select value={psYear} onChange={v => { setPsYear(v); fetchPayslips(psMonth, v); }} style={{ width: 100 }}>
                {[2024, 2025, 2026, 2027].map(y => <Option key={y} value={y}>{y}</Option>)}
              </Select>
              <Select placeholder="Filter by employee" allowClear style={{ width: 220 }}
                onChange={v => fetchPayslips(psMonth, psYear, v || "")}>
                {employees.map(e => <Option key={e.id} value={e.id}>{e.name} ({e.employee_code})</Option>)}
              </Select>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => { genForm.resetFields(); setGenModal(true); }}>
                Generate Payslip
              </Button>
              <Popconfirm
                title={`Auto-generate payslips for all employees for ${MONTHS[psMonth - 1]} ${psYear}?`}
                description="This will calculate salary based on attendance data."
                onConfirm={handleBulkGenerate}
              >
                <Button
                onClick={() => { setBulkPF(true); setBulkESI(true); setBulkModal(true); }}
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
              >
                Auto Generate All
              </Button>
              </Popconfirm>            </div>
            {/* MOBILE VIEW */}
<div className="mobile-view">

  {payslips.map((pay) => (

    <div key={pay.id} className="mobile-card">

      <div className="flex justify-between items-start mb-3">

        <div>
          <h3 className="font-bold text-[14px]">
            {pay.employee?.name}
          </h3>

          <p className="text-[11px] text-gray-400">
            {pay.employee?.employee_code}
          </p>
        </div>

        <Tag
          color={{
            draft: "default",
            generated: "blue",
            paid: "green"
          }[pay.status]}
        >
          {pay.status}
        </Tag>

      </div>

      <div className="space-y-2">

        <div className="flex justify-between">
          <span className="mobile-label">Month</span>

          <span className="mobile-value">
            {MONTHS[pay.month - 1]} {pay.year}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="mobile-label">Gross</span>

          <span className="font-semibold">
            ₹{parseFloat(pay.gross_salary).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="mobile-label">Deduction</span>

          <span className="text-red-500 font-semibold">
            ₹{parseFloat(pay.total_deductions).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="mobile-label">Net Salary</span>

          <span className="text-green-600 font-bold">
            ₹{parseFloat(pay.net_salary).toLocaleString("en-IN")}
          </span>
        </div>

      </div>

      <div className="flex gap-2 mt-4 flex-wrap">

        <Button
          size="small"
          icon={<Eye size={12} />}
          onClick={() => handleViewPayslip(pay.id)}
        >
          View
        </Button>

        {pay.status !== "paid" && (
          <Button
            size="small"
            type="primary"
            onClick={() =>
              handlePayslipStatus(pay.id, "paid")
            }
          >
            Mark Paid
          </Button>
        )}

      </div>

    </div>

  ))}

</div>

{/* DESKTOP VIEW */}
<div className="desktop-table overflow-x-auto">

<Table
  size="small"
  scroll={{ x: 1000 }}
  loading={payslipLoading}
  dataSource={payslips}
  rowKey="id"
  columns={[
    {
      title: "Employee",
      key: "emp",
      render: (_, r) =>
        r.employee
          ? `${r.employee.name} (${r.employee.employee_code})`
          : "--"
    },

    {
      title: "Month",
      key: "month",
      render: (_, r) =>
        `${MONTHS[r.month - 1]} ${r.year}`
    },

    {
      title: "Gross",
      dataIndex: "gross_salary",
      render: v =>
        `₹${parseFloat(v).toLocaleString("en-IN")}`
    },

    {
      title: "Deductions",
      dataIndex: "total_deductions",
      render: v => (
        <span className="text-red-500">
          ₹{parseFloat(v).toLocaleString("en-IN")}
        </span>
      )
    },

    {
      title: "Net Salary",
      dataIndex: "net_salary",
      render: v => (
        <span className="font-semibold text-green-600">
          ₹{parseFloat(v).toLocaleString("en-IN")}
        </span>
      )
    },

    {
      title: "Status",
      dataIndex: "status",
      render: v => (
        <Tag
          color={{
            draft: "default",
            generated: "blue",
            paid: "green"
          }[v]}
        >
          {v}
        </Tag>
      )
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <div className="flex gap-2">

          <Button
            size="small"
            icon={<Eye size={12} />}
            onClick={() => handleViewPayslip(r.id)}
          >
            View
          </Button>

          {r.status !== "paid" && (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                handlePayslipStatus(r.id, "paid")
              }
            >
              Mark Paid
            </Button>
          )}

        </div>
      )
    },
  ]}
/>

</div>
            </div>
          </TabPane>

          {/* ── Shift Rules Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><Settings size={14} />Shift Rules</span>} key="shifts">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[13px] text-gray-500">Define shift timings, grace periods, and leave rules. These are applied automatically when attendance is marked.</p>
                </div>
                <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditingShift(null); shiftForm.resetFields(); setShiftModal(true); }}>
                  Add Shift Rule
                </Button>
              </div>

              {/* MOBILE VIEW */}
<div className="mobile-view">

  {shiftRules.map((rule) => (

    <div
      key={rule.id}
      className="mobile-card"
    >

      {/* TOP */}
      <div className="flex flex-col gap-3">

        <div className="flex items-start justify-between gap-2">

          <div className="flex items-center gap-2">

            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>

            <div>

              <div className="flex items-center gap-2 flex-wrap">

                <h3 className="font-bold text-[14px]">
                  {rule.name}
                </h3>

                {rule.is_default && (
                  <Tag color="blue">
                    Default
                  </Tag>
                )}

              </div>

              <p className="text-[11px] text-gray-400">
                {rule.shift_start} - {rule.shift_end}
              </p>

            </div>

          </div>

        </div>

        {/* BUTTONS */}
        <div className="flex gap-2 w-full">

          <Button
            size="small"
            className="flex-1"
            onClick={() => openEditShift(rule)}
          >
            Edit
          </Button>

          <Popconfirm
            title="Remove shift rule?"
            onConfirm={() =>
              handleDeleteShiftRule(rule.id)
            }
          >

            <Button
              size="small"
              danger
              className="flex-1"
            >
              Remove
            </Button>

          </Popconfirm>

        </div>

      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-2 gap-2 mt-4">

        {[
          {
            label: "Grace",
            value: `${rule.grace_minutes} min`,
            color: "bg-green-50 text-green-700"
          },

          {
            label: "Late",
            value: `${rule.late_mark_after_minutes} min`,
            color: "bg-yellow-50 text-yellow-700"
          },

          {
            label: "Half Day",
            value: `${rule.half_day_after_minutes} min`,
            color: "bg-orange-50 text-orange-700"
          },

          {
            label: "Absent",
            value: `${rule.absent_after_minutes} min`,
            color: "bg-red-50 text-red-700"
          },

          {
            label: "Full Day",
            value: `${rule.min_hours_full_day}h`,
            color: "bg-blue-50 text-blue-700"
          },

          {
            label: "Half Day",
            value: `${rule.min_hours_half_day}h`,
            color: "bg-purple-50 text-purple-700"
          },

        ].map((item) => (

          <div
            key={item.label}
            className={`rounded-xl p-3 ${item.color}`}
          >

            <p className="text-[10px] font-semibold opacity-70">
              {item.label}
            </p>

            <p className="text-[15px] font-bold mt-1">
              {item.value}
            </p>

          </div>

        ))}

      </div>

    </div>

  ))}

</div>

{/* DESKTOP VIEW */}
<div className="desktop-table overflow-x-auto">

  <Table
    rowKey="id"
    dataSource={shiftRules}
    pagination={false}
    scroll={{ x: 1000 }}
    columns={[

      {
        title: "Shift",
        render: (_, rule) => (
          <div>

            <p className="font-semibold">
              {rule.name}
            </p>

            <p className="text-[11px] text-gray-400">
              {rule.shift_start} - {rule.shift_end}
            </p>

          </div>
        )
      },

      {
        title: "Grace",
        render: (_, r) =>
          `${r.grace_minutes} min`
      },

      {
        title: "Late",
        render: (_, r) =>
          `${r.late_mark_after_minutes} min`
      },

      {
        title: "Absent",
        render: (_, r) =>
          `${r.absent_after_minutes} min`
      },

      {
        title: "Actions",
        render: (_, r) => (

          <div className="flex gap-2">

            <Button
              size="small"
              onClick={() => openEditShift(r)}
            >
              Edit
            </Button>

            <Popconfirm
              title="Remove shift rule?"
              onConfirm={() =>
                handleDeleteShiftRule(r.id)
              }
            >

              <Button
                size="small"
                danger
              >
                Remove
              </Button>

            </Popconfirm>

          </div>

        )
      },

    ]}
  />

</div>
            </div>
          </TabPane>

          {/* ── Leave Policies Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><FileText size={14} />Leave Policies</span>} key="leave-policies">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <p className="text-[13px] text-gray-500">Configure leave entitlements. These values are used to calculate each employee's leave balance dynamically.</p>
                <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditingPolicy(null); policyForm.resetFields(); setPolicyModal(true); }}>
                  Add Policy
                </Button>
              </div>

              {/* MOBILE VIEW */}
<div className="mobile-view">

  {leavePolicies.map((p) => (

    <div
      key={p.id}
      className="mobile-card"
    >

      {/* TOP */}
      <div className="flex items-start justify-between gap-2">

        <div>

          <h3 className="font-bold text-[14px]">
            {p.label}
          </h3>

          <p className="text-[11px] text-gray-400 capitalize">
            {p.leave_type}
          </p>

        </div>

        <Tag
          color={
            p.carry_forward
              ? "green"
              : "default"
          }
        >
          {p.carry_forward
            ? "Carry"
            : "No Carry"}
        </Tag>

      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-2 gap-2 mt-4">

        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-[10px] text-blue-500 font-semibold">
            DAYS / YEAR
          </p>

          <p className="text-[18px] font-bold text-blue-700">
            {p.days_per_year}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-3">
          <p className="text-[10px] text-purple-500 font-semibold">
            MAX CF
          </p>

          <p className="text-[18px] font-bold text-purple-700">
            {p.max_carry_forward_days || 0}
          </p>
        </div>

      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 mt-4">

        <Tag
          color={
            p.requires_approval
              ? "orange"
              : "blue"
          }
        >
          {p.requires_approval
            ? "Approval Required"
            : "Auto Approval"}
        </Tag>

        <Tag color="cyan">
          {p.applicable_gender}
        </Tag>

      </div>

      {/* BUTTON */}
      <Button
        block
        size="small"
        className="mt-4"
        onClick={() => openEditPolicy(p)}
      >
        Edit Policy
      </Button>

    </div>

  ))}

</div>

{/* DESKTOP VIEW */}
<div className="desktop-table overflow-x-auto">

  <Table
    rowKey="id"
    dataSource={leavePolicies}
    pagination={false}
    scroll={{ x: 1000 }}
    columns={[

      {
        title: "Leave Type",
        render: (_, p) => (

          <div>

            <p className="font-semibold">
              {p.label}
            </p>

            <p className="text-[11px] text-gray-400 capitalize">
              {p.leave_type}
            </p>

          </div>

        )
      },

      {
        title: "Days / Year",
        dataIndex: "days_per_year",
      },

      {
        title: "Carry Forward",
        render: (_, p) => (
          <Tag
            color={
              p.carry_forward
                ? "green"
                : "default"
            }
          >
            {p.carry_forward
              ? "Yes"
              : "No"}
          </Tag>
        )
      },

      {
        title: "Max CF Days",
        render: (_, p) =>
          p.carry_forward
            ? `${p.max_carry_forward_days} days`
            : "—"
      },

      {
        title: "Approval",
        render: (_, p) => (
          <Tag
            color={
              p.requires_approval
                ? "orange"
                : "blue"
            }
          >
            {p.requires_approval
              ? "Required"
              : "Auto"}
          </Tag>
        )
      },

      {
        title: "Applicable",
        dataIndex: "applicable_gender",
      },

      {
        title: "Actions",
        render: (_, p) => (

          <Button
            size="small"
            onClick={() => openEditPolicy(p)}
          >
            Edit
          </Button>

        )
      },

    ]}
  />

</div>
            </div>
          </TabPane>

          {/* ── Advance Payments Tab ── */}
          <TabPane tab={<span className="flex items-center gap-2"><IndianRupee size={14} />Advances</span>} key="advances">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 flex-wrap">
                <Select placeholder="Filter by status" allowClear style={{ width: 180 }}
                  onChange={v => { setAdvFilter(v || ''); fetchAdvances(v || ''); }}>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="paid">Paid</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="deducted">Deducted</Option>
                </Select>
                <Button type="primary" icon={<Plus size={14} />}
                  onClick={() => { addAdvForm.resetFields(); setAddAdvModal(true); }}>
                  Add Advance
                </Button>
              </div>
              {/* MOBILE */}
<div className="mobile-view">

  {advances.map((adv) => (

    <div key={adv.id} className="mobile-card">

      <h3 className="font-bold text-[14px]">
        {adv.employee?.name}
      </h3>

      <div className="mt-3">

        <p className="mobile-label">Amount</p>

        <p className="text-[18px] font-bold text-green-600">
          ₹{adv.amount}
        </p>

      </div>

      <Tag className="mt-2">
        {adv.status}
      </Tag>

      <Button
        block
        type="primary"
        className="mt-4"
        onClick={() => {
          setSelectedAdv(adv);
          advForm.setFieldsValue({
            status: adv.status,
            admin_notes: adv.admin_notes,
            deduct_month: adv.deduct_month,
            deduct_year: adv.deduct_year
          });
          setAdvModal(true);
        }}
      >
        Manage
      </Button>

    </div>

  ))}

</div>

{/* DESKTOP */}
<div className="desktop-table overflow-x-auto">

<Table
  size="small"
  loading={advLoading}
  dataSource={advances}
  rowKey="id"
  columns={[
    { title: 'Employee', key: 'emp', render: (_, r) => r.employee ? `${r.employee.name} (${r.employee.employee_code})` : '--' },
    { title: 'Requested', dataIndex: 'requested_date', render: v => dayjs(v).format('DD MMM YYYY') },
    { title: 'Amount', dataIndex: 'amount', render: v => <span className="font-bold text-gray-800">₹{parseFloat(v).toLocaleString('en-IN')}</span> },
    { title: 'Reason', dataIndex: 'reason', ellipsis: true },
    { title: 'Deduct Month', key: 'deduct', render: (_, r) => r.deduct_month ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][r.deduct_month-1]} ${r.deduct_year}` : '—' },
    { title: 'Status', dataIndex: 'status', render: v => {
      const c = { pending:'orange', approved:'blue', paid:'green', rejected:'red', deducted:'default' };
      return <Tag color={c[v]}>{v}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_, r) => (
      <Button size="small" onClick={() => {
        setSelectedAdv(r);
        advForm.setFieldsValue({
          status: r.status,
          admin_notes: r.admin_notes,
          deduct_month: r.deduct_month,
          deduct_year: r.deduct_year
        });
        setAdvModal(true);
      }}>
        Manage
      </Button>
    )},
  ]}
/>

</div>
            </div>
          </TabPane>

        </Tabs>
      </div>

      {/* ── Employee Detail Drawer ── */}
      <Drawer
        title={drawerEmp ? `${drawerEmp.name} — ${drawerEmp.employee_code}` : ""}
        open={!!drawerEmp}
        onClose={() => setDrawerEmp(null)}
        width={680}
      >
        {drawerEmp && (
          <Tabs activeKey={drawerTab} onChange={setDrawerTab}>
            <TabPane tab="Profile" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Name">{drawerEmp.name}</Descriptions.Item>
                <Descriptions.Item label="Code">{drawerEmp.employee_code}</Descriptions.Item>
                <Descriptions.Item label="Email">{drawerEmp.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{drawerEmp.phone || "--"}</Descriptions.Item>
                <Descriptions.Item label="Department">{drawerEmp.department || "--"}</Descriptions.Item>
                <Descriptions.Item label="Designation">{drawerEmp.designation || "--"}</Descriptions.Item>
                <Descriptions.Item label="Employment Type"><Tag>{drawerEmp.employment_type?.replace("_", " ")}</Tag></Descriptions.Item>
                <Descriptions.Item label="Gender">{drawerEmp.gender || "--"}</Descriptions.Item>
                <Descriptions.Item label="Date of Joining">{drawerEmp.date_of_joining ? dayjs(drawerEmp.date_of_joining).format("DD MMM YYYY") : "--"}</Descriptions.Item>
                <Descriptions.Item label="Date of Birth">{drawerEmp.date_of_birth ? dayjs(drawerEmp.date_of_birth).format("DD MMM YYYY") : "--"}</Descriptions.Item>
                <Descriptions.Item label="Salary">₹{drawerEmp.salary || "0"}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color={drawerEmp.is_active ? "green" : "red"}>{drawerEmp.is_active ? "Active" : "Inactive"}</Tag></Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>{drawerEmp.address || "--"}</Descriptions.Item>
              </Descriptions>
              <div className="flex gap-2 mt-4">
                <Button type="primary" onClick={() => openEdit(drawerEmp)}>Edit Employee</Button>
                <Popconfirm title="Deactivate this employee?" onConfirm={() => { handleDelete(drawerEmp.id); setDrawerEmp(null); }}>
                  <Button danger>Deactivate</Button>
                </Popconfirm>
              </div>
            </TabPane>

            <TabPane tab="Attendance" key="attendance">
              <Table
                size="small"
                dataSource={drawerAttendance}
                rowKey="id"
                columns={[
                  { title: "Date", dataIndex: "date", render: v => dayjs(v).format("DD MMM YYYY") },
                  { title: "Sign In", dataIndex: "sign_in", render: v => v || "--" },
                  { title: "Sign Out", dataIndex: "sign_out", render: v => v || "--" },
                  { title: "Hours", dataIndex: "hours_worked", render: v => v ? `${v}h` : "--" },
                  { title: "Status", dataIndex: "status", render: v => <Tag color={{ present: "green", absent: "red", half_day: "orange", holiday: "blue", leave: "purple" }[v]}>{v?.replace("_", " ")}</Tag> },
                  { title: "Proof", key: "proof", render: (_, r) => r.selfie_url ? (
                    <Button size="small" icon={<Eye size={12} />} onClick={() => setProofRecord(r)}>View</Button>
                  ) : "—" },
                ]}
              />
            </TabPane>

            <TabPane tab="Leaves" key="leaves">
              <Table
                size="small"
                dataSource={drawerLeaves}
                rowKey="id"
                columns={[
                  { title: "Type", dataIndex: "leave_type", render: v => <Tag>{v}</Tag> },
                  { title: "From", dataIndex: "from_date", render: v => dayjs(v).format("DD MMM YYYY") },
                  { title: "To", dataIndex: "to_date", render: v => dayjs(v).format("DD MMM YYYY") },
                  { title: "Days", dataIndex: "days" },
                  { title: "Status", dataIndex: "status", render: v => <Tag color={{ pending: "orange", approved: "green", rejected: "red" }[v]}>{v}</Tag> },
                ]}
              />
            </TabPane>

            <TabPane tab="Documents" key="documents">
              {drawerDocs.length === 0
                ? <p className="text-gray-400 text-sm py-4">No documents uploaded</p>
                : drawerDocs.map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-3 mb-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{doc.document_name}</p>
                      <p className="text-xs text-gray-400">{doc.file_name} · <Tag className="text-[10px]">{doc.document_type?.replace("_", " ")}</Tag></p>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">View</a>
                  </div>
                ))
              }
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* ── Add / Edit Employee Modal ── */}
      <Modal
        title={editingEmp ? "Edit Employee" : "Add Employee"}
        open={empModal}
        onCancel={() => { setEmpModal(false); setEditingEmp(null); empForm.resetFields(); }}
        footer={null} width={680} destroyOnClose
      >
        <Form form={empForm} layout="vertical" onFinish={handleSaveEmployee}>
          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-500">Basic Info</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
              <Input placeholder="john@example.com" />
            </Form.Item>
            {!editingEmp && (
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Min 6 characters" />
              </Form.Item>
            )}
            <Form.Item name="phone" label="Phone">
              <Input placeholder="10-digit number" />
            </Form.Item>
          </div>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-500">Job Details</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="department" label="Department">
              <Input placeholder="e.g. Sales" />
            </Form.Item>
            <Form.Item name="designation" label="Designation">
              <Input placeholder="e.g. Store Manager" />
            </Form.Item>
            <Form.Item name="employment_type" label="Employment Type">
              <Select placeholder="Select">
                <Option value="full_time">Full Time</Option>
                <Option value="part_time">Part Time</Option>
                <Option value="contract">Contract</Option>
                <Option value="intern">Intern</Option>
              </Select>
            </Form.Item>
            <Form.Item name="salary" label="Salary (₹)">
              <Input type="number" placeholder="0" />
            </Form.Item>
            <Form.Item name="date_of_joining" label="Date of Joining">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-500">Personal Details</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="date_of_birth" label="Date of Birth">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Full address" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setEmpModal(false); setEditingEmp(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editingEmp ? "Update Employee" : "Create Employee"}</Button>
          </div>
        </Form>
      </Modal>

      {/* ── Mark Attendance Modal ── */}
      <Modal
        title="Mark Attendance"
        open={attModal}
        onCancel={() => { setAttModal(false); attForm.resetFields(); }}
        footer={null} destroyOnClose
      >
        <Form form={attForm} layout="vertical" onFinish={handleMarkAttendance}>
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee" showSearch optionFilterProp="children">
              {employees.map(e => <Option key={e.id} value={e.id}>{e.name} ({e.employee_code})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="sign_in" label="Sign In Time">
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
            <Form.Item name="sign_out" label="Sign Out Time">
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">
              <Option value="present">Present</Option>
              <Option value="absent">Absent</Option>
              <Option value="half_day">Half Day</Option>
              <Option value="holiday">Holiday</Option>
              <Option value="leave">Leave</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setAttModal(false); attForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>

      {/* ── Bulk Generate Modal ── */}
      <Modal
        title={null}
        open={bulkModal}
        onCancel={() => setBulkModal(false)}
        footer={null}
        width={460}
        destroyOnClose
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: '8px 8px 0 0', margin: '-20px -24px 24px', padding: '24px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Auto Generate Payslips</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {MONTHS[psMonth - 1]} {psYear} · All active employees
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          Payslips will be calculated from attendance data. Choose which deductions to include:
        </p>

        {/* PF Toggle */}
        <div
          onClick={() => setBulkPF(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 12, cursor: 'pointer', marginBottom: 12,
            border: `2px solid ${bulkPF ? '#3b82f6' : '#e2e8f0'}`,
            background: bulkPF ? '#eff6ff' : '#f8fafc',
            transition: 'all 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: bulkPF ? '#1d4ed8' : '#374151' }}>
              Provident Fund (PF)
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>12% of Basic Salary</div>
          </div>
          <div style={{
            width: 44, height: 24, borderRadius: 12, position: 'relative', transition: 'all 0.2s',
            background: bulkPF ? '#3b82f6' : '#d1d5db',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: bulkPF ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* ESI Toggle */}
        <div
          onClick={() => setBulkESI(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 12, cursor: 'pointer', marginBottom: 24,
            border: `2px solid ${bulkESI ? '#3b82f6' : '#e2e8f0'}`,
            background: bulkESI ? '#eff6ff' : '#f8fafc',
            transition: 'all 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: bulkESI ? '#1d4ed8' : '#374151' }}>
              Employee State Insurance (ESI)
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>0.75% of Gross · Applicable if gross ≤ ₹21,000</div>
          </div>
          <div style={{
            width: 44, height: 24, borderRadius: 12, position: 'relative', transition: 'all 0.2s',
            background: bulkESI ? '#3b82f6' : '#d1d5db',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: bulkESI ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Deductions that will be applied:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bulkPF
              ? <span style={{ fontSize: 12, background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>PF (12%) included</span>
              : <span style={{ fontSize: 12, background: '#f1f5f9', color: '#94a3b8', padding: '3px 10px', borderRadius: 20 }}>PF excluded</span>
            }
            {bulkESI
              ? <span style={{ fontSize: 12, background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>ESI (0.75%) included</span>
              : <span style={{ fontSize: 12, background: '#f1f5f9', color: '#94a3b8', padding: '3px 10px', borderRadius: 20 }}>ESI excluded</span>
            }
            {!bulkPF && !bulkESI && (
              <span style={{ fontSize: 12, background: '#fef9c3', color: '#854d0e', padding: '3px 10px', borderRadius: 20 }}>No statutory deductions</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={() => setBulkModal(false)}>Cancel</Button>
          <Button
            type="primary"
            loading={bulkLoading}
            onClick={handleBulkGenerate}
            style={{ background: '#1d4ed8', borderColor: '#1d4ed8' }}
          >
            Generate for All Employees
          </Button>
        </div>
      </Modal>

      {/* ── Attendance Edit Modal ── */}
      <Modal
        title={attEditData ? (
          <div>
            <div className="text-[15px] font-bold text-gray-800">Edit Attendance</div>
            <div className="text-[12px] text-gray-400 font-normal mt-0.5">
              {attEditData.emp?.name} &nbsp;·&nbsp; {attEditData.date}
            </div>
          </div>
        ) : "Edit Attendance"}
        open={attEditModal}
        onCancel={() => { setAttEditModal(false); attEditForm.resetFields(); }}
        footer={null}
        width={460}
        destroyOnClose
      >
        {attEditData && (
          <div>
            {/* Employee info strip */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                {attEditData.emp?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-800">{attEditData.emp?.name}</div>
                <div className="text-[11px] text-gray-500">{attEditData.emp?.employee_code} &nbsp;·&nbsp; {attEditData.emp?.department || 'General'}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[11px] text-gray-400">Date</div>
                <div className="text-[13px] font-semibold text-gray-700">{dayjs(attEditData.date).format('DD MMM YYYY')}</div>
              </div>
            </div>

            {/* ── Sign-In Proof (selfie + location) ── */}
            {attEditData.existingRecord?.selfie_url && (
              <div className="mb-4 rounded-xl border border-indigo-100 overflow-hidden">
                <div className="bg-indigo-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Sign-In Proof
                  </span>
                  {attEditData.existingRecord.selfie_expires_at && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Expires {dayjs(attEditData.existingRecord.selfie_expires_at).fromNow()}
                    </span>
                  )}
                </div>
                <div className="flex gap-0">
                  {/* Selfie thumbnail */}
                  <div className="w-28 flex-shrink-0 bg-black">
                    <img
                      src={getSelfieUrl(attEditData.existingRecord.selfie_url)}
                      alt="Sign-in selfie"
                      className="w-full h-full object-cover"
                      style={{ maxHeight: 112 }}
                    />
                  </div>
                  {/* Location */}
                  <div className="flex-1 p-3 bg-white">
                    {attEditData.existingRecord.location_address ? (
                      <>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Location
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug line-clamp-3">{attEditData.existingRecord.location_address}</p>
                        {attEditData.existingRecord.latitude && (
                          <a
                            href={`https://www.google.com/maps?q=${attEditData.existingRecord.latitude},${attEditData.existingRecord.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="text-[10px] text-blue-500 underline mt-1 inline-block"
                          >
                            Open in Google Maps →
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-400">No location data</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setProofRecord({ ...attEditData.existingRecord, employee: attEditData.emp })}
                      className="mt-2 text-[10px] text-indigo-500 underline"
                    >
                      View full size →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Form form={attEditForm} layout="vertical" onFinish={handleSaveAttEdit}>
              <Form.Item name="status" label="Attendance Status" rules={[{ required: true }]}>
                <Select>
                  {[
                    { v: 'present',    label: 'Present',    color: '#16a34a' },
                    { v: 'absent',     label: 'Absent',     color: '#dc2626' },
                    { v: 'half_day',   label: 'Half Day',   color: '#ea580c' },
                    { v: 'late',       label: 'Late',       color: '#d97706' },
                    { v: 'leave',      label: 'Leave',      color: '#7c3aed' },
                    { v: 'holiday',    label: 'Holiday',    color: '#2563eb' },
                    { v: 'permission', label: 'Permission', color: '#0891b2' },
                  ].map(s => (
                    <Option key={s.v} value={s.v}>
                      <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item name="sign_in" label="Sign In Time">
                  <TimePicker className="w-full" format="HH:mm" placeholder="e.g. 09:15" />
                </Form.Item>
                <Form.Item name="sign_out" label="Sign Out Time">
                  <TimePicker className="w-full" format="HH:mm" placeholder="e.g. 18:00" />
                </Form.Item>
              </div>

              <Form.Item name="notes" label="Notes / Reason">
                <Input.TextArea rows={2} placeholder="e.g. Employee forgot to sign in, confirmed present by manager" />
              </Form.Item>

              <div className="flex justify-end gap-2 pt-1">
                <Button onClick={() => { setAttEditModal(false); attEditForm.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">Save Attendance</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── Advance Management Modal ── */}
      <Modal
        title={selectedAdv ? `Advance Request — ₹${parseFloat(selectedAdv.amount || 0).toLocaleString('en-IN')}` : 'Manage Advance'}
        open={advModal}
        onCancel={() => { setAdvModal(false); advForm.resetFields(); setSelectedAdv(null); }}
        footer={null} width={480} destroyOnClose
      >
        {selectedAdv && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                {selectedAdv.employee?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-gray-800">{selectedAdv.employee?.name}</div>
                <div className="text-[11px] text-gray-500">{selectedAdv.employee?.employee_code} · Requested {dayjs(selectedAdv.requested_date).format('DD MMM YYYY')}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-400">Amount</div>
                <div className="text-[16px] font-bold text-gray-800">₹{parseFloat(selectedAdv.amount).toLocaleString('en-IN')}</div>
              </div>
            </div>
            {selectedAdv.reason && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-[13px] text-gray-600">
                <span className="font-semibold text-gray-500 text-[11px] uppercase">Reason: </span>{selectedAdv.reason}
              </div>
            )}
            <Form form={advForm} layout="vertical" onFinish={handleAdvanceAction}>
              <Form.Item name="status" label="Update Status" rules={[{ required: true }]}>
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="paid">Paid (Amount Disbursed)</Option>
                  <Option value="rejected">Rejected</Option>
                </Select>
              </Form.Item>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item name="deduct_month" label="Deduct in Month">
                  <Select placeholder="Month">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                      <Option key={i+1} value={i+1}>{m}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="deduct_year" label="Deduct Year">
                  <Select placeholder="Year">
                    {[2024,2025,2026,2027].map(y => <Option key={y} value={y}>{y}</Option>)}
                  </Select>
                </Form.Item>
              </div>
              <Form.Item name="paid_date" label="Paid Date">
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="admin_notes" label="Admin Notes">
                <Input.TextArea rows={2} placeholder="Optional notes to employee" />
              </Form.Item>
              <Form.Item name="rejection_reason" label="Rejection Reason">
                <Input.TextArea rows={2} placeholder="Required if rejecting" />
              </Form.Item>
              <div className="flex justify-end gap-2">
                <Button onClick={() => { setAdvModal(false); advForm.resetFields(); setSelectedAdv(null); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">Save</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── Add Advance by Admin Modal ── */}
      <Modal
        title="Add Advance Payment"
        open={addAdvModal}
        onCancel={() => { setAddAdvModal(false); addAdvForm.resetFields(); }}
        footer={null} width={520} destroyOnClose
      >
        <Form form={addAdvForm} layout="vertical" onFinish={handleAddAdvance}
          initialValues={{ status: 'approved', requested_date: dayjs(), deduct_year: dayjs().year() }}>

          <Form.Item name="employee_id" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
            <Select placeholder="Select employee" showSearch optionFilterProp="children">
              {employees.map(e => (
                <Option key={e.id} value={e.id}>{e.name} ({e.employee_code})</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: 'Enter amount' }]}>
              <InputNumber className="w-full" min={1} placeholder="0" prefix="₹" />
            </Form.Item>
            <Form.Item name="requested_date" label="Date">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Reason for advance" />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Option value="approved">Approved</Option>
              <Option value="paid">Paid (Disbursed)</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Deduction Schedule</Divider>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="deduct_month" label="Deduct in Month">
              <Select placeholder="Month" allowClear>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <Option key={i+1} value={i+1}>{m}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="deduct_year" label="Deduct Year">
              <Select placeholder="Year">
                {[2024,2025,2026,2027].map(y => <Option key={y} value={y}>{y}</Option>)}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="paid_date" label="Paid Date (if already disbursed)">
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="admin_notes" label="Admin Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={() => { setAddAdvModal(false); addAdvForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addAdvLoading}>Create Advance</Button>
          </div>
        </Form>
      </Modal>

      {/* ── Leave Policy Modal ── */}
      <Modal
        title={editingPolicy ? `Edit — ${editingPolicy.label}` : "Add Leave Policy"}
        open={policyModal}
        onCancel={() => { setPolicyModal(false); setEditingPolicy(null); policyForm.resetFields(); }}
        footer={null} width={500} destroyOnClose
      >
        <Form form={policyForm} layout="vertical" onFinish={handleSavePolicy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="label" label="Display Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Paid Leave" />
            </Form.Item>
            <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true }]}>
              <Select disabled={!!editingPolicy} placeholder="Select type">
                {['paid','unpaid','sick','casual','maternity','paternity'].map(t => (
                  <Option key={t} value={t} className="capitalize">{t}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="days_per_year" label="Days Per Year" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} step={0.5} addonAfter="days" />
            </Form.Item>
            <Form.Item name="applicable_gender" label="Applicable To">
              <Select>
                <Option value="all">All Employees</Option>
                <Option value="male">Male Only</Option>
                <Option value="female">Female Only</Option>
              </Select>
            </Form.Item>
            <Form.Item name="carry_forward" label="Carry Forward" valuePropName="checked">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
            <Form.Item name="max_carry_forward_days" label="Max Carry Forward Days">
              <InputNumber className="w-full" min={0} step={0.5} addonAfter="days" />
            </Form.Item>
            <Form.Item name="requires_approval" label="Requires Approval">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No (Auto-approved)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="max_consecutive_days" label="Max Consecutive Days">
              <InputNumber className="w-full" min={1} placeholder="No limit" />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setPolicyModal(false); setEditingPolicy(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editingPolicy ? 'Update' : 'Create'}</Button>
          </div>
        </Form>
      </Modal>

      {/* ── Shift Rule Modal ── */}
      <Modal
        title={editingShift ? "Edit Shift Rule" : "Add Shift Rule"}
        open={shiftModal}
        onCancel={() => { setShiftModal(false); setEditingShift(null); shiftForm.resetFields(); }}
        footer={null} width={620} destroyOnClose
      >
        <Form form={shiftForm} layout="vertical" onFinish={handleSaveShiftRule} initialValues={{
          work_days_per_week: 5, grace_minutes: 10, late_mark_after_minutes: 10,
          half_day_after_minutes: 120, absent_after_minutes: 240,
          min_hours_full_day: 7, min_hours_half_day: 4,
          permission_allowed: true, permission_max_hours: 2, permission_per_month: 2,
          shift_hours: 8, working_days: [1,2,3,4,5],
        }}>
          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Shift Info</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Shift Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. General Shift" />
            </Form.Item>
            <Form.Item name="shift_hours" label="Total Shift Hours">
              <InputNumber className="w-full" min={1} max={24} step={0.5} />
            </Form.Item>
            <Form.Item name="shift_start" label="Shift Start Time" rules={[{ required: true }]}>
              <Input placeholder="09:00:00" />
            </Form.Item>
            <Form.Item name="shift_end" label="Shift End Time" rules={[{ required: true }]}>
              <Input placeholder="18:00:00" />
            </Form.Item>
            <Form.Item name="work_days_per_week" label="Work Days Per Week">
              <InputNumber className="w-full" min={1} max={7} />
            </Form.Item>
            <Form.Item name="is_default" label="Set as Default" valuePropName="checked">
              <Select>
                <Option value={true}>Yes — apply to all employees</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </div>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Late / Absent Rules (minutes late from shift start)</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="grace_minutes" label="Grace Period (min)" tooltip="No penalty within this time">
              <InputNumber className="w-full" min={0} addonAfter="min" />
            </Form.Item>
            <Form.Item name="late_mark_after_minutes" label="Mark Late After (min)" tooltip="Mark as Late after this many minutes">
              <InputNumber className="w-full" min={0} addonAfter="min" />
            </Form.Item>
            <Form.Item name="half_day_after_minutes" label="Half Day After (min)" tooltip="Mark as Half Day after this many minutes late">
              <InputNumber className="w-full" min={0} addonAfter="min" />
            </Form.Item>
            <Form.Item name="absent_after_minutes" label="Absent After (min)" tooltip="Mark as Absent after this many minutes late">
              <InputNumber className="w-full" min={0} addonAfter="min" />
            </Form.Item>
          </div>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Hours-Based Rules</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="min_hours_full_day" label="Min Hours for Full Day">
              <InputNumber className="w-full" min={0} max={24} step={0.5} addonAfter="hrs" />
            </Form.Item>
            <Form.Item name="min_hours_half_day" label="Min Hours for Half Day">
              <InputNumber className="w-full" min={0} max={24} step={0.5} addonAfter="hrs" />
            </Form.Item>
          </div>

          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Permission Leave Rules</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
            <Form.Item name="permission_allowed" label="Allow Permission Leave">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
            <Form.Item name="permission_max_hours" label="Max Hours Per Day">
              <InputNumber className="w-full" min={0} max={8} step={0.5} addonAfter="hrs" />
            </Form.Item>
            <Form.Item name="permission_per_month" label="Max Times Per Month">
              <InputNumber className="w-full" min={0} addonAfter="times" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { setShiftModal(false); setEditingShift(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editingShift ? "Update" : "Create"}</Button>
          </div>
        </Form>
      </Modal>

      {/* ── Generate Payslip Modal ── */}      <Modal title="Generate Payslip" open={genModal} onCancel={() => setGenModal(false)} footer={null} width={520} destroyOnClose>        <Form form={genForm} layout="vertical" onFinish={handleGeneratePayslip}>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-[13px] text-blue-700">
            Salary is calculated automatically from attendance records. Absent days are deducted pro-rata from the base salary.
          </div>
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee" showSearch optionFilterProp="children">
              {employees.map(e => <Option key={e.id} value={e.id}>{e.name} ({e.employee_code})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="period" label="Month & Year" rules={[{ required: true }]}>
            <DatePicker.MonthPicker className="w-full" />
          </Form.Item>
          <Divider orientation="left" orientationMargin={0} className="!text-sm !text-gray-400">Optional Overrides</Divider>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="bonus" label="Bonus (₹)">
              <InputNumber className="w-full" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="other_allowance" label="Other Allowance (₹)">
              <InputNumber className="w-full" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="tax_deduction" label="TDS / Tax (₹)">
              <InputNumber className="w-full" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="other_deduction" label="Other Deduction (₹)">
              <InputNumber className="w-full" min={0} placeholder="0" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setGenModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Generate</Button>
          </div>
        </Form>
      </Modal>

      {/* ── View Payslip Modal ── */}
      <Modal
        open={payslipModal}
        onCancel={() => setPayslipModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPayslipModal(false)}>Close</Button>
            <Button type="primary" icon={<Download size={14} />} onClick={handlePrintPayslip}>Download / Print</Button>
          </div>
        }
        width={780} destroyOnClose
      >
        {viewPayslip && <AdminPayslipPrint data={viewPayslip} />}
      </Modal>

      {/* ── Sign-In Proof Modal ── */}
      <ProofModal
        record={proofRecord}
        onClose={() => setProofRecord(null)}
      />

    </div>
  );
}

// ── Sign-In Proof Viewer Modal (Admin) ────────────────────────────────────────
function ProofModal({ record, onClose }) {
  if (!record) return null;
  const selfieUrl = getSelfieUrl(record.selfie_url);
  const mapsUrl = record.latitude && record.longitude
    ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}`
    : null;
  const expiresIn = record.selfie_expires_at
    ? Math.max(0, Math.ceil((new Date(record.selfie_expires_at) - Date.now()) / (1000 * 60 * 60)))
    : null;

  return (
    <Modal
      open={!!record}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      title={
        <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800">
          <span>Sign-In Proof</span>
          {record.employee && (
            <span className="text-gray-400 font-normal text-[12px]">
              — {record.employee?.name || ""} · {dayjs(record.date).format("DD MMM YYYY")}
            </span>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Selfie */}
        {selfieUrl ? (
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ aspectRatio: "4/3" }}>
            <img src={selfieUrl} alt="Sign-in selfie" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm" style={{ aspectRatio: "4/3" }}>
            No selfie available
          </div>
        )}

        {/* Location */}
        {record.location_address ? (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-[12px] text-green-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Location at Sign-In</p>
              <p className="text-green-600 leading-snug">{record.location_address}</p>
              {record.latitude && (
                <p className="text-green-500 text-[11px] mt-1">{parseFloat(record.latitude).toFixed(6)}, {parseFloat(record.longitude).toFixed(6)}</p>
              )}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="text-[11px] text-blue-600 underline whitespace-nowrap">Open Map</a>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[12px] text-gray-400 text-center">
            No location data
          </div>
        )}

        {/* Sign-in time + expiry */}
        <div className="flex items-center justify-between text-[12px] text-gray-500 px-1">
          <span>Sign-in time: <strong className="text-gray-700">{record.sign_in || "--"}</strong></span>
          {expiresIn !== null && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${expiresIn < 12 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
              Proof expires in {expiresIn}h
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Attendance Grid Component ─────────────────────────────────────────────────
const STATUS_CYCLE = ['present', 'absent', 'leave', 'holiday'];

const STATUS_STYLE = {
  present: { bg: '#dcfce7', text: '#16a34a', label: 'P' },
  absent:  { bg: '#fee2e2', text: '#dc2626', label: 'A' },
  leave:   { bg: '#ffedd5', text: '#ea580c', label: 'L' },
  holiday: { bg: '#dbeafe', text: '#2563eb', label: 'H' },
};

function AttendanceGrid({ employees, month, grid, originalGrid = {}, onCellClick, onCellEdit, loading }) {
  const daysInMonth = month.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const [quickFill, setQuickFill] = useState(null); // status to paint on hover-drag
  const [isDragging, setIsDragging] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // highlight row

  const isWeekend = d => [0, 6].includes(new Date(month.year(), month.month(), d).getDay());
  const isToday   = d => {
    const t = new Date();
    return t.getDate() === d && t.getMonth() === month.month() && t.getFullYear() === month.year();
  };
  const dayName = d => DAY_NAMES[new Date(month.year(), month.month(), d).getDay()];

  // Drag-paint: mousedown starts drag, mouseover paints, mouseup stops
  const handleMouseDown = (empId, d) => {
    setIsDragging(true);
    onCellClick(empId, d);
  };
  const handleMouseEnter = (empId, d) => {
    if (isDragging) onCellClick(empId, d);
  };
  const handleMouseUp = () => setIsDragging(false);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
      <span className="text-[13px] text-gray-400">Loading attendance data...</span>
    </div>
  );

  if (employees.length === 0) return (
    <div className="text-center py-16 text-gray-400 text-sm">No employees found. Add employees first.</div>
  );

  // Total dirty count
  const dirtyCount = Object.keys({ ...grid, ...originalGrid }).filter(k => (grid[k] ?? null) !== (originalGrid[k] ?? null)).length;

  return (
    <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="select-none">

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-6 mb-4 px-1">
        {[
          { label: 'Present', color: '#16a34a', bg: '#dcfce7', key: 'present' },
          { label: 'Absent',  color: '#dc2626', bg: '#fee2e2', key: 'absent'  },
          { label: 'Leave',   color: '#ea580c', bg: '#ffedd5', key: 'leave'   },
          { label: 'Holiday', color: '#2563eb', bg: '#dbeafe', key: 'holiday' },
        ].map(s => {
          const count = Object.values(grid).filter(v => v === s.key).length;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: s.bg, border: `1.5px solid ${s.color}50` }} />
              <span className="text-[12px] text-gray-500">{s.label}</span>
              <span className="text-[13px] font-bold" style={{ color: s.color }}>{count}</span>
            </div>
          );
        })}
        {dirtyCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
          </div>
        )}      </div>

      {/* ── Grid ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <table className="border-collapse" style={{ minWidth: `${daysInMonth * 36 + 260}px`, tableLayout: 'fixed' }}>

          {/* Header */}
          <thead>
            <tr>
              <th className="sticky left-0 z-20 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-r border-gray-200 min-w-[220px]"
                style={{ background: '#f8fafc' }}>
                Employee
              </th>
              {days.map(d => {
                const weekend = isWeekend(d);
                const today   = isToday(d);
                return (
                  <th key={d} className="border-b border-gray-200 p-0"
                    style={{ width: 34, background: today ? '#eff6ff' : '#f8fafc' }}>
                    <div className="flex flex-col items-center py-2 gap-0.5">
                      <span className={`text-[11px] font-bold ${today ? 'text-blue-600' : weekend ? 'text-gray-300' : 'text-gray-500'}`}>{d}</span>
                      <span className={`text-[9px] ${today ? 'text-blue-400' : weekend ? 'text-gray-300' : 'text-gray-400'}`}>{dayName(d)}</span>
                      {today && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>
                  </th>
                );
              })}
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 border-b border-l border-gray-200 min-w-[110px]"
                style={{ background: '#f8fafc' }}>
                Attendance %
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {employees.map((emp, idx) => {
              const present = days.filter(d => grid[`${emp.id}-${d}`] === 'present').length;
              const absent  = days.filter(d => grid[`${emp.id}-${d}`] === 'absent').length;
              const leave   = days.filter(d => grid[`${emp.id}-${d}`] === 'leave').length;
              const holiday = days.filter(d => grid[`${emp.id}-${d}`] === 'holiday').length;
              const marked  = present + absent + leave + holiday;
              const pct     = marked > 0 ? Math.round((present + leave) / marked * 100) : null;
              const isSelected = selectedEmp === emp.id;
              const rowBg = isSelected ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#fafbfc';

              return (
                <tr key={emp.id}
                  style={{ background: rowBg }}
                  className="group"
                  onMouseEnter={() => setSelectedEmp(emp.id)}
                  onMouseLeave={() => setSelectedEmp(null)}
                >
                  {/* Employee cell */}
                  <td className="sticky left-0 z-10 px-4 py-2 border-b border-r border-gray-100"
                    style={{ background: rowBg }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{emp.name}</div>
                        <div className="text-[10px] text-gray-400">{emp.employee_code}{emp.department ? ` · ${emp.department}` : ''}</div>
                      </div>
                      <button
                        onClick={() => onCellEdit && onCellEdit(emp, new Date().getDate())}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 bg-white transition-opacity flex-shrink-0"
                        title="Edit today's attendance"
                      >
                        Edit
                      </button>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map(d => {
                    const key     = `${emp.id}-${d}`;
                    const status  = grid[key] ?? null;
                    const s       = status ? STATUS_STYLE[status] : null;
                    const weekend = isWeekend(d);
                    const today   = isToday(d);
                    const isDirty = (grid[key] ?? null) !== (originalGrid[key] ?? null);

                    return (
                      <td key={d}
                        onMouseDown={() => handleMouseDown(emp.id, d)}
                        onMouseEnter={() => handleMouseEnter(emp.id, d)}
                        onContextMenu={(e) => { e.preventDefault(); onCellEdit && onCellEdit(emp, d); }}
                        className="border-b border-gray-100 cursor-pointer p-0.5"
                        style={{ background: today ? '#eff6ff' : weekend && !status ? '#f9fafb' : 'transparent' }}
                        title={status ? `${emp.name} — ${dayjs(`${month.year()}-${month.month()+1}-${d}`, 'YYYY-M-D').format('DD MMM')} — ${status}` : undefined}
                      >
                        <div className="relative flex items-center justify-center" style={{ height: 32 }}>
                          <div
                            className="rounded-md flex items-center justify-center text-[11px] font-bold transition-all duration-100"
                            style={{
                              width: 28, height: 28,
                              background: s ? s.bg : weekend ? '#f1f5f9' : isSelected ? '#f0f9ff' : '#f8fafc',
                              color: s ? s.text : '#d1d5db',
                              border: s ? `1.5px solid ${s.text}50` : `1.5px solid ${weekend ? '#e2e8f0' : '#eef0f3'}`,
                              boxShadow: s ? `0 1px 4px ${s.text}25` : 'none',
                            }}
                          >
                            {s ? s.label : <span style={{ fontSize: 16, color: weekend ? '#d1d5db' : '#e5e7eb' }}>·</span>}
                          </div>
                          {isDirty && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                              style={{ boxShadow: '0 0 0 1.5px white' }} />
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Attendance % cell */}
                  <td className="border-b border-l border-gray-100 px-3 py-2">
                    {pct !== null ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-semibold" style={{ color: pct >= 75 ? '#16a34a' : pct >= 50 ? '#ea580c' : '#dc2626' }}>
                            {pct}%
                          </span>
                          <span className="text-[10px] text-gray-400">{present}P · {absent}A{leave > 0 ? ` · ${leave}L` : ''}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 75 ? '#16a34a' : pct >= 50 ? '#ea580c' : '#dc2626',
                            }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-300">Not marked</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <span className="text-[11px] text-gray-400">Left-click / drag to cycle status &nbsp;·&nbsp; Right-click to edit times</span>
        {Object.entries(STATUS_STYLE).map(([k, s]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{ background: s.bg, color: s.text, border: `1.5px solid ${s.text}40` }}>
              {s.label}
            </div>
            <span className="text-[11px] text-gray-500 capitalize">{k}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-[11px] text-gray-400">Unsaved</span>
        </div>
      </div>
    </div>
  );
}

// ── Inline Payslip Print Component for Admin ──────────────────────────────────
function AdminPayslipPrint({ data }) {
  return <PayslipTemplate data={data} printId="admin-payslip-print" />;
}
