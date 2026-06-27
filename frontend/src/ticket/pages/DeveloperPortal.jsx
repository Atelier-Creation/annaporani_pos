import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Select, message, Spin } from "antd";
import { Ticket, LogOut, RefreshCw, Wrench, Video, Mic, FileText } from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import { BASE_API } from "../../api/api.js";

const { Option } = Select;

const STATUS_COLOR = {
  open:        "#f59e0b",
  assigned:    "#3b82f6",
  in_progress: "#8b5cf6",
  completed:   "#10b981",
  approved:    "#059669",
  rejected:    "#ef4444",
};

const BACKEND = BASE_API.replace("/api/v1", "");

// ── Attachment thumbnail ──────────────────────────────────────────────────────
const AttachThumb = ({ att }) => {
  const url = `${BACKEND}${att.url}`;
  if (att.type?.startsWith("image/")) return (
    <a href={url} target="_blank" rel="noreferrer"
      className="rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition"
      style={{ width: 72, height: 72, flexShrink: 0, display: "block" }}>
      <img src={url} alt={att.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </a>
  );
  if (att.type?.startsWith("video/")) return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex flex-col items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 text-[10px] gap-1 hover:bg-purple-100 transition"
      style={{ width: 72, height: 72, flexShrink: 0 }}>
      <Video size={20} /><span>Video</span>
    </a>
  );
  if (att.type?.startsWith("audio/")) return (
    <div style={{ minWidth: 160, flexShrink: 0 }}>
      <audio controls src={url} style={{ width: "100%", height: 32 }} />
      <div className="text-[10px] text-gray-400 truncate mt-0.5">{att.name}</div>
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50 transition"
      style={{ flexShrink: 0 }}>
      <FileText size={12} /> {att.name}
    </a>
  );
};

// ── Separate axios for developer (uses devToken, not admin token) ─────────────
const devAxios = axios.create({ baseURL: BASE_API });
devAxios.interceptors.request.use(config => {
  const token = localStorage.getItem("devToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function DeveloperPortal() {
  const navigate = useNavigate();
  const developer = JSON.parse(localStorage.getItem("developer") || "{}");

  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("devToken")) { navigate("/developer-login"); return; }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await devAxios.get("/developer/tickets");
      setTickets(res.data.data || []);
    } catch { message.error("Failed to load tickets"); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (ticketId, status) => {
    setUpdatingId(ticketId);
    try {
      await devAxios.put(`/developer/tickets/${ticketId}/status`, { status });
      message.success("Status updated");
      fetchTickets();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("devToken");
    localStorage.removeItem("developer");
    navigate("/developer-login");
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Ticket size={20} />
          </div>
          <div>
            <div className="font-black text-[16px]">Developer Portal</div>
            <div className="text-white/60 text-[12px]">{developer.name} · {developer.email}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTickets}
            className="p-2 rounded-xl hover:bg-white/10 transition" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-medium transition">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-black text-gray-900">
            My Assigned Tickets
            <span className="ml-2 text-[14px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
              {tickets.length}
            </span>
          </h2>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Ticket size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-[15px]">No tickets assigned to you yet</p>
            <p className="text-[12px] mt-1">Check back later or contact the admin</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tickets.map(t => {
              const sc = STATUS_COLOR[t.status] || "#6b7280";
              const atts = t.attachments || [];
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                            {t.ticket_no}
                          </span>
                          <Tag style={{ fontSize: 11, margin: 0 }}>
                            {(t.ticket_type || "").replace(/_/g, " ")}
                          </Tag>
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{t.title}</h3>
                        {t.description && (
                          <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{t.description}</p>
                        )}
                      </div>
                      <span style={{
                        background: sc + "20", color: sc,
                        padding: "5px 12px", borderRadius: 12,
                        fontWeight: 700, fontSize: 11, flexShrink: 0, whiteSpace: "nowrap"
                      }}>
                        {(t.status || "").replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    {/* Attachments */}
                    {atts.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                          Attachments ({atts.length})
                        </div>
                        <div className="flex flex-wrap gap-2 items-start">
                          {atts.map((att, i) => <AttachThumb key={i} att={att} />)}
                        </div>
                      </div>
                    )}

                    {/* Admin notes */}
                    {t.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="text-[10px] font-bold text-blue-500 uppercase mb-0.5">Admin Note</div>
                        <div className="text-[12px] text-blue-700">{t.admin_notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[11px] text-gray-400">
                      Created {dayjs(t.createdAt).format("DD MMM YYYY")}
                      {t.assigned_at && <> · Assigned {dayjs(t.assigned_at).format("DD MMM")} </>}
                    </div>
                    {t.status !== "approved" && t.status !== "rejected" && (
                      <div className="flex items-center gap-2">
                        <Wrench size={13} className="text-gray-400" />
                        <Select
                          value={t.status}
                          onChange={v => handleStatusChange(t.id, v)}
                          size="small"
                          style={{ width: 150 }}
                          loading={updatingId === t.id}
                          disabled={updatingId === t.id}
                        >
                          <Option value="assigned">Assigned</Option>
                          <Option value="in_progress">In Progress</Option>
                          <Option value="completed">Mark Completed</Option>
                        </Select>
                      </div>
                    )}
                    {(t.status === "approved" || t.status === "rejected") && (
                      <span className="text-[11px]" style={{ color: sc, fontWeight: 700 }}>
                        {t.status === "approved" ? "✓ Approved by Admin" : "✗ Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
