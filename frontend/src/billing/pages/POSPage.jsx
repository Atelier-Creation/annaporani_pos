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
    const [phoneQuery, setPhoneQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");

    // Payment
    const [saving, setSaving] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [saleStatus, setSaleStatus] = useState("paid");
    const [paidAmount, setPaidAmount] = useState("");
    const [completedSale, setCompletedSale] = useState(null);

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
                        price: parseFloat(i.unit_price),
                        qty: i.quantity,
                        tax_rate: parseFloat(i.tax_percentage || 0),
                        _sale_item_id: i.id,
                    })));
                }
            })
            .catch(() => message.error("Failed to load bill"));
    }, [editId]);

    // Search customer by phone
    const handlePhoneSearch = async () => {
        if (!phoneQuery.trim()) return;
        setSearching(true);
        setCustomer(null); 
        try {
            const res = await customerService.getAllCustomers({ search: phoneQuery, limit: 5 });
            const rows = res?.data?.data ?? res?.data ?? [];
            const list = Array.isArray(rows) ? rows : rows?.data ?? [];
            if (list.length === 0) { message.warning("No customer found"); return; }
            const c = list[0];
            setCustomer(c);
            setCustomerName(c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim());
            setCustomerPhone(c.phone || phoneQuery);
        } catch { message.error("Failed to search customer"); }
        finally { setSearching(false); }
    };

    const clearCustomer = () => {
        setCustomer(null); setPhoneQuery(""); setCustomerName(""); setCustomerPhone(""); setNotes("");
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

    const buildSalePayload = ({ paid, due, autoStatus } = {}) => {
        const paidAmt = paid ?? total;
        const dueAmt = due ?? 0;
        const status = isEdit ? saleStatus : (autoStatus ?? "paid");
        
        return {
            customer_name: customerName || "Walk-in Customer",
            customer_phone: customerPhone || null,
            type: "Casier Billing",
            counter_no: "Counter 1",
            billing_date: new Date().toISOString(),
            subtotal_amount: subtotal,
            tax_amount: tax,
            discount_amount: 0,
            total_amount: total,
            paid_amount: paidAmt,
            due_amount: dueAmt,
            payment_method: paymentMethod,
            status,
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
    };

    const handleConfirmPayment = async ({ paid, due, change, autoStatus } = {}) => {
        if (cart.length === 0) { message.warning("Cart is empty"); return; }
        setSaving(true);
        try {
            let result;
            const payload = buildSalePayload({ paid, due, autoStatus });
            if (isEdit) {
                result = await billingService.update(editId, payload);
                message.success("Sale updated!");
            } else {
                result = await billingService.create(payload);
                message.success("Sale completed!");
            }
            const sale = result?.data?.data ?? result?.data ?? result;
            setCompletedSale({ ...sale, customer_phone: customerPhone, customer_name: customerName || "Customer" });
            setShowPayment(false);
            setCart([]);
            clearCustomer();
        } catch (err) {
            message.error(err?.response?.data?.message || err?.message || "Failed to save sale");
        } finally { setSaving(false); }
    };

    return (
        <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate("/billing/list")} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                    <ArrowLeft size={14} /> Back to Bills
                </button>
                <h1 className="text-lg font-bold text-[#0E1680]">
                    {isEdit ? "Edit Bill" : "Point of Sale Terminal"}
                </h1>
                <div className="w-24" />
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* LEFT — Customer + Cart */}
                <div className="w-full lg:w-[45%] bg-white border-r border-gray-200 flex flex-col overflow-hidden">

                    {/* Customer Search */}
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Details</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={phoneQuery} onChange={e => setPhoneQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handlePhoneSearch()}
                                    placeholder="Search customer by phone..."
                                    className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30" />
                            </div>
                            <button onClick={handlePhoneSearch} disabled={searching}
                                className="px-3 py-2 bg-[#506EE4] text-white rounded-lg text-sm hover:bg-[#3f56c2] disabled:opacity-60 shrink-0">
                                {searching ? "..." : "Search"}
                            </button>
                        </div>

                        {customer ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
                                <button onClick={clearCustomer} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={14} /></button>
                                <div className="flex items-center gap-2 mb-1">
                                    <User size={14} className="text-blue-600" />
                                    <span className="font-semibold text-sm text-gray-800">{customerName}</span>
                                </div>
                                <p className="text-xs text-gray-500">{customerPhone}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name (Walk-in)"
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30" />
                                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone (optional)"
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30" />
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p className="text-lg font-semibold">Cart is empty</p>
                                <p className="text-sm">Select items from the right panel</p>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeColor(item.type)}`}>{item.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#506EE4] hover:text-white transition">-</button>
                                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#506EE4] hover:text-white transition">+</button>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-sm text-gray-800">{fmt(item.price * item.qty)}</p>
                                    <p className="text-xs text-gray-400">{item.qty} × {fmt(item.price)}</p>
                                </div>
                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={15} /></button>
                            </div>
                        ))}
                    </div>

                    {/* Totals + Pay */}
                    <div className="p-4 border-t border-gray-200 bg-white space-y-2 shrink-0">
                        <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                        <div className="flex justify-between text-sm text-gray-600"><span>Tax</span><span>{fmt(tax)}</span></div>
                        <div className="flex justify-between text-lg font-bold text-gray-800 pt-1 border-t border-gray-100"><span>Total</span><span>{fmt(total)}</span></div>

                        <div className="grid grid-cols-3 gap-2 pt-2">
                            {["cash", "card", "upi"].map(m => (
                                <button key={m} onClick={() => { setPaymentMethod(m); setPaidAmount(total.toFixed(2)); setShowPayment(true); }}
                                    className={`py-2 rounded-lg text-sm font-medium ${m === "cash" ? "bg-green-600 text-white hover:bg-green-700" : m === "card" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-purple-600 text-white hover:bg-purple-700"}`}>
                                    {m.toUpperCase()} PAY
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
                                className={`px-3 py-1 rounded-lg text-sm capitalize ${activeTab === tab ? "bg-[#506EE4] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
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
                                {filteredItems.map(item => (
                                    <div key={item.id} onClick={() => addToCart(item)}
                                        className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col cursor-pointer hover:border-[#506EE4] hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColor(item.category_name)}`}>{item.category_name || "Item"}</span>
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.product_name} className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                                            )}
                                        </div>
                                        <div className="mt-auto">
                                            <p className="font-semibold text-gray-800 text-sm leading-tight">{item.product_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.product_code}</p>
                                            <p className="text-[#506EE4] font-bold mt-1">{fmt(parseFloat(item.selling_price || item.unit_price))}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment / Confirm Modal */}
            {showPayment && (() => {
                const paid = parseFloat(paidAmount) || 0;
                const due = Math.max(total - paid, 0);
                const change = paid > total ? paid - total : 0;
                const isPartial = paid > 0 && paid < total;
                const autoStatus = paid <= 0 ? "unpaid" : isPartial ? "partial" : "paid";
                return (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[440px] rounded-xl shadow-xl p-6 relative">
                        <button onClick={() => setShowPayment(false)} className="absolute top-3 right-3 text-gray-400 hover:text-black"><X size={18} /></button>
                        <h2 className="text-lg font-semibold mb-1">{isEdit ? "Update Bill" : "Confirm Payment"}</h2>
                        <p className="text-sm text-gray-500 mb-3">Customer: <span className="font-medium text-gray-700">{customerName || "Walk-in"}</span></p>

                        <div className="space-y-3 text-sm">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{fmt(tax)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                                    <span>Total</span><span>{fmt(total)}</span>
                                </div>
                            </div>

                            {/* Paid Amount input */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Amount Received</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    placeholder={`Full amount: ${total.toFixed(2)}`}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#506EE4]/30"
                                />
                            </div>

                            {/* Live feedback */}
                            {paid > 0 && (
                                <div className={`rounded-lg p-3 space-y-1.5 text-sm ${isPartial ? "bg-yellow-50 border border-yellow-200" : paid > total ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"}`}>
                                    {isPartial && (
                                        <div className="flex justify-between font-semibold text-yellow-700">
                                            <span>⚠ Pending Due</span>
                                            <span>{fmt(due)}</span>
                                        </div>
                                    )}
                                    {change > 0 && (
                                        <div className="flex justify-between font-semibold text-blue-700">
                                            <span>💵 Change to Return</span>
                                            <span>{fmt(change)}</span>
                                        </div>
                                    )}
                                    {!isPartial && change === 0 && (
                                        <div className="flex justify-between font-semibold text-green-700">
                                            <span>✓ Fully Paid</span>
                                            <span>{fmt(paid)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs text-gray-500 border-t border-gray-200 pt-1.5">
                                        <span>Status</span>
                                        <span className={`font-semibold capitalize ${autoStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                                            {autoStatus}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Payment Method</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm">
                                    {["cash", "card", "upi"].map(m => (
                                        <option key={m} value={m}>{m.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm" placeholder="Optional notes..." />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowPayment(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
                            <button onClick={() => handleConfirmPayment({ paid, due, change, autoStatus })} disabled={saving}
                                className="flex-1 bg-[#506EE4] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#3f56c2] disabled:opacity-60">
                                {saving ? "Saving..." : isEdit ? "Update Bill" : "Confirm Bill"}
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}
            {/* Success Modal */}
            {completedSale && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[400px] rounded-xl shadow-xl p-6 text-center">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageCircle size={28} className="text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            {isEdit ? "Bill Updated!" : "Bill Completed!"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {completedSale.billing_no} · ₹{parseFloat(completedSale.total_amount || total).toLocaleString("en-IN")}
                        </p>
                        
                        <button onClick={() => { setCompletedSale(null); navigate("/billing/list"); }}
                            className="w-full bg-[#506EE4] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#3f56c2]">
                            Back to Bills List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
