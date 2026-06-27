import { useState, useEffect, useRef } from "react";
import { Spin, Modal } from "antd";
import { FileText, Download, Eye } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import PayslipTemplate from "../components/PayslipTemplate";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeePayslip() {
  const { employee } = useEmployeeAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    empApi.get("/employee/payslips")
      .then(res => setPayslips(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (id) => {
    try {
      const res = await empApi.get(`/employee/payslips/${id}`);
      setSelected(res.data.data);
      setModalOpen(true);
    } catch { /* silent */ }
  };

  const handlePrint = () => {
    const content = document.getElementById("payslip-print");
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Payslip - ${selected?.employee?.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Segoe UI',sans-serif;background:#f1f5f9;padding:24px;}
        @media print{body{background:#fff;padding:0;}}
      </style>
      </head><body>${content.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const statusColor = { draft: "bg-gray-100 text-gray-500", generated: "bg-blue-100 text-blue-600", paid: "bg-green-100 text-green-600" };

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;

  return (
    <div className="p-2">
      <h2 className="text-[16px] font-bold text-gray-800 mb-4">My Payslips</h2>

      {payslips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText size={40} className="mb-3 opacity-40" />
          <p>No payslips generated yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-[13px]">
                <th className="p-4">Month</th>
                <th className="p-4">Gross Salary</th>
                <th className="p-4">Deductions</th>
                <th className="p-4">Net Salary</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map(p => (
                <tr key={p.id} className="border-t border-gray-100 text-[13px] hover:bg-gray-50">
                  <td className="p-4 font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                  <td className="p-4">₹{parseFloat(p.gross_salary).toLocaleString("en-IN")}</td>
                  <td className="p-4 text-red-500">₹{parseFloat(p.total_deductions).toLocaleString("en-IN")}</td>
                  <td className="p-4 font-semibold text-green-600">₹{parseFloat(p.net_salary).toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[12px] capitalize ${statusColor[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleView(p.id)} className="flex items-center gap-1 text-blue-600 text-[13px] hover:underline">
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Close</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
              <Download size={14} /> Download / Print
            </button>
          </div>
        }
        width={780}
        destroyOnClose
      >
        {selected && <PayslipTemplate data={selected} printId="payslip-print" />}
      </Modal>
    </div>
  );
}
