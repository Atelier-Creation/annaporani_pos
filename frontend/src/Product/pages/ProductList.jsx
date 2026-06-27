import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Table, Input, Button, Space, Popconfirm, message, Grid, List, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import productService from "../services/productService.js";
import debounce from "lodash.debounce";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import Barcode from "react-barcode";
import JsBarcode from "jsbarcode";

const { Search } = Input;

const ProductList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [messageApi, contextHolder] = message.useMessage();
  // separate input visual state from api query state
  const [inputValue, setInputValue] = useState("");
  // Use ref for search query to ensure fresh access in callbacks without dependency
  const searchRef = useRef("");

  const [sorter, setSorter] = useState({ field: null, order: null });

  const qrRefs = useRef({});
  const barcodeRefs = useRef({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  // Sync state with URL only
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search") || "";
    setInputValue(s);
    searchRef.current = s;
    // Explicitly fetch when URL changes
    fetchProducts({ search: s, current: 1 });
  }, [location.search]);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      // Use param if provided, otherwise fallback to ref
      const currentSearch = params.search !== undefined ? params.search : searchRef.current;

      const queryParams = {
        page: params.current || pagination.current,
        limit: params.pageSize || pagination.pageSize,
        search: currentSearch,
        sortField: params.sortField || sorter.field,
        sortOrder: params.sortOrder || sorter.order,
      };

      console.log('Fetching products with params:', queryParams);

      const response = await productService.getAll(queryParams);

      const result = response.data;
      setProducts(Array.isArray(result.data) ? result.data : []);
      setPagination((prev) => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
        pageSize: result.limit || 10,
      }));
    } catch (err) {
      console.error('Fetch products error:', err);
      message.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sorter]);

  // Initial fetch on mount if no URL param (or handle by URL effect if empty string counts as param change?)
  // The URL effect runs on mount with "" if no param. So it handles initial fetch.
  // We DO NOT need a generic useEffect calling fetchProducts() now.

  const debouncedSearch = useCallback(
    debounce((value) => {
      searchRef.current = value;
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchProducts({ search: value, current: 1 });
    }, 500),
    [fetchProducts]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    debouncedSearch(val);
  };

  const handleTableChange = (pag, filters, sort) => {
    setPagination(pag);
    setSorter({
      field: sort.field,
      order: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null,
    });
    // Explicit fetch on table change
    // Note: State updates (setPagination, setSorter) are async. 
    // We should pass the NEW values to fetchProducts to be safe.
    fetchProducts({
      current: pag.current,
      pageSize: pag.pageSize,
      sortField: sort.field,
      sortOrder: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null
    });
  };

  const handleDelete = async (id) => {
    try {
      await productService.remove(id);
      messageApi.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      console.error(err);
      messageApi.error("Failed to delete product");
    }
  };

  const downloadQR = (id, code) => {
    const canvas = qrRefs.current[id]?.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL();
      link.download = `${code}.png`;
      link.click();
    }
  };

  const downloadBarcode = (id, code) => {
    const svg = barcodeRefs.current[id]?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `barcode_${code}.png`;
        link.click();
      };
      img.src = url;
    }
  };

  const downloadAllQRPDF = () => {
    const pdf = new jsPDF();
    let x = 10;
    let y = 10;
    const size = 40;

    products.forEach((product) => {
      const canvas = qrRefs.current[product.id]?.querySelector("canvas");
      if (canvas) {
        const imgData = canvas.toDataURL("image/png");
        pdf.text(product.product_code, x, y - 2);
        pdf.addImage(imgData, "PNG", x, y, size, size);

        x += size + 20;
        if (x + size > 200) {
          x = 10;
          y += size + 20;
        }
      }
    });

    pdf.save("product_qrcodes.pdf");
  };

  // Generate label sticker PDF for selected products
  const downloadLabelsPDF = () => {
    if (selectedRows.length === 0) {
      message.warning("Please select at least one product");
      return;
    }

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const labelW = 60;
    const labelH = 38;
    const cols = 3;
    const marginX = 10;
    const marginY = 10;
    const gapX = 5;
    const gapY = 5;

    selectedRows.forEach((product, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      if (index > 0 && col === 0 && row * (labelH + gapY) + marginY > 260) {
        pdf.addPage();
      }

      const x = marginX + col * (labelW + gapX);
      const y = marginY + (row % Math.floor((297 - marginY * 2) / (labelH + gapY))) * (labelH + gapY);

      // Border
      pdf.setDrawColor(180);
      pdf.roundedRect(x, y, labelW, labelH, 2, 2);

      // Header: Duch Clothing
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 30);
      pdf.text("Duch Clothing", x + labelW / 2, y + 5, { align: "center" });

      // Divider line
      pdf.setDrawColor(200);
      pdf.line(x + 2, y + 7, x + labelW - 2, y + 7);

      // Barcode SVG → canvas → image (high resolution to avoid blur)
      const barcodeCanvas = document.createElement("canvas");
      const scale = 4; // render 4x for sharpness
      JsBarcode(barcodeCanvas, product.product_code || "000000", {
        format: "CODE128",
        width: 2 * scale,
        height: 40 * scale,
        displayValue: false,
        margin: 2 * scale,
      });
      const barcodeImg = barcodeCanvas.toDataURL("image/png");
      pdf.addImage(barcodeImg, "PNG", x + 4, y + 8, labelW - 8, 14);

      // product_code text — clear gap below barcode
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80);
      pdf.text(product.product_code || "", x + labelW / 2, y + 24, { align: "center" });

      // Info lines
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30);
      pdf.text(`Price : Rs.${product.selling_price ?? ""}`, x + 3, y + 28);
      pdf.text(`Portion: ${product.portion_size ?? ""}`, x + 3, y + 32);
      pdf.text(`Name : ${product.product_name ?? ""}`, x + 3, y + 36, { maxWidth: labelW - 4 });
    });

    pdf.save("label_stickers.pdf");
  };

  const columns = [
    { title: "Name", dataIndex: "product_name", key: "product_name", sorter: true, responsive: ["xs", "sm", "md"] },
    { title: "Code", dataIndex: "product_code", key: "product_code", responsive: ["md"] },
    {
      title: "QR Code",
      key: "qr_code",
      responsive: ["lg"],
      render: (_, record) => (
        <div ref={(el) => (qrRefs.current[record.id] = el)} style={{ display: "flex", alignItems: "center" }}>
          <QRCodeCanvas value={record.product_code || ""} size={64} level="H" />
          <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadQR(record.id, record.product_code)} style={{ marginLeft: 8 }}>
            Download
          </Button>
        </div>
      ),
    },
    {
      title: "Barcode",
      key: "barcode",
      responsive: ["lg"],
      render: (_, record) => (
        <div ref={(el) => (barcodeRefs.current[record.id] = el)} style={{ display: "flex", alignItems: "center" }}>
          <Barcode value={record.product_code || "000000"} width={1.2} height={40} fontSize={10} />
          <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadBarcode(record.id, record.product_code)} style={{ marginLeft: 8 }}>
            Download
          </Button>
        </div>
      ),
    },
    { title: "Category", dataIndex: "category_name", key: "category", responsive: ["lg"] },
    { title: "Selling Price", dataIndex: "selling_price", key: "selling_price", sorter: true, responsive: ["xl"], render: (price) => `₹${price}` },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => {
        const menuItems = [
          { key: "category", label: `Category: ${record.category_name}` },
        ];

        return (
          <>
            {contextHolder}
            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/Product/edit/${record.id}`)}>
                Edit
              </Button>
              <Popconfirm title="Are you sure you want to delete this product?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                <Button danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            </Space>
          </>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-row items-center gap-2 mb-4 flex-wrap">
        <Search
          placeholder="Search products..."
          value={inputValue}
          onSearch={(v) => {
            searchRef.current = v;
            setPagination((prev) => ({ ...prev, current: 1 }));
            fetchProducts({ search: v, current: 1 });
          }}
          onChange={handleInputChange}
          enterButton
          allowClear
          style={{ flex: "1 1 180px", minWidth: 140, maxWidth: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/Product/add")}>
          Add Product
        </Button>
        <Button type="default" icon={<DownloadOutlined />} onClick={downloadAllQRPDF}>
          QR PDF
        </Button>
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={downloadLabelsPDF}
          disabled={selectedRowKeys.length === 0}
        >
          Labels {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
        </Button>
      </div>

      {!screens.md ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={products}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
              fetchProducts({ current: page, pageSize });
            },
          }}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Card
                title={item.product_name}
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/Product/edit/${item.id}`)}
                    />
                    <Popconfirm title="Are you sure you want to delete this product?" onConfirm={() => handleDelete(item.id)} okText="Yes" cancelText="No">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Code:</span>
                  <span className="font-medium">{item.product_code}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">₹{item.selling_price}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium">{item.category_name}</span>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div ref={(el) => (qrRefs.current[item.id] = el)}>
                    <QRCodeCanvas value={item.product_code || ""} size={64} level="H" />
                  </div>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadQR(item.id, item.product_code)}
                  >
                    Download QR
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div ref={(el) => (barcodeRefs.current[item.id] = el)}>
                    <Barcode value={item.product_code || "000000"} width={1.2} height={40} fontSize={10} />
                  </div>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadBarcode(item.id, item.product_code)}
                  >
                    Download Barcode
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={products}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
          scroll={{ x: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => {
              // Merge with existing selections from other pages
              setSelectedRowKeys((prevKeys) => {
                const currentPageIds = products.map((p) => p.id);
                // Remove current page keys, then add newly selected ones
                const otherPageKeys = prevKeys.filter((k) => !currentPageIds.includes(k));
                return [...otherPageKeys, ...keys];
              });
              setSelectedRows((prevRows) => {
                const currentPageIds = products.map((p) => p.id);
                const otherPageRows = prevRows.filter((r) => !currentPageIds.includes(r.id));
                return [...otherPageRows, ...rows];
              });
            },
          }}
        />
      )}
    </div>
  );
};

export default ProductList;
