import { useEffect, useState } from "react";
import {
  LogoutOutlined, UserOutlined, DownOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined,
} from "@ant-design/icons";
import { Dropdown, message, Menu } from "antd";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import empApi from "../../api/employeeApi";

const EmployeeHeader = ({ collapsed, setCollapsed }) => {
  const { theme, headerBgColor, headerGradient } = useTheme();
  const navigate = useNavigate();
  const { employee, logout } = useEmployeeAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = async ({ key }) => {
    if (key === "logout") {
      try { await empApi.post("/employee/logout"); } catch { /* ignore */ }
      logout();
      message.success("Logged out");
      navigate("/employee-login");
    }
  };

  const userMenu = (
    <Menu
      items={[
        { key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true },
      ]}
      onClick={handleMenuClick}
    />
  );

  const isGradient = headerGradient && headerGradient.includes("gradient");
  const headerStyle = isGradient
    ? { background: headerGradient }
    : { backgroundColor: headerBgColor || "#ffffff" };
  const textColor = theme === "dark" || isGradient ? "#fff" : "#000";

  return (
    <div
      className="flex justify-between items-center px-6 py-2 transition-all duration-300"
      style={{
        ...headerStyle,
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        borderBottom: theme === "dark" ? "1px solid #374151" : "1px solid #f3f4f6",
      }}
    >
      {isMobile ? (
        <div
          className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
          style={{ color: textColor }}
        >
          {collapsed
            ? <MenuUnfoldOutlined style={{ fontSize: 20 }} />
            : <MenuFoldOutlined style={{ fontSize: 20 }} />
          }
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-4">
        {/* Employee badge */}
        <span className="text-[12px] px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium hidden sm:block">
          Employee Portal
        </span>

        <Dropdown overlay={userMenu} placement="bottomRight" trigger={["click"]}>
          <div
            className="cursor-pointer flex items-center gap-3 p-1 pr-3 rounded-full border border-transparent hover:border-gray-200 transition-all duration-200"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#ffffff",
              boxShadow: theme === "dark" ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center bg-green-100 text-green-600"
              style={{ width: 36, height: 36 }}
            >
              <UserOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                {employee?.name || "Employee"}
              </div>
              {employee?.designation && (
                <div className="text-xs" style={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}>
                  {employee.designation}
                </div>
              )}
            </div>
            <DownOutlined style={{ fontSize: 10, color: "#9CA3AF" }} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default EmployeeHeader;
