import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Modal, Input, message, Popconfirm, Tag } from "antd";
import { Plus, ChevronLeft, Users, Trash2, Mail, Phone } from "lucide-react";
import ticketApi from "../api/ticketApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { name: "", email: "", phone: "", skills: "", password: "" };

export default function DeveloperManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.role_name === "super admin";

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getDevelopers();
      setDevelopers(res.data.data || []);
    } catch { message.error("Failed to load developers"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isSuperAdmin) { navigate("/ticket/dashboard"); return; }
    fetchAll();
  }, [isSuperAdmin]);

  const handleAdd = async () => {
    if (!form.name.trim()) { message.warning("Name is required"); return; }
    if (!form.email.trim()) { message.warning("Email is required"); return; }
    if (!form.password || form.password.length < 6) { message.warning("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await ticketApi.addDeveloper(form);
      message.success("Developer added successfully");
      setAddModal(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) { message.error(err.response?.data?.message || "Failed to add developer"); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id) => {
    try {
      await ticketApi.removeDeveloper(id);
      message.success("Developer removed");
      fetchAll();
    } catch { message.error("Failed to remove developer"); }
  };

  const columns = [
    {
      title: "Developer", key: "dev",
      render: (_, r) => (
        <div>
          <div className="font-semibold text-[14px] text-gray-900">{r.name}</div>
          <div className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
            <Mail size={10} /> {r.email}
          </div>
          {r.phone && (
            <div className="text-[12px] text-gray-500 flex items-center gap-1">
              <Phone size={10} /> {r.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Skills", dataIndex: "skills", key: "skills",
      render: v => v
        ? v.split(",").filter(Boolean).map(s => <Tag key={s} color="blue" style={{ fontSize: 11 }}>{s.trim()}</Tag>)
        : <span className="text-gray-400 text-[12px]">—</span>,
    },
    {
      title: "Status", dataIndex: "is_active", key: "is_active", width: 90,
      render: v => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions", key: "actions", width: 80,
      render: (_, r) => (
        <Popconfirm title="Remove this developer?" onConfirm={() => handleRemove(r.id)} okText="Yes" cancelText="No">
          <Button size="small" danger icon={<Trash2 size={12} />}>Remove</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-5">
      <button onClick={() => navigate("/ticket/dashboard")}
        className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-800 mb-4 transition">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-black text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-purple-600" /> Developer Accounts
          </h2>
          <p className="text-[12px] text-gray-500 mt-0.5">Manage developers — they can login at <strong>/developer-login</strong></p>
        </div>
        <Button type="primary" icon={<Plus size={13} />}
          style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
          onClick={() => { setForm(emptyForm); setAddModal(true); }}>
          Add Developer
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={developers} rowKey="id" loading={loading}
          size="small" scroll={{ x: 600 }} locale={{ emptyText: "No developers added yet" }} />
      </div>

      {/* Add Developer Modal */}
      <Modal
        title={<div className="flex items-center gap-2 text-[15px] font-bold"><Users size={16} className="text-purple-600" /> Add Developer</div>}
        open={addModal}
        onCancel={() => { setAddModal(false); setForm(emptyForm); }}
        footer={null} width={440} centered destroyOnClose
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Full Name *</div>
            <Input size="large" placeholder="e.g. John Doe"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Email *</div>
            <Input size="large" type="email" placeholder="e.g. john@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Phone</div>
            <Input size="large" placeholder="e.g. 9876543210"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">
              Skills <span className="text-gray-400 font-normal">(comma-separated)</span>
            </div>
            <Input size="large" placeholder="e.g. React, Node.js, MySQL"
              value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">
              Password * <span className="text-gray-400 font-normal">(developer portal login)</span>
            </div>
            <Input.Password size="large" placeholder="Min 6 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button size="large" onClick={() => { setAddModal(false); setForm(emptyForm); }} className="flex-1">
              Cancel
            </Button>
            <Button type="primary" size="large" loading={saving} onClick={handleAdd} className="flex-1"
              style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
              Add Developer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
