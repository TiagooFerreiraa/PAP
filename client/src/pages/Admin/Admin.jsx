import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function Admin({ setUser }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [tab, setTab] = useState("users");

  const logout = () => {
    localStorage.removeItem("user");
    setUser && setUser(null);
    navigate("/");
  };

  return (
    <div className="main-wrap admin-wrap">
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">NovusStore Admin</div>
        </div>

        <div className="nav-right">
          <div className="user">Welcome, {user?.username || 'User'}</div>
          <button className="logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      <header className="admin-header">
        <h2>Administration</h2>
        <div className="admin-tabs">
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
          <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button>
          <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Categories</button>
        </div>
      </header>

      <section className="admin-content">
        {tab === 'users' && <UsersPanel />}
        {tab === 'products' && <ProductsPanel />}
        {tab === 'categories' && <CategoriesPanel />}
      </section>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('create-failed');
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:3000/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete-failed');
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="panel">
      <h3>Users</h3>
      <form className="small-form" onSubmit={handleCreate}>
        <input placeholder="Username" value={newUser.username} onChange={e=>setNewUser(s=>({...s, username:e.target.value}))} required />
        <input placeholder="Email" type="email" value={newUser.email} onChange={e=>setNewUser(s=>({...s, email:e.target.value}))} required />
        <input placeholder="Password" type="password" value={newUser.password} onChange={e=>setNewUser(s=>({...s, password:e.target.value}))} required />
        <select value={newUser.role} onChange={e=>setNewUser(s=>({...s, role:e.target.value}))}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit">Create</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <table className="list-table">
          <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td><button className="danger" onClick={()=>handleDelete(u.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description:'', price:0, stock:0, category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchAll = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('http://localhost:3000/products'),
        fetch('http://localhost:3000/categories')
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProducts(pData);
      setCategories(cData);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreating(true);
    try {
      const form = new FormData();
      form.append('name', newProduct.name);
      form.append('description', newProduct.description);
      form.append('price', newProduct.price);
      form.append('stock', newProduct.stock);
      form.append('category_id', newProduct.category_id || '');
      if (imageFile) form.append('image', imageFile);

      const res = await fetch('http://localhost:3000/products', {
        method: 'POST',
        body: form
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }
      if (!res.ok) {
        const msg = json?.message || text || 'create-failed';
        setCreateError(msg);
        throw new Error(msg);
      }
      setNewProduct({ name: '', description:'', price:0, stock:0, category_id: '' });
      setImageFile(null);
      setImagePreview('');
      setCreateSuccess(json?.message || 'Created');
      fetchAll();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:3000/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete-failed');
      fetchAll();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="panel">
      <h3>Products</h3>
      <form className="small-form" onSubmit={handleCreate}>
        <input placeholder="Name" value={newProduct.name} onChange={e=>setNewProduct(s=>({...s, name:e.target.value}))} required />
        <input placeholder="Description" value={newProduct.description} onChange={e=>setNewProduct(s=>({...s, description:e.target.value}))} />
        <input placeholder="Price" type="number" step="0.01" value={newProduct.price} onChange={e=>setNewProduct(s=>({...s, price:parseFloat(e.target.value||0)}))} required />
        <input placeholder="Stock" type="number" value={newProduct.stock} onChange={e=>setNewProduct(s=>({...s, stock:parseInt(e.target.value||0)}))} required />
        <input type="file" accept="image/*" onChange={e=>{
          const f = e.target.files[0];
          setImageFile(f || null);
          if (f) {
            const reader = new FileReader();
            reader.onload = ev => setImagePreview(ev.target.result);
            reader.readAsDataURL(f);
          } else {
            setImagePreview('');
          }
        }} />
        {imagePreview && <img src={imagePreview} alt="preview" style={{width:80, height:80, objectFit:'cover', borderRadius:6}} />}
        <select value={newProduct.category_id} onChange={e=>setNewProduct(s=>({...s, category_id: e.target.value}))}>
          <option value="">Uncategorized</option>
          {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
      </form>
      {createError && <p style={{color:'crimson'}}>{createError}</p>}
      {createSuccess && <p style={{color:'green'}}>{createSuccess}</p>}

      <table className="list-table">
        <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.category_name || '—'}</td>
              <td>€{parseFloat(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td><button className="danger" onClick={()=>handleDelete(p.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3000/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) { console.error(err); }
  };

  useEffect(()=>{ fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/categories', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, description}) });
      if (!res.ok) throw new Error('create-failed');
      setName(''); setDescription('');
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`http://localhost:3000/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete-failed');
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="panel">
      <h3>Categories</h3>
      <form className="small-form" onSubmit={handleCreate}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <button type="submit">Create</button>
      </form>

      <table className="list-table">
        <thead><tr><th>ID</th><th>Name</th><th>Description</th><th></th></tr></thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.description}</td>
              <td><button className="danger" onClick={()=>handleDelete(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
