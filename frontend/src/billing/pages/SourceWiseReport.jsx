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
  Progress,
  Dropdown,
  Menu,
} from "antd";
import {
  FileTextOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { IndianRupee, TrendingUp, Users, Download } from "lucide-react";
import dayjs from "dayjs";
import reportService from "../service/reportService";
import { useBranch } from "../../context/BranchContext";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function SourceWiseReport() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("today");
  const [dateRange, setDateRange] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { selectedBranch } = useBranch();
  const reportRef = useRef(null);

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

      const response = await reportService.getSourceWiseReport(params);
      setReportData(response.data);
      message.success("Source-wise report generated successfully");
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

  // Source columns
  const sourceColumns = [
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => {
        const colors = {
          "Walk-in": "blue",
          "Online": "green",
          "Referral": "purple",
          "Social Media": "magenta",
          "Advertisement": "orange",
          "WhatsApp": "cyan",
          "Instagram": "pink",
          "Facebook": "geekblue",
          "Google Search": "volcano",
          "Google Review": "lime",
          "Friend Ref": "gold",
          "Ads": "gold",
        };
        return (
          <Tag color={colors[source] || "default"} style={{ fontSize: 13, padding: "4px 12px" }}>
            {source}
          </Tag>
        );
      },
    },
    {
      title: "Bills Count",
      dataIndex: "bills_count",
      key: "bills_count",
      align: "center",
      sorter: (a, b) => a.bills_count - b.bills_count,
    },
    {
      title: "Unique Customers",
      dataIndex: "unique_customers",
      key: "unique_customers",
      align: "center",
      render: (count) => (
        <Space>
          <TeamOutlined />
          {count}
        </Space>
      ),
      sorter: (a, b) => a.unique_customers - b.unique_customers,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (amount) => `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: "Avg Bill Value",
      dataIndex: "avg_bill_value",
      key: "avg_bill_value",
      align: "right",
      render: (amount) => `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sorter: (a, b) => a.avg_bill_value - b.avg_bill_value,
    },
    {
      title: "Paid Amount",
      dataIndex: "paid_amount",
      key: "paid_amount",
      align: "right",
      render: (amount) => (
        <Text type="success">₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
      ),
    },
    {
      title: "Due Amount",
      dataIndex: "due_amount",
      key: "due_amount",
      align: "right",
      render: (amount) => (
        <Text type={amount > 0 ? "danger" : "secondary"}>
          ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Contribution %",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
      render: (pct) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={parseFloat(pct)}
            size="small"
            format={(percent) => `${percent}%`}
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
        </div>
      ),
      sorter: (a, b) => a.percentage - b.percentage,
    },
  ];

  // Top customers columns
  const topCustomersColumns = [
    {
      title: "Rank",
      key: "rank",
      align: "center",
      width: 60,
      render: (_, __, index) => (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: index < 3 ? ["#FFD700", "#C0C0C0", "#CD7F32"][index] : "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: index < 3 ? "#fff" : "#666",
          }}
        >
          {index + 1}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customer_name",
      key: "customer_name",
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.customer_phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => {
        const colors = {
          "Walk-in": "blue",
          "Online": "green",
          "Referral": "purple",
          "Social Media": "magenta",
        };
        return <Tag color={colors[source] || "default"}>{source}</Tag>;
      },
    },
    {
      title: "Bills Count",
      dataIndex: "bills_count",
      key: "bills_count",
      align: "center",
    },
    {
      title: "Total Spent",
      dataIndex: "total_spent",
      key: "total_spent",
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#52c41a", fontSize: 14 }}>
          ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
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
        ["SOURCE-WISE BILLING REPORT"],
        [""],
        ["Report Period:", getPeriodLabel()],
        ["Branch:", selectedBranch?.name || "All Branches"],
        ["Generated On:", dayjs().format("DD MMM YYYY, hh:mm A")],
        [""],
        ["SUMMARY"],
        ["Total Sales", `₹${parseFloat(reportData.summary.total_sales).toLocaleString("en-IN")}`],
        ["Total Bills", reportData.summary.total_bills],
        ["Total Sources", reportData.summary.total_sources],
        ["Average Bill Value", `₹${parseFloat(reportData.summary.average_bill_value).toLocaleString("en-IN")}`],
        [""],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Source Breakdown Sheet
      const sourceData = [
        ["SOURCE-WISE BREAKDOWN"],
        [""],
        [
          "Source",
          "Bills Count",
          "Unique Customers",
          "Total Amount (₹)",
          "Paid Amount (₹)",
          "Due Amount (₹)",
          "Avg Bill Value (₹)",
          "Contribution %",
        ],
      ];

      reportData.sources.forEach((source) => {
        sourceData.push([
          source.source,
          source.bills_count,
          source.unique_customers,
          parseFloat(source.total_amount).toFixed(2),
          parseFloat(source.paid_amount).toFixed(2),
          parseFloat(source.due_amount).toFixed(2),
          parseFloat(source.avg_bill_value).toFixed(2),
          `${source.percentage}%`,
        ]);
      });

      const sourceSheet = XLSX.utils.aoa_to_sheet(sourceData);
      
      // Set column widths
      sourceSheet["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(workbook, sourceSheet, "Source Breakdown");

      // Top Customers Sheet
      if (reportData.top_customers && reportData.top_customers.length > 0) {
        const customerData = [
          ["TOP 10 CUSTOMERS BY SPENDING"],
          [""],
          ["Rank", "Customer Name", "Phone", "Source", "Bills Count", "Total Spent (₹)"],
        ];

        reportData.top_customers.forEach((customer, index) => {
          customerData.push([
            index + 1,
            customer.customer_name,
            customer.customer_phone,
            customer.source,
            customer.bills_count,
            parseFloat(customer.total_spent).toFixed(2),
          ]);
        });

        const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
        customerSheet["!cols"] = [
          { wch: 8 },
          { wch: 25 },
          { wch: 15 },
          { wch: 20 },
          { wch: 12 },
          { wch: 18 },
        ];

        XLSX.utils.book_append_sheet(workbook, customerSheet, "Top Customers");
      }

      // Generate filename
      const filename = `Source_Wise_Report_${getPeriodLabel().replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;

      // Write file
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
      // Create a temporary container for PDF content
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "210mm"; // A4 width
      pdfContent.style.padding = "20mm";
      pdfContent.style.backgroundColor = "#ffffff";
      pdfContent.style.fontFamily = "Arial, sans-serif";

      // Header
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1890ff; padding-bottom: 20px;">
          <h1 style="color: #1890ff; margin: 0; font-size: 28px; font-weight: bold;">SOURCE-WISE BILLING REPORT</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            ${getPeriodLabel()} | ${selectedBranch?.name || "All Branches"}
          </p>
          <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
            Generated on ${dayjs().format("DD MMM YYYY, hh:mm A")}
          </p>
        </div>

        <!-- Summary Section -->
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
              <td style="padding: 12px; border: 1px solid #d9d9d9; font-weight: bold;">Total Sources</td>
              <td style="padding: 12px; border: 1px solid #d9d9d9; text-align: right;">${reportData.summary.total_sources}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #d9d9d9; font-weight: bold;">Average Bill Value</td>
              <td style="padding: 12px; border: 1px solid #d9d9d9; text-align: right;">
                ₹${parseFloat(reportData.summary.average_bill_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </table>
        </div>

        <!-- Source Breakdown -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #1890ff; padding-left: 10px;">
            Source-wise Breakdown
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #1890ff; color: white;">
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: left;">Source</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">Bills</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">Customers</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Total (₹)</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Avg Bill (₹)</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">%</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.sources
                .map(
                  (source, index) => `
                <tr style="background: ${index % 2 === 0 ? "#fafafa" : "white"};">
                  <td style="padding: 10px; border: 1px solid #d9d9d9; font-weight: bold;">${source.source}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">${source.bills_count}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">${source.unique_customers}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">
                    ₹${parseFloat(source.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">
                    ₹${parseFloat(source.avg_bill_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right; font-weight: bold; color: #1890ff;">
                    ${source.percentage}%
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        ${
          reportData.top_customers && reportData.top_customers.length > 0
            ? `
        <!-- Top Customers -->
        <div style="page-break-before: always; margin-top: 30px;">
          <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #faad14; padding-left: 10px;">
            Top 10 Customers by Spending
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #faad14; color: white;">
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: center; width: 50px;">Rank</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: left;">Customer Name</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: left;">Phone</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: left;">Source</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">Bills</th>
                <th style="padding: 10px; border: 1px solid #d9d9d9; text-align: right;">Total Spent (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.top_customers
                .map(
                  (customer, index) => `
                <tr style="background: ${index % 2 === 0 ? "#fffbe6" : "white"};">
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: center; font-weight: bold;">
                    ${index + 1}
                  </td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9;">${customer.customer_name}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9;">${customer.customer_phone}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9;">${customer.source}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: center;">${customer.bills_count}</td>
                  <td style="padding: 10px; border: 1px solid #d9d9d9; text-align: right; font-weight: bold; color: #52c41a;">
                    ₹${parseFloat(customer.total_spent).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #d9d9d9; text-align: center; color: #999; font-size: 11px;">
          <p style="margin: 0;">This is a system-generated report</p>
          <p style="margin: 5px 0 0 0;">© ${dayjs().year()} - All Rights Reserved</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      // Convert to canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(pdfContent);

      // Create PDF
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

      // Generate filename
      const filename = `Source_Wise_Report_${getPeriodLabel().replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;

      pdf.save(filename);
      message.success("Report exported to PDF successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      message.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  // Export menu
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
                <TrendingUp size={28} style={{ marginRight: 8, verticalAlign: "middle" }} />
                Source-Wise Billing Report
              </Title>
              <Text type="secondary">
                Analyze sales performance by customer acquisition source
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
              <Col xs={24} sm={6}>
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
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Total Bills"
                    value={reportData.summary.total_bills}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Total Sources"
                    value={reportData.summary.total_sources}
                    prefix={<Users size={20} />}
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
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

            {/* Source Breakdown */}
            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  <span>Source-wise Breakdown</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Table
                dataSource={reportData.sources}
                columns={sourceColumns}
                pagination={false}
                rowKey="source"
                size="small"
                scroll={{ x: true }}
              />
            </Card>

            {/* Top Customers */}
            {reportData.top_customers && reportData.top_customers.length > 0 && (
              <Card
                title={
                  <Space>
                    <UserOutlined />
                    <span>Top 10 Customers by Spending</span>
                  </Space>
                }
              >
                <Table
                  dataSource={reportData.top_customers}
                  columns={topCustomersColumns}
                  pagination={false}
                  rowKey={(record) => record.customer_phone}
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
                  Select a period to view source-wise sales data
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SourceWiseReport;
