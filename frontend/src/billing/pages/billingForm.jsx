import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs } from "antd";
import { useBranch } from "../../context/BranchContext";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  DatePicker,
  message,
  Spin,
  Table,
  Row,
  Col,
  Divider,
  Typography,
  Card,
  Alert,
  Tag,
  Space,
  Modal,
} from "antd";
import { CheckCircleOutlined, GiftOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import productService from "../../Product/services/productService";
import billingService from "../service/billingService";
import localPrintService from "../service/localPrintService";
import { getReceiptProfile } from "../service/receiptSettings";
import couponService from "../../coupon/service/couponService";
import customerService from "../../customer/service/customerService";
import { Gift, Laptop, PhoneCall, Printer, ShieldCheck, Trash2 } from "lucide-react";

const { Title } = Typography;
const { Option } = Select;

const BalanceCalculator = React.memo(({ grandTotal, receivedAmount, onReceivedAmountChange }) => {
  const [localVal, setLocalVal] = useState(receivedAmount);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalVal(receivedAmount);
  }, [receivedAmount]);

  const handleChange = (val) => {
    const num = val || 0;
    setLocalVal(num);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onReceivedAmountChange(num);
    }, 500);
  };

  return (
    <div style={{ marginBottom: 8, padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 6 }}>Balance Calculator</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Amount Received</div>
          <InputNumber
            size="small"
            min={0}
            precision={2}
            value={localVal || null}
            onChange={handleChange}
            prefix="₹"
            style={{ width: "100%" }}
            placeholder="0"
          />
        </div>
        <span style={{ color: "#9ca3af", fontSize: 12, marginTop: 14 }}>➔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Balance to Return</div>
          <div style={{ 
            height: 24, 
            lineHeight: "24px", 
            fontWeight: 700, 
            fontSize: 14, 
            color: (localVal - grandTotal) >= 0 ? "#16a34a" : "#ef4444" 
          }}>
            ₹{Math.max(0, (localVal || 0) - grandTotal).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

function BillingForm() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [preview, setPreview] = useState({ items: [], customer_name: "", billing_date: dayjs() });
  const [activeTab, setActiveTab] = useState("new");
  const [customerHistoryBills, setCustomerHistoryBills] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Product dropdown states
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Quick add product modal states
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [quickAddForm] = Form.useForm();
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Inline new product states
  const [creatingInlineProducts, setCreatingInlineProducts] = useState(new Set());

  const [messageApi, contextHolder] = message.useMessage();
  // Fetch all products for dropdown
  const fetchAllProducts = async (searchTerm = "") => {
    setProductsLoading(true);
    try {
      const params = {
        page: 1,
        limit: searchTerm ? 100 : 10, // Show more when searching
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await productService.getAll(params);
      const products = response.data?.data || response.data || [];
      setAllProducts(products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      message.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  // Load initial products on mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Fetch billing data for edit mode
  useEffect(() => {
    if (id) {
      fetchBillingData();
    }
  }, [id]);

  const fetchBillingData = async () => {
    setFetchingData(true);
    try {
      console.log('Fetching billing data for ID:', id);
      const response = await billingService.getById(id);
      console.log('Full response object:', response);
      console.log('Response keys:', Object.keys(response));
      console.log('Response.data:', response.data);
      console.log('Response.data type:', typeof response.data);

      // Try different possible response structures
      let billingData = null;

      if (response.data) {
        billingData = response.data;
      } else if (response) {
        billingData = response;
      }

      console.log('Extracted billing data:', billingData);
      console.log('Billing data type:', typeof billingData);

      if (!billingData || typeof billingData !== 'object') {
        console.error('Invalid billing data structure');
        throw new Error('No billing data received');
      }

      // Process items to include product details
      const processedItems = (billingData.items || []).map(item => {
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const tax = parseFloat(item.tax) || 0;
        const discount = parseFloat(item.discount) || 0;

        // Calculate tax_percentage from tax amount if not provided
        // tax_percentage = (tax / (quantity * unitPrice)) * 100
        let taxPercentage = parseFloat(item.tax_percentage) || 0;
        if (!taxPercentage && tax > 0 && quantity > 0 && unitPrice > 0) {
          taxPercentage = (tax / (quantity * unitPrice)) * 100;
        }

        return {
          key: item.id || Math.random().toString(),
          product_id: item.product_id,
          product_code: item.product?.product_code || item.product_code || '',
          product_name: item.product?.product_name || item.product_name || '',
          quantity: quantity,
          unit_price: unitPrice,
          mrp: parseFloat(item.mrp) || 0,
          discount_percentage: parseFloat(item.discount_percentage) || 0,
          discount_amount: discount,
          tax_percentage: parseFloat(taxPercentage.toFixed(2)),
          tax_amount: tax,
          total_price: parseFloat(item.total_price) || 0,
          size: item.size || '',
          color: item.color || '',
          unit: item.unit || 'piece',
          barcode: item.barcode || '',
        };
      });

      console.log('Processed items:', processedItems);

      // Populate form with billing data
      const formValues = {
        customer_name: billingData.customer_name || '',
        customer_phone: billingData.customer_phone || '',
        customer_email: billingData.customer_email || '',
        billing_date: billingData.billing_date ? dayjs(billingData.billing_date) : dayjs(),
        payment_method: billingData.payment_method || 'cash',
        payment_status: billingData.status || 'paid',
        items: processedItems,
        subtotal: parseFloat(billingData.subtotal_amount) || 0,
        discount: parseFloat(billingData.discount_amount) || 0,
        tax: parseFloat(billingData.tax_amount) || 0,
        total_amount: parseFloat(billingData.total_amount) || 0,
        paid_amount: parseFloat(billingData.paid_amount) || 0,
        due_amount: parseFloat(billingData.due_amount) || 0,
        notes: billingData.notes || '',
      };

      console.log('Form values to set:', formValues);
      form.setFieldsValue(formValues);

      // Set preview
      setPreview({
        items: processedItems,
        customer_name: billingData.customer_name || '',
        billing_date: billingData.billing_date ? dayjs(billingData.billing_date) : dayjs(),
      });

      // Restore bill-level discount state
      const existingDiscount = parseFloat(billingData.discount_amount) || 0;
      // Per-item discounts
      const itemDiscounts = processedItems.reduce((s, it) => s + (Number(it.discount_amount) || 0), 0);
      // Bill-level discount = total discount - item discounts (can't be negative)
      const billLevelDiscount = Math.max(0, existingDiscount - itemDiscounts);
      const subtotalForPct = processedItems.reduce((s, it) => s + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0), 0);
      const billLevelPct = subtotalForPct > 0 ? parseFloat(((billLevelDiscount / subtotalForPct) * 100).toFixed(2)) : 0;
      setBillDiscountAmt(billLevelDiscount);
      setBillDiscountPct(billLevelPct);

      // Restore split payment state
      if (billingData.payment_method === 'split') {
        setIsSplitPayment(true);
        const details = billingData.payment_details;
        if (Array.isArray(details) && details.length > 0) {
          setSplitPayments(details.map(p => ({ method: p.method, amount: p.amount })));
        }
      } else {
        setIsSplitPayment(false);
        setSplitPayments([{ method: billingData.payment_method || 'cash', amount: parseFloat(billingData.total_amount) || 0 }]);
      }

      console.log('Form values after set:', form.getFieldsValue());
      message.success('Billing data loaded');
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      message.error('Failed to load billing data: ' + error.message);
      // Don't navigate away, let user see the error
      // navigate('/billing/list');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchCustomerBills = async () => {
    const phone = form.getFieldValue("customer_phone");

    if (!phone || phone.length !== 10) {
      message.warning("Enter valid customer phone number first");
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await billingService.getByCustomerPhone(phone);
      const data = response.data?.data || response.data || [];
      setCustomerHistoryBills(data);
    } catch (err) {
      message.error("Failed to fetch customer billing history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const historyColumns = [
    {
      title: "Bill No",
      dataIndex: "billing_no",
      key: "billing_no",
    },
    {
      title: "Date",
      dataIndex: "billing_date",
      key: "date",
      render: (v) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Items",
      dataIndex: "total_quantity",
      key: "qty",
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "amount",
      render: (v) => `₹${Number(v).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={v === "paid" ? "green" : "orange"}>
          {v?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => {
            // Open in new tab
            window.open(`/billing/edit/${record.id}`, '_blank');
          }}
        >
          Edit
        </Button>
      ),
    },
  ];
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);

  // Bill-level discount (percentage ↔ amount auto-convert)
  const [billDiscountPct, setBillDiscountPct] = useState(0);
  const [billDiscountAmt, setBillDiscountAmt] = useState(0);
  const [couponError, setCouponError] = useState(""); // Track coupon validation errors

  // Customer states
  const [customerData, setCustomerData] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Split payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: 'cash', amount: 0 }
  ]);

  // Success modal for generated coupon
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState(null);

  // Print confirmation modal after billing save
  const [printConfirmModal, setPrintConfirmModal] = useState(false);
  const printYesRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const [savedBillingResult, setSavedBillingResult] = useState(null);
  const [savedItemsRaw, setSavedItemsRaw] = useState([]);
  const [billToPrint, setBillToPrint] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState(0);

  // Bill Management (Tabs)
  const DRAFT_KEY = "billing_draft_bills";
  const DRAFT_ACTIVE_KEY = "billing_draft_active";

  // Load persisted drafts from sessionStorage on first mount
  const [bills, setBills] = useState(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore dayjs objects
        return parsed.map(b => ({
          ...b,
          formValues: {
            ...b.formValues,
            billing_date: b.formValues?.billing_date ? dayjs(b.formValues.billing_date) : dayjs(),
          },
          preview: {
            ...b.preview,
            billing_date: b.preview?.billing_date ? dayjs(b.preview.billing_date) : dayjs(),
          },
        }));
      }
    } catch { /* ignore */ }
    return [];
  });

  const [activeBillKey, setActiveBillKey] = useState(() => {
    return sessionStorage.getItem(DRAFT_ACTIVE_KEY) || "1";
  });
  const { selectedBranch, branches } = useBranch();

  const currentBranchDetails = branches.find(b => b.branch_id === selectedBranch?.id)?.branch;

  const printBillSilently = async (bill, sourceItems) => {
    const printableItems = (sourceItems || []).map((rawItem) => {
      const item = updateItemCalculations({ ...rawItem });
      return {
        ...item,
        product: item.product || {
          product_name: item.product_name,
          product_code: item.product_code,
          unit: item.unit,
        },
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        total_price: Number(item.total_price || 0),
        tax_amount: Number(item.tax_amount || 0),
      };
    });

    const printableBill = {
      ...bill,
      items: printableItems,
      received_amount: receivedAmount,
      customer_name: bill.customer_name || form.getFieldValue("customer_name") || "",
      customer_phone: bill.customer_phone || form.getFieldValue("customer_phone") || "",
      counter_no: bill.counter_no || form.getFieldValue("counter_no") || null,
      payment_method: bill.payment_method || form.getFieldValue("payment_method") || "cash",
      receiptProfile: getReceiptProfile({
        branches,
        selectedBranch,
        branch: bill.branch || currentBranchDetails,
      }),
    };

    const printerName = localStorage.getItem("thermalPrinterName") || "";
    await localPrintService.printReceiptLocally(printableBill, printerName);
    return printableBill;
  };

  // Helper to generate a blank bill state
  const createNewBillState = (key) => {
    // Leave bill_no empty so placeholder "Auto Generates" shows
    return {
      key: key || Date.now().toString(),
      label: `Bill ${key || 1}`,
      formValues: { 
        bill_no: "", 
        billing_date: dayjs(), 
        status: "pending", 
        items: [], 
        counter_no: "Counter 1", 
        source: "",
        customer_name: "",
        customer_phone: "",
        payment_method: "cash",
        notes: ""
      },
      customerData: null,
      isNewCustomer: false,
      couponCode: "",
      couponData: null,
      couponApplied: false,
      isSplitPayment: false,
      splitPayments: [{ method: 'cash', amount: 0 }],
      customerHistoryBills: [],
      receivedAmount: 0,
      preview: { items: [], customer_name: "", billing_date: dayjs(), counter_no: "Counter 1" },
    };
  };

  // Initialize first bill
  useEffect(() => {
    // Only if bills empty
    if (bills.length === 0) {
      const initial = createNewBillState("1");
      setBills([initial]);
      loadBillToForm(initial);
    } else {
      // Restore the active bill into the form on mount
      const activeBill = bills.find(b => b.key === activeBillKey) || bills[0];
      if (activeBill) loadBillToForm(activeBill);
    }
  }, []);

  // Persist bills to sessionStorage whenever they change
  useEffect(() => {
    if (bills.length > 0) {
      try {
        sessionStorage.setItem("billing_draft_bills", JSON.stringify(bills));
      } catch { /* ignore quota errors */ }
    }
  }, [bills]);

  // Persist active key
  useEffect(() => {
    sessionStorage.setItem("billing_draft_active", activeBillKey);
  }, [activeBillKey]);

  const loadBillToForm = (billState) => {
    form.resetFields();
    form.setFieldsValue(billState.formValues);
    setCustomerData(billState.customerData);
    setIsNewCustomer(billState.isNewCustomer);
    setCouponCode(billState.couponCode);
    setCouponData(billState.couponData);
    setCouponApplied(billState.couponApplied);
    setIsSplitPayment(billState.isSplitPayment);
    setSplitPayments(billState.splitPayments);
    setCustomerHistoryBills(billState.customerHistoryBills);
    setReceivedAmount(billState.receivedAmount || 0);
    setPreview(billState.preview);
  };

  const saveCurrentBillState = () => {
    // Return the state object representing current UI
    return {
      formValues: form.getFieldsValue(true), // true = include hidden/all
      customerData,
      isNewCustomer,
      couponCode,
      couponData,
      couponApplied,
      isSplitPayment,
      splitPayments,
      customerHistoryBills,
      receivedAmount,
      preview,
    };
  };

  const handleTabChange = (newKey) => {
    // 1. Save current bill state to the bills array
    const updatedBills = bills.map(b =>
      b.key === activeBillKey
        ? { ...b, ...saveCurrentBillState() }
        : b
    );

    // 2. Find target bill
    const targetBill = updatedBills.find(b => b.key === newKey);
    if (!targetBill) return;

    // 3. Update active key and bills list
    setActiveBillKey(newKey);
    setBills(updatedBills);

    // 4. Load target bill data into form/state
    loadBillToForm(targetBill);
  };

  const handleEditTabs = (targetKey, action) => {
    if (action === 'add') {
      addTab();
    } else {
      removeTab(targetKey);
    }
  };

  const addTab = () => {
    if (bills.length >= 10) {
      message.warning("Maximum 10 bills allowed");
      return;
    }
    // Save current before switching? Yes, usually desired.
    const currentSaved = saveCurrentBillState();
    const updatedBills = bills.map(b => b.key === activeBillKey ? { ...b, ...currentSaved } : b);

    const newKey = (parseInt(updatedBills[updatedBills.length - 1].key) + 1).toString();
    const newBill = createNewBillState(newKey);

    const nextBills = [...updatedBills, newBill];
    setBills(nextBills);
    setActiveBillKey(newKey);
    loadBillToForm(newBill);
  };

  const removeTab = (targetKey) => {
    let newActiveKey = activeBillKey;
    let lastIndex = -1;

    // You cannot close the last remaining tab
    if (bills.length === 1) {
      message.warning("At least one bill must be open");
      return;
    }

    bills.forEach((bill, i) => {
      if (bill.key === targetKey) {
        lastIndex = i - 1;
      }
    });

    const newBills = bills.filter((bill) => bill.key !== targetKey);

    if (newBills.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newBills[lastIndex].key;
      } else {
        newActiveKey = newBills[0].key;
      }
    }

    setBills(newBills);
    setActiveBillKey(newActiveKey);

    // If we switched tabs, load the data
    if (newActiveKey !== activeBillKey) {
      // Find the data for the new active key in the filtered list
      const billToLoad = newBills.find(b => b.key === newActiveKey);
      if (billToLoad) loadBillToForm(billToLoad);
    } else if (newBills.length > 0 && targetKey === activeBillKey) {
      // Should catch above, but safety:
      loadBillToForm(newBills[0]);
    }
  };

  const generateRandomBillNo = () => {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `PNO${randomNumber}`;
  };

  // ensure item calculations are up-to-date
  const updateItemCalculations = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    const discount = Number(item.discount_amount || 0);
    // tax_percentage is used to compute tax_amount; numeric percent (e.g. 7.5)
    const taxPerc = Number(item.tax_percentage || 0);

    const tax = ((qty * price * taxPerc) / 100);
    const total = qty * price + tax - discount;

    item.tax_amount = parseFloat(tax.toFixed(2));
    item.total_price = parseFloat(total.toFixed(2));
    return item;
  };

  // ADD PRODUCT BY CODE
  const handleProductCode = async (code) => {
    const trimmed = String(code || "").trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const response = await productService.getByCode(trimmed);
      // Extract product from response - could be response.data or response directly
      const product = response.data || response;

      console.log("Product fetched:", product);

      if (!product || !product.product_code) {
        message.error("No product found for code: " + trimmed);
        return;
      }

      addProductToItems(product);
      setProductCode("");
    } catch (err) {
      console.error("handleProductCode error:", err);
      message.error(
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) ||
        "Failed to fetch product"
      );
    } finally {
      setLoading(false);
    }
  };

  // ADD PRODUCT FROM DROPDOWN
  const handleProductSelect = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      addProductToItems(product);
      setSelectedProduct(null); // Clear selection
    }
  };

  // QUICK ADD NEW PRODUCT
  const handleQuickAddProduct = async (values) => {
    setQuickAddLoading(true);
    try {
      // Create minimal product with just name and price
      const productData = {
        product_name: values.product_name,
        product_code: `QUICK-${Date.now()}`, // Auto-generate code
        selling_price: values.unit_price,
        cost_price: values.unit_price * 0.7, // Default 30% margin
        mrp: values.unit_price,
        unit: values.unit || 'piece',
        category_id: null, // Optional
        subcategory_id: null, // Optional
        description: 'Quick add product',
        is_active: true
      };

      console.log('Creating quick product:', productData);
      const response = await productService.create(productData);
      console.log('Product created response:', response);

      const newProduct = response.data?.data || response.data;
      console.log('New product data:', newProduct);

      // Ensure we have the product ID
      const productId = newProduct.id || newProduct._id || newProduct.uuid;
      if (!productId) {
        throw new Error('Product created but no ID returned');
      }

      message.success({
        content: `✅ "${values.product_name}" added to bill!`,
        duration: 3
      });

      // Refresh products list
      fetchAllProducts();

      // Add the new product to the billing items immediately
      const productToAdd = {
        id: productId,
        product_id: productId,
        _id: productId,
        product_name: values.product_name,
        product_code: newProduct.product_code || productData.product_code,
        selling_price: values.unit_price,
        unit: values.unit || 'piece',
        mrp: values.unit_price,
        cost_price: values.unit_price * 0.7
      };

      console.log('Adding product to items:', productToAdd);
      addProductToItems(productToAdd);

      message.success({
        content: `✅ "${values.product_name}" added to bill!`,
        duration: 3
      });

      // Close modal and reset form
      setQuickAddModalVisible(false);
      quickAddForm.resetFields();
    } catch (error) {
      console.error('Quick add product error:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to add product');
    } finally {
      setQuickAddLoading(false);
    }
  };

  // ADD EMPTY ROW FOR INLINE PRODUCT CREATION
  const handleAddEmptyRow = () => {
    let items = form.getFieldValue("items") || [];
    const emptyRow = {
      _isNew: true, // Flag to identify new product rows
      _tempId: `temp-${Date.now()}`, // Temporary ID
      product_id: null,
      product_code: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_percentage: 0,
      tax_amount: 0,
      total_price: 0,
    };
    items = [...items, emptyRow];
    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));
    message.info('Enter product name and price in the table below');
  };

  // Common function to add product to items
  const addProductToItems = (product) => {
    // resolve product id from common property names
    const resolvedProductId =
      product.id ||
      product._id ||
      product.uuid ||
      product.product_uuid ||
      product.productId ||
      null;

    if (!resolvedProductId) {
      message.error("Product is missing an id/uuid and cannot be added to the bill.");
      console.error("Product payload missing id/uuid:", product);
      return;
    }

    let items = form.getFieldValue("items") || [];
    const index = items.findIndex((i) => i.product_code === product.product_code);

    if (index >= 0) {
      items[index].quantity = (items[index].quantity || 0) + 1;
      items[index] = updateItemCalculations(items[index]);
    } else {
      const newItem = updateItemCalculations({
        product_id: String(resolvedProductId),
        product_code: product.product_code,
        product_name: product.product_name || product.name || "",
        size: product.size || "",
        color: product.color || "",
        quantity: 1,
        unit_price: product.selling_price || product.price || 0,
        discount_amount: 0,
        tax_percentage: product.tax_percentage || product.tax || 0,
        tax_amount: 0,
        total_price: 0,
      });
      items = [...items, newItem];
    }

    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));

    message.success(`${product.product_name || product.product_code} added`);
  };

  // update a single item field (qty/discount/price)
  const handleItemChange = (index, field, value) => {
    let items = form.getFieldValue("items") || [];
    if (!items[index]) return;
    const item = { ...items[index], [field]: value };
    items[index] = updateItemCalculations(item);
    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));
  };

  const removeItem = (index) => {
    const items = (form.getFieldValue("items") || []).slice();
    items.splice(index, 1);
    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));
  };

  // Bill-level discount handlers — auto-convert between % and amount
  const handleBillDiscountPct = (val) => {
    const pct = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const items = form.getFieldValue("items") || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0);
    const amt = parseFloat(((pct / 100) * subtotal).toFixed(2));
    setBillDiscountPct(pct);
    setBillDiscountAmt(amt);
  };

  const handleBillDiscountAmt = (val) => {
    const amt = Math.max(0, parseFloat(val) || 0);
    const items = form.getFieldValue("items") || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0);
    const pct = subtotal > 0 ? parseFloat(((amt / subtotal) * 100).toFixed(2)) : 0;
    setBillDiscountAmt(amt);
    setBillDiscountPct(pct);
  };

  // calculate invoice summary
  const calculateSummaryFromItems = (items, appliedCoupon = null) => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0);
    const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount_amount) || 0), 0);
    const totalTax = items.reduce((sum, i) => sum + (Number(i.tax_amount) || 0), 0);

    let couponDiscount = 0;
    if (appliedCoupon && couponApplied) {
      couponDiscount = appliedCoupon.discount_amount || appliedCoupon.discount?.discountAmount || 0;
    }

    const grandTotal = subtotal - totalDiscount - billDiscountAmt + totalTax - couponDiscount;
    return { subtotal, totalDiscount, billDiscount: billDiscountAmt, billDiscountPct, totalTax, couponDiscount, grandTotal: Math.max(0, grandTotal) };
  };

  // Validate coupon
  const handleValidateCoupon = async () => {
    const customerPhone = form.getFieldValue("customer_phone");
    const items = form.getFieldValue("items") || [];

    if (!couponCode.trim()) {
      const errorMsg = "Please enter a coupon code";
      setCouponError(errorMsg);
      message.warning(errorMsg);
      return;
    }

    if (!customerPhone) {
      const errorMsg = "Please enter customer phone number first";
      setCouponError(errorMsg);
      message.warning(errorMsg);
      return;
    }

    if (items.length === 0) {
      const errorMsg = "Please add items to the bill first";
      setCouponError(errorMsg);
      message.warning(errorMsg);
      return;
    }

    const summary = calculateSummaryFromItems(items);

    setCouponValidating(true);
    try {
      const response = await couponService.validateCoupon({
        coupon_code: couponCode.toUpperCase(),
        customer_phone: customerPhone,
        purchase_amount: summary.subtotal, // Use subtotal for validation
      });

      const result = response.data || response;

      if (result.success && result.discount_amount) {
        // Store the validated coupon data with correct structure
        setCouponData({
          valid: true,
          discount_amount: result.discount_amount,
          coupon: result.coupon,
          message: result.message
        });
        setCouponApplied(true);
        setCouponError(""); // Clear any previous errors
        message.success(`Coupon applied! Discount: ₹${result.discount_amount.toFixed(2)}`);
      } else {
        // Handle validation failure - backend returned success: false
        setCouponData(null);
        setCouponApplied(false);
        setCouponCode(""); // Clear the invalid coupon code
        // Show the backend message if available; handles specific errors like:
        // "Cannot use your own referral coupon", "Coupon will be valid in 24 hours", etc.
        const errorMessage = result.message || "Invalid coupon code";
        setCouponError(errorMessage); // Set error for UI display
        message.error(errorMessage);
      }
    } catch (error) {
      setCouponData(null);
      setCouponApplied(false);
      setCouponCode(""); // Clear the invalid coupon code
      // Prefer error.response.data.message as that's where the API returns the specific error message
      const errorMsg = error.response?.data?.message || error.message || "Failed to validate coupon";
      setCouponError(errorMsg); // Set error for UI display
      message.error(errorMsg);
    } finally {
      setCouponValidating(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponApplied(false);
    setCouponError(""); // Clear any error messages
    message.info("Coupon removed");
  };

  // Split payment handlers
  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: 0 }]);
  };

  const removeSplitPayment = (index) => {
    const newPayments = splitPayments.filter((_, i) => i !== index);
    setSplitPayments(newPayments.length > 0 ? newPayments : [{ method: 'cash', amount: 0 }]);
  };

  const updateSplitPayment = (index, field, value) => {
    const newPayments = [...splitPayments];
    newPayments[index][field] = value;
    setSplitPayments(newPayments);
  };

  const getTotalSplitAmount = () => {
    return splitPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  // Lookup customer by phone
  const handleCustomerLookup = async (phone) => {
    if (!phone || phone.length !== 10) {
      setCustomerData(null);
      setIsNewCustomer(false);
      return;
    }

    setCustomerLoading(true);
    try {
      const response = await customerService.getCustomerByPhone(phone);
      const customer = response.data.data;

      if (customer) {
        setCustomerData(customer);
        setIsNewCustomer(false);

        // Auto-fill customer name if found and set source to 'Existing Customer'
        form.setFieldsValue({
          customer_name: customer.customer_name,
          source: "Existing Customer"
        });

        message.success(`Customer found: ${customer.customer_name}`);

        // Fetch customer history and analytics
        try {
          const [historyRes, analyticsRes, couponsRes] = await Promise.all([
            customerService.getCustomerHistory(customer.id),
            customerService.getCustomerAnalytics(customer.id),
            couponService.getCustomerCoupons(phone),
          ]);

          const historyData = historyRes.data.data || historyRes.data || {};
          console.log(historyData)
          const analyticsData = analyticsRes.data.data || analyticsRes.data || {};
          const couponsData = couponsRes.data.data || couponsRes.data || [];

          setCustomerData({
            ...customer,
            // From history endpoint
            statistics: historyData.statistics || {},
            top_products: historyData.top_products || [],
            recent_purchases: historyData.recent_purchases || [],
            preferences: historyData.preferences || {},
            // From analytics endpoint
            analytics: analyticsData,
            // From coupons endpoint
            coupons: couponsData,
            // Legacy support
            totalPoints: customer.totalPoints || 0,
          });
          setCustomerHistoryBills(historyData.recent_purchases || []);
        } catch (err) {
          console.error("Error fetching customer details:", err);
        }
      } else {
        setCustomerData(null);
        setIsNewCustomer(true);
        message.info("New customer - please enter name");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setCustomerData(null);
        setIsNewCustomer(true);
        message.info("New customer - please enter name");
      } else {
        message.error("Failed to lookup customer");
      }
    } finally {
      setCustomerLoading(false);
    }
  };

  // when form changes, keep preview in sync (debounced by 0.5s to prevent typing lag)
  const onValuesChange = (changed, all) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    previewTimeoutRef.current = setTimeout(() => {
      setPreview(all);
    }, 500);
  };

  // SUBMIT -> send payload shape backend expects
  const handleSubmit = async (values) => {
    // Validate split payment if enabled
    if (isSplitPayment) {
      const splitTotal = getTotalSplitAmount();
      const items = form.getFieldValue("items") || [];
      const summary = calculateSummaryFromItems(items, couponApplied ? couponData : null);

      if (Math.abs(splitTotal - summary.grandTotal) > 0.01) {
        messageApi.error(`Split payment total (₹${splitTotal.toFixed(2)}) must equal bill total (₹${summary.grandTotal.toFixed(2)})`);
        return;
      }
    }

    setLoading(true);
    try {
      let itemsRaw = form.getFieldValue("items") || [];

      if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
        messageApi.error("Add at least one product/item before submitting the bill.");
        setLoading(false);
        return;
      }

      // Create products for new rows first
      const newProductRows = itemsRaw.filter(item => item._isNew);
      if (newProductRows.length > 0) {
        messageApi.loading('Creating new products...', 0);

        for (let i = 0; i < itemsRaw.length; i++) {
          const item = itemsRaw[i];
          if (item._isNew) {
            if (!item.product_name || !item.unit_price) {
              messageApi.destroy();
              messageApi.error(`Please enter product name and price for row ${i + 1}`);
              setLoading(false);
              return;
            }

            // Create the product
            const productData = {
              product_name: item.product_name,
              product_code: `QUICK-${Date.now()}-${i}`,
              selling_price: item.unit_price,
              cost_price: item.unit_price * 0.7,
              mrp: item.unit_price,
              unit: 'piece',
              description: 'Quick add product',
              is_active: true
            };

            const response = await productService.create(productData);
            const newProduct = response.data?.data || response.data;
            const productId = newProduct.id || newProduct._id || newProduct.uuid;

            if (!productId) {
              messageApi.destroy();
              messageApi.error(`Failed to create product: ${item.product_name}`);
              setLoading(false);
              return;
            }

            // Update the item with real product data
            itemsRaw[i] = {
              ...itemsRaw[i],
              _isNew: false,
              product_id: String(productId),
              product_code: newProduct.product_code || productData.product_code,
            };
          }
        }

        messageApi.destroy();
        messageApi.success(`${newProductRows.length} new product(s) created!`);

        // Update form with new product IDs
        form.setFieldsValue({ items: itemsRaw });
      }

      for (const it of itemsRaw) {
        if (!it.product_id) {
          messageApi.error("One or more items are missing product_id. Remove and re-add them.");
          console.error("Invalid item (missing product_id):", it);
          setLoading(false);
          return;
        }
      }

      // Build items using backend field names: discount_amount, tax_amount, total_price
      const items = itemsRaw.map((i) => {
        // ensure computed fields exist
        const item = updateItemCalculations({ ...i });
        return {
          product_id: String(item.product_id),
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          unit: item.unit || "",
          discount_amount: Number(item.discount_amount || 0),
          tax_amount: Number(item.tax_amount || 0),
          total_price: Number(item.total_price || (item.quantity * item.unit_price + item.tax_amount - item.discount_amount) || 0),
        };
      });

      // Summaries
      const subtotal = items.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
      const discount_amount = items.reduce((s, it) => s + (it.discount_amount || 0), 0) + billDiscountAmt;
      const tax_amount = items.reduce((s, it) => s + (it.tax_amount || 0), 0);
      const totalQuantity = items.reduce((s, it) => s + (it.quantity || 0), 0);

      // Calculate coupon discount
      let coupon_discount = 0;
      let coupon_code_used = null;
      if (couponApplied && couponData && couponData.discount_amount) {
        coupon_discount = couponData.discount_amount;
        coupon_code_used = couponCode.toUpperCase();
      }

      const totalAmount = Math.max(0, subtotal - discount_amount + tax_amount - coupon_discount);

      // bill_no is optional — server generates billing_no; keep client-side id in bill_no if provided
      const bill_no = values.bill_no || `BILL-${Date.now()}`;

      // Build final payload that matches backend.createBillingWithItems
      const payload = {
        // server will create billing_no; sending bill_no is harmless if you want to keep client id
        bill_no,
        branch_id: selectedBranch?.id, // Add branch_id
        status: "paid",
        customer_name: values.customer_name || "",
        customer_phone: values.customer_phone || "",
        source: values.source || null,
        billing_date: values.billing_date ? dayjs(values.billing_date).toISOString() : new Date().toISOString(),
        counter_no: values.counter_no || null,
        discount_amount,
        tax_amount,
        coupon_discount, // Add coupon discount
        coupon_code: coupon_code_used, // Add coupon code
        total_amount: totalAmount,
        paid_amount: totalAmount, // Always equal to total — bill is fully paid on submit
        payment_method: isSplitPayment ? "split" : (values.payment_method || "cash"),
        payment_details: isSplitPayment ? splitPayments : null,
        notes: values.remarks || "",
        total_quantity: totalQuantity,
        is_active: true,
        billing_items: items, // Changed from 'items' to 'billing_items' to match backend schema
      };

      // Validate branch_id
      if (!payload.branch_id) {
        messageApi.error("Please select a branch");
        setLoading(false);
        return;
      }

      console.log("Billing payload ->", payload);

      if (!Array.isArray(payload.billing_items) || payload.billing_items.length === 0) {
        messageApi.error("No billing items detected. Please add items to the bill.");
        setLoading(false);
        return;
      }

      let response;
      if (id) {
        response = await billingService.update(id, payload);
        messageApi.success("Billing updated successfully" + (couponApplied ? " with coupon applied!" : ""));
      } else {
        response = await billingService.create(payload);
        messageApi.success("Billing created successfully" + (couponApplied ? " with coupon applied!" : ""));
      }

      const result = response.data || response;

      if (!id && result.coupon_generated) {
        setGeneratedCoupon(result.coupon_generated);
        setShowCouponModal(true);
        // Store result so print modal can use it after coupon modal closes
        setSavedBillingResult(result);
        setSavedItemsRaw(itemsRaw);
      } else {
        setSavedBillingResult(result);
        setSavedItemsRaw(itemsRaw);
        setPrintConfirmModal(true);
      }
    } catch (err) {
      console.error("create billing error:", err);
      console.error("error response:", err.response?.data);

      let errorMessage = "Failed to create billing";

      if (err.response?.data) {
        const errorData = err.response.data;

        // Handle different error formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Validation errors
          errorMessage = errorData.errors.map(e => e.message || e).join(', ');
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeCurrentTab = () => {
    // If multiple tabs, remove current.
    if (bills.length > 1) {
      removeTab(activeBillKey);
    } else {
      // Only one tab, reset it to new state
      // We reuse the same key '1' or activeKey
      const newBill = createNewBillState(activeBillKey);
      setBills([newBill]);
      loadBillToForm(newBill);
    }
  };

  const handleReset = () => {
    // Save to Draft: Preserve current bill and create a new tab
    if (bills.length >= 10) {
      message.warning("Maximum 10 bills allowed");
      return;
    }

    // Save current bill state
    const currentSaved = saveCurrentBillState();
    const updatedBills = bills.map(b => b.key === activeBillKey ? { ...b, ...currentSaved } : b);

    // Create new bill tab
    const newKey = (parseInt(updatedBills[updatedBills.length - 1].key) + 1).toString();
    const newBill = createNewBillState(newKey);

    const nextBills = [...updatedBills, newBill];
    setBills(nextBills);
    setActiveBillKey(newKey);
    loadBillToForm(newBill);

    message.success("Bill saved to draft. New bill ready!");
  };

  // table columns (editable)
  const columns = [
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "code",
      render: (text, record) => record._isNew ? <Tag color="blue">NEW</Tag> : text
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "name",
      render: (text, record, idx) => record._isNew ? (
        <Input
          placeholder="Enter product name"
          value={text}
          onChange={(e) => handleItemChange(idx, "product_name", e.target.value)}
          style={{ width: '100%' }}
        />
      ) : text
    },
    {
      title: "Qty",
      key: "qty",
      render: (_, record, idx) => (
        <InputNumber min={1} value={record.quantity} onChange={(v) => handleItemChange(idx, "quantity", v || 0)} />
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "price",
      render: (v, record, idx) => record._isNew ? (
        <InputNumber
          placeholder="Price"
          min={0}
          value={v}
          onChange={(val) => handleItemChange(idx, "unit_price", val || 0)}
          style={{ width: '100%' }}
          prefix="₹"
        />
      ) : `₹${(Number(v) || 0).toFixed(2)}`
    },
    {
      title: "Discount",
      key: "disc",
      render: (_, record, idx) => (
        <InputNumber min={0} value={record.discount_amount} onChange={(v) => handleItemChange(idx, "discount_amount", v || 0)} />
      ),
    },
    { title: "Tax", dataIndex: "tax_amount", key: "tax", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Total", dataIndex: "total_price", key: "total", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    {
      title: "Action",
      key: "actions",
      render: (_, __, idx) => (
        <Button danger size="small" type="text" icon={<DeleteOutlined />} onClick={() => removeItem(idx)} />
      ),
    },
  ];

  // preview (read-only)
  const previewColumns = [
    { title: "#", dataIndex: "_idx", key: "idx", render: (_, __, idx) => idx + 1 },
    { title: "Product", dataIndex: "product_name", key: "pname" },
    { title: "Qty", dataIndex: "quantity", key: "pq" },
    { title: "Unit", dataIndex: "unit_price", key: "pu", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Tax", dataIndex: "tax_amount", key: "pt", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Total", dataIndex: "total_price", key: "ptotal", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
  ];

  const summary = calculateSummaryFromItems(preview.items || [], couponApplied ? couponData : null);

  const styles = {
    page: { background: "#f1f6fb", minHeight: "100vh", padding: 10 },
    container: { maxWidth: 1200, margin: "0 auto" },
    mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 },
    leftCard: { background: "#fff", borderRadius: 8, padding: 12 },
    rightCard: { background: "#fff", borderRadius: 8, padding: 12, height: "fit-content", position: "sticky", top: 24 },
    sectionTitle: { color: "#0b75ff", fontWeight: 600, borderRadius: 8, },
  };

  const renderHistoryExpandedRow = (record) => {
    // Show products for this specific billing
    if (!record.items || record.items.length === 0) {
      return <div style={{ padding: 16, color: "#999" }}>No items found</div>;
    }

    return (
      <div style={{ background: "#fafafa", padding: 16, borderRadius: 6 }}>
        <Title level={5} style={{ marginBottom: 12 }}>Products in this Bill</Title>
        <Table
          size="small"
          pagination={false}
          dataSource={record.items}
          rowKey={(r) => r.id}
          columns={[
            { title: "Product Name", dataIndex: "product_name" },
            { title: "Product Code", dataIndex: "product_code" },
            { title: "Quantity", dataIndex: "quantity" },
            {
              title: "Unit Price",
              dataIndex: "unit_price",
              render: (v) => `₹${Number(v).toFixed(2)}`,
            },
            {
              title: "Discount",
              dataIndex: "discount_amount",
              render: (v) => v ? `₹${Number(v).toFixed(2)}` : '-',
            },
            {
              title: "Tax",
              dataIndex: "tax_amount",
              render: (v) => v ? `₹${Number(v).toFixed(2)}` : '-',
            },
            {
              title: "Total",
              dataIndex: "total_price",
              render: (v) => `₹${Number(v).toFixed(2)}`,
            },
          ]}
        />
      </div>
    );
  };
  return (
    <>
      {contextHolder}
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Bill Tabs */}
          <Tabs
            type="editable-card"
            activeKey={activeBillKey}
            onChange={handleTabChange}
            onEdit={handleEditTabs}
            items={bills.map(b => ({ label: b.label, key: b.key, closable: bills.length > 1 }))}
            style={{ marginBottom: 0 }}
          />
          <Spin spinning={loading}>
            <Form
              form={form}
              className="form"
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ status: "pending", items: [] }}
              onValuesChange={onValuesChange}
            >
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <div style={styles.leftCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={styles.sectionTitle}>Billing Details</div>
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Bill no" name="bill_no">
                          <Input disabled placeholder="Auto Generates" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Billing Date" name="billing_date" rules={[{ required: true, message: "Select billing date" }]}>
                          <DatePicker style={{ width: "100%" }} disabled />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="Customer Phone"
                          name="customer_phone"
                          rules={[
                            { required: true, message: "Enter phone number" },
                            { pattern: /^[0-9]{10}$/, message: "Enter valid 10-digit number" }
                          ]}
                        >
                          <Input
                            placeholder="Enter 10-digit phone number"
                            maxLength={10}
                            onChange={(e) => {
                              const phone = e.target.value;
                              if (phone.length === 10) {
                                handleCustomerLookup(phone);
                              } else {
                                setCustomerData(null);
                                setIsNewCustomer(false);
                              }
                            }}
                            suffix={
                              customerLoading ? (
                                <Spin size="small" />
                              ) : customerData ? (
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              ) : isNewCustomer ? (
                                <Tag color="blue">New</Tag>
                              ) : null
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Customer Name"
                          name="customer_name"
                          rules={[{ required: true, message: "Enter customer name" }]}
                        >
                          <Input
                            placeholder={isNewCustomer ? "Enter new customer name" : "Enter customer name"}
                            disabled={customerLoading}
                            style={{ textTransform: "capitalize" }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Source" name="source">
                          <Select placeholder="Select source">
                            <Option value="Existing Customer">Existing Customer</Option>
                            <Option value="Walk-in">Walk-in</Option>
                            <Option value="Instagram">Instagram</Option>
                            <Option value="Google Search">Google Search</Option>
                            <Option value="Google Review">Google Review</Option>
                            <Option value="Friend Ref">Friend Ref</Option>
                            <Option value="Ads">Ads</Option>
                            <Option value="Other">Other</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Customer Info Card */}
                    {/* {customerData && (
                  <Card
                    size="small"
                    style={{ marginBottom: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}
                    title={
                      <Space>
                        <CheckCircleOutlined style={{ color: '#1890ff' }} />
                        <span>Existing Customer - {customerData.customer?.name || customerData.name}</span>
                      </Space>
                    }
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Total Purchases</div>
                        <div style={{ fontWeight: 600 }}>
                          {customerData.statistics?.total_purchases || 0} orders
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Total Spent</div>
                        <div style={{ fontWeight: 600 }}>
                          ₹{Number(customerData.statistics?.total_amount || 0).toFixed(2)}
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Avg Purchase</div>
                        <div style={{ fontWeight: 600 }}>
                          ₹{Number(customerData.statistics?.average_purchase_value || 0).toFixed(2)}
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Loyalty Points</div>
                        <div style={{ fontWeight: 600, color: '#52c41a' }}>
                          🏆 {customerData.totalPoints || 0}
                        </div>
                      </Col>
                    </Row>

                    {customerData.statistics?.last_purchase && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          Last Purchase:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span>{dayjs(customerData.statistics.last_purchase.date).format('DD MMM YYYY')}</span>
                          <span><strong>{customerData.statistics.last_purchase.billing_no}</strong></span>
                          <span style={{ fontWeight: 600 }}>₹{customerData.statistics.last_purchase.amount}</span>
                        </div>
                      </div>
                    )}

                    {customerData.top_products && customerData.top_products.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Favorite Products:
                        </div>
                        <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                          {customerData.top_products.slice(0, 3).map((product, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 0',
                              fontSize: 12
                            }}>
                              <span>{product.product_name} ({product.product_code})</span>
                              <span style={{ fontWeight: 600 }}>×{product.total_quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerData.recent_purchases && customerData.recent_purchases.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Recent Purchases:
                        </div>
                        <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                          {customerData.recent_purchases.slice(0, 3).map((bill, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 0',
                              fontSize: 12
                            }}>
                              <span>{dayjs(bill.billing_date).format('DD/MM/YYYY')}</span>
                              <span>{bill.billing_no}</span>
                              <span style={{ fontWeight: 600 }}>₹{bill.total_amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerData.coupons && customerData.coupons.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Available Coupons: 🎁 {customerData.coupons.filter(c => !c.is_used && c.is_active).length}
                        </div>
                      </div>
                    )}
                  </Card>
                )} */}

                    {isNewCustomer && (
                      <Alert
                        message="New Customer"
                        description="This is a new customer. Please enter their name above."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Counter No" name="counter_no" placeholder="Select Counter">
                          <Select>
                            <Option value="Counter 1">Counter 1</Option>
                            <Option value="Counter 2">Counter 2</Option>
                            <Option value="Counter 3">Counter 3</Option>
                            <Option value="Counter 4">Counter 4</Option>
                            <Option value="Counter 5">Counter 5</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Payment Method" name="payment_method">
                          {!isSplitPayment ? (
                            <Select onChange={(value) => {
                              if (value === 'split') {
                                setIsSplitPayment(true);
                              }
                            }}>
                              <Option value="cash">Cash</Option>
                              <Option value="credit_card">Credit Card</Option>
                              <Option value="debit_card">Debit Card</Option>
                              <Option value="UPI Current Account">UPI Current Account</Option>
                              <Option value="UPI Normal Account">UPI</Option>
                              <Option value="net_banking">Net Banking(Bank Transfer)</Option>
                              <Option value="split">Split Payment</Option>
                              <Option value="hold">Hold</Option>
                            </Select>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>Split Payment Active</span>
                              <Button size="small" type="link" onClick={() => setIsSplitPayment(false)}>Cancel</Button>
                            </div>
                          )}
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Split Payment Section */}
                    {isSplitPayment && (
                      <Card
                        size="small"
                        title="Split Payment Details"
                        style={{ marginBottom: 16, background: '#fff7e6', border: '1px solid #ffd591' }}
                        extra={
                          <Button
                            type="dashed"
                            size="small"
                            onClick={addSplitPayment}
                          >
                            + Add Payment
                          </Button>
                        }
                      >
                        {splitPayments.map((payment, index) => (
                          <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
                            <Col span={10}>
                              <Select
                                value={payment.method}
                                onChange={(value) => updateSplitPayment(index, 'method', value)}
                                style={{ width: '100%' }}
                              >
                                <Option value="cash">Cash</Option>
                                <Option value="credit_card">Credit Card</Option>
                                <Option value="debit_card">Debit Card</Option>
                                <Option value="UPI Current Account">UPI Current</Option>
                                <Option value="UPI Normal Account">UPI Normal</Option>
                                <Option value="net_banking">Net Banking</Option>
                              </Select>
                            </Col>
                            <Col span={10}>
                              <InputNumber
                                value={payment.amount}
                                onChange={(value) => updateSplitPayment(index, 'amount', value)}
                                placeholder="Amount"
                                min={0}
                                style={{ width: '100%' }}
                                prefix="₹"
                              />
                            </Col>
                            <Col span={4}>
                              {splitPayments.length > 1 && (
                                <Button
                                  danger
                                  size="icon"
                                  onClick={() => removeSplitPayment(index)}
                                  icon={<Trash2 size={16} />}
                                  style={{ border: 'none', background: 'none', boxShadow: "none" }}
                                >
                                </Button>
                              )}
                            </Col>
                          </Row>
                        ))}
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>Total Split Amount:</span>
                          <span style={{ color: getTotalSplitAmount() === summary.grandTotal ? '#52c41a' : '#ff4d4f' }}>
                            ₹{getTotalSplitAmount().toFixed(2)} / ₹{summary.grandTotal.toFixed(2)}
                          </span>
                        </div>
                        {getTotalSplitAmount() !== summary.grandTotal && (
                          <Alert
                            message="Split payment total must equal the bill total"
                            type="warning"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </Card>
                    )}

                    {/* Coupon Section - Always show */}
                    {/* <Card
                  size="small"
                  title={
                    <Space>
                      <GiftOutlined style={{ color: '#52c41a' }} />
                      <span>Apply Coupon Code</span>
                    </Space>
                  }
                  style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}
                >
                  {!couponApplied ? (
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder="Enter coupon code (e.g., REFABC1234)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        maxLength={10}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <Button
                        type="primary"
                        onClick={handleValidateCoupon}
                        loading={couponValidating}
                      >
                        Apply
                      </Button>
                    </Space.Compact>
                  ) : (
                    <Alert
                      message="Coupon Applied Successfully!"
                      description={
                        <div>
                          <div><strong>Code:</strong> {couponCode}</div>
                          <div><strong>Discount:</strong> ₹{couponData?.discount?.discountAmount?.toFixed(2)}</div>
                          <div><strong>Owner Reward:</strong> {couponData?.discount?.ownerRewardPoints} points</div>
                          <div><strong>Your Reward:</strong> {couponData?.discount?.userRewardPoints} points</div>
                        </div>
                      }
                      type="success"
                      icon={<CheckCircleOutlined />}
                      showIcon
                      action={
                        <Button size="small" danger onClick={handleRemoveCoupon}>
                          Remove
                        </Button>
                      }
                    />
                  )}

                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    💡 Tip: Earn coupons by making purchases of ₹2000 or more!
                  </div>
                </Card> */}
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Select Product">
                          <Space.Compact style={{ width: '100%' }}>
                            <Select
                              showSearch
                              placeholder="Search and select product"
                              value={selectedProduct}
                              onChange={handleProductSelect}
                              onSearch={(value) => {
                                if (value.length >= 2) {
                                  fetchAllProducts(value);
                                } else if (value.length === 0) {
                                  fetchAllProducts();
                                }
                              }}
                              loading={productsLoading}
                              filterOption={false}
                              notFoundContent={productsLoading ? <Spin size="small" /> : "No products found"}
                              style={{ width: "100%" }}
                            >
                              {allProducts.map((product) => (
                                <Option key={product.id} value={product.id}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>
                                      {product.product_name} ({product.product_code})
                                    </span>
                                    <span style={{ color: "#52c41a", fontWeight: 600 }}>
                                      ₹{product.selling_price}
                                    </span>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setQuickAddModalVisible(true)}
                              title="Quick Add New Product"
                            >
                              New
                            </Button>
                          </Space.Compact>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Apply Coupon">
                          {!couponApplied ? (
                            <>
                              <Space.Compact style={{ width: "100%" }}>
                                <Input
                                  placeholder="Enter coupon code"
                                  value={couponCode}
                                  maxLength={10}
                                  onChange={(e) => {
                                    setCouponCode(e.target.value.toUpperCase());
                                    setCouponError(""); // Clear error when user types
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleValidateCoupon();
                                    }
                                  }}
                                  style={{ textTransform: "uppercase" }}
                                  status={couponError ? "error" : ""}
                                />
                                <Button
                                  type="primary"
                                  loading={couponValidating}
                                  onClick={handleValidateCoupon}
                                >
                                  Apply
                                </Button>
                              </Space.Compact>
                              {couponError && (
                                <Alert
                                  message={couponError}
                                  type="error"
                                  showIcon
                                  style={{ marginTop: "8px", fontSize: "12px" }}
                                  closable
                                  onClose={() => setCouponError("")}
                                />
                              )}
                            </>
                          ) : (
                            <div
                              style={{
                                background: "#f6ffed",
                                border: "1px solid #b7eb8f",
                                borderRadius: "6px",
                                padding: "0px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <CheckCircleOutlined
                                style={{ color: "#52c41a", fontSize: "16px" }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: "#52c41a", marginBottom: "2px" }}>
                                  Coupon Applied! <Tag style={{ marginLeft: "6px" }} color="warning">{couponCode}</Tag>
                                </div>
                              </div>
                              <Button
                                danger
                                type="text"
                                icon={<Trash2 size={16} />}
                                onClick={handleRemoveCoupon}
                                style={{ padding: "0px 8px" }}
                              />
                            </div>
                          )}
                        </Form.Item>
                      </Col>
                    </Row>



                    {/* Items table (editable) */}
                    <Tabs
                      activeKey={activeTab}
                      onChange={(key) => {
                        setActiveTab(key);
                        if (key === "history") {
                          fetchCustomerBills();
                        }
                      }}
                      items={[
                        {
                          key: "new",
                          label: "New Bill",
                          children: (
                            <Form.List name="items">
                              {() => {
                                const items = form.getFieldValue("items") || [];
                                return (
                                  <>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                                        Bill Items ({items.length})
                                      </div>
                                      <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        onClick={handleAddEmptyRow}
                                        size="small"
                                      >
                                        Add New Product
                                      </Button>
                                    </div>
                                    <Table
                                      dataSource={items}
                                      columns={columns}
                                      pagination={false}
                                      rowKey={(r, idx) => r._tempId || idx}
                                      size="small"
                                      scroll={{ x: 600 }}
                                      className="billingItemsTable"
                                      style={{ marginBottom: 8 }}
                                    />

                                    <div style={{ display: "flex", justifyContent: "right", marginTop: 10 }}>
                                      <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
                                          <div style={{ color: "#374151" }}>Subtotal</div>
                                          <div style={{ fontWeight: 700, color: "#222" }}>₹{summary.subtotal.toFixed(2)}</div>
                                        </div>
                                      </div>
                                    </div>

                                    <Divider />
                                  </>
                                );
                              }}
                            </Form.List>
                          ),
                        },
                        ...(customerData
                          ? [
                            {
                              key: "history",
                              label: "History",
                              children: (
                                <Spin spinning={historyLoading}>
                                  <Table
                                    dataSource={customerHistoryBills}
                                    columns={historyColumns}
                                    rowKey={(record) => record.billing_no}
                                    pagination={{ pageSize: 5 }}
                                    locale={{ emptyText: "No previous bills found" }}
                                    size="small"
                                    expandable={{
                                      expandedRowRender: renderHistoryExpandedRow,
                                      rowExpandable: () => true,
                                    }}
                                  />
                                </Spin>
                              ),
                            },
                          ]
                          : []),
                      ]}
                    />
                  </div>
                </Col>
                <Col xs={24} lg={8}>
                  {/* RIGHT: live preview */}
                  <div style={styles.rightCard}>
                    <Title level={5} style={{ marginBottom: 6 }}>
                      Bill Preview
                    </Title>

                    <style>{`
                  .invoiceHeader{background: gray; padding:12px; border-radius:6px; color:#fff}
                  .invoiceHeader .company{font-weight:800; font-size:16px}
                  .invoiceHeader .meta{font-size:12px; opacity:0.95}
                  .previewTable .ant-table-thead > tr > th{background:transparent; color:#0b75ff}
                  .previewTable .even-row{background:rgba(11,117,255,0.04)}
                  .previewTotals{background:#ffffff; padding:12px; border-radius:8px; box-shadow:0 6px 18px rgba(11,117,255,0.06)}
                  .badge{display:inline-block; padding:4px 8px; border-radius:999px; font-weight:700}
                  .badge-paid{background:#bbf7d0; color:#065f46}
                  .badge-pending{background:#fee2e2; color:#991b1b}
                  .billingItemsTable .ant-table-thead > tr > th{font-size:12px; padding:8px 4px;}
                  .billingItemsTable .ant-table-tbody > tr > td{font-size:12px; padding:8px 4px;}
                  .billingItemsTable .ant-input-number{font-size:12px;}
                  .billingItemsTable .ant-input-number-input{font-size:12px; padding:2px 6px;}
                `}</style>

                    <div className="invoiceHeader">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div className="company">{currentBranchDetails?.name || currentBranchDetails?.branch_name || "Atelier Tech"}</div>
                          <div className="meta">{currentBranchDetails?.address || "Address Not Available"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700 }}>{preview.billing_date ? dayjs(preview.billing_date).format("DD MMM YYYY") : "-"}</div>
                          <div style={{ fontSize: 12 }}>{preview.customer_name || "-"}</div>
                          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: "4px" }}><PhoneCall size={12} /> {preview.customer_phone || preview.customer_phone_nu || "-"}</div>
                          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: "4px" }}> <Laptop size={12} /> {preview.counter_no || preview.couner || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <Table
                        className="previewTable"
                        dataSource={(preview.items || []).map((it, i) => ({ ...it, key: i }))}
                        columns={previewColumns}
                        pagination={false}
                        size="small"
                        rowClassName={(record, idx) => (idx % 2 === 0 ? "even-row" : "")}
                        style={{ marginBottom: 8, borderRadius: 6, overflow: "hidden" }}
                      />

                      <div className="previewTotals" style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ color: "#374151" }}>Subtotal</div>
                          <div>₹{summary.subtotal.toFixed(2)}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div>Tax</div>
                          <div>₹{summary.totalTax.toFixed(2)}</div>
                        </div>
                        {summary.totalDiscount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ color: "#6b7280" }}>Item Discounts</div>
                            <div style={{ color: "#ef4444" }}>-₹{summary.totalDiscount.toFixed(2)}</div>
                          </div>
                        )}

                        {/* ── Bill-level discount ── */}
                        <div style={{ marginBottom: 8, padding: "8px 10px", background: "#fef9f0", border: "1px solid #fde68a", borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 6 }}>Bill Discount</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <InputNumber
                              size="small"
                              min={0}
                              max={100}
                              precision={2}
                              value={billDiscountPct || null}
                              onChange={handleBillDiscountPct}
                              addonAfter="%"
                              style={{ flex: 1 }}
                              placeholder="0"
                            />
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>↔</span>
                            <InputNumber
                              size="small"
                              min={0}
                              precision={2}
                              value={billDiscountAmt || null}
                              onChange={handleBillDiscountAmt}
                              prefix="₹"
                              style={{ flex: 1 }}
                              placeholder="0"
                            />
                          </div>
                          {billDiscountAmt > 0 && (
                            <div style={{ fontSize: 11, color: "#d97706", marginTop: 4 }}>
                              Saving ₹{billDiscountAmt.toFixed(2)} ({billDiscountPct.toFixed(1)}% off)
                            </div>
                          )}
                        </div>

                        {couponApplied && summary.couponDiscount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ color: "#52c41a", fontWeight: 600 }}>
                              <GiftOutlined /> Coupon Discount
                            </div>
                            <div style={{ color: "#52c41a", fontWeight: 600 }}>
                              -₹{summary.couponDiscount.toFixed(2)}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 8 }}>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>Total Amount</div>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>₹{summary.grandTotal.toFixed(2)}</div>
                        </div>

                        <Divider style={{ margin: "12px 0" }} />
                        <BalanceCalculator
                          grandTotal={summary.grandTotal}
                          receivedAmount={receivedAmount}
                          onReceivedAmountChange={setReceivedAmount}
                        />

                        {couponApplied && (
                          <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
                            Coupon code <Tag color="success">{couponCode}</Tag> is Applied <Button
                              danger
                              type="text"
                              icon={<Trash2 size={16} />}
                              onClick={handleRemoveCoupon}
                              style={{ padding: "0px 8px" }}
                            />
                            <div style={{ marginTop: 4, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Gift color="red" size={16} /> Discount: ₹{couponData?.discount_amount?.toFixed(2)}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "right", marginTop: 10, alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button onClick={handleReset}><ShieldCheck size={16} />Save To Draft</Button>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={loading}
                              disabled={loading}
                              style={{ background: "#09b13bff", borderColor: "#09b13bff" }}
                            >
                              Add Bill
                            </Button>
                            {/* <Button type="primary" htmlType="submit" style={{ background: "#0b75ff", borderColor: "#0b75ff" }}>
                          <Printer size={16} /> Print
                        </Button> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              <div style={{ height: 18 }} />
            </Form>
          </Spin>
        </div >

        {/* ── Print Confirmation Modal ── */}
        <Modal
          open={printConfirmModal}
          onCancel={() => { setPrintConfirmModal(false); closeCurrentTab(); }}
          afterOpenChange={(open) => { if (open && printYesRef.current) printYesRef.current.focus(); }}
          footer={null}
          width={380}
          centered
          closable={false}
        >
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
              Bill Saved Successfully!
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              Do you want to print the thermal receipt?
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => { setPrintConfirmModal(false); closeCurrentTab(); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                No, Skip
              </button>
              <button
                ref={printYesRef}
                onClick={async () => {
                  setPrintConfirmModal(false);
                  try {
                    await printBillSilently(savedBillingResult, savedItemsRaw);
                    messageApi.success("Thermal receipt printed");
                  } catch (err) {
                    messageApi.error("Print failed: " + err.message);
                  } finally {
                    closeCurrentTab();
                  }
                }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#1e3a8a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                Yes, Print
              </button>
            </div>
          </div>
        </Modal>

        {/* Success Modal for Generated Coupon */}
        < Modal
          open={showCouponModal}
          onCancel={() => {
            setShowCouponModal(false);
            setSavedBillingResult(savedBillingResult);
            setSavedItemsRaw(savedItemsRaw);
            setPrintConfirmModal(true);
          }}
          footer={
            [
              <Button
                key="print-again"
                onClick={async () => {
                  if (!billToPrint) return;
                  try {
                    const printerName = localStorage.getItem("thermalPrinterName") || "";
                    await localPrintService.printReceiptLocally(billToPrint, printerName);
                    messageApi.success("Thermal receipt printed");
                  } catch (error) {
                    messageApi.error(`Thermal print failed: ${error.message}`);
                  }
                }}
              >
                Print Again
              </Button>,
              <Button
                key="done"
                type="primary"
                onClick={() => {
                  setShowCouponModal(false);
                  setPrintConfirmModal(true);
                }}
              >
                Done & Print?
              </Button>,
            ]}
          width={500}
          centered
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <GiftOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 16 }} />
            <Title level={3} style={{ marginBottom: 8 }}>
              Congratulations! 🎉
            </Title>
            <Title level={5} style={{ color: "#666", fontWeight: "normal", marginBottom: 24 }}>
              A referral coupon has been generated for this purchase!
            </Title>

            {generatedCoupon && (
              <Card
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ color: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                    COUPON CODE
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: "bold",
                      letterSpacing: 4,
                      marginBottom: 16,
                      fontFamily: "monospace",
                    }}
                  >
                    {generatedCoupon.code}
                  </div>
                  <Divider style={{ borderColor: "rgba(255,255,255,0.3)", margin: "16px 0" }} />
                  <Row gutter={16} style={{ textAlign: "left" }}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Valid From</div>
                      <div style={{ fontSize: 14, fontWeight: "bold" }}>
                        {dayjs(generatedCoupon.valid_from).format("DD MMM YYYY")}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Valid Until</div>
                      <div style={{ fontSize: 14, fontWeight: "bold" }}>
                        {dayjs(generatedCoupon.valid_until).format("DD MMM YYYY")}
                      </div>
                    </Col>
                  </Row>
                  <Divider style={{ borderColor: "rgba(255,255,255,0.3)", margin: "16px 0" }} />
                  <div style={{ fontSize: 16, fontWeight: "bold" }}>
                    {generatedCoupon.discount}
                  </div>
                </div>
              </Card>
            )}

            <Alert
              message={generatedCoupon?.message || "Share this code with friends!"}
              type="info"
              showIcon
              style={{ textAlign: "left" }}
            />
          </div>
        </Modal >

        {/* Quick Add Product Modal */}
        <Modal
          title="Quick Add New Product"
          open={quickAddModalVisible}
          onCancel={() => {
            setQuickAddModalVisible(false);
            quickAddForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={quickAddForm}
            layout="vertical"
            onFinish={handleQuickAddProduct}
          >
            <Form.Item
              name="product_name"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input
                placeholder="e.g., Blue Cotton Dress"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="unit_price"
              label="Unit Price (₹)"
              rules={[
                { required: true, message: 'Please enter unit price' },
                { type: 'number', min: 0, message: 'Price must be positive' }
              ]}
            >
              <InputNumber
                placeholder="e.g., 500"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="unit"
              label="Unit"
              initialValue="piece"
            >
              <Select>
                <Option value="piece">Piece</Option>
                <Option value="kg">Kilogram (kg)</Option>
                <Option value="gram">Gram (g)</Option>
                <Option value="liter">Liter (L)</Option>
                <Option value="meter">Meter (m)</Option>
                <Option value="box">Box</Option>
                <Option value="pack">Pack</Option>
              </Select>
            </Form.Item>

            <Alert
              message="Quick Add"
              description="This will create a basic product with auto-generated code. You can edit full details later in Products section."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setQuickAddModalVisible(false);
                  quickAddForm.resetFields();
                }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={quickAddLoading}
                >
                  Add & Use in Bill
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div >
    </>
  );
}

export default BillingForm;

