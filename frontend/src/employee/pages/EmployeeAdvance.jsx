import { useState, useEffect, useCallback } from "react";
import { Modal, Form, Input, InputNumber, DatePicker, Spin, message } from "antd";
import { Plus, IndianRupee } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";

const STATUS_STYLE = {
  pending:  { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  approved: { bg: '#dbeafe', text: '#1d4ed8', label: 'Approved' },
  rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
  paid:     { bg: '#dcfce7', text: '#15803d', label: 'Paid' },
  deducted: { bg: '#f3f4f6', text: '#374151', label: 'Deducted' },
};

const fmt = v => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function EmployeeAdvance() {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await empApi.get('/employee/advances');
      setAdvances(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleRequest = async (values) => {
    setSubmitting(true);
    try {
      await empApi.post('/employee/advances', {
        amount: values.amount,
        reason: values.reason,
        requested_date: values.requested_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      });
      message.success('Advance request submitted');
      form.resetFields();
      setModal(false);
      fetch();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const totalPending  = advances.filter(a => a.status === 'pending').reduce((s, a) => s + parseFloat(a.amount), 0);
  const totalApproved = advances.filter(a => ['approved','paid'].includes(a.status)).reduce((s, a) => s + parseFloat(a.amount), 0);
  const totalDeducted = advances.filter(a => a.status === 'deducted').reduce((s, a) => s + parseFloat(a.amount), 0);

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-bold text-gray-800">Advance Payment</h2>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
        >
          <Plus size={14} /> Request Advance
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Pending',  value: totalPending,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Approved / Paid', value: totalApproved, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Deducted', value: totalDeducted, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{c.label}</p>
            <p className={`text-[20px] font-bold mt-1 ${c.color}`}>₹{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {advances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <IndianRupee size={36} className="mb-3 opacity-30" />
          <p>No advance requests yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-[12px] font-semibold uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Deduct Month</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admin Notes</th>
              </tr>
            </thead>
            <tbody>
              {advances.map(a => {
                const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                return (
                  <tr key={a.id} className="border-t border-gray-100 text-[13px] hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{dayjs(a.requested_date).format('DD MMM YYYY')}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">₹{fmt(a.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.deduct_month ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][a.deduct_month-1]} ${a.deduct_year}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-[12px] font-semibold"
                        style={{ background: s.bg, color: s.text }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-[12px]">{a.admin_notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Modal */}
      <Modal title="Request Advance Payment" open={modal} onCancel={() => setModal(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleRequest}>
          <Form.Item name="amount" label="Amount Required (₹)" rules={[{ required: true, message: 'Enter amount' }]}>
            <InputNumber className="w-full" min={1} placeholder="e.g. 5000" formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="requested_date" label="Required By Date">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please provide a reason' }]}>
            <Input.TextArea rows={3} placeholder="Reason for advance payment request..." />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
