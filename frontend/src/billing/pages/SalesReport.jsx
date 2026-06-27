import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Statistic,
  Table,
  Spin,
  message,
  Tag,
  Space,
  Typography,
  Divider,
  Dropdown,
  Menu,
} from "antd";
import {
  FileTextOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ShopOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { IndianRupee } from "lucide-react";
import dayjs from "dayjs";
import reportService from "../service/reportService";
import { useBranch } from "../../context/BranchContext";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function SalesReport() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("today");
  const [dateRange, setDateRange] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { selectedBranch } = useBranch();

  useEffect(() => {
    // When branch changes, re-fetch with the current period (don't reset it)
    fetchReport(period, dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  useEffect(() => {
    if (period === "custom" && dateRange) {
      fetchReport("custom", dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReport = async (p = period, dr = dateRange) => {
    setLoading(true);
    try {
      const params = { period: p };

      if (p === "custom" && dr) {
        params.startDate = dr[0].toISOString();
        params.endDate   = dr[1].toISOString();
      }

      const response = await reportService.getSalesReport(params);
      setReportData(response.data);
      message.success("Report generated successfully");
    } catch (error) {
      console.error("Error fetching report:", error);
      message.error(error.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value !== "custom") {
      setDateRange(null);
      fetchReport(value, null);
    }
  };

  const handleGenerateReport = () => {
    if (period === "custom" && !dateRange) {
      message.warning("Please select a date range");
      return;
    }
    fetchReport(period, dateRange);
  };

  // Payment method columns
  const paymentColumns = [
    {
      title: "Payment Method",
      dataIndex: "method",
      key: "method",
      render: (method) => {
        const colors = {
          cash: "green",
          credit_card: "blue",
          debit_card: "cyan",
          "UPI Current Account": "purple",
          "UPI Normal Account": "magenta",
          net_banking: "orange",
          split: "gold",
        };
        return <Tag color={colors[method] || "default"}>{method.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Bills Count",
      dataIndex: "count",
      key: "count",
      align: "center",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: "Collected",
      dataIndex: "paid_amount",
      key: "paid_amount",
      align: "right",
      render: (amount) => (
        <span style={{ color: "#16a34a", fontWeight: 600 }}>
          ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Pending",
      dataIndex: "due_amount",
      key: "due_amount",
      align: "right",
      render: (amount) => {
        const val = parseFloat(amount);
        if (val <= 0) return <span style={{ color: "#94a3b8" }}>—</span>;
        return (
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            ₹{val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      render: (pct) => `${pct}%`,
    },
  ];

  // Branch columns
  const branchColumns = [
    {
      title: "Branch Code",
      dataIndex: "branch_code",
      key: "branch_code",
    },
    {
      title: "Branch Name",
      dataIndex: "branch_name",
      key: "branch_name",
    },
    {
      title: "Bills Count",
      dataIndex: "count",
      key: "count",
      align: "center",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      render: (pct) => `${pct}%`,
    },
  ];

  // Top days columns
  const topDaysColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Bills Count",
      dataIndex: "bills_count",
      key: "bills_count",
      align: "center",
    },
    {
      title: "Total Sales",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
    },
  ];

  const getPeriodLabel = () => {
    switch (period) {
      case "today":        return "Today";
      case "yesterday":    return "Yesterday";
      case "this_month":
        return "This Month";
      case "this_year":
        return "This Year";
      case "custom":
        return dateRange
          ? `${dayjs(dateRange[0]).format("DD MMM YYYY")} - ${dayjs(dateRange[1]).format("DD MMM YYYY")}`
          : "Custom Range";
      default:
        return "";
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) {
      message.warning("No data to export");
      return;
    }

    setExporting(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["SALES REPORT"],
        [""],
        ["Report Period:", getPeriodLabel()],
        ["Branch:", selectedBranch?.name || "All Branches"],
        ["Generated On:", dayjs().format("DD MMM YYYY, hh:mm A")],
        [""],
        ["SUMMARY"],
        ["Total Sales", `₹${parseFloat(reportData.summary.total_sales).toLocaleString("en-IN")}`],
        ["Total Bills", reportData.summary.total_bills],
        ["Average Bill Value", `₹${parseFloat(reportData.summary.average_bill_value).toLocaleString("en-IN")}`],
        [""],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Payment Methods Sheet
      const paymentData = [
        ["PAYMENT METHOD BREAKDOWN"],
        [""],
        ["Payment Method", "Bills Count", "Total Amount (₹)", "Paid Amount (₹)", "Due Amount (₹)", "Percentage %"],
      ];

      reportData.payment_methods.forEach((pm) => {
        paymentData.push([
          pm.method.toUpperCase(),
          pm.count,
          parseFloat(pm.total_amount).toFixed(2),
          parseFloat(pm.paid_amount).toFixed(2),
          parseFloat(pm.due_amount).toFixed(2),
          `${pm.percentage}%`,
        ]);
      });

      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      paymentSheet["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Methods");

      // Branch Breakdown Sheet (if available)
      if (reportData.branches && reportData.branches.length > 0) {
        const branchData = [
          ["BRANCH-WISE SALES"],
          [""],
          ["Branch Code", "Branch Name", "Bills Count", "Total Amount (₹)", "Percentage %"],
        ];

        reportData.branches.forEach((branch) => {
          branchData.push([
            branch.branch_code,
            branch.branch_name,
            branch.count,
            parseFloat(branch.total_amount).toFixed(2),
            `${branch.percentage}%`,
          ]);
        });

        const branchSheet = XLSX.utils.aoa_to_sheet(branchData);
        branchSheet["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, branchSheet, "Branch Breakdown");
      }

      // Top Days Sheet (if available)
      if (reportData.top_days && reportData.top_days.length > 0) {
        const topDaysData = [
          ["TOP 5 SELLING DAYS"],
          [""],
          ["Date", "Bills Count", "Total Sales (₹)"],
        ];

        reportData.top_days.forEach((day) => {
          topDaysData.push([
            dayjs(day.date).format("DD MMM YYYY"),
            day.bills_count,
            parseFloat(day.total_amount).toFixed(2),
          ]);
        });

        const topDaysSheet = XLSX.utils.aoa_to_sheet(topDaysData);
        topDaysSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, topDaysSheet, "Top Days");
      }

      const filename = `Sales_Report_${getPeriodLabel().replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, filename);
      message.success("Report exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!reportData) {
      message.warning("No data to export");
      return;
    }

    setExporting(true);

    try {
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "210mm";
      pdfContent.style.padding = "20mm";
      pdfContent.style.backgroundColor = "#ffffff";
      pdfContent.style.fontFamily = "Arial, sans-serif";

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1890ff; padding-bottom: 20px;">
          <h1 style="color: #1890ff; margin: 0; font-size: 28px; font-weight: bold;">SALES REPORT</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            ${getPeriodLabel()} | ${selectedBranch?.name || "All Branches"}
          </p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
            Generated on ${dayjs().format("DD MMM YYYY, hh:mm A")}
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #52c41a; padding-left: 10px;">
            Summary
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f0f9ff;">
              <td style="padding: 12px; border: 1px solid #d9d9d9; font-weight: bold; width: 50%;">Total Sales</td>
              <td style="padding: 12px; border: 1px solid #d9d9d9; text-align: right; color: #52c41a; font-weight: bold;">
                ₹${parseFloat(reportData.summary.total_sales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #d9d9d9; font-weight: bold;">Total Bills</td>
              <td style="padding: 12px; border: 1px solid #d9d9d9; text-align: right;">${reportData.summary.total_bills}</td>
            </tr>
            <tr style="background: #f0f9ff;">
              <td style="padding: 12px; border: 1px solid #d9d9d9; font-weight: bold;">Average Bill Value</td>
              <td style="padding: 12px; border: 1px solid #d9d9d9; text-align: right;">
                ₹${parseFloat(reportData.summary.average_bill_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #1890ff; padding-left: 10px;">
            Payment Method Breakdown
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #1890ff; color: white;">
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: left;">Payment Method</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">Bills</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Total (₹)</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Paid (₹)</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Due (₹)</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">%</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.payment_methods
                .map(
                  (pm, index) => `
                <tr style="background: ${index % 2 === 0 ? "#fafafa" : "white"};">
                  <td style="padding: 10px; border: 1px solid #d9d9d9; font-weight: bold;">${pm.method.toUpperCase()}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">${pm.count}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">
                    ₹${parseFloat(pm.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">
                    ₹${parseFloat(pm.paid_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right; color: ${pm.due_amount > 0 ? "#ff4d4f" : "#52c41a"};">
                    ₹${parseFloat(pm.due_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right; font-weight: bold; color: #1890ff;">
                    ${pm.percentage}%
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #d9d9d9; text-align: center; color: #999; font-size: 11px;">
          <p style="margin: 0;">This is a system-generated report</p>
          <p style="margin: 5px 0 0 0;">© ${dayjs().year()} - All Rights Reserved</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const filename = `Sales_Report_${getPeriodLabel().replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
      pdf.save(filename);
      message.success("Report exported to PDF successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      message.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={exportToExcel}>
        Export to Excel
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={exportToPDF}>
        Export to PDF
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <Title level={2}>
                <BarChartOutlined /> Sales Report
              </Title>
              <Text type="secondary">
                View sales analytics and payment method breakdown
              </Text>
            </div>
            <Space>
              {selectedBranch && (
                <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                  <ShopOutlined /> {selectedBranch.name === "All Branches" ? "All Branches" : selectedBranch.name}
                </Tag>
              )}
              {reportData && (
                <Dropdown overlay={exportMenu} placement="bottomRight" disabled={exporting}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={exporting}
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  >
                    Export Report
                  </Button>
                </Dropdown>
              )}
            </Space>
          </div>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Period</Text>
                <Select
                  value={period}
                  onChange={handlePeriodChange}
                  style={{ width: "100%" }}
                >
                  <Option value="today">Today</Option>
                  <Option value="yesterday">Yesterday</Option>
                  <Option value="this_month">This Month</Option>
                  <Option value="this_year">This Year</Option>
                  <Option value="custom">Custom Range</Option>
                </Select>
              </Space>
            </Col>

            {period === "custom" && (
              <Col xs={24} sm={12} md={10}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>Date Range</Text>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    style={{ width: "100%" }}
                    format="DD MMM YYYY"
                  />
                </Space>
              </Col>
            )}

            {/* <Col xs={24} sm={24} md={6}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleGenerateReport}
                loading={loading}
                block
                style={{ marginTop: period === "custom" ? 24 : 0 }}
              >
                Generate Report
              </Button>
            </Col> */}
          </Row>
        </Card>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title={`Total Sales - ${getPeriodLabel()}`}
                    value={reportData.summary.total_sales}
                    prefix={<IndianRupee size={20} />}
                    precision={2}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Total Bills"
                    value={reportData.summary.total_bills}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Average Bill Value"
                    value={reportData.summary.average_bill_value}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title={
                <Space>
                  <IndianRupee size={20} />
                  <span>Payment Method Breakdown</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Table
                dataSource={reportData.payment_methods}
                columns={paymentColumns}
                pagination={false}
                rowKey="method"
                size="small"
                scroll={{ x: true }}
              />
            </Card>

            {/* Branch Breakdown */}
            {reportData.branches && reportData.branches.length > 0 && (
              <Card
                title={
                  <Space>
                    <ShopOutlined />
                    <span>Branch-wise Sales</span>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                <Table
                  dataSource={reportData.branches}
                  columns={branchColumns}
                  pagination={false}
                  rowKey="branch_id"
                  size="small"
                  scroll={{ x: true }}
                />
              </Card>
            )}

            {/* Top Selling Days */}
            {reportData.top_days && reportData.top_days.length > 0 && (
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    <span>Top 5 Selling Days</span>
                  </Space>
                }
              >
                <Table
                  dataSource={reportData.top_days}
                  columns={topDaysColumns}
                  pagination={false}
                  rowKey="date"
                  size="small"
                  scroll={{ x: true }}
                />
              </Card>
            )}
          </>
        ) : (
          <Card>
            <div style={{ textAlign: "center", padding: 40 }}>
              <BarChartOutlined style={{ fontSize: 48, color: "#ccc" }} />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  Select a period and click "Generate Report" to view sales data
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SalesReport;
