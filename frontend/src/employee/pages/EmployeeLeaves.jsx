import { useState, useEffect, useCallback } from "react";
import { Modal, Form, Select, DatePicker, Input, Spin, message } from "antd";
import { Plus } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const leaveStatusColor = { pending: "bg-yellow-100 text-yellow-600", approved: "bg-green-100 text-green-600", rejected: "bg-red-100 text-red-600", cancelled: "bg-gray-100 text-gray-500" };

export default function EmployeeLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await empApi.get("/employee/leaves?limit=50");
      setLeaves(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleApply = async (values) => {
    setSubmitting(true);
    try {
      const [from, to] = values.dates;
      await empApi.post("/employee/leaves", {
        leave_type: values.leave_type,
        from_date: from.format("YYYY-MM-DD"),
        to_date: to.format("YYYY-MM-DD"),
        days: to.diff(from, "day") + 1,
        reason: values.reason,
      });
      message.success("Leave applied successfully");
      form.resetFields();
      setModal(false);
      fetch();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-bold text-gray-800">My Leaves</h2>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
        >
          <Plus size={14} /> Apply Leave
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spin /></div> : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
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
              {leaves.length === 0
                ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">No leave records</td></tr>
                : leaves.map(l => (
                  <tr key={l.id} className="border-t border-gray-100 text-[13px] hover:bg-gray-50">
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
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <Modal title="Apply Leave" open={modal} onCancel={() => setModal(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleApply}>
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
            <Input.TextArea rows={3} placeholder="Reason for leave" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">
              {submitting ? "Submitting..." : "Apply"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
