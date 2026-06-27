import { useState, useEffect, useCallback, useRef } from "react";
import { message, Modal, Spin } from "antd";
import { LogIn, LogOut, Plus, User, Camera, MapPin, RefreshCw, CheckCircle } from "lucide-react";
import dayjs from "dayjs";
import empApi from "../../api/employeeApi";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { useNavigate } from "react-router-dom";

// ── Sign-In Proof Modal ───────────────────────────────────────────────────────
function SignInModal({ open, onConfirm, onCancel, loading }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep]             = useState("camera");
  const [selfieData, setSelfieData] = useState(null);
  const [location, setLocation]     = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState("");
  const [camError, setCamError]     = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("camera"); setSelfieData(null); setLocation(null);
    setLocError(""); setCamError("");
    startCamera(); fetchLocation();
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCamError("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const fetchLocation = () => {
    setLocLoading(true); setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported"); setLocLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        } catch { /* use coords */ }
        setLocation({ latitude, longitude, address });
        setLocLoading(false);
      },
      () => { setLocError("Location access denied."); setLocLoading(false); },
      { timeout: 10000 }
    );
  };

  const takeSelfie = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Aggressive compression for high-res cameras (iPhone etc.)
    // Cap at 480px wide, JPEG at 50% quality → typically 20–60KB
    const MAX_WIDTH = 480;
    const srcW = video.videoWidth  || 640;
    const srcH = video.videoHeight || 480;
    const scale = Math.min(1, MAX_WIDTH / srcW);
    canvas.width  = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfieData(canvas.toDataURL("image/jpeg", 0.5));
    setStep("preview"); stopCamera();
  };

  const retake = () => { setSelfieData(null); setStep("camera"); startCamera(); };

  const handleConfirm = () => {
    if (!selfieData) { message.warning("Please take a selfie first"); return; }
    if (!location)   { message.warning("Waiting for location…"); return; }
    onConfirm({ selfie_base64: selfieData, latitude: location.latitude, longitude: location.longitude, location_address: location.address });
  };

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={420} centered destroyOnClose
      title={<div className="flex items-center gap-2 text-[15px] font-bold text-gray-800"><LogIn size={16} className="text-green-500" />Sign In — Verification</div>}
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* Camera / Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
          {step === "camera" && !camError && (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
          {step === "preview" && selfieData && (
            <img src={selfieData} alt="selfie" className="w-full h-full object-cover" />
          )}
          {camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
              <Camera size={32} className="opacity-50" />
              <p className="text-sm opacity-70">{camError}</p>
            </div>
          )}
          {step === "camera" && !camError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-48 rounded-full border-2 border-white border-dashed opacity-40" />
            </div>
          )}
          {step === "preview" && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={11} /> Captured
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {/* Location */}
        <div className={`flex items-start gap-3 p-3 rounded-xl border text-[12px] ${
          location   ? "bg-green-50 border-green-200 text-green-700"
          : locError ? "bg-red-50 border-red-200 text-red-600"
          : "bg-blue-50 border-blue-200 text-blue-600"
        }`}>
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {locLoading && <span>Fetching location…</span>}
            {locError   && <div className="flex items-center justify-between"><span>{locError}</span><button onClick={fetchLocation} className="ml-2 underline text-[11px]">Retry</button></div>}
            {location   && <span className="line-clamp-2">{location.address}</span>}
          </div>
          {location && <button onClick={fetchLocation} title="Refresh"><RefreshCw size={13} className="text-green-500" /></button>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step === "camera" ? (
            <button onClick={takeSelfie} disabled={!!camError || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40 transition">
              <Camera size={15} /> Take Selfie
            </button>
          ) : (
            <button onClick={retake} disabled={loading}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-xl text-[13px] font-medium hover:bg-gray-50 disabled:opacity-40 transition">
              <RefreshCw size={14} /> Retake
            </button>
          )}
          <button onClick={handleConfirm} disabled={loading || !selfieData || !location}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-60 transition relative overflow-hidden">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing In…
              </>
            ) : (
              <><LogIn size={15} /> Confirm Sign In</>
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center">
          Selfie and location are stored for 3 days for attendance verification.
        </p>
      </div>
    </Modal>
  );
}

