import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Catalog.css';

interface CatalogProps {
  token: string | null;
  addToCart: (product: any, qty: number) => void;
}

const Catalog = ({ token, addToCart }: CatalogProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(200); 

  useEffect(() => {
    api.getProducts().then(res => {
      setProducts(res.data);
      setFilteredProducts(res.data);
    }).catch(err => console.error("Ürünler çekilemedi:", err));
  }, []);

  useEffect(() => {
    let result = products.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedGenre !== 'All') {
      result = result.filter(p => p.genre === selectedGenre);
    }

    result = result.filter(p => Number(p.price) <= maxPrice);

    setFilteredProducts(result);
  }, [searchTerm, selectedGenre, maxPrice, products]);

  const handleQtyChange = (isbn: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({ ...prev, [isbn]: qty }));
  };

  const genres = ['All', ...new Set(products.map(p => p.genre))];

  return (
    <div className="catalog-page">
      <div className="filter-controls">
        <input 
          type="text" 
          placeholder="Search books or authors..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        
        <select 
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)} 
          className="filter-select"
        >
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <div className="price-range">
          <span>Max Price: <strong>${maxPrice}</strong></span>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(Number(e.target.value))} 
          />
        </div>
      </div>

      <div className="book-grid">
        {filteredProducts.map(p => {
          const isSoldOut = Number(p.stock) <= 0;
          const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 3;
          
          return (
            <div key={p.isbn} className="book-card">
              <div className="image-square">
                <span>Book Cover</span>
                {isSoldOut && <div className="sold-out-overlay">SOLD OUT</div>}
              </div>

              <div className="book-info">
                <h3>{p.title}</h3>
                
                {isLowStock && (
                  <p className="low-stock-alert">Only {p.stock} left!</p>
                )}

                <p className="price">${Number(p.price).toFixed(2)}</p>
                
                <div className="cart-controls">
                  <input 
                    type="number" 
                    value={quantities[p.isbn] || 1} 
                    min={1} 
                    max={p.stock}
                    disabled={isSoldOut}
                    className="qty-input" 
                    onChange={(e) => handleQtyChange(p.isbn, e.target.value)}
                  />
                  <button 
                    className="add-btn"
                    disabled={isSoldOut}
                    onClick={() => addToCart(p, quantities[p.isbn] || 1)}
                  >
                    {isSoldOut ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filteredProducts.length === 0 && (
        <div className="no-results">No books found matching your criteria.</div>
      )}
    </div>
  );
};

export default Catalog;