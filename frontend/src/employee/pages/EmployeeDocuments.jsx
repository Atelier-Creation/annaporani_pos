import { useState, useEffect, useCallback } from "react";
import { Modal, Form, Input, Select, Spin, message } from "antd";
import { Plus, FileText } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";

const { Option } = Select;

export default function EmployeeDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await empApi.get("/employee/documents");
      setDocs(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (values) => {
    setSubmitting(true);
    try {
      await empApi.post("/employee/documents", values);
      message.success("Document added");
      form.resetFields();
      setModal(false);
      fetch();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await empApi.delete(`/employee/documents/${id}`);
      message.success("Document removed");
      fetch();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
  };

  const typeColors = { id_proof: "bg-blue-100 text-blue-600", address_proof: "bg-green-100 text-green-600", education: "bg-purple-100 text-purple-600", experience: "bg-orange-100 text-orange-600", other: "bg-gray-100 text-gray-600" };

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-bold text-gray-800">My Documents</h2>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium"
        >
          <Plus size={14} /> Add Document
        </button>
      </div>

      {docs.length === 0
        ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 opacity-40" />
            <p>No documents uploaded yet</p>
          </div>
        )
        : (
          <div className="grid grid-cols-3 gap-4">
            {docs.map(doc => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[15px]">{doc.document_name}</h3>
                    <p className="text-gray-400 text-[12px] mt-1">{doc.file_name || "document"}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full capitalize ${typeColors[doc.document_type] || "bg-gray-100 text-gray-600"}`}>
                    {doc.document_type?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-gray-400 text-[12px] mt-3">{dayjs(doc.uploaded_at).format("DD MMM YYYY")}</p>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[13px] hover:underline">View / Download</a>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-400 text-[13px] hover:text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal title="Add Document" open={modal} onCancel={() => setModal(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
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
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60">
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
