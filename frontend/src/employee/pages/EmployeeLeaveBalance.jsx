import { useState, useEffect } from "react";
import { Spin, Tag } from "antd";
import empApi from "../../api/employeeApi";

const BAR_COLOR = {
  paid: "#3b82f6", sick: "#ef4444", casual: "#22c55e",
  unpaid: "#9ca3af", maternity: "#ec4899", paternity: "#8b5cf6",
};

const BORDER_COLOR = {
  paid: "#bfdbfe", sick: "#fecaca", casual: "#bbf7d0",
  unpaid: "#e5e7eb", maternity: "#fbcfe8", paternity: "#ddd6fe",
};

const BG_COLOR = {
  paid: "#eff6ff", sick: "#fef2f2", casual: "#f0fdf4",
  unpaid: "#f9fafb", maternity: "#fdf2f8", paternity: "#f5f3ff",
};

export default function EmployeeLeaveBalance() {
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    empApi.get("/employee/leaves/balance")
      .then(res => setBalance(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  const entries = Object.entries(balance);

  return (
    <div className="p-2">
      <h2 className="text-[16px] font-bold text-gray-800 mb-4">Leave Balance</h2>

      {entries.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No balance data available</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {entries.map(([type, bal]) => {
            const bar   = BAR_COLOR[type]   || "#3b82f6";
            const bg    = BG_COLOR[type]    || "#f8fafc";
            const bdr   = BORDER_COLOR[type] || "#e2e8f0";
            const pct   = bal.entitled > 0 ? Math.min(100, Math.round((bal.used / bal.entitled) * 100)) : 0;
            const label = bal.label || (type.charAt(0).toUpperCase() + type.slice(1) + ' Leave');

            return (
              <div key={type} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[15px] text-gray-800">{label}</h3>
                    {bal.applicable_gender && bal.applicable_gender !== 'all' && (
                      <span className="text-[10px] text-gray-400 capitalize">{bal.applicable_gender} only</span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] font-black"
                    style={{ background: bg, border: `1.5px solid ${bdr}`, color: bar }}>
                    {bal.remaining}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-[13px] mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Entitled</span>
                    <span className="font-semibold text-gray-700">{bal.entitled} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Used</span>
                    <span className="font-semibold text-red-500">{bal.used} days</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                    <span className="font-semibold text-gray-700">Remaining</span>
                    <span className="font-bold text-green-600">{bal.remaining} days</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: bar }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{pct}% used</span>
                  {bal.carry_forward && (
                    <span className="text-blue-500">CF: up to {bal.max_carry_forward} days</span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-1 mt-3 flex-wrap">
                  {bal.requires_approval === false && (
                    <Tag color="green" className="text-[10px]">Auto-approved</Tag>
                  )}
                  {bal.carry_forward && (
                    <Tag color="blue" className="text-[10px]">Carry forward</Tag>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
