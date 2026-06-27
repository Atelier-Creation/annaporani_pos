import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Table, Tag, Select, Button, Input, message, Spin } from "antd";
import { Plus, Eye, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import ticketApi from "../api/ticketApi";
import { useAuth } from "../../context/AuthContext";

const { Search } = Input;
const { Option } = Select;

const STATUS_COLOR = {
  open:        { color: "#f59e0b", bg: "#fffbeb" },
  assigned:    { color: "#3b82f6", bg: "#eff6ff" },
  in_progress: { color: "#8b5cf6", bg: "#f5f3ff" },
  completed:   { color: "#10b981", bg: "#ecfdf5" },
  approved:    { color: "#059669", bg: "#d1fae5" },
  rejected:    { color: "#ef4444", bg: "#fef2f2" },
};

const PRIORITY_COLOR = { low:"#10b981", medium:"#f59e0b", high:"#ef4444", critical:"#7c3aed" };

export default function TicketList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.role_name === "super admin";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const res = await ticketApi.getAll(params);
      setTickets(res.data.data || []);
      setPagination(p => ({ ...p, current: page, total: res.data.pagination?.total || 0 }));
    } catch { message.error("Failed to load tickets"); }
    finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { fetchTickets(1); }, [fetchTickets]);

  const columns = [
    {
      title: "Ticket No", dataIndex: "ticket_no", key: "ticket_no", width: 120,
      render: (v, r) => (
        <button onClick={() => navigate(`/ticket/${r.id}`)}
          className="text-indigo-600 font-bold hover:underline text-[13px]">{v}</button>
      ),
    },
    {
      title: "Type", dataIndex: "ticket_type", key: "ticket_type", width: 130,
      render: v => <Tag>{(v || "").replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Title", dataIndex: "title", key: "title",
      render: (v, r) => (
        <button onClick={() => navigate(`/ticket/${r.id}`)}
          className="text-left text-[13px] text-gray-800 hover:text-indigo-600 font-medium line-clamp-1">
          {v}
        </button>
      ),
    },
    {
      title: "Priority", dataIndex: "priority", key: "priority", width: 100,
      render: v => <span style={{ color: PRIORITY_COLOR[v], fontWeight: 700, fontSize: 12 }}>{(v||"").toUpperCase()}</span>,
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 120,
      render: v => {
        const s = STATUS_COLOR[v] || { color: "#6b7280", bg: "#f3f4f6" };
        return (
          <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 12, fontWeight: 700, fontSize: 11 }}>
            {(v || "").replace(/_/g, " ").toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "Raised By", key: "raiser", width: 130,
      render: (_, r) => <span className="text-[12px]">{r.raiser?.username || r.raised_by_name || "—"}</span>,
    },
    {
      title: "Assigned To", key: "dev", width: 130,
      render: (_, r) => r.assigned_to_name
        ? <span className="text-[12px] text-blue-600">{r.assigned_to_name}</span>
        : <span className="text-[11px] text-gray-400">Unassigned</span>,
    },
    {
      title: "Created", dataIndex: "createdAt", key: "createdAt", width: 120,
      render: v => <span className="text-[11px] text-gray-500">{dayjs(v).format("DD MMM YYYY")}</span>,
    },
    {
      title: "", key: "actions", width: 60,
      render: (_, r) => (
        <Button size="small" icon={<Eye size={12} />} onClick={() => navigate(`/ticket/${r.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-[20px] font-black text-gray-900">
          {isSuperAdmin ? "All Tickets" : "My Tickets"}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Search placeholder="Search tickets…" allowClear onSearch={v => setSearch(v)}
            onChange={e => !e.target.value && setSearch("")} style={{ width: 220 }} />
          <Select value={status} onChange={v => setStatus(v)} style={{ width: 140 }}>
            <Option value="all">All Status</Option>
            <Option value="open">Open</Option>
            <Option value="assigned">Assigned</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
          <Button icon={<RefreshCw size={13} />} onClick={() => fetchTickets(1)} />
          <Button type="primary" icon={<Plus size={13} />} onClick={() => navigate("/ticket/raise")}
            style={{ background: "#4f46e5", borderColor: "#4f46e5" }}>
            New Ticket
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 900 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: page => fetchTickets(page),
          showSizeChanger: false,
        }}
        locale={{ emptyText: "No tickets found" }}
      />
    </div>
  );
}
