import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, Trash2, X, ArrowLeft, User, Phone, ChevronDown, MessageCircle } from "lucide-react";
import { message } from "antd";
import productService from "../../Product/services/productService.js";
import customerService from "../../customer/service/customerService.js";
import billingService from "../service/billingService.js";
import dayjs from "dayjs";

const fmt = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v || 0);

// Product type colors adapted for a Sweet Shop / Cafe
const typeColor = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("sweet")) return "bg-pink-100 text-pink-700";
    if (t.includes("snack")) return "bg-orange-100 text-orange-700";
    if (t.includes("tea") || t.includes("coffee")) return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
};
const getStockImage = (categoryName, productName) => {
    const cat = (categoryName || "").toLowerCase();
    const prod = (productName || "").toLowerCase();

    if (prod.includes("milk")) {
        return "https://organicmandya.com/cdn/shop/articles/generated-image38.jpg?v=1782296041&width=1600";
    }
    if (cat.includes("beverage") || prod.includes("coffee") || prod.includes("tea")) {
        return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&auto=format&fit=crop&q=60";
    }
    if (cat.includes("bakery") || prod.includes("bread") || prod.includes("bun") || prod.includes("cake")) {
        return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=60";
    }
    if (prod.includes("mixture")) {
        return "https://floristchennai.com/cdn/shop/files/Bombay_mixture.jpg?v=1723985189";
    }
    if (cat.includes("snack") || prod.includes("samosa") || prod.includes("chips")) {
        return "https://images.unsplash.com/photo-1599490659213-e2b9527ec087?w=120&auto=format&fit=crop&q=60";
    }
    if (cat.includes("sweet") || prod.includes("laddu") || prod.includes("halwa") || prod.includes("jalebi")) {
        return "https://images.unsplash.com/photo-1589119908995-c6800ffbc36b?w=120&auto=format&fit=crop&q=60";
    }
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60";
};

