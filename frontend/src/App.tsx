import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Catalog from './pages/Catalog/Catalog';
import LoginPage from './pages/LoginPage/LoginPage';
import Orders from './pages/Orders/Orders';
import CartView from './pages/Cart/CartView';
import PaymentPage from './pages/Payment/Payment';
import AdminDashboard from './pages/Admin/AdminDashboard';

interface CartItem {
  bookIsbn: string;
  title: string;
  price: number;
  quantity: number;
}

type ViewType = 'catalog' | 'login' | 'orders' | 'cart' | 'payment' | 'admin';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  //const [view, setView] = useState<'catalog' | 'login' | 'orders' | 'cart' | 'payment'>('catalog');
  const [view, setView] = useState<ViewType>('catalog');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products] = useState<any[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('role'));

  const handleLogin = (data: any) => {
    console.log("Data received from server:", data);
    setToken(data.token);
    setUserRole(data.role); 
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role); 
    setView('catalog');
  };

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    setMyOrders([]); 
    setCart([]);    
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setView('catalog');
  };

  const addToCart = (product: any, qty: number) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.bookIsbn === product.isbn);
      if (existing) {
        return prevCart.map(item => 
          item.bookIsbn === product.isbn ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prevCart, { bookIsbn: product.isbn, title: product.title, price: product.price, quantity: qty }];
    });
    alert(`${product.title} added to cart!`);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="app-wrapper">
      <Navbar 
        setView={setView} 
        token={token} 
        userRole={userRole}
        onLogout={handleLogout} 
        cart={cart}
      />
      
      <div className="container">
        {view === 'admin' && userRole === 'ADMIN' ? (
          <AdminDashboard token={token!} />
        ) : view === 'admin' ? (
          <div>Access Denied: You are not an admin.</div>
        ) : null}

        {view === 'catalog' && (
          <Catalog 
          token={token} 
          addToCart={addToCart} 
          />
          )}
        
        {view === 'cart' && (
          <CartView 
            cart={cart} 
            setCart={setCart} 
            token={token} 
            setView={setView} 
            setCurrentOrderId={setCurrentOrderId}
          />
        )}

        {view === 'payment' && (
          <PaymentPage 
            orderId={currentOrderId}
            total={cartTotal}
            setView={setView}
            onPaymentSuccess={() => {
              setCart([]);
              setView('orders');
            }}
          />
        )}

        {view === 'login' && <LoginPage onLoginSuccess={handleLogin} />}
        
        {view === 'orders' && token && (
          <Orders 
            token={token} 
            orders={myOrders} 
            setOrders={setMyOrders} 
            products={products}
          />
        )}
      </div>
    </div>
  );
}

export default App;