// ── Main Overview ─────────────────────────────────────────────────────────────
export default function EmployeeOverview() {
  const { employee }  = useEmployeeAuth();
  const navigate      = useNavigate();
  const [todayRecord, setTodayRecord]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [signInModal, setSignInModal]     = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const now = dayjs();
      const res = await empApi.get(`/employee/attendance?month=${now.month() + 1}&year=${now.year()}&limit=31`);
      const rows = res.data.data || [];
      setTodayRecord(rows.find(r => r.date === now.format("YYYY-MM-DD")) || null);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchToday(); }, []);

  const handleSignInConfirm = async (payload) => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-in", payload);
      message.success("Signed in successfully");
      setSignInModal(false);
      fetchToday();
    } catch (err) {
      message.error(err.response?.data?.message || "Sign in failed");
    } finally { setActionLoading(false); }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await empApi.post("/employee/attendance/sign-out");
      message.success("Signed out successfully");
      fetchToday();
    } catch (err) { message.error(err.response?.data?.message || "Sign out failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;

  const statusColor = {
    present: "bg-green-100 text-green-600", absent: "bg-red-100 text-red-600",
    half_day: "bg-yellow-100 text-yellow-600", holiday: "bg-blue-100 text-blue-600",
    leave: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="p-2">
      <SignInModal open={signInModal} onConfirm={handleSignInConfirm} onCancel={() => setSignInModal(false)} loading={actionLoading} />

      {/* Employee Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 min-w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#0f172a]">{employee?.name}</h1>
            <p className="text-[13px] text-[#64748b]">{employee?.designation || "Employee"} · {employee?.employee_code}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSignInModal(true)} disabled={actionLoading || !!todayRecord?.sign_in}
            className="flex items-center gap-2 bg-[#6bc58b] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50">
            <LogIn size={14} />
            {todayRecord?.sign_in ? `In: ${todayRecord.sign_in}` : "Sign In"}
          </button>
          <button onClick={handleSignOut} disabled={actionLoading || !todayRecord?.sign_in || !!todayRecord?.sign_out}
            className="flex items-center gap-2 bg-[#f0a76d] text-white px-4 py-2 rounded-xl text-[13px] font-medium disabled:opacity-50">
            <LogOut size={14} />
            {todayRecord?.sign_out ? `Out: ${todayRecord.sign_out}` : "Sign Out"}
          </button>
          <button onClick={() => navigate("/employee-dashboard/leaves")}
            className="flex items-center gap-2 bg-[#4f6ee8] text-white px-4 py-2 rounded-xl text-[13px] font-medium">
            <Plus size={14} /> Apply Leave
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TODAY",       value: dayjs().format("DD MMM YYYY"),
            extra: <span className={`text-[11px] px-2 py-1 rounded-full mt-2 inline-block ${todayRecord ? statusColor[todayRecord.status] : "bg-gray-100 text-gray-500"}`}>{todayRecord?.status?.replace("_"," ") || "Not marked"}</span> },
          { label: "SIGN IN",     value: todayRecord?.sign_in || "--",
            extra: todayRecord?.selfie_url ? <span className="text-[10px] text-green-500 flex items-center gap-1 mt-1"><Camera size={10} /> Selfie captured</span> : null },
          { label: "SIGN OUT",    value: todayRecord?.sign_out || "--" },
          { label: "HOURS TODAY", value: todayRecord?.hours_worked ? `${todayRecord.hours_worked}h` : "0.00h" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <p className="text-[11px] text-gray-400">{c.label}</p>
            <h2 className="text-[14px] font-semibold mt-2">{c.value}</h2>
            {c.extra}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div onClick={() => navigate("/employee-dashboard/attendance")} className="bg-blue-50 border border-blue-100 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
          <p className="font-semibold text-blue-700">View Attendance</p>
          <p className="text-sm text-blue-500 mt-1">Check your monthly attendance records</p>
        </div>
        <div onClick={() => navigate("/employee-dashboard/balance")} className="bg-green-50 border border-green-100 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
          <p className="font-semibold text-green-700">Leave Balance</p>
          <p className="text-sm text-green-500 mt-1">View your remaining leave days</p>
        </div>
      </div>
    </div>
  );
}
