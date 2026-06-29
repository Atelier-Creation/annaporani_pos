// Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import companyLogo from "/duch-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  FileText,
  List,
  PlusCircle,
  Box,
  ShoppingCart,
  Database,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Receipt,
  IndianRupee,
  Megaphone,
  MessageCircle
} from "lucide-react";
import { Popover, Tooltip } from "antd";
import { FaWhatsapp } from "react-icons/fa";

const PanelLeftIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

/**
 * Sidebar component
 * - Collapsed (desktop): parent icons centered; parents with children open a Popover flyout.
 * - Expanded or mobile: inline expand/collapse for parent children.
 * - Visual rules:
 *   Active: background #1C2244, text & icon color #ffffff
 *   Inactive: text & icon color #1C2244, background transparent
 * - Settings button is placed at the bottom and becomes active on the /settings route.
 */

const Sidebar = ({ collapsed = true, setCollapsed = () => { }, selectedParent, setSelectedParent, menuItems: propMenuItems }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, primaryColor, sidebarBgColor } = useTheme();
  const [openMenu, setOpenMenu] = useState(null); // stores key of open inline menu OR open popover
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const containerRef = useRef(null);

  // Colors requested
  const ACTIVE_BG = primaryColor;
  const ACTIVE_TEXT = "#ffffff";
  const INACTIVE_TEXT = theme === "dark" ? "#D1D5DB" : "#374151"; // Gray-300 dark, Gray-700 light
  const INACTIVE_BG = "transparent";

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popup when clicking outside (guard). Only closes popover when collapsed & desktop.
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpenMenu((prev) => {
          return prev && collapsed && !isMobile ? null : prev;
        });
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [collapsed, isMobile]);

  // === static menu ===
  const staticMenuItems = [
    { key: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    {
      key: "Billing",
      label: "Casier Billing",
      icon: <IndianRupee size={20} />,
      children: [
        { key: "/billing/list", label: "Billing List", icon: <List size={18} /> },
      ],
    },
    { key: "", label: "Self Checkout", icon: <PlusCircle size={20} />, noRoute: true },
    {
      key: "Product",
      label: "Product",
      icon: <Box size={20} />,
      children: [
        { key: "/product/list", label: "Product List", icon: <List size={18} /> },
        { key: "/product/add", label: "Add Product", icon: <PlusCircle size={18} /> },
        { key: "/category/list", label: "Category List", icon: <List size={18} /> },
        { key: "/category/add", label: "Add Category", icon: <PlusCircle size={18} /> },
        { key: "/subcategory/list", label: "Subcategory List", icon: <List size={18} /> },
        { key: "/subcategory/add", label: "Add Subcategory", icon: <PlusCircle size={18} /> },
      ],
    },
    {
      key: "Inward",
      label: "Inward",
      icon: <ShoppingCart size={20} />,
      children: [
        { key: "/inward/list", label: "Inward List", icon: <List size={18} /> },
        { key: "/inward/add", label: "Add Inward", icon: <PlusCircle size={18} /> },
      ],
    },
    { key: "/stock/list", label: "Stocks", icon: <Database size={20} /> },
    {
      key: "Marketing",
      label: "Marketing",
      icon: <Megaphone size={20} />,
      children: [
        { key: "/marketing/dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
        { key: "/marketing/campaigns", label: "Campaigns", icon: <List size={18} /> },
        { key: "/marketing/whatsapp", label: "WhatsApp", icon: <FaWhatsapp size={18} /> },
      ],
    },
  ];
  const menuItems = propMenuItems && propMenuItems.length ? propMenuItems : staticMenuItems;
  // ===================

  // determine active state (parents active when any child matches)
  const isActive = (key, exact = false) => {
    if (!key) return false;

    // If this key matches a parent item that has children, check children's routes
    const parentItem = menuItems.find((m) => m.key === key);
    if (parentItem && parentItem.children && parentItem.children.length > 0) {
      return parentItem.children.some((c) => {
        return pathname === c.key || pathname.startsWith(c.key + "/");
      });
    }

    // Exact match only (used for items like Overview where the key is a prefix of siblings)
    if (exact || (parentItem && parentItem.exact)) {
      return pathname === key;
    }

    // Otherwise normal match for direct routes
    return pathname === key || pathname.startsWith(key + "/");
  };

  // Build modern popover content for children (uses exact active/inactive colors requested)
  const buildPopoverContent = (item) => {
    const bg = theme === "dark" ? "#1f2937" : "#ffffff";
    const border = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
    return (
      <div
        className="shadow-xl"
        style={{
          minWidth: 240,
          borderRadius: 16,
          background: bg,
          color: INACTIVE_TEXT,
          overflow: "hidden",
          border: `1px solid ${border}`,
          padding: "8px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${border}`,
          fontWeight: 600,
          color: theme === "dark" ? "#9CA3AF" : "#6B7280",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          {item.label}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" }}>
          {item.children.map((child) => {
            const active = isActive(child.key);
            return (
              <div
                key={child.key}
                onClick={(e) => {
                  e.stopPropagation();
                  // navigate first, then close popover
                  if (!child.noRoute) {
                    navigate(child.key);
                  }
                  setOpenMenu(null);
                  if (isMobile) setCollapsed(false);
                }}
                role="button"
                tabIndex={0}
                className="transition-all duration-200"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: active ? `${primaryColor}15` : "transparent", // transparent bg with 10% opacity primary color for active
                  color: active ? primaryColor : INACTIVE_TEXT,
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {child.icon}
                </span>
                <div style={{ fontSize: 14 }}>{child.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // render parent button: when collapsed + desktop + has children => show popover, else inline expand or navigate
  const renderParentButton = (item) => {
    const active = isActive(item.key, item.exact);

    // Collapsed & Desktop & has children => use Popover (modern flyout)
    if (collapsed && !isMobile && item.children && item.children.length > 0) {
      return (
        <Popover
          content={buildPopoverContent(item)}
          trigger="hover" // Changed to hover for faster interaction
          placement="rightTop"
          overlayClassName="sidebar-flyout-popover"
          open={openMenu === item.key}
          onOpenChange={(visible) => setOpenMenu(visible ? item.key : null)}
          getPopupContainer={() => containerRef.current || document.body} // render inside sidebar container
          destroyTooltipOnHide
          overlayStyle={{ zIndex: 3000, paddingLeft: 10 }}
        >
          <div
            className="transition-all duration-200"
            style={{
              padding: 12,
              cursor: "pointer",
              margin: "8px 0",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: active ? "#ffffff" : INACTIVE_TEXT,
              background: active ? primaryColor : "transparent",
              boxShadow: active ? `0 4px 12px ${primaryColor}40` : "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={{ fontSize: 22 }}>
              {item.icon}
            </span>
          </div>
        </Popover>
      );
    }

    // Normal behavior (not collapsed or mobile)
    const button = (
      <div
        onClick={() => {
          if (item.children && item.children.length > 0) {
            setOpenMenu(openMenu === item.key ? null : item.key);
          } else {
            if (!item.noRoute) {
              navigate(item.key);
            }
            if (isMobile) setCollapsed(false);
            setOpenMenu(null);
          }
        }}
        className="group transition-all duration-200"
        style={{
          padding: collapsed && !isMobile ? 12 : "12px 16px",
          cursor: "pointer",
          margin: "4px 0",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "flex-start",
          color: active ? "#ffffff" : INACTIVE_TEXT,
          backgroundColor: active ? primaryColor : "transparent",
          boxShadow: active ? `0 4px 6px -1px ${primaryColor}40` : "none",
          fontWeight: active ? 600 : 500,
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, minWidth: 24 }}>
          {item.icon}
        </span>
        {/* show label only when not collapsed OR on mobile */}
        {(!collapsed || isMobile) && <span style={{ marginLeft: 12 }}>{item.label}</span>}
        {item.children && item.children.length > 0 && (!collapsed || isMobile) && (
          <span style={{ marginLeft: "auto", fontSize: 14, opacity: 0.7 }}>{openMenu === item.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        )}
      </div>
    );

    return collapsed && !isMobile ? (
      <Tooltip title={item.label} placement="right">
        {button}
      </Tooltip>
    ) : (
      button
    );
  };

  // Settings active check
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <>
      {/* Mobile Hamburger / Close */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 2100,
            cursor: "pointer",
            background: "#fff",
            borderRadius: "50%",
            padding: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <X size={20} /> : <Menu size={20} />}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(isMobile ? collapsed : true) && (
          <div ref={containerRef} style={{ height: "100%" }}>
            {isMobile && collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "black",
                  zIndex: 1500,
                }}
                onClick={() => setCollapsed(false)}
              />
            )}

            <motion.div
              initial={{ x: isMobile ? -300 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -300 : 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                height: "100%",
                width: collapsed && !isMobile ? 80 : isMobile ? 260 : 260, // Increased width for better spacing
                backgroundColor: theme === "dark" ? "#fcfcfcff" : sidebarBgColor,
                borderRight: theme === "dark" ? "1px solid #ffffffff" : "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                position: isMobile ? "fixed" : "relative",
                top: 0,
                left: 0,
                zIndex: 1601,
              }}
            >
              {/* Top (Logo / Sidebar Toggle) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: collapsed && !isMobile ? 0 : "16px 0",
                  height: collapsed && !isMobile ? 80 : 88,
                  borderBottom: theme === "dark" ? "1px solid #374151" : "1px solid #f3f4f6",
                  marginBottom: 8,
                  width: "100%",
                }}
              >
                {collapsed && !isMobile ? (
                  <div
                    onMouseEnter={() => setIsLogoHovered(true)}
                    onMouseLeave={() => setIsLogoHovered(false)}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isLogoHovered ? (
                      <Tooltip title="Open sidebar" placement="right">
                        <button
                          onClick={() => {
                            setCollapsed(false);
                            setIsLogoHovered(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                            color: theme === "dark" ? "#D1D5DB" : "#4B5563",
                            transition: "all 0.2s ease-in-out",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)";
                            e.currentTarget.style.color = theme === "dark" ? "#ffffff" : "#111827";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
                            e.currentTarget.style.color = theme === "dark" ? "#D1D5DB" : "#4B5563";
                          }}
                        >
                          <PanelLeftIcon size={20} />
                        </button>
                      </Tooltip>
                    ) : (
                      <img
                        src="/colapslogo.png"
                        alt="DUCH CLOTHING"
                        className="transition-all duration-300 hover:scale-105"
                        style={{
                          height: 36,
                          width: "auto",
                          maxWidth: 48,
                          cursor: "pointer",
                          background: "#fff",
                          borderRadius: 8,
                          padding: 4,
                          objectFit: "contain",
                        }}
                        onClick={() => navigate("/dashboard")}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: (!collapsed && !isMobile) ? "space-between" : "center",
                      width: "100%",
                      padding: (!collapsed && !isMobile) ? "0 12px 0 16px" : "0 24px",
                    }}
                  >
                    <img
                      src="/Company_logo.png"
                      alt="DUCH CLOTHING"
                      className="transition-all duration-300 hover:scale-102"
                      style={{
                        height: 56,
                        width: "auto",
                        maxWidth: (!collapsed && !isMobile) ? 160 : 200,
                        cursor: "pointer",
                        background: "#fff",
                        borderRadius: 8,
                        padding: "6px 12px",
                        objectFit: "contain",
                      }}
                      onClick={() => navigate("/dashboard")}
                    />
                    {!collapsed && !isMobile && (
                      <Tooltip title="Close sidebar" placement="bottom">
                        <button
                          onClick={() => setCollapsed(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: "transparent",
                            color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                            transition: "all 0.2s ease-in-out",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
                            e.currentTarget.style.color = theme === "dark" ? "#ffffff" : "#111827";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = theme === "dark" ? "#9CA3AF" : "#6B7280";
                          }}
                        >
                          <PanelLeftIcon size={20} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="custom-scrollbar" style={{ flexGrow: 1, overflowY: "auto", padding: "16px 12px" }}>
                {menuItems.map((item) => (
                  <div key={item.key}>
                    {renderParentButton(item)}

                    {/* Inline submenu when expanded or on mobile */}
                    <AnimatePresence initial={false}>
                      {item.children && openMenu === item.key && (!collapsed || isMobile) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          style={{ marginLeft: 12, overflow: "hidden", borderLeft: `2px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}` }} // Tree view line
                        >
                          {item.children.map((child) => {
                            const childActive = isActive(child.key);
                            return (
                              <div
                                key={child.key}
                                onClick={() => {
                                  // navigate and keep parent open (so it's visibly active)
                                  if (!child.noRoute) {
                                    navigate(child.key);
                                  }
                                  setOpenMenu(item.key); // keep parent open / active in inline mode
                                  if (isMobile) setCollapsed(false);
                                }}
                                className="transition-all duration-200"
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  margin: "4px 0 4px 12px",
                                  borderRadius: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  color: childActive ? primaryColor : INACTIVE_TEXT,
                                  backgroundColor: childActive ? `${primaryColor}10` : "transparent",
                                  fontWeight: childActive ? "600" : 500,
                                }}
                                onMouseEnter={(e) => {
                                  if (!childActive) e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
                                }}
                                onMouseLeave={(e) => {
                                  if (!childActive) e.currentTarget.style.backgroundColor = "transparent";
                                }}
                              >
                                <span style={{ marginRight: 10, fontSize: 16 }}>{child.icon}</span>
                                <span style={{ fontSize: 14 }}>{child.label}</span>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Settings (sticky bottom) */}
              <Tooltip title={collapsed && !isMobile ? "Settings" : ""} placement="right">
                <div
                  onClick={() => {
                    navigate("/settings");
                    if (isMobile) setCollapsed(false);
                  }}
                  role="button"
                  tabIndex={0}
                  className="transition-all duration-200 hover:bg-gray-50"
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                    cursor: "pointer",
                    marginTop: "auto",
                    borderTop: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.05)" : "#e5e7eb"}`,
                    color: settingsActive ? primaryColor : INACTIVE_TEXT,
                  }}
                >
                  <Settings size={20} />
                  {(!collapsed || isMobile) && <span style={{ marginLeft: 12, fontWeight: 500 }}>Settings</span>}
                </div>
              </Tooltip>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
