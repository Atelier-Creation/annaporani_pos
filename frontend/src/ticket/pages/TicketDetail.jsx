import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag, Select, Button, Input, message, Spin, Modal } from "antd";
import { ChevronLeft, User, Calendar, Wrench, CheckCircle, ThumbsUp, UserPlus, Image, Video, Mic, FileText, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import ticketApi from "../api/ticketApi";
import { useAuth } from "../../context/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

const STATUS_FLOW = ["open","assigned","in_progress","completed","approved"];
const STATUS_COLOR = {
  open:"#f59e0b", assigned:"#3b82f6", in_progress:"#8b5cf6",
  completed:"#10b981", approved:"#059669", rejected:"#ef4444",
};
const PRIORITY_COLOR = { low:"#10b981", medium:"#f59e0b", high:"#ef4444", critical:"#7c3aed" };

const AttachmentThumb = ({ att, baseUrl }) => {
  const url = `${baseUrl}${att.url}`;
  if (att.type?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 w-24 h-24">
        <img src={url} alt={att.name} className="w-full h-full object-cover" />
      </a>
    );
  }
  if (att.type?.startsWith("video/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border border-purple-200 bg-purple-50 text-purple-600 text-[11px] gap-1">
        <Video size={22} /> <span>Video</span>
      </a>
    );
  }
  if (att.type?.startsWith("audio/")) {
    return (
      <div className="w-40">
        <audio controls src={url} className="w-full" />
        <div className="text-[10px] text-gray-500 truncate mt-1">{att.name}</div>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-[12px] text-gray-700 hover:bg-gray-50">
      <FileText size={14} /> {att.name}
    </a>
  );
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.role_name === "super admin";
  const BACKEND_BASE = (import.meta.env.VITE_API_URL || "").replace("/api/v1", "");

  const [ticket, setTicket] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignDev, setAssignDev] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status modal
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await ticketApi.getById(id);
      setTicket(res.data.data);
    } catch { message.error("Ticket not found"); navigate("/ticket/list"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTicket();
    if (isSuperAdmin) ticketApi.getDevelopers().then(r => setDevelopers(r.data.data || []));
  }, [id]);

  const handleAssign = async () => {
    if (!assignDev) { message.warning("Select a developer"); return; }
    setAssigning(true);
    try {
      await ticketApi.assign(id, { developer_id: assignDev, admin_notes: assignNote });
      message.success("Ticket assigned");
      setAssignModal(false); setAssignDev(""); setAssignNote("");
      fetchTicket();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
    finally { setAssigning(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) { message.warning("Select a status"); return; }
    setUpdatingStatus(true);
    try {
      await ticketApi.updateStatus(id, {
        status: newStatus,
        completion_note: newStatus === "completed" || newStatus === "approved" ? statusNote : undefined,
        admin_notes: statusNote,
      });
      message.success("Status updated");
      setStatusModal(false); setNewStatus(""); setStatusNote("");
      fetchTicket();
    } catch (err) { message.error(err.response?.data?.message || "Failed"); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!ticket) return null;

  const sc = STATUS_COLOR[ticket.status] || "#6b7280";
  const currentIdx = STATUS_FLOW.indexOf(ticket.status);
  const nextStatuses = STATUS_FLOW.slice(currentIdx + 1);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <button onClick={() => navigate("/ticket/list")} className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft size={16} /> Back to Tickets
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        {/* Header band */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{ticket.ticket_no}</span>
              <Tag>{(ticket.ticket_type || "").replace(/_/g, " ")}</Tag>
              <span style={{ color: PRIORITY_COLOR[ticket.priority], fontWeight: 700, fontSize: 11 }}>
                {(ticket.priority || "").toUpperCase()}
              </span>
            </div>
            <h2 className="text-[18px] font-black text-gray-900">{ticket.title}</h2>
          </div>
          <span style={{ background: sc + "20", color: sc, padding: "5px 14px", borderRadius: 14, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {(ticket.status || "").replace(/_/g, " ").toUpperCase()}
          </span>
        </div>

        {/* Status timeline */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_FLOW.map((s, i) => {
              const done = STATUS_FLOW.indexOf(ticket.status) >= i;
              const isCur = ticket.status === s;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${done ? "text-white" : "bg-gray-200 text-gray-400"}`}
                      style={{ background: done ? STATUS_COLOR[s] : undefined }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[11px] font-semibold capitalize ${isCur ? "text-gray-900" : done ? "text-gray-500" : "text-gray-300"}`}>
                      {s.replace(/_/g, " ")}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && <div className={`w-6 h-0.5 ${done ? "bg-gray-400" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5 text-[12px]">
            <div>
              <div className="text-gray-400 mb-0.5">Raised By</div>
              <div className="font-semibold flex items-center gap-1"><User size={11} /> {ticket.raiser?.username || ticket.raised_by_name}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Created</div>
              <div className="font-semibold flex items-center gap-1"><Calendar size={11} /> {dayjs(ticket.createdAt).format("DD MMM YYYY, hh:mm A")}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Assigned To</div>
              <div className="font-semibold flex items-center gap-1">
                {ticket.assigned_to_name
                  ? <><Wrench size={11} className="text-blue-500" /> {ticket.assigned_to_name}</>
                  : <span className="text-gray-400">Unassigned</span>
                }
              </div>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="mb-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Description</div>
              <div className="text-[13px] text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Attachments</div>
              <div className="flex flex-wrap gap-3">
                {ticket.attachments.map((att, i) => (
                  <AttachmentThumb key={i} att={att} baseUrl={BACKEND_BASE} />
                ))}
              </div>
            </div>
          )}

          {/* Admin notes */}
          {ticket.admin_notes && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wide mb-1">Admin Notes</div>
              <div className="text-[13px] text-blue-800">{ticket.admin_notes}</div>
            </div>
          )}

          {/* Completion note */}
          {ticket.completion_note && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-[11px] font-bold text-green-600 uppercase tracking-wide mb-1">Completion Note</div>
              <div className="text-[13px] text-green-800">{ticket.completion_note}</div>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Actions */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="text-[13px] font-bold text-gray-700 mb-3">Admin Actions</div>
          <div className="flex flex-wrap gap-3">
            {ticket.status === "open" && (
              <Button icon={<UserPlus size={13} />} type="primary"
                style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
                onClick={() => setAssignModal(true)}>
                Assign to Developer
              </Button>
            )}
            {ticket.status !== "approved" && ticket.status !== "rejected" && (
              <Button icon={<Wrench size={13} />}
                onClick={() => { setNewStatus(""); setStatusModal(true); }}>
                Update Status
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal title="Assign Ticket to Developer" open={assignModal}
        onCancel={() => setAssignModal(false)} footer={null} width={420}>
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Select Developer</div>
            <Select value={assignDev} onChange={setAssignDev} placeholder="Choose developer" style={{ width: "100%" }}>
              {developers.map(d => (
                <Option key={d.id} value={d.id}>
                  {d.name} ({d.email})
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Admin Notes (optional)</div>
            <TextArea rows={2} value={assignNote} onChange={e => setAssignNote(e.target.value)} placeholder="Notes for the developer..." />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setAssignModal(false)} className="flex-1">Cancel</Button>
            <Button type="primary" loading={assigning} onClick={handleAssign} className="flex-1"
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal title="Update Ticket Status" open={statusModal}
        onCancel={() => setStatusModal(false)} footer={null} width={420}>
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">New Status</div>
            <Select value={newStatus} onChange={setNewStatus} placeholder="Select status" style={{ width: "100%" }}>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="approved">Approved ✓</Option>
              <Option value="rejected">Rejected ✗</Option>
            </Select>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Note (optional)</div>
            <TextArea rows={3} value={statusNote} onChange={e => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change..." />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setStatusModal(false)} className="flex-1">Cancel</Button>
            <Button type="primary" loading={updatingStatus} onClick={handleStatusUpdate} className="flex-1">Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