export default function POSPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const editId = searchParams.get("edit");
    const isEdit = Boolean(editId);
    const dropdownRef = useRef(null);

    // Items catalogue
    const [allItems, setAllItems] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [itemSearch, setItemSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Cart
    const [cart, setCart] = useState([]);

    // Patient / Customer
    const [customer, setCustomer] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    // Payment
    const [saving, setSaving] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [saleStatus, setSaleStatus] = useState("paid");
    const [paidAmount, setPaidAmount] = useState("");
    const [completedSale, setCompletedSale] = useState(null);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitCash, setSplitCash] = useState("");
    const [splitUPI, setSplitUPI] = useState("");

    // Load billable items catalogue
    useEffect(() => {
        setLoading(true);
        productService.getAll({ limit: 500 })
            .then(res => {
                const data = res?.data?.data || res?.data || [];
                setAllItems(Array.isArray(data) ? data : []);
            })
            .catch(() => message.error("Failed to load products"))
            .finally(() => setLoading(false));
    }, []);

    // If edit mode — load existing sale and prefill everything
    useEffect(() => {
        if (!editId) return;
        billingService.getById(editId)
            .then(res => {
                const sale = res?.data?.data ?? res?.data;
                if (!sale) return;
                setCustomerName(sale.customer_name || "");
                setCustomerPhone(sale.customer_phone || "");
                setNotes(sale.notes || "");
                setPaymentMethod(sale.payment_method || "cash");
                setSaleStatus(sale.status || "paid");
                // Prefill cart from sale items
                if (Array.isArray(sale.items)) {
                    setCart(sale.items.map(i => ({
                        id: i.product_id,
                        name: i.product_name,
                        type: i.category_name || "Item",
                        image_url: i.product?.image_url || i.image_url,
                        price: parseFloat(i.unit_price),
                        qty: i.quantity,
                        tax_rate: parseFloat(i.tax_percentage || 0),
                        _sale_item_id: i.id,
                    })));
                }
            })
            .catch(() => message.error("Failed to load bill"));
    }, [editId]);

    // Search customer suggestions as they type
    const handlePhoneChange = async (e) => {
        const val = e.target.value;
        setCustomerPhone(val);
        if (customer && customer.phone !== val) {
            setCustomer(null);
        }
        if (val.trim().length >= 2) {
            try {
                const res = await customerService.getAllCustomers({ search: val, limit: 5 });
                const rows = res?.data?.data ?? res?.data ?? [];
                const list = Array.isArray(rows) ? rows : rows?.data ?? [];
                setSuggestions(list);
            } catch {
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectCustomer = (cust) => {
        setCustomer(cust);
        setCustomerPhone(cust.customer_phone || cust.phone || "");
        setCustomerName(cust.customer_name || cust.name || `${cust.first_name || ""} ${cust.last_name || ""}`.trim());
        setSuggestions([]);
    };

    const clearCustomer = () => {
        setCustomer(null);
        setCustomerPhone("");
        setCustomerName("");
        setNotes("");
        setPaidAmount("");
    };

    // Cart ops
    const addToCart = (item) => {
        setCart(prev => {
            const exist = prev.find(p => p.id === item.id);
            if (exist) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
            const taxRate = parseFloat((item.tax_percentage || "0").toString().replace("%", "")) || 0;
            return [...prev, {
                id: item.id,
                name: item.product_name,
                price: parseFloat(item.selling_price || item.unit_price || 0),
                type: item.category_name || "Item",
                image_url: item.image_url,
                qty: 1,
                tax_rate: taxRate
            }];
        });
    };

    const updateQty = (id, delta) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
    const removeItem = (id) => setCart(prev => prev.filter(p => p.id !== id));

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = cart.reduce((s, i) => s + (i.price * i.qty) * (i.tax_rate / 100), 0);
    const total = subtotal + tax;

    const filteredItems = allItems.filter(item => {
        const matchTab = activeTab === "all" || (item.category_name || "").toLowerCase() === activeTab.toLowerCase();
        const matchSearch = (item.product_name || "").toLowerCase().includes(itemSearch.toLowerCase()) || (item.product_code || "").toLowerCase().includes(itemSearch.toLowerCase());
        return matchTab && matchSearch;
    });


    const handleCheckout = async (method, paymentDetails = null) => {
        if (cart.length === 0) { message.warning("Cart is empty"); return; }

        const paid = paidAmount.trim() !== "" ? parseFloat(paidAmount) : total;
        const due = Math.max(total - paid, 0);
        const change = paid > total ? paid - total : 0;
        const isPartial = paid > 0 && paid < total;
        const autoStatus = paid <= 0 ? "unpaid" : isPartial ? "partial" : "paid";

        setSaving(true);
        try {
            const payload = {
                customer_name: customerName || "Walk-in Customer",
                customer_phone: customerPhone.trim() !== "" ? customerPhone : "9999999999",
                type: "Casier Billing",
                counter_no: "Counter 1",
                billing_date: new Date().toISOString(),
                subtotal_amount: subtotal,
                tax_amount: tax,
                discount_amount: 0,
                total_amount: total,
                paid_amount: paid,
                due_amount: due,
                payment_method: method === "upi" ? "UPI Normal Account" : method === "card" ? "credit_card" : method,
                payment_details: paymentDetails,
                status: isEdit ? saleStatus : autoStatus,
                notes: notes || null,
                items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.qty,
                    unit_price: item.price,
                    discount_amount: 0,
                    tax_percentage: item.tax_rate,
                    tax_amount: (item.price * item.qty) * (item.tax_rate / 100),
                    total_price: (item.price * item.qty) * (1 + item.tax_rate / 100),
                })),
            };

            let result;
            if (isEdit) {
                result = await billingService.update(editId, payload);
                message.success("Sale updated!");
            } else {
                result = await billingService.create(payload);
                message.success("Sale completed!");
            }
            const sale = result?.data?.data ?? result?.data ?? result;
            setCart([]);
            clearCustomer();
            navigate(`/billing/customer-copy/${sale.id}?print=1`);
        } catch (err) {
            message.error(err?.response?.data?.message || err?.message || "Failed to save sale");
        } finally { setSaving(false); }
    };
    const handleSplitSubmit = () => {
        const cashAmt = parseFloat(splitCash) || 0;
        const upiAmt = parseFloat(splitUPI) || 0;

        const paymentDetails = [];
        if (cashAmt > 0) paymentDetails.push({ method: 'cash', amount: cashAmt });
        if (upiAmt > 0) paymentDetails.push({ method: 'UPI Normal Account', amount: upiAmt });

        handleCheckout('split', paymentDetails);
        setShowSplitModal(false);
    };

    return (
        <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden pos-page-font">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate("/billing/list")} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                    <ArrowLeft size={14} /> Back to Bills
                </button>
                <h1 className="text-lg font-bold text-[#0E1680]">
                    {isEdit ? "Edit Bill" : "Point of Sale"}
                </h1>
                <div className="w-24" />
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* LEFT — Customer + Cart */}
                <div className="w-full lg:w-[45%] bg-white border-r border-gray-200 flex flex-col overflow-hidden">

                    {/* Customer Details */}
                    <div className="px-4 pt-4 !pb-0 border-b border-gray-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Details</p>
                            {(customerName || customerPhone) && (
                                <button onClick={clearCustomer} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 relative">
                            <div className="relative">
                                <input
                                    value={customerPhone}
                                    onChange={handlePhoneChange}
                                    onBlur={() => setTimeout(() => setSuggestions([]), 250)}
                                    placeholder="Phone (optional)"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[60]">
                                        {suggestions.map(cust => (
                                            <div
                                                key={cust.id}
                                                onMouseDown={() => handleSelectCustomer(cust)}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between border-b border-gray-50 last:border-0"
                                            >
                                                <span className="font-semibold text-gray-800">{cust.customer_phone || cust.phone}</span>
                                                <span className="text-gray-500 truncate max-w-[120px]">
                                                    {cust.customer_name || cust.name || `${cust.first_name || ""} ${cust.last_name || ""}`.trim()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Name (Walk-in)"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                            />
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p className="text-lg font-semibold">Cart is empty</p>
                                <p className="text-sm">Select items from the right panel</p>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.id} className="border border-gray-200 rounded-xl p-2 flex items-center justify-between gap-3">
                                <img
                                    src={item.image_url || getStockImage(item.type, item.name)}
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 !mb-[0.2rem] text-sm truncate">{item.name}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeColor(item.type)}`}>{item.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#506EE4] hover:!text-white transition">-</button>
                                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#506EE4] hover:!text-white transition">+</button>
                                </div>
                                <div className="text-right shrink-0">
                                    {/* <p className="">{fmt(item.price * item.qty)}</p> */}
                                    <p className="font-bold text-sm text-gray-800 !mb-0">{item.qty} × {fmt(item.price)}</p>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="shrink-0 px-2 py-4 h-full "><Trash2 size={18} className="text-red-400 hover:text-white-600" /></button>
                            </div>
                        ))}
                    </div>

                    {/* Totals + Pay */}
                    <div className="p-4 border-t border-gray-200 bg-white space-y-3 shrink-0">
                        {/* Subtotal & Tax */}
                        <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                        <div className="flex justify-between text-sm text-gray-600"><span>Tax</span><span>{fmt(tax)}</span></div>

                        {/* Amount Received & Balance */}
                        <div className="border-t border-gray-100 pt-2 space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Amount Received</span>
                                <div className="relative w-36">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value)}
                                        placeholder={total.toFixed(2)}
                                        className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                                    />
                                </div>
                            </div>

                            {(() => {
                                const paid = paidAmount.trim() !== "" ? parseFloat(paidAmount) : total;
                                const change = paid > total ? paid - total : 0;
                                const due = Math.max(total - paid, 0);
                                return (
                                    <>
                                        {change > 0 && (
                                            <div className="flex justify-between text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 rounded-lg p-2">
                                                <span>Balance to Pay Back:</span>
                                                <span>{fmt(change)}</span>
                                            </div>
                                        )}
                                        {due > 0 && paidAmount.trim() !== "" && (
                                            <div className="flex justify-between text-xs text-yellow-600 font-semibold bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                                                <span>Pending Due:</span>
                                                <span>{fmt(due)}</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between text-lg font-bold text-gray-800 pt-1 border-t border-gray-100">
                            <span>Total</span>
                            <span>{fmt(total)}</span>
                        </div>


                        {/* Direct Pay Buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            {["cash", "split", "upi"].map(m => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        if (m === "split") {
                                            setSplitCash("");
                                            setSplitUPI("");
                                            setShowSplitModal(true);
                                        } else {
                                            handleCheckout(m);
                                        }
                                    }}
                                    disabled={saving}
                                    className={`py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-95 disabled:opacity-60 ${m === "cash"
                                        ? "bg-green-600 !text-white hover:bg-green-700 shadow-sm"
                                        : m === "split"
                                            ? "bg-blue-600 !text-white hover:bg-blue-700 shadow-sm"
                                            : "bg-purple-600 !text-white hover:bg-purple-700 shadow-sm"
                                        }`}
                                >
                                    {m === "cash" ? "Cash" : m === "split" ? "Split" : "UPI"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT — Items catalogue */}
                <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Search products..."
                            className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30" />
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                        {["all", "sweets", "snacks", "beverages", "bakery"].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1 rounded-lg text-sm !capitalize ${activeTab === tab ? "bg-[#506EE4] !text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400">Loading items...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No items found</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {filteredItems.map(item => {
                                    const inCart = cart.some(c => c.id === item.id);
                                    return (
                                        <div key={item.id} onClick={() => addToCart(item)}
                                            className={`border rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all duration-200 relative ${inCart
                                                    ? "bg-[#E6F7F0] border-[#10b981] shadow-[0_4px_12px_rgba(16,185,129,0.12)]"
                                                    : "bg-white border-gray-200 hover:border-[#10b981] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
                                                }`}
                                        >
                                            {/* Category tag */}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium absolute top-3 left-3 ${typeColor(item.category_name)}`}>
                                                {item.category_name || "Item"}
                                            </span>

                                            {/* Product Image Centered & Large Circular */}
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-[0_4px_8px_rgba(0,0,0,0.06)] flex items-center justify-center mt-4 mb-3 bg-gray-50 shrink-0">
                                                <img
                                                    src={item.image_url || getStockImage(item.category_name, item.product_name)}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Product Title & Info */}
                                            <div className="flex flex-col items-center w-full text-center">
                                                <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 !mb-0">
                                                    {item.product_name}
                                                </h3>
                                                <span className="font-bold text-sm text-[#10b981] mt-1">
                                                    {fmt(parseFloat(item.selling_price || item.unit_price))}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Split Payment Modal */}
            {showSplitModal && (() => {
                const totalCash = parseFloat(splitCash) || 0;
                const totalUPI = parseFloat(splitUPI) || 0;
                const splitTotal = totalCash + totalUPI;
                return (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white w-[400px] rounded-xl shadow-xl p-6 relative">
                            <button onClick={() => setShowSplitModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-black">
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-semibold mb-1 text-gray-800">Split Payment</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Total Bill Amount: <span className="font-bold text-gray-800">{fmt(total)}</span>
                            </p>

                            <div className="space-y-4">
                                {/* Cash Input */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash Amount</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={splitCash}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setSplitCash(val);
                                                const enteredCash = parseFloat(val) || 0;
                                                const remaining = Math.max(0, total - enteredCash);
                                                setSplitUPI(remaining > 0 ? remaining.toFixed(2) : "");
                                            }}
                                            placeholder="0.00"
                                            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                                        />
                                    </div>
                                </div>

                                {/* UPI Input */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">UPI Amount</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={splitUPI}
                                            onChange={e => setSplitUPI(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                                        />
                                    </div>
                                </div>

                                {/* Split Balance Status */}
                                <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Entered:</span>
                                        <span className="font-semibold">{fmt(splitTotal)}</span>
                                    </div>
                                    {Math.abs(splitTotal - total) > 0.01 && (
                                        <div className="flex justify-between text-red-500 font-semibold">
                                            <span>{splitTotal > total ? "Exceeded By:" : "Remaining Amount:"}</span>
                                            <span>{fmt(Math.abs(total - splitTotal))}</span>
                                        </div>
                                    )}
                                    {Math.abs(splitTotal - total) <= 0.01 && (
                                        <div className="text-green-600 font-semibold text-center pt-1">
                                            ✓ Total Matches Perfectly!
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowSplitModal(false)}
                                    className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSplitSubmit}
                                    disabled={saving || Math.abs(splitTotal - total) > 0.01}
                                    className="flex-1 bg-[#506EE4] !text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#3f56c2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm & Pay
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}
