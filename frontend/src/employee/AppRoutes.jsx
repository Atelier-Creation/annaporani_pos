import { Routes, Route } from "react-router-dom";
import HRMSAdmin from "./HRMSAdmin";

export const employeeMenuItems = [
  { key: "/employee/hrms", label: "HRMS" },
];

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="/hrms" element={<HRMSAdmin />} />
    </Routes>
  );
}
