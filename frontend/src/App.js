import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AuthCtx = createContext();
const CartCtx = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('ec_user')); } catch { return null; } });
  useEffect(() => { const t = localStorage.getItem('ec_token'); if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`; }, []);
  const set = (token, u) => { localStorage.setItem('ec_token', token); localStorage.setItem('ec_user', JSON.stringify(u)); axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; setUser(u); };
  const login = async (e, p) => { const { data } = await axios.post('/api/auth/login', { email: e, password: p }); set(data.token, data.user); };
  const register = async (n, e, p) => { const { data } = await axios.post('/api/auth/register', { name: n, email: e, password: p }); set(data.token, data.user); };
  const logout = () => { localStorage.clear(); delete axios.defaults.headers.common['Authorization']; setUser(null); };
  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const { user } = useContext(AuthCtx);
  const load = async () => { if (user) { const { data } = await axios.get('/api/cart'); setCart(data); } };
  useEffect(() => { load(); }, [user]);
  const add = async (product_id) => { await axios.post('/api/cart', { product_id }); load(); };
  const remove = async (id) => { await axios.delete(`/api/cart/${id}`); load(); };
  const update = async (id, quantity) => { await axios.put(`/api/cart/${id}`, { quantity }); load(); };
  const clear = async () => { await axios.delete('/api/cart'); load(); };
  return <CartCtx.Provider value={{ cart, add, remove, update, clear, reload: load }}>{children}</CartCtx.Provider>;
}

const useAuth = () => useContext(AuthCtx);
const useCart = () => useContext(CartCtx);

const s = {
  nav: { background: '#1a1a2e', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { color: '#e94560', fontWeight: 700, fontSize: 20, textDecoration: 'none' },
  navLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  navLink: { color: '#ccc', textDecoration: 'none', fontSize: 14 },
  cartBtn: { background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  page: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 },
  card: { background: '#fff', border: '1px solid #e8e8e4', borderRadius: 12, overflow: 'hidden' },
  cardImg: { width: '100%', height: 180, background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  cardBody: { padding: '1rem' },
  price: { fontSize: 18, fontWeight: 700, color: '#e94560' },
  addBtn: { width: '100%', padding: '8px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 8 },
  inp: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  btn: (bg='#e94560') => ({ width: '100%', padding: 11, background: bg, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }),
};

const EMOJIS = { Electronics: '💻', Shoes: '👟', Clothing: '👕', Books: '📚' };

function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>ShopReact</Link>
      <div style={s.navLinks}>
        {user ? <>
          <span style={{ color: '#ccc', fontSize: 14 }}>Hi, {user.name}</span>
          <Link to="/orders" style={s.navLink}>Orders</Link>
          <button onClick={logout} style={{ ...s.cartBtn, background: '#444' }}>Logout</button>
          <Link to="/cart"><button style={s.cartBtn}>Cart {count > 0 && `(${count})`}</button></Link>
        </> : <>
          <Link to="/login" style={s.navLink}>Login</Link>
          <Link to="/register"><button style={s.cartBtn}>Sign up</button></Link>
        </>}
      </div>
    </nav>
  );
}

function HomePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { add } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    axios.get('/api/products', { params }).then(r => setProducts(r.data));
  }, [search, category]);

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={s.page}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input style={{ ...s.inp, marginBottom: 0, flex: 1 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="">All categories</option>
            {['Electronics','Shoes','Clothing','Books'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={s.grid}>
          {products.map(p => (
            <div key={p.id} style={s.card}>
              <div style={s.cardImg}>{EMOJIS[p.category] || '📦'}</div>
              <div style={s.cardBody}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{p.category}</p>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={s.price}>€{p.price}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.stock} left</span>
                </div>
                {user ? <button style={s.addBtn} onClick={() => add(p.id)}>Add to cart</button>
                  : <Link to="/login"><button style={s.addBtn}>Login to buy</button></Link>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CartPage() {
  const { cart, remove, update } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const checkout = async () => {
    await axios.post('/api/orders', { shipping_address: '123 Main St, Hamburg' });
    navigate('/orders');
  };
  if (!user) return <Navigate to="/login" />;
  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ ...s.page, maxWidth: 700 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Your Cart</h1>
        {cart.items.length === 0 ? <p style={{ color: '#94a3b8' }}>Cart is empty.</p> : <>
          {cart.items.map(item => (
            <div key={item.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 16, padding: '1rem', marginBottom: 12 }}>
              <div style={{ fontSize: 32 }}>{EMOJIS[item.category] || '📦'}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{item.name}</p>
                <p style={{ color: '#e94560', fontWeight: 700 }}>€{item.price}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => update(item.id, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16 }}>-</button>
                <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => update(item.id, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16 }}>+</button>
              </div>
              <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Total: €{cart.total}</p>
            <button style={{ ...s.btn(), width: 'auto', padding: '12px 32px' }} onClick={checkout}>Checkout →</button>
          </div>
        </>}
      </div>
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();
  useEffect(() => { axios.get('/api/orders').then(r => setOrders(r.data)); }, []);
  if (!user) return <Navigate to="/login" />;
  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ ...s.page, maxWidth: 700 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Your Orders</h1>
        {orders.length === 0 ? <p style={{ color: '#94a3b8' }}>No orders yet.</p> : orders.map(o => (
          <div key={o.id} style={{ ...s.card, padding: '1rem', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Order #{o.id.split('-')[0]}</span>
              <span style={{ fontSize: 12, background: '#e1f5ee', color: '#085041', padding: '2px 8px', borderRadius: 20 }}>{o.status}</span>
            </div>
            <p style={{ fontWeight: 700, color: '#e94560', marginTop: 4 }}>€{o.total}</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{o.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthPage({ mode }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const handle = async (e) => {
    e.preventDefault(); setErr('');
    try { mode === 'login' ? await login(f.email, f.password) : await register(f.name, f.email, f.password); navigate('/'); }
    catch(err) { setErr(err.response?.data?.error || 'Error'); }
  };
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem', width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{err}</p>}
        <form onSubmit={handle}>
          {mode === 'register' && <input style={s.inp} placeholder="Name" value={f.name} onChange={e => setF({...f,name:e.target.value})} required />}
          <input style={s.inp} type="email" placeholder="Email" value={f.email} onChange={e => setF({...f,email:e.target.value})} required />
          <input style={s.inp} type="password" placeholder="Password" value={f.password} onChange={e => setF({...f,password:e.target.value})} required />
          <button style={s.btn()} type="submit">{mode === 'login' ? 'Sign in' : 'Register'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
          {mode === 'login' ? 'No account? ' : 'Have account? '}
          <Link to={mode === 'login' ? '/register' : '/login'} style={{ color: '#e94560' }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Link>
        </p>
      </div>
    </div>
  );
}

function AppInner() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage mode="login" />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <AuthPage mode="register" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppInner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
