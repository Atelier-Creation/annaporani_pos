import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { BASE_API } from "../api/api.js";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { motion } from "framer-motion";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

const BackgroundCard = ({ className, index = 1 }) => {
  const isEven = index % 2 === 0;
  const price = 1000 + (index * 153) % 4000;
  const orderId = 1000 + (index * 79) % 9000;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.6, y: 0 }}
      transition={{ delay: (index % 5) * 0.1, duration: 0.8 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 ${className}`}
    >
      <div className="flex justify-between">
        <div>
          <div className="font-semibold text-gray-700 text-sm">Order #{orderId}</div>
          <div className="text-xs text-gray-400">Fixed Display</div>
        </div>
        <span className="text-xs font-bold text-gray-700">₹{price}</span>
      </div>
      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${isEven ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
        {isEven ? "Delivered" : "In Progress"}
      </span>
    </motion.div>
  );
};

const FloatingColumn = ({ speed = 20, children, className }) => (
  <motion.div
    animate={{ y: [0, "-50%"] }}
    transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    className={className}
  >
    {children}
    {children}
  </motion.div>
);

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login } = useEmployeeAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!identifier.trim() || !password.trim()) {
      setLoginError("Email/phone and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_API}/employee/login`, { identifier, password });
      const { token, employee } = res.data;
      login(token, employee);
      message.success("Welcome back, " + employee.name);
      navigate("/employee-dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials";
      setLoginError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 flex gap-6 justify-center opacity-30 pointer-events-none -skew-y-6 scale-110">
        <FloatingColumn speed={40} className="flex flex-col gap-6 w-64">
          {[1, 2, 3, 4, 5].map(i => <BackgroundCard key={i} index={i} />)}
        </FloatingColumn>
        <FloatingColumn speed={55} className="flex flex-col gap-6 w-64 pt-20">
          {[6, 7, 8, 9, 10].map(i => <BackgroundCard key={i} index={i} />)}
        </FloatingColumn>
        <FloatingColumn speed={45} className="flex flex-col gap-6 w-64 hidden md:flex">
          {[11, 12, 13, 14, 15].map(i => <BackgroundCard key={i} index={i} />)}
        </FloatingColumn>
        <FloatingColumn speed={45} className="flex flex-col gap-6 w-64 hidden md:flex">
          {[16, 17, 18, 19, 20].map(i => <BackgroundCard key={i} index={i} />)}
        </FloatingColumn>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pointer-events-none" />

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/40 relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <img src="/duch_small_logo.png" alt="DUCH CLOTHING" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Login</h1>
          <p className="text-gray-500 text-sm mt-1">HRMS Employee Portal</p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email / Phone</label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or phone"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 bg-white/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
              <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 bg-white/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
              {showPassword
                ? <FaEyeSlash className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onClick={() => setShowPassword(false)} />
                : <FaEye className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onClick={() => setShowPassword(true)} />
              }
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg font-semibold rounded-xl !text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">Application Developed and maintained by</p>
          <p className="text-sm font-medium text-gray-600 mt-1">Atelier Technology Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
