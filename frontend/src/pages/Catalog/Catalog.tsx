import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Catalog.css';

const Catalog = ({ token }: { token: string | null }) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.getProducts().then(res => setProducts(res.data));
  }, []);

  const handleBuy = async (isbn: string) => {
    if (!token) return alert("Please login first!");
    try {
      await api.placeOrder({ items: [{ bookIsbn: isbn, quantity: 1 }] }, token);
      alert("Order placed!");
      const res = await api.getProducts();
      setProducts(res.data);
    } catch (err) { alert("Order failed"); }
  };

  return (
    <div className="book-grid">
      {products.map(p => (
  <div key={p.isbn} className="book-card">
    <div className="image-square">
      <span>Book Cover</span>
    </div>
    <div className="book-info">
      <h3>{p.title}</h3>
      <p className="price">${p.price}</p>
      
      <div className="cart-controls">
        <input type="number" defaultValue={1} min={1} className="qty-input" />
        <button className="add-btn">Add to Cart</button>
      </div>
    </div>
  </div>
))}
    </div>
  );
};

export default Catalog;