import { useState, useEffect, useCallback } from "react";
import { Spin } from "antd";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";

const statusColor = { present: "bg-green-100 text-green-600", absent: "bg-red-100 text-red-600", half_day: "bg-yellow-100 text-yellow-600", holiday: "bg-blue-100 text-blue-600", leave: "bg-purple-100 text-purple-600" };

export default function EmployeeAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(dayjs());

  const fetch = useCallback(async (m) => {
    setLoading(true);
    try {
      const res = await empApi.get(`/employee/attendance?month=${m.month() + 1}&year=${m.year()}&limit=31`);
      setAttendance(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(month); }, [month]);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-bold text-gray-800">Attendance</h2>
        <input
          type="month"
          value={month.format("YYYY-MM")}
          onChange={e => setMonth(dayjs(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {loading ? <div className="flex justify-center py-16"><Spin /></div> : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-[13px]">
                <th className="p-4">Date</th>
                <th className="p-4">Day</th>
                <th className="p-4">Sign In</th>
                <th className="p-4">Sign Out</th>
                <th className="p-4">Hours</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0
                ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">No records for this month</td></tr>
                : attendance.map(row => (
                  <tr key={row.id} className="border-t border-gray-100 text-[13px] hover:bg-gray-50">
                    <td className="p-4">{dayjs(row.date).format("DD MMM YYYY")}</td>
                    <td className="p-4 text-gray-500">{dayjs(row.date).format("ddd")}</td>
                    <td className="p-4">{row.sign_in || "--"}</td>
                    <td className="p-4">{row.sign_out || "--"}</td>
                    <td className="p-4">{row.hours_worked ? `${row.hours_worked}h` : "--"}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[12px] ${statusColor[row.status] || "bg-gray-100 text-gray-500"}`}>
                        {row.status?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
