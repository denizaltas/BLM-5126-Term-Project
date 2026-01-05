import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Catalog from './pages/Catalog/Catalog';
import LoginPage from './pages/LoginPage/LoginPage';
import Orders from './pages/Orders/Orders';
import CartView from './pages/Cart/CartView';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'catalog' | 'login' | 'orders' | 'cart'>('catalog');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{bookIsbn: string, title: string, price: number, quantity: number}[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setView('catalog');
  };

  const handleLogout = () => {
    setToken(null);
    setMyOrders([]);
    localStorage.removeItem('token');
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

  return (
    <div className="app-wrapper">
      <Navbar 
      setView={setView} 
      token={token} 
      onLogout={handleLogout} 
      cart={cart}
      />
      
      <div className="container">
        {view === 'catalog' && <Catalog token={token} addToCart={addToCart} />}
        {view === 'cart' && <CartView cart={cart} setCart={setCart} token={token} setView={setView} />}
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