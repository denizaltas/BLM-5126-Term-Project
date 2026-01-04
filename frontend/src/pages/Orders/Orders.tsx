import { useEffect } from 'react';
import { api } from '../../services/api';
import './Orders.css';

interface OrdersProps {
  token: string | null;
  orders: any[];
  setOrders: (orders: any[]) => void;
}

const Orders = ({ token, orders, setOrders }: OrdersProps) => {
  useEffect(() => {
    if (token) {
      api.getMyOrders(token)
        .then(res => setOrders(res.data))
        .catch(err => console.error("Failed to fetch orders:", err));
    }
  }, [token, setOrders]);

  return (
    <div className="container"> 
      <div className="order-list">
        {orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          orders.map(o => (
            <div key={o.id} className="amazon-card">
              <div className="order-header">
                <div className="header-column">
                  <span className="label">ORDER PLACED</span>
                  <span className="value">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="header-column">
                  <span className="label">TOTAL</span>
                  <span className="value">${o.total}</span>
                </div>
                <div className="header-column">
                  <span className="label">ORDER # {o.id}</span>
                </div>
              </div>
              <div className="order-body">
                {o.items.map((item: any) => (
                  <div className="order-item" key={item.id}>
                    <div className="item-square">Book</div>
                    <div className="item-details">
                      <strong>ISBN: {item.bookIsbn}</strong>
                      <p>Quantity: {item.quantity} — Price: ${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;