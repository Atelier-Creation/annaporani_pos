import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { Ticket, Clock, UserCheck, Wrench, CheckCircle, ThumbsUp, Plus, List, Users } from "lucide-react";
import ticketApi from "../api/ticketApi";
import { useAuth } from "../../context/AuthContext";

const StatCard = ({ label, value, icon: Icon, color, bg, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
    style={{ background: bg, border: `1.5px solid ${color}30` }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-[13px] font-semibold" style={{ color }}>{label}</div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <div className="text-[32px] font-black" style={{ color }}>{value ?? 0}</div>
  </div>
);

export default function TicketDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.role_name === "super admin";

  useEffect(() => {
    ticketApi.getStats()
      .then(r => setStats(r.data.data))
      .catch(() => message.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-[22px] font-black text-gray-900 flex items-center gap-2">
            <Ticket size={24} className="text-indigo-600" /> Ticket Management
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">Raise and track issues, feature requests, and bugs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate("/ticket/raise")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition"
          >
            <Plus size={14} /> Raise Ticket
          </button>
          <button
            onClick={() => navigate("/ticket/list")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50 transition"
          >
            <List size={14} /> View All
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => navigate("/ticket/developers")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 text-purple-700 text-[13px] font-semibold hover:bg-purple-50 transition"
            >
              <Users size={14} /> Developers
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total"       value={stats?.total}       icon={Ticket}     color="#6366f1" bg="#eef2ff" onClick={() => navigate("/ticket/list")} />
        <StatCard label="Open"        value={stats?.open}        icon={Clock}      color="#f59e0b" bg="#fffbeb" onClick={() => navigate("/ticket/list?status=open")} />
        <StatCard label="Assigned"    value={stats?.assigned}    icon={UserCheck}  color="#3b82f6" bg="#eff6ff" onClick={() => navigate("/ticket/list?status=assigned")} />
        <StatCard label="In Progress" value={stats?.in_progress} icon={Wrench}     color="#8b5cf6" bg="#f5f3ff" onClick={() => navigate("/ticket/list?status=in_progress")} />
        <StatCard label="Completed"   value={stats?.completed}   icon={CheckCircle}color="#10b981" bg="#ecfdf5" onClick={() => navigate("/ticket/list?status=completed")} />
        <StatCard label="Approved"    value={stats?.approved}    icon={ThumbsUp}   color="#059669" bg="#d1fae5" onClick={() => navigate("/ticket/list?status=approved")} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate("/ticket/raise")}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all"
        >
          <Plus size={28} className="mb-3 opacity-90" />
          <div className="text-[17px] font-bold mb-1">Raise a New Ticket</div>
          <div className="text-[13px] opacity-70">Report a bug, request a feature, or flag a UI issue</div>
        </div>
        <div
          onClick={() => navigate("/ticket/list")}
          className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
        >
          <List size={28} className="mb-3 text-indigo-500" />
          <div className="text-[17px] font-bold text-gray-800 mb-1">View My Tickets</div>
          <div className="text-[13px] text-gray-500">Track status of your submitted tickets</div>
        </div>
      </div>
    </div>
  );
}
