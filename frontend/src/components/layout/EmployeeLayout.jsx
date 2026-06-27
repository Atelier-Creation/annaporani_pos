import { useState, useEffect } from "react";
import { Layout, ConfigProvider } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import EmployeeHeader from "./EmployeeHeader";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import {
  CalendarDays, FileText, CheckCircle, FolderOpen, LayoutDashboard, Receipt, IndianRupee
} from "lucide-react";

const { Sider, Content } = Layout;

const employeeMenuItems = [
  { key: "/employee-dashboard",            label: "Overview",      icon: <LayoutDashboard size={20} />, exact: true },
  { key: "/employee-dashboard/attendance", label: "Attendance",    icon: <CalendarDays size={20} /> },
  { key: "/employee-dashboard/leaves",     label: "My Leaves",     icon: <FileText size={20} /> },
  { key: "/employee-dashboard/balance",    label: "Leave Balance", icon: <CheckCircle size={20} /> },
  { key: "/employee-dashboard/documents",  label: "My Documents",  icon: <FolderOpen size={20} /> },
  { key: "/employee-dashboard/payslips",   label: "Payslips",      icon: <Receipt size={20} /> },
  { key: "/employee-dashboard/advance",    label: "Advance",       icon: <IndianRupee size={20} /> },
];

export default function EmployeeLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, sidebarBgColor, contentBgColor, footerBgColor, primaryColor } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <Layout className="min-h-screen">
        {/* Sidebar */}
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            collapsedWidth={80}
            theme={theme}
            style={{
              position: "fixed",
              left: 0, top: 0, bottom: 0,
              zIndex: 100,
              backgroundColor: theme === "dark" ? "#001529" : sidebarBgColor,
            }}
          >
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              menuItems={employeeMenuItems}
              selectedParent={null}
              setSelectedParent={() => {}}
            />
          </Sider>
        )}

        <Layout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
            transition: "margin-left 0.3s",
            backgroundColor: contentBgColor,
          }}
        >
          <EmployeeHeader collapsed={collapsed} setCollapsed={setCollapsed} />

          <Content
            style={{
              padding: "8px",
              backgroundColor: contentBgColor,
              minHeight: "calc(100vh - 112px)",
              overflow: "auto",
            }}
          >
            <div
              className="rounded-2xl shadow-sm p-3 min-h-full"
              style={{ backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff" }}
            >
              <Outlet />
            </div>
          </Content>

          <AppFooter
            theme={theme}
            bgColor={theme === "dark" ? "#001529" : footerBgColor}
          />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

