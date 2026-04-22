import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const INITIAL_PRODUCTS = [
  { id: 1, name: "Tata Salt (1kg)", stock: 12, dailySales: 3.2, price: 22 },
  { id: 2, name: "Amul Butter (500g)", stock: 5, dailySales: 2.1, price: 280 },
  { id: 3, name: "Aashirvaad Atta (5kg)", stock: 8, dailySales: 1.5, price: 255 },
  { id: 4, name: "Fortune Sunflower Oil (1L)", stock: 3, dailySales: 1.8, price: 165 },
  { id: 5, name: "Maggi Noodles (12pk)", stock: 20, dailySales: 4.0, price: 144 },
  { id: 6, name: "Surf Excel (1kg)", stock: 7, dailySales: 0.9, price: 120 },
];

const daysUntilStockout = (stock, dailySales) =>
  dailySales > 0 ? Math.floor(stock / dailySales) : 999;

const urgencyColor = (days) => {
  if (days <= 3) return "#D93025";
  if (days <= 7) return "#F5A623";
  return "#1A7A4A";
};

const urgencyBg = (days) => {
  if (days <= 3) return "#FFF0EE";
  if (days <= 7) return "#FFFBF0";
  return "#F0FFF7";
};

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [tab, setTab] = useState("dashboard");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", stock: "", dailySales: "", price: "" });
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ stock: "", dailySales: "", price: "" });

  const criticalItems = products.filter(p => daysUntilStockout(p.stock, p.dailySales) <= 3);
  const warningItems = products.filter(p => {
    const d = daysUntilStockout(p.stock, p.dailySales);
    return d > 3 && d <= 7;
  });
  const totalRevAtRisk = criticalItems.reduce((sum, p) => sum + p.dailySales * 7 * p.price, 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditValues({ stock: p.stock, dailySales: p.dailySales, price: p.price });
  };

  const saveEdit = (id) => {
    setProducts(products.map(p =>
      p.id === id ? {
        ...p,
        stock: parseFloat(editValues.stock) || p.stock,
        dailySales: parseFloat(editValues.dailySales) || p.dailySales,
        price: parseFloat(editValues.price) || p.price,
      } : p
    ));
    setEditingId(null);
  };

  const runForecast = async () => {
    setLoading(true); setError(""); setForecast(null);
    const payload = products.map(p => ({
      name: p.name, currentStock: p.stock, dailySales: p.dailySales,
      priceINR: p.price, daysLeft: daysUntilStockout(p.stock, p.dailySales),
    }));
    const today = new Date();
    const month = today.toLocaleString("en-IN", { month: "long" });
    const prompt = `You are an expert AI inventory manager for Indian kirana stores. Today is ${today.toDateString()}, month: ${month}.
Inventory: ${JSON.stringify(payload)}
Return ONLY valid JSON, no markdown:
{"summary":"...","festivalNote":"...","items":[{"name":"...","reorderQty":0,"urgency":"ok","festivalAlert":null,"revenueRisk":0,"insight":"..."}]}`;
    try {
      const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!key) { setError("Please enter your Anthropic API key."); setShowKeyInput(true); setLoading(false); return; }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || "API error"); }
      const data = await res.json();
      const clean = data.content[0].text.trim().replace(/```json|```/g, "").trim();
      setForecast(JSON.parse(clean));
      setTab("forecast");
    } catch (e) { setError("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.stock || !newProduct.dailySales || !newProduct.price) return;
    setProducts([...products, { id: Date.now(), name: newProduct.name, stock: parseFloat(newProduct.stock), dailySales: parseFloat(newProduct.dailySales), price: parseFloat(newProduct.price) }]);
    setNewProduct({ name: "", stock: "", dailySales: "", price: "" });
  };

  const removeProduct = (id) => setProducts(products.filter(p => p.id !== id));

  const chartData = products.map(p => ({
    name: p.name.split(" ")[0],
    days: daysUntilStockout(p.stock, p.dailySales),
    color: urgencyColor(daysUntilStockout(p.stock, p.dailySales)),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF8C38 100%)", padding: "16px 20px", color: "#fff", boxShadow: "0 2px 12px rgba(255,107,0,0.3)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>🏪 Quickstock</h1>
            <p style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Smart Inventory · IdeaJam 2026</p>
          </div>
          <button onClick={runForecast} disabled={loading} style={{
            background: loading ? "rgba(255,255,255,0.3)" : "#fff", color: loading ? "#fff" : "#FF6B00",
            border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14,
          }}>
            {loading ? "⏳ Analysing..." : "🤖 AI Forecast"}
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div style={{ background: "#FFF3CD", padding: "12px 20px", borderBottom: "1px solid #FFE082" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#7A5F00" }}>🔑 Enter Anthropic API Key:</span>
            <input type="password" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "6px 10px", borderRadius: 8, border: "1px solid #FFD54F", fontSize: 13 }} />
            <button onClick={() => { setShowKeyInput(false); setError(""); runForecast(); }}
              style={{ background: "#FF6B00", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13 }}>Use Key</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "#FFF0EE", borderBottom: "1px solid #FFCDD2", padding: "10px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", color: "#D93025", fontSize: 13 }}>⚠️ {error}</div>
        </div>
      )}

      {/* Tabs */}
      <nav style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 4 }}>
          {["dashboard", "products", "forecast"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "14px 18px", border: "none", background: "none",
              borderBottom: tab === t ? "3px solid #FF6B00" : "3px solid transparent",
              color: tab === t ? "#FF6B00" : "#6B6B6B",
              fontWeight: tab === t ? 700 : 400, fontSize: 14, transition: "all 0.15s",
            }}>
              {t === "dashboard" ? "📊 Dashboard" : t === "products" ? "📦 Products" : "🤖 AI Forecast"}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total Products", value: products.length, icon: "📦", color: "#1A7A4A" },
                { label: "Critical Stock", value: criticalItems.length, icon: "🚨", color: "#D93025" },
                { label: "Low Stock", value: warningItems.length, icon: "⚠️", color: "#F5A623" },
                { label: "Revenue at Risk", value: `₹${Math.round(totalRevAtRisk).toLocaleString("en-IN")}`, icon: "💸", color: "#7B1FA2" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Baloo 2', cursive", marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Days Until Stockout</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} days`, "Days left"]} />
                  <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {criticalItems.length > 0 && (
              <div style={{ background: "#FFF0EE", border: "1px solid #FFCDD2", borderRadius: 14, padding: 16 }}>
                <h3 style={{ color: "#D93025", marginBottom: 12, fontSize: 15 }}>🚨 Critical — Reorder Today</h3>
                {criticalItems.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #FFCDD2" }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: "#D93025", fontWeight: 700 }}>{daysUntilStockout(p.stock, p.dailySales)} days left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div>
            {/* Add product form */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 16 }}>
              <h3 style={{ marginBottom: 14, fontSize: 16 }}>➕ Add Product</h3>
              {/* Row 1: name + stock */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input type="text" placeholder="Product name (e.g. Rice 1kg)"
                  value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
                <input type="number" placeholder="Stock (units)"
                  value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
              </div>
              {/* Row 2: daily sales + price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <input type="number" placeholder="Daily sales (per day)"
                  value={newProduct.dailySales} onChange={e => setNewProduct({ ...newProduct, dailySales: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
                <input type="number" placeholder="Price (₹)"
                  value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
              </div>
              <button onClick={addProduct} style={{
                background: "#FF6B00", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, width: "100%",
              }}>Add Product</button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 14, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder={`Search ${products.length} products...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "12px 40px 12px 42px",
                  borderRadius: 10, border: "2px solid #FF6B00",
                  fontSize: 14, background: "#fff",
                  boxShadow: "var(--shadow)", boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer",
                }}>✕</button>
              )}
            </div>

            {searchQuery && (
              <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 10 }}>
                Found {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "{searchQuery}"
              </div>
            )}

            {/* Product List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <div>No products found for "{searchQuery}"</div>
                </div>
              )}

              {filteredProducts.map(p => {
                const days = daysUntilStockout(p.stock, p.dailySales);
                const isEditing = editingId === p.id;
                return (
                  <div key={p.id} style={{
                    background: urgencyBg(days),
                    border: `1px solid ${urgencyColor(days)}33`,
                    borderRadius: 12, padding: "14px 16px",
                  }}>

                    {/* Normal view */}
                    {!isEditing && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          {/* Product name */}
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.name}</div>
                          {/* All 4 fields in one line */}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#444", background: "#fff", padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd" }}>
                              📦 {p.stock} units
                            </span>
                            <span style={{ fontSize: 12, color: "#444", background: "#fff", padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd" }}>
                              📈 {p.dailySales}/day
                            </span>
                            <span style={{ fontSize: 12, color: "#444", background: "#fff", padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd" }}>
                              ₹{p.price}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <span style={{ color: urgencyColor(days), fontWeight: 800, fontSize: 15 }}>
                            {days >= 999 ? "∞" : `${days} days`}
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => startEdit(p)} style={{
                              background: "#fff", border: "1px solid #FF6B00", borderRadius: 6,
                              color: "#FF6B00", padding: "4px 10px", fontSize: 12, fontWeight: 600,
                            }}>✏️ Edit</button>
                            <button onClick={() => removeProduct(p.id)} style={{
                              background: "#fff", border: "1px solid #FFCDD2", borderRadius: 6,
                              color: "#D93025", padding: "4px 10px", fontSize: 12, fontWeight: 600,
                            }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit view */}
                    {isEditing && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✏️ Editing: {p.name}</div>
                        {/* Row 1: stock */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>📦 Stock (units)</div>
                          <input type="number" value={editValues.stock}
                            onChange={e => setEditValues({ ...editValues, stock: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #FF6B00", fontSize: 14, boxSizing: "border-box" }} />
                        </div>
                        {/* Row 2: daily sales + price side by side */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>📈 Daily Sales</div>
                            <input type="number" value={editValues.dailySales}
                              onChange={e => setEditValues({ ...editValues, dailySales: e.target.value })}
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>₹ Price</div>
                            <input type="number" value={editValues.price}
                              onChange={e => setEditValues({ ...editValues, price: e.target.value })}
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => saveEdit(p.id)} style={{
                            flex: 1, background: "#1A7A4A", color: "#fff", border: "none",
                            borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 14,
                          }}>✅ Save Changes</button>
                          <button onClick={() => setEditingId(null)} style={{
                            flex: 1, background: "#fff", color: "#666", border: "1px solid #ddd",
                            borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 14,
                          }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FORECAST ── */}
        {tab === "forecast" && (
          <div>
            {!forecast && !loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B6B6B" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: 20, marginBottom: 8, color: "#1C1C1C" }}>AI Forecast Not Run Yet</h3>
                <p style={{ fontSize: 14, marginBottom: 20 }}>Click the "AI Forecast" button in the header.</p>
                <button onClick={runForecast} style={{
                  background: "#FF6B00", color: "#fff", border: "none",
                  borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 15,
                }}>🤖 Run AI Forecast</button>
              </div>
            )}
            {loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B6B6B" }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite" }}>⏳</div>
                <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: 20 }}>Claude is analysing your inventory...</h3>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {forecast && (
              <div>
                <div style={{ background: "linear-gradient(135deg, #FF6B00, #FF8C38)", borderRadius: 14, padding: 20, color: "#fff", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 17, marginBottom: 8 }}>📋 Store Summary</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{forecast.summary}</p>
                  {forecast.festivalNote && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.9 }}>🎉 {forecast.festivalNote}</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {forecast.items?.map((item, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                          <div style={{ fontSize: 13, color: "#555", marginTop: 5, lineHeight: 1.5 }}>{item.insight}</div>
                          {item.festivalAlert && <div style={{ fontSize: 12, color: "#FF6B00", marginTop: 4 }}>🎉 {item.festivalAlert}</div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <span style={{
                            background: item.urgency === "critical" ? "#D93025" : item.urgency === "warning" ? "#F5A623" : "#1A7A4A",
                            color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
                          }}>{item.urgency?.toUpperCase()}</span>
                          {item.reorderQty > 0 && <span style={{ fontSize: 13, color: "#1A7A4A", fontWeight: 600 }}>Order: {item.reorderQty} units</span>}
                          {item.revenueRisk > 0 && <span style={{ fontSize: 12, color: "#7B1FA2" }}>Risk: ₹{item.revenueRisk.toLocaleString("en-IN")}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px", color: "#999", fontSize: 12, marginTop: 20 }}>
        Built for IdeaJam 2026 · Made in JIS 🇮🇳
      </footer>
    </div>
  );
}
