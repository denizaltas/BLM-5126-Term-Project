import './CartView.css';
import { api } from '../../services/api';
import EmptyState from '../../components/EmptyState/EmptyState';

const CartView = ({ cart, setCart, token, setView }: any) => {
  const total = cart.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!token) {
      alert("Please login to checkout");
      setView('login');
      return;
    }
    try {
      const orderData = {
        items: cart.map((item: any) => ({
          bookIsbn: item.bookIsbn,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        }))
      };
      await api.placeOrder(orderData, token);
      alert("Order placed successfully!");
      setCart([]); 
      setView('orders');
    } catch (err) {
      alert("Checkout failed");
    }
  };

  return (
    <div className="cart-container">
      
      {cart.length === 0 ? (
        <EmptyState 
          message="Your shopping cart is empty!" 
          actionText="Go Shopping" 
          onAction={() => setView('catalog')} 
          icon="🛒"
        />
      ) : (
        <>
        <h2>Shopping Cart</h2>
        <div className="cart-layout">
          <div className="cart-items">
  {cart.map((item: any) => (
    <div key={item.bookIsbn} className="cart-item-card">
      <div className="item-main-content">
        <div className="item-img-placeholder">
          <span>Book</span>
        </div>
        
        <div className="item-details">
          <h3 className="item-title">{item.title}</h3>
          <div className="item-meta">
            <span className="item-price-unit">${item.price} each</span>
            <span className="item-qty">Qty: {item.quantity}</span>
          </div>
        </div>
      </div>

      <div className="item-actions">
        <span className="item-subtotal">${(item.price * item.quantity).toFixed(2)}</span>
        <button 
          onClick={() => setCart(cart.filter((i: any) => i.bookIsbn !== item.bookIsbn))} 
          className="remove-link"
        >
          Remove from cart
        </button>
      </div>
    </div>
  ))}
</div>
          <div className="cart-summary">
            <h3>Subtotal: ${total.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default CartView;