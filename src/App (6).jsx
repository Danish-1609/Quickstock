import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Local Storage Helpers ────────────────────────────────────
const storage = {
  get: (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

const INITIAL_PRODUCTS = [
  { id: 1, name: "Tata Salt (1kg)", stock: 12, dailySales: 3.2, price: 22, minStock: 5 },
  { id: 2, name: "Amul Butter (500g)", stock: 5, dailySales: 2.1, price: 280, minStock: 4 },
  { id: 3, name: "Aashirvaad Atta (5kg)", stock: 8, dailySales: 1.5, price: 255, minStock: 3 },
  { id: 4, name: "Fortune Sunflower Oil (1L)", stock: 3, dailySales: 1.8, price: 165, minStock: 5 },
  { id: 5, name: "Maggi Noodles (12pk)", stock: 20, dailySales: 4.0, price: 144, minStock: 6 },
  { id: 6, name: "Surf Excel (1kg)", stock: 7, dailySales: 0.9, price: 120, minStock: 3 },
];

const DEMO_USERS = [
  { username: "admin", password: "admin123", storeName: "My Kirana Store" },
  { username: "demo", password: "demo123", storeName: "Demo Store" },
];

const daysLeft = (stock, dailySales) => dailySales > 0 ? Math.floor(stock / dailySales) : 999;
const urgencyColor = (d) => d <= 3 ? "#D93025" : d <= 7 ? "#F5A623" : "#1A7A4A";
const urgencyBg = (d) => d <= 3 ? "#FFF0EE" : d <= 7 ? "#FFFBF0" : "#F0FFF7";

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", storeName: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const allUsers = () => storage.get("qs_users", DEMO_USERS);

  const handleLogin = () => {
    const user = allUsers().find(u => u.username === form.username && u.password === form.password);
    if (user) { storage.set("qs_session", user); onLogin(user); }
    else setError("Wrong username or password");
  };

  const handleRegister = () => {
    if (!form.username || !form.password || !form.storeName) { setError("Fill all fields"); return; }
    const users = allUsers();
    if (users.find(u => u.username === form.username)) { setError("Username taken"); return; }
    const newUser = { username: form.username, password: form.password, storeName: form.storeName };
    storage.set("qs_users", [...users, newUser]);
    storage.set("qs_session", newUser);
    onLogin(newUser);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#FF6B00 0%,#FF8C38 40%,#FDF6EC 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 380, boxShadow: "0 12px 48px rgba(255,107,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52 }}>🏪</div>
          <h1 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 30, fontWeight: 800, color: "#FF6B00", margin: "8px 0 2px" }}>Quickstock</h1>
          <p style={{ fontSize: 13, color: "#aaa" }}>Smart Inventory Manager</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
              flex: 1, padding: "9px", border: "none", borderRadius: 8,
              background: tab === t ? "#FF6B00" : "none",
              color: tab === t ? "#fff" : "#666",
              fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: "pointer",
            }}>{t === "login" ? "Login" : "Register"}</button>
          ))}
        </div>

        {tab === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 600 }}>STORE NAME</div>
            <input type="text" placeholder="e.g. Ramesh Kirana Store"
              value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 600 }}>USERNAME</div>
          <input type="text" placeholder="Enter username"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 600 }}>PASSWORD</div>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} placeholder="Enter password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())}
              style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, boxSizing: "border-box" }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#D93025", fontSize: 13, margin: "8px 0" }}>❌ {error}</div>}

        <button onClick={tab === "login" ? handleLogin : handleRegister} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg,#FF6B00,#FF8C38)",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
          marginTop: 16, cursor: "pointer",
        }}>{tab === "login" ? "Login →" : "Create Account →"}</button>

        {tab === "login" && (
          <div style={{ marginTop: 16, background: "#FFF8F0", borderRadius: 10, padding: 12, fontSize: 12, color: "#AA4400" }}>
            <strong>Quick demo:</strong> username: <code>demo</code> · password: <code>demo123</code>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => storage.get("qs_session", null));

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { storage.set("qs_session", null); setUser(null); };

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [products, setProducts] = useState(() => storage.get(`qs_products_${user.username}`, INITIAL_PRODUCTS));
  const [sales, setSales] = useState(() => storage.get(`qs_sales_${user.username}`, []));
  const [tab, setTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [newProduct, setNewProduct] = useState({ name: "", stock: "", dailySales: "", price: "", minStock: "" });
  const [showLogout, setShowLogout] = useState(false);
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "1" });
  const [saleMsg, setSaleMsg] = useState("");
  const [notification, setNotification] = useState(null);

  // Save to localStorage whenever products/sales change
  useEffect(() => { storage.set(`qs_products_${user.username}`, products); }, [products]);
  useEffect(() => { storage.set(`qs_sales_${user.username}`, sales); }, [sales]);

  // Check low stock notifications
  useEffect(() => {
    const low = products.filter(p => p.stock <= p.minStock);
    if (low.length > 0) setNotification(`⚠️ ${low.length} item${low.length > 1 ? "s are" : " is"} low on stock!`);
    else setNotification(null);
  }, [products]);

  const criticalItems = products.filter(p => p.stock <= p.minStock);
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const saveEdit = (id) => {
    setProducts(products.map(p => p.id === id ? {
      ...p,
      stock: parseFloat(editValues.stock) || p.stock,
      dailySales: parseFloat(editValues.dailySales) || p.dailySales,
      price: parseFloat(editValues.price) || p.price,
      minStock: parseFloat(editValues.minStock) || p.minStock,
    } : p));
    setEditingId(null);
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.stock || !newProduct.price) return;
    const p = {
      id: Date.now(), name: newProduct.name,
      stock: parseFloat(newProduct.stock),
      dailySales: parseFloat(newProduct.dailySales) || 1,
      price: parseFloat(newProduct.price),
      minStock: parseFloat(newProduct.minStock) || 5,
    };
    setProducts([...products, p]);
    setNewProduct({ name: "", stock: "", dailySales: "", price: "", minStock: "" });
  };

  const recordSale = () => {
    const p = products.find(x => x.id === parseInt(saleForm.productId));
    const qty = parseFloat(saleForm.qty);
    if (!p || !qty || qty <= 0) { setSaleMsg("Select a product and quantity"); return; }
    if (qty > p.stock) { setSaleMsg(`Only ${p.stock} units in stock!`); return; }
    const sale = { id: Date.now(), productId: p.id, productName: p.name, qty, price: p.price, total: qty * p.price, date: new Date().toISOString() };
    setSales([...sales, sale]);
    setProducts(products.map(x => x.id === p.id ? { ...x, stock: x.stock - qty } : x));
    setSaleMsg(`✅ Sold ${qty} × ${p.name} for ₹${(qty * p.price).toLocaleString("en-IN")}`);
    setSaleForm({ productId: "", qty: "1" });
    setTimeout(() => setSaleMsg(""), 3000);
  };

  const exportCSV = () => {
    const rows = [["Product", "Qty Sold", "Price", "Total", "Date"]];
    sales.forEach(s => rows.push([s.productName, s.qty, s.price, s.total, new Date(s.date).toLocaleDateString("en-IN")]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "quickstock_sales.csv"; a.click();
  };

  const chartData = products.slice(0, 8).map(p => ({
    name: p.name.split(" ")[0],
    days: daysLeft(p.stock, p.dailySales),
    color: urgencyColor(daysLeft(p.stock, p.dailySales)),
  }));

  const weekSales = () => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const data = days.map(d => ({ day: d, total: 0 }));
    sales.forEach(s => {
      const d = new Date(s.date).getDay();
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(s.date) >= weekAgo) data[d].total += s.total;
    });
    return data;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EE", paddingBottom: 70 }}>

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C38)", padding: "14px 18px", color: "#fff", boxShadow: "0 2px 12px rgba(255,107,0,0.3)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🏪 {user.storeName}</h1>
            <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>Quickstock</p>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowLogout(!showLogout)} style={{
              background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 10, padding: "7px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>👤 {user.username}</button>
            {showLogout && (
              <div style={{ position: "absolute", right: 0, top: 42, background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: 8, zIndex: 100, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: "#999", padding: "4px 10px 8px", borderBottom: "1px solid #f0f0f0" }}>{user.storeName}</div>
                <button onClick={exportCSV} style={{ width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#1A7A4A", fontWeight: 600, fontSize: 13, textAlign: "left", cursor: "pointer" }}>
                  📥 Export CSV
                </button>
                <button onClick={handleLogout} style={{ width: "100%", padding: "9px 10px", background: "none", border: "none", color: "#D93025", fontWeight: 600, fontSize: 13, textAlign: "left", cursor: "pointer" }}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Low stock notification banner */}
      {notification && (
        <div style={{ background: "#FFF3CD", padding: "10px 18px", borderBottom: "2px solid #F5A623", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#7A5F00", fontWeight: 600 }}>{notification}</span>
          <button onClick={() => setTab("inventory")} style={{ background: "#F5A623", color: "#fff", border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View</button>
        </div>
      )}

      <main style={{ padding: "16px" }}>

        {/* ── HOME ── */}
        {tab === "dashboard" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Total Products", value: products.length, icon: "📦", color: "#1A7A4A", bg: "#F0FFF7" },
                { label: "Low Stock Alerts", value: criticalItems.length, icon: "🚨", color: "#D93025", bg: "#FFF0EE" },
                { label: "Today's Sales", value: todaySales.length, icon: "🛒", color: "#1565C0", bg: "#E8F0FE" },
                { label: "Today's Revenue", value: `₹${Math.round(todayRevenue).toLocaleString("en-IN")}`, icon: "💰", color: "#7B1FA2", bg: "#F8F0FF" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: 14, border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 24 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Baloo 2',cursive", marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#333" }}>Quick Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Add Product", icon: "➕", action: () => setTab("inventory"), color: "#FF6B00" },
                  { label: "Record Sale", icon: "🛒", action: () => setTab("sales"), color: "#1A7A4A" },
                  { label: "View Inventory", icon: "📦", action: () => setTab("inventory"), color: "#1565C0" },
                  { label: "View Reports", icon: "📊", action: () => setTab("reports"), color: "#7B1FA2" },
                ].map(q => (
                  <button key={q.label} onClick={q.action} style={{
                    padding: "12px 8px", background: `${q.color}11`, border: `1.5px solid ${q.color}33`,
                    borderRadius: 12, cursor: "pointer", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22 }}>{q.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: q.color, marginTop: 4 }}>{q.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stock chart */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#333" }}>Days Until Stockout</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} days`, "Days left"]} />
                  <Bar dataKey="days" radius={[5, 5, 0, 0]}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Low stock list */}
            {criticalItems.length > 0 && (
              <div style={{ background: "#FFF0EE", border: "1px solid #FFCDD2", borderRadius: 14, padding: 14 }}>
                <h3 style={{ color: "#D93025", fontSize: 14, marginBottom: 10 }}>🚨 Low Stock — Reorder Now</h3>
                {criticalItems.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #FFCDD2" }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: "#D93025", fontWeight: 700 }}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab === "inventory" && (
          <div>
            {/* Add product */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>➕ Add Product</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input placeholder="Product name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, gridColumn: "1 / -1" }} />
                <input type="number" placeholder="Stock (units)" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13 }} />
                <input type="number" placeholder="Daily sales" value={newProduct.dailySales} onChange={e => setNewProduct({ ...newProduct, dailySales: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13 }} />
                <input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13 }} />
                <input type="number" placeholder="Min stock alert" value={newProduct.minStock} onChange={e => setNewProduct({ ...newProduct, minStock: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13 }} />
              </div>
              <button onClick={addProduct} style={{ width: "100%", background: "#FF6B00", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 14 }}>
                Add Product
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
              <input placeholder={`Search ${products.length} products...`} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "11px 40px 11px 40px", borderRadius: 10, border: "2px solid #FF6B00", fontSize: 14, boxSizing: "border-box", background: "#fff" }} />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 17, cursor: "pointer", color: "#999" }}>✕</button>}
            </div>

            {searchQuery && <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{filteredProducts.length} results for "{searchQuery}"</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredProducts.map(p => {
                const d = daysLeft(p.stock, p.dailySales);
                const isLow = p.stock <= p.minStock;
                const isEditing = editingId === p.id;
                return (
                  <div key={p.id} style={{ background: isLow ? "#FFF0EE" : "#fff", border: `1px solid ${isLow ? "#FFCDD2" : "#e0e0e0"}`, borderRadius: 12, padding: 14 }}>
                    {!isEditing ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {isLow && <span style={{ color: "#D93025" }}>🚨 </span>}{p.name}
                          </div>
                          <span style={{ color: urgencyColor(d), fontWeight: 800, fontSize: 14 }}>{d >= 999 ? "∞" : `${d}d`}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, background: "#f5f5f5", padding: "3px 8px", borderRadius: 6 }}>📦 {p.stock} units</span>
                          <span style={{ fontSize: 12, background: "#f5f5f5", padding: "3px 8px", borderRadius: 6 }}>📈 {p.dailySales}/day</span>
                          <span style={{ fontSize: 12, background: "#f5f5f5", padding: "3px 8px", borderRadius: 6 }}>₹{p.price}</span>
                          <span style={{ fontSize: 12, background: isLow ? "#FFCDD2" : "#f5f5f5", padding: "3px 8px", borderRadius: 6, color: isLow ? "#D93025" : "#666" }}>min:{p.minStock}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setEditingId(p.id); setEditValues({ stock: p.stock, dailySales: p.dailySales, price: p.price, minStock: p.minStock }); }}
                            style={{ flex: 1, background: "#FFF3E0", border: "1px solid #FF6B00", borderRadius: 8, color: "#FF6B00", padding: "6px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                          <button onClick={() => setProducts(products.filter(x => x.id !== p.id))}
                            style={{ flex: 1, background: "#FFF0EE", border: "1px solid #FFCDD2", borderRadius: 8, color: "#D93025", padding: "6px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🗑️ Delete</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#FF6B00" }}>✏️ Editing: {p.name}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          {[
                            { key: "stock", label: "📦 Stock" },
                            { key: "dailySales", label: "📈 Daily Sales" },
                            { key: "price", label: "₹ Price" },
                            { key: "minStock", label: "⚠️ Min Stock" },
                          ].map(f => (
                            <div key={f.key}>
                              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{f.label}</div>
                              <input type="number" value={editValues[f.key]} onChange={e => setEditValues({ ...editValues, [f.key]: e.target.value })}
                                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #FF6B00", fontSize: 13, boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => saveEdit(p.id)} style={{ flex: 1, background: "#1A7A4A", color: "#fff", border: "none", borderRadius: 8, padding: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✅ Save</button>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, background: "#f5f5f5", color: "#666", border: "1px solid #ddd", borderRadius: 8, padding: 9, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === "sales" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🛒 Record Sale</h3>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 600 }}>SELECT PRODUCT</div>
                <select value={saleForm.productId} onChange={e => setSaleForm({ ...saleForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, background: "#fff" }}>
                  <option value="">Choose product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) — ₹{p.price}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 600 }}>QUANTITY</div>
                <input type="number" min="1" value={saleForm.qty} onChange={e => setSaleForm({ ...saleForm, qty: e.target.value })}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              {saleForm.productId && saleForm.qty && (
                <div style={{ background: "#F0FFF7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 14, color: "#1A7A4A", fontWeight: 600 }}>
                  💰 Total: ₹{((products.find(p => p.id === parseInt(saleForm.productId))?.price || 0) * parseFloat(saleForm.qty || 0)).toLocaleString("en-IN")}
                </div>
              )}
              {saleMsg && <div style={{ padding: "10px 14px", borderRadius: 10, background: saleMsg.includes("✅") ? "#F0FFF7" : "#FFF0EE", color: saleMsg.includes("✅") ? "#1A7A4A" : "#D93025", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{saleMsg}</div>}
              <button onClick={recordSale} style={{ width: "100%", background: "linear-gradient(135deg,#1A7A4A,#25A865)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Record Sale
              </button>
            </div>

            {/* Today's sales */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Today's Sales</h3>
                <span style={{ fontSize: 13, color: "#1A7A4A", fontWeight: 700 }}>₹{Math.round(todayRevenue).toLocaleString("en-IN")}</span>
              </div>
              {todaySales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#aaa", fontSize: 13 }}>No sales recorded today</div>
              ) : (
                todaySales.slice().reverse().map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #f0f0f0" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.productName}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{s.qty} units × ₹{s.price}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A7A4A" }}>₹{s.total.toLocaleString("en-IN")}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Today", value: `₹${Math.round(todaySales.reduce((s, x) => s + x.total, 0)).toLocaleString("en-IN")}`, icon: "📅" },
                { label: "Total Sales", value: sales.length, icon: "🛒" },
                { label: "Total Revenue", value: `₹${Math.round(sales.reduce((s, x) => s + x.total, 0)).toLocaleString("en-IN")}`, icon: "💰" },
                { label: "Products", value: products.length, icon: "📦" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: 24 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B00", fontFamily: "'Baloo 2',cursive", marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Weekly chart */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 This Week's Sales (₹)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekSales()} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`₹${v}`, "Revenue"]} />
                  <Bar dataKey="total" fill="#FF6B00" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Export */}
            <button onClick={exportCSV} style={{ width: "100%", background: "#1A7A4A", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              📥 Export Sales as CSV
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eee", display: "flex", boxShadow: "0 -2px 12px rgba(0,0,0,0.08)", zIndex: 50 }}>
        {[
          { id: "dashboard", icon: "🏠", label: "Home" },
          { id: "inventory", icon: "📦", label: "Inventory" },
          { id: "sales", icon: "🛒", label: "Sales" },
          { id: "reports", icon: "📊", label: "Reports" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 4px 8px", border: "none", background: "none", cursor: "pointer",
            borderTop: tab === t.id ? "3px solid #FF6B00" : "3px solid transparent",
          }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#FF6B00" : "#999", marginTop: 2 }}>{t.label}</div>
          </button>
        ))}
      </nav>
    </div>
  );
}
