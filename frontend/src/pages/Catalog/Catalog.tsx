import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Catalog.css';

interface CatalogProps {
  token: string | null;
  addToCart: (product: any, qty: number) => void;
}

const Catalog = ({ token, addToCart }: CatalogProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    api.getProducts().then(res => setProducts(res.data));
  }, []);

  const handleQtyChange = (isbn: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({ ...prev, [isbn]: qty }));
  };

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
              <input 
                type="number" 
                value={quantities[p.isbn] || 1} 
                min={1} 
                max={p.stock}
                className="qty-input" 
                onChange={(e) => handleQtyChange(p.isbn, e.target.value)}
              />
              <button 
                className="add-btn"
                disabled={p.stock <= 0}
                onClick={() => addToCart(p, quantities[p.isbn] || 1)}
              >
                {p.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Catalog;