import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = ({ token }: { token: string }) => {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0 });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await api.getAllOrders(token); // You'll need to add this to api.ts
        setAllOrders(res.data);
        
        // Simple calculation for stats
        const total = res.data
          .filter((o: any) => o.status === 'PAID')
          .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
        
        setStats({ totalSales: total, orderCount: res.data.length });
      } catch (err) {
        console.error("Admin access denied");
      }
    };
    fetchAdminData();
  }, [token]);

  return (
    <div className="admin-container">
      <h1>Admin Control Center</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Revenue</span>
          <p className="revenue">${stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <span>Total Orders</span>
          <p>{stats.orderCount}</p>
        </div>
      </div>

      <div className="admin-table-container">
        <h3>Recent Transactions</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer ID</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>User {order.userId}</td>
                <td>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>${order.totalAmount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;