import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Main.css";

function Main({ setUser }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const logout = () => {
    localStorage.removeItem("user");
    setUser && setUser(null);
    navigate("/");
  };

  useEffect(() => {
    // Try fetch from backend; fallback to mock data if unavailable
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3000/products");
        if (!res.ok) throw new Error("no-products-endpoint");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        // Fallback mock products
        setProducts([
          { id: 1, name: "Wireless Headphones", description: "High quality sound", price: 59.99, stock: 12, category: "electronics" },
          { id: 2, name: "Coffee Mug", description: "Ceramic 350ml", price: 9.5, stock: 40, category: "home" },
          { id: 3, name: "Sneakers", description: "Comfortable running shoes", price: 79.99, stock: 7, category: "fashion" },
          { id: 4, name: "Bluetooth Speaker", description: "Portable and loud", price: 39.99, stock: 22, category: "electronics" }
        ]);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    "all",
    ...Array.from(new Set(products.map(p => (p.category || p.category_name)).filter(Boolean)))
  ];

  const filtered = products.filter(p => {
    const name = (p.name || "").toString();
    const desc = (p.description || "").toString();
    const matchesQuery = name.toLowerCase().includes(query.toLowerCase()) || desc.toLowerCase().includes(query.toLowerCase());
    const prodCategory = p.category || p.category_name || "";
    const matchesCategory = category === "all" || prodCategory === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="main-wrap">
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">NovusStore</div>
          <div className="search">
            <input
              placeholder="Search products"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="nav-right">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All categories' : cat}</option>
            ))}
          </select>

          <div className="user">Welcome, {user?.username || "User"}</div>
          <button className="logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      <main className="content">
        <h2 className="section-title">Products</h2>

        <div className="products-grid">
          {filtered.length === 0 && <p>No products found.</p>}

          {filtered.map(p => (
            <div key={p.id} className="product-card">
                <div className="product-image">
                  {p.image ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={p.image} alt={p.name || 'product image'} />
                  ) : (
                    '📦'
                  )}
                </div>
              <h3 className="product-name">{p.name}</h3>
              <p className="product-desc">{p.description}</p>
              <div className="product-footer">
                  <div className="price">€{(Number(p.price) || 0).toFixed(2)}</div>
                  <button className="buy" disabled={Number(p.stock) <= 0}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Main;