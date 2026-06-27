import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, message, Upload, Progress } from "antd";
import { Upload as UploadIcon, X, Image, Video, Mic, FileText, ChevronLeft } from "lucide-react";
import ticketApi from "../api/ticketApi";

const { TextArea } = Input;
const { Option } = Select;

const TICKET_TYPES = [
  { value: "bug",             label: "🐛 Bug" },
  { value: "feature_request", label: "✨ Feature Request" },
  { value: "ui_issue",        label: "🎨 UI Issue" },
  { value: "performance",     label: "⚡ Performance" },
  { value: "other",           label: "📋 Other" },
];

const PRIORITIES = [
  { value: "low",      label: "Low",      color: "#10b981" },
  { value: "medium",   label: "Medium",   color: "#f59e0b" },
  { value: "high",     label: "High",     color: "#ef4444" },
  { value: "critical", label: "Critical", color: "#7c3aed" },
];

const fileIcon = (type) => {
  if (type?.startsWith("image/")) return <Image size={16} className="text-blue-500" />;
  if (type?.startsWith("video/")) return <Video size={16} className="text-purple-500" />;
  if (type?.startsWith("audio/")) return <Mic size={16} className="text-green-500" />;
  return <FileText size={16} className="text-gray-500" />;
};

export default function RaiseTicket() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileAdd = (e) => {
    const selected = Array.from(e.target.files || []);
    const filtered = selected.filter(f => {
      if (f.size > 50 * 1024 * 1024) { message.warning(`${f.name} is too large (max 50MB)`); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...filtered].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (values) => {
    if (!values.title?.trim()) { message.warning("Title is required"); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("description",  values.description  || "");
      fd.append("ticket_type",  values.ticket_type  || "bug");
      fd.append("priority",     values.priority     || "medium");
      files.forEach(f => fd.append("attachments", f));

      await ticketApi.create(fd);
      message.success("Ticket raised successfully!");
      navigate("/ticket/list");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-800 mb-4 transition">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-[20px] font-black text-gray-900 mb-1">Raise a Ticket</h2>
        <p className="text-[13px] text-gray-500 mb-6">Describe your issue clearly. Attach screenshots, videos, or voice notes for faster resolution.</p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ ticket_type: "bug", priority: "medium" }}>

          <Form.Item label={<span className="font-semibold text-[13px]">Ticket Type</span>} name="ticket_type">
            <Select size="large">
              {TICKET_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item label={<span className="font-semibold text-[13px]">Priority</span>} name="priority">
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map(p => (
                <button type="button" key={p.value}
                  onClick={() => form.setFieldValue("priority", p.value)}
                  className="px-4 py-2 rounded-lg text-[12px] font-bold border-2 transition"
                  style={{
                    borderColor: form.getFieldValue("priority") === p.value ? p.color : "#e5e7eb",
                    background:  form.getFieldValue("priority") === p.value ? p.color + "15" : "#fff",
                    color:       form.getFieldValue("priority") === p.value ? p.color : "#6b7280",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label={<span className="font-semibold text-[13px]">Title <span className="text-red-500">*</span></span>} name="title"
            rules={[{ required: true, message: "Title is required" }]}>
            <Input size="large" placeholder="Brief summary of the issue" />
          </Form.Item>

          <Form.Item label={<span className="font-semibold text-[13px]">Description</span>} name="description">
            <TextArea rows={5} placeholder="Describe the issue in detail — steps to reproduce, expected vs actual behaviour, etc." />
          </Form.Item>

          {/* Attachments */}
          <div className="mb-6">
            <div className="text-[13px] font-semibold text-gray-700 mb-2">
              Attachments <span className="text-gray-400 font-normal">(max 5 files — screenshot, video, voice, PDF)</span>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf"
              className="hidden" onChange={handleFileAdd} />

            {files.length < 5 && (
              <button type="button" onClick={() => fileInputRef.current.click()}
                className="w-full border-2 border-dashed border-indigo-300 rounded-xl p-4 flex flex-col items-center gap-2 text-indigo-500 hover:bg-indigo-50 transition">
                <UploadIcon size={22} />
                <span className="text-[13px] font-medium">Click to add files ({files.length}/5)</span>
                <span className="text-[11px] text-gray-400">Images, Videos, Audio, PDF — max 50MB each</span>
              </button>
            )}

            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    {fileIcon(f.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-800 truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                    {f.type?.startsWith("image/") && (
                      <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <button type="button" onClick={() => removeFile(i)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-400 transition">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate(-1)} size="large" className="flex-1">Cancel</Button>
            <Button type="primary" htmlType="submit" size="large" loading={loading} className="flex-1"
              style={{ background: "#4f46e5", borderColor: "#4f46e5" }}>
              Submit Ticket
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
