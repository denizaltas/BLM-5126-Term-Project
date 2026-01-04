import './Navbar.css';

const Navbar = ({ setView, token, onLogout }: any) => (
  <nav className="main-nav">
    <div className="nav-logo" onClick={() => setView('catalog')}>
      <span className="icon">📚</span>
      <span className="text">BookStore</span>
    </div>
    <div className="nav-links">
      <button className="nav-btn" onClick={() => setView('catalog')}>Catalog</button>
      {token && (
        <button className="nav-btn" onClick={() => setView('orders')}>My Orders</button>
      )}
      {!token ? (
        <button className="login-btn" onClick={() => setView('login')}>Sign In</button>
      ) : (
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      )}
    </div>
  </nav>
);

export default Navbar;