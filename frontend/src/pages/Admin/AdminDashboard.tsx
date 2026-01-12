import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = ({ token }: { token: string }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  const [editingIsbn, setEditingIsbn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({ 
    isbn: '', 
    title: '', 
    author: '', 
    genre: '', 
    price: '', 
    stock: '' 
  });

  const fetchData = async () => {
    try {
      const orderRes = await api.getAllOrders(token);
      const productRes = await api.getProducts();
      setOrders(orderRes.data);
      setBooks(productRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Update order status
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      alert(`Order #${orderId} updated to ${newStatus}`);
      fetchData(); 
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Yeni kitap ekle
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addBook(newBook);
      alert("Book added successfully!");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error adding book");
    }
  };

  const handleUpdateBook = async (isbn: string) => {
  try {
    await api.updateBook(isbn, {
      price: parseFloat(editForm.price),
      stock: parseInt(editForm.stock)
    });
    alert("Book updated!");
    setEditingIsbn(null);
    fetchData();
  } catch (err) {
    alert("Update failed");
  }
};

  const handleDeleteBook = async (isbn: string) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await api.deleteBook(isbn);
        fetchData();
      } catch (err) {
        alert("Failed to delete");
      }
    }
  };

  const handleRefund = async (orderId: number) => {
  if (window.confirm("Are you sure you want to refund this order? This will return money to the customer's card.")) {
    try {
      await api.refundOrder(orderId);
      alert("Refund Successful! Card balance updated.");
      fetchData(); 
    } catch (err) {
      alert("Refund process failed. Check backend connectivity.");
    }
  }
};

  const stats = {
    revenue: orders
      .filter(o => o.status === 'PAID')
      .reduce((acc, o) => acc + Number(o.total || 0), 0),
    count: orders.length
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <div className="tab-menu">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={activeTab === 'orders' ? 'active' : ''}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={activeTab === 'inventory' ? 'active' : ''}
          >
            Inventory
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">Total Revenue: <strong>${stats.revenue.toFixed(2)}</strong></div>
        <div className="stat">Total Orders: <strong>{stats.count}</strong></div>
      </div>

      {activeTab === 'orders' ? (
        <div className="admin-section">
          <h3>Recent Orders</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
  <tr key={o.id}>
    <td>#{o.id}</td>
    <td>{o.userFirstName} {o.userLastName}</td>
    <td>${Number(o.total).toFixed(2)}</td>
    <td>
      <span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span>
    </td>
    <td>
      {o.status === 'PENDING' && (
        <button 
          className="action-btn cancel" 
          onClick={() => handleUpdateStatus(o.id, 'CANCELLED')}
        >
          Cancel Order
        </button>
      )}
      {o.status === 'PAID' && (
  <button 
    className="action-btn refund" 
    onClick={() => handleRefund(o.id)}
  >
    Issue Refund
  </button>
)}
    </td>
  </tr>
))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-section">
          <div className="section-header">
            <h3>Manage Books</h3>
            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add Book</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Title</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(b => (
  <tr key={b.isbn}>
    <td>{b.isbn}</td>
    <td>{b.title}</td>
    <td>
      {editingIsbn === b.isbn ? (
        <input 
          type="number" 
          value={editForm.price} 
          onChange={e => setEditForm({...editForm, price: e.target.value})} 
        />
      ) : `$${b.price}`}
    </td>
    <td>
      {editingIsbn === b.isbn ? (
        <input 
          type="number" 
          value={editForm.stock} 
          onChange={e => setEditForm({...editForm, stock: e.target.value})} 
        />
      ) : b.stock}
    </td>
    <td>
      {editingIsbn === b.isbn ? (
        <button className="save-btn" onClick={() => handleUpdateBook(b.isbn)}>Save</button>
      ) : (
        <button className="edit-btn" onClick={() => {
          setEditingIsbn(b.isbn);
          setEditForm({ price: b.price.toString(), stock: b.stock.toString() });
        }}>Edit</button>
      )}
      <button className="del-btn" onClick={() => handleDeleteBook(b.isbn)}>Delete</button>
    </td>
  </tr>
))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Book</h2>
            <form onSubmit={handleAddBook}>
              <input placeholder="ISBN" onChange={e => setNewBook({...newBook, isbn: e.target.value})} required />
    <input placeholder="Title" onChange={e => setNewBook({...newBook, title: e.target.value})} required />
    <input placeholder="Author" onChange={e => setNewBook({...newBook, author: e.target.value})} required />
    <input placeholder="Genre" onChange={e => setNewBook({...newBook, genre: e.target.value})} required />
    <input type="number" step="0.01" placeholder="Price" onChange={e => setNewBook({...newBook, price: e.target.value})} required />
    <input type="number" placeholder="Stock Amount" onChange={e => setNewBook({...newBook, stock: e.target.value})} required />
              <div className="modal-actions">
  <button type="submit" className="save-btn">Save Book</button>
  <button 
    type="button" 
    className="cancel-modal-btn" 
    onClick={() => setIsModalOpen(false)}
  >
    Cancel
  </button>
</div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;