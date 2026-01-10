import './Navbar.css';

const Navbar = ({ setView, token, userRole, onLogout, cart }: any) => {
  const itemCount = cart.reduce((total: number, item: any) => total + item.quantity, 0);

  return (
    <nav className="main-nav">
      <div className="nav-logo" onClick={() => setView('catalog')}>
        <span className="icon">📚</span>
        <span className="text">BookStore</span>
      </div>

      <div className="nav-links">
        <button className="nav-btn" onClick={() => setView('catalog')}>Catalog</button>
        
        <button className="nav-btn cart-link" onClick={() => setView('cart')}>
          Cart {itemCount > 0 && <span className="cart-badge">({itemCount})</span>}
        </button>

        {token && (
          <button className="nav-btn" onClick={() => setView('orders')}>My Orders</button>
        )}
        
        {token && userRole === 'ADMIN' && (
          <button className="nav-btn admin-nav-link" onClick={() => setView('admin')}>
            Admin Panel
          </button>
        )}

        {!token ? (
          <button className="login-btn" onClick={() => setView('login')}>Sign In</button>
        ) : (
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;