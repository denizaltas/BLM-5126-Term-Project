import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = ({ token }: { token: string }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'transactions'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [editingIsbn, setEditingIsbn] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({ 
    isbn: '', title: '', author: '', genre: '', price: '', stock: '' 
  });

  const fetchData = async () => {
    try {
      const [orderRes, productRes, transRes] = await Promise.all([
        api.getAllOrders(token),
        api.getProducts(),
        api.getTransactions()
      ]);
      setOrders(orderRes.data);
      setBooks(productRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDeleteBook = async (isbn: string) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await api.deleteBook(isbn);
        fetchData();
      } catch (err) {
        alert("Failed to delete book");
      }
    }
  };

  const renderOrderSummary = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items) return <em style={{color: '#94a3b8'}}>Details unavailable</em>;
    
    return (
      <div className="transaction-items-list">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="transaction-item-row">
            <span className="item-title">{item.bookTitle || item.title || "Unknown Book"}</span>
            <span className="item-details">x{item.quantity} - ${Number(item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchData(); 
    } catch (err) { alert("Status update failed"); }
  };

  const handleRefund = async (orderId: number) => {
    if (window.confirm("Confirm refund?")) {
      try {
        await api.refundOrder(orderId);
        fetchData(); 
      } catch (err) { alert("Refund failed"); }
    }
  };

  const handleUpdateBook = async (isbn: string) => {
    try {
      await api.updateBook(isbn, { price: parseFloat(editForm.price), stock: parseInt(editForm.stock) });
      setEditingIsbn(null);
      fetchData();
    } catch (err) { alert("Update failed"); }
  };

  const stats = {
    revenue: orders.filter(o => o.status === 'PAID').reduce((acc, o) => acc + Number(o.total || 0), 0),
    count: orders.length
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <div className="tab-menu">
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>Orders</button>
          <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'active' : ''}>Inventory</button>
          <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? 'active' : ''}>Transactions</button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">Total Revenue: <strong>${stats.revenue.toFixed(2)}</strong></div>
        <div className="stat">Total Orders: <strong>{stats.count}</strong></div>
      </div>

      {activeTab === 'orders' && (
        <div className="admin-section">
          <h3>Orders Management</h3>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.userFirstName} {o.userLastName}</td>
                  <td>${Number(o.total).toFixed(2)}</td>
                  <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td>
                    {o.status === 'PENDING' && <button className="action-btn cancel" onClick={() => handleUpdateStatus(o.id, 'CANCELLED')}>Cancel</button>}
                    {o.status === 'PAID' && <button className="action-btn refund" onClick={() => handleRefund(o.id)}>Refund</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="admin-section">
          <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
            <h3>Inventory Management</h3>
            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Add Book</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Title</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(b => (
                <tr key={b.isbn}>
                  <td>{b.isbn}</td>
                  <td>{b.title}</td>
                  <td>
                    {editingIsbn === b.isbn ? (
                      <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="inline-edit" />
                    ) : `$${Number(b.price).toFixed(2)}`}
                  </td>
                  <td>
                    {editingIsbn === b.isbn ? (
                      <input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="inline-edit" />
                    ) : <span className={Number(b.stock) <= 3 ? "low-stock" : ""}>{b.stock}</span>}
                  </td>
                  <td className="actions-cell">
                    {editingIsbn === b.isbn ? (
                      <button className="save-inline-btn" onClick={() => handleUpdateBook(b.isbn)}>Save</button>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={() => {
                          setEditingIsbn(b.isbn);
                          setEditForm({ price: b.price.toString(), stock: b.stock.toString() });
                        }}>Edit</button>
                        <button className="del-btn" onClick={() => handleDeleteBook(b.isbn)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="admin-section">
          <h3>Financial Audit Log</h3>
          <table className="admin-table audit-log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Details</th>
                <th>Amount</th>
                <th>Card</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="trans-id">Order #{t.orderId}</div>
                    {renderOrderSummary(t.orderId)}
                  </td>
                  <td><strong>${Number(t.amount).toFixed(2)}</strong></td>
                  <td>**** {t.cardNumber.slice(-4)}</td>
                  <td className="status-cell-container">
                    <span className={`badge ${t.status.toLowerCase()}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Book</h2>
            <form onSubmit={(e) => { e.preventDefault(); api.addBook(newBook).then(() => { setIsModalOpen(false); fetchData(); }); }}>
              <input placeholder="ISBN" onChange={e => setNewBook({...newBook, isbn: e.target.value})} required />
              <input placeholder="Title" onChange={e => setNewBook({...newBook, title: e.target.value})} required />
              <input placeholder="Genre" onChange={e => setNewBook({...newBook, genre: e.target.value})} required />
              <input type="number" placeholder="Price" onChange={e => setNewBook({...newBook, price: e.target.value})} required />
              <input type="number" placeholder="Stock" onChange={e => setNewBook({...newBook, stock: e.target.value})} required />
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save Book</button>
                <button type="button" className="cancel-modal-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;