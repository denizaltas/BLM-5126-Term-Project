import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Catalog from './pages/Catalog/Catalog';
import LoginPage from './pages/LoginPage/LoginPage';
import Orders from './pages/Orders/Orders';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'catalog' | 'login' | 'orders'>('catalog');
  const [myOrders, setMyOrders] = useState<any[]>([]);

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

  return (
    <div className="app-wrapper">
      <Navbar setView={setView} token={token} onLogout={handleLogout} />
      
      <div className="container">
        {view === 'catalog' && <Catalog token={token} />}
        {view === 'login' && <LoginPage onLoginSuccess={handleLogin} />}
        {view === 'orders' && token && (
          <Orders 
            token={token} 
            orders={myOrders} 
            setOrders={setMyOrders} 
          />
        )}
      </div>
    </div>
  );
}

export default App;