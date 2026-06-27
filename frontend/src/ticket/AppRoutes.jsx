import { Routes, Route } from "react-router-dom";
import TicketDashboard from "./pages/TicketDashboard";
import TicketList from "./pages/TicketList";
import RaiseTicket from "./pages/RaiseTicket";
import TicketDetail from "./pages/TicketDetail";
import DeveloperManagement from "./pages/DeveloperManagement";
import { Ticket, Plus, List, Users } from "lucide-react";

export const ticketMenuItems = [
  { key: "/ticket/dashboard",  label: "Overview",    icon: <Ticket size={18} /> },
  { key: "/ticket/list",       label: "Tickets",     icon: <List size={18} /> },
  { key: "/ticket/raise",      label: "Raise Ticket",icon: <Plus size={18} /> },
  { key: "/ticket/developers", label: "Developers",  icon: <Users size={18} /> },
];

export default function TicketRoutes() {
  return (
    <Routes>
      <Route path="dashboard"    element={<TicketDashboard />} />
      <Route path="list"         element={<TicketList />} />
      <Route path="raise"        element={<RaiseTicket />} />
      <Route path=":id"          element={<TicketDetail />} />
      <Route path="developers"   element={<DeveloperManagement />} />
    </Routes>
  );
}
