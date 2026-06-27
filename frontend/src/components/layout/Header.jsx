import React, { useEffect, useState } from "react";
import {
  LogoutOutlined,
  UserOutlined,
  BellFilled,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { Dropdown, message, Menu, Popover, Badge, List, Avatar } from "antd";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import companyLogo from "../assets/Company_logo.png";
import BranchSelector from "../BranchSelector";

const HeaderBar = ({ collapsed, setCollapsed }) => {
  const { theme, headerBgColor, headerGradient } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      message.success("Logged out");
      navigate("/");
    } else if (key === "profile") {
      navigate("/settings");
    }
  };

  // user menu (AntD Menu)
  const userMenu = (
    <Menu
      items={[
        {
          key: "profile",
          icon: <UserOutlined />,
          label: "Profile",
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Logout",
          danger: true,
        },
      ]}
      onClick={handleMenuClick}
    />
  );

  // Dummy recent bills for notifications
  const recentBills = [
    { id: 1, customer: "John Doe", amount: 1280.5 },
    { id: 2, customer: "Alice Rao", amount: 560.0 },
    { id: 3, customer: "Mohan Kumar", amount: 2300.75 },
  ];

  const notificationContent = (
    <div style={{ minWidth: 280 }}>
      <List
        size="small"
        dataSource={recentBills}
        renderItem={(item) => (
          <List.Item
            style={{ display: "flex", justifyContent: "space-between", padding: 8 }}
            key={item.id}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar style={{ backgroundColor: "#f0f2f5", color: "#000" }}>
                {item.customer.charAt(0)}
              </Avatar>
              <div>
                <div style={{ fontSize: 13 }}>{item.customer}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Recent bill</div>
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>₹{item.amount.toFixed(2)}</div>
          </List.Item>
        )}
      />
      <div style={{ textAlign: "center", padding: 8, borderTop: "1px solid #f0f0f0" }}>
        <a onClick={() => message.info("Open all notifications")}>View all</a>
      </div>
    </div>
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
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        borderBottom: theme === "dark" ? "1px solid #374151" : "1px solid #f3f4f6",
      }}
    >
      {/* Left side: Collapse Button */}
      <div
        className="cursor-pointer p-2 rounded-lg hover:bg-gray-100  transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        style={{ color: textColor }}
      >
        {collapsed ? (
          <MenuUnfoldOutlined style={{ fontSize: 20 }} />
        ) : (
          <MenuFoldOutlined style={{ fontSize: 20 }} />
        )}
      </div>

      {/* Right side: notifications + user */}
      <div className="flex items-center gap-2 sm:gap-6">
        {/* Branch Selector */}
        <BranchSelector />

        {/* Notifications */}
        {/* <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
          overlayInnerStyle={{ borderRadius: "12px", padding: 0 }}
        >
          <Badge count={recentBills.length} offset={[-2, 2]} size="small">
            <div
              className="cursor-pointer p-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
              }}
            >
              <BellFilled style={{ fontSize: 20, color: theme === "dark" ? "#D1D5DB" : "#4B5563" }} />
            </div>
          </Badge>
        </Popover> */}

        {/* User dropdown */}
        <Dropdown overlay={userMenu} placement="bottomRight" trigger={["click"]}>
          <div
            className="cursor-pointer flex items-center gap-3 p-1 pr-3 rounded-full border border-transparent hover:border-gray-200 transition-all duration-200"
            style={{
              background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#ffffff",
              boxShadow: theme === "dark" ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600"
              style={{ width: 36, height: 36 }}
            >
              <UserOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                {user?.username || "Admin"}
              </div>
              {user?.role?.role_name && (
                <div className="text-xs" style={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}>
                  {user.role.role_name}
                </div>
              )}
            </div>
            <DownOutlined style={{ fontSize: 10, color: theme === "dark" ? "#9CA3AF" : "#9CA3AF" }} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderBar;
