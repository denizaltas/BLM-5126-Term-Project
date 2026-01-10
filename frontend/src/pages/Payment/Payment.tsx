import React, { useState } from 'react';
import './Payment.css';
import { api } from '../../services/api';

interface PaymentPageProps {
  orderId: number | null;
  total: number;
  onPaymentSuccess: () => void;
  setView: (view: any) => void;
}

const PaymentPage = ({ orderId, total, onPaymentSuccess, setView }: PaymentPageProps) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState(''); 
  const [cardHolder, setCardHolder] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const formatted = input.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    setExpiry(input.substring(0, 5));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    try {
      const payload = {
        orderId: orderId,
        amount: total,
        cardDetails: {
          number: cardNumber,
          cvv: cvv,
          cardHolder: cardHolder,
          expiry: expiry
        }
      };

      const response = await api.processPayment(payload);

      if (response.data.success) {
        alert("Ödeme Başarılı!");
        onPaymentSuccess();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Kart bilgileri yanlış";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page-container">
      <div className="payment-modal">
        <button className="close-btn" onClick={() => setView('cart')}>✕</button>
        
        <h2>Checkout</h2>
        
        <div className="payment-summary">
          <span>Paying for Order </span>
          <span className="payment-amount">${total.toFixed(2)}</span>
        </div>

        <form onSubmit={handlePay} className="payment-form">
          <div className="input-group">
            <label>Cardholder Name</label>
            <input 
              required
              type="text" 
              placeholder="Full Name"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Card Number</label>
            <input 
              required
              type="text" 
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
            />
          </div>

          <div className="row">
            <div className="input-group">
              <label>Expiry</label>
              <input 
                required
                type="text" 
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
              />
            </div>
            
            <div className="input-group">
              <label>CVV</label>
              <input 
                required
                type="password" 
                placeholder="123"
                maxLength={3}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button type="submit" className="confirm-pay-btn" disabled={loading}>
            {loading ? "Verifying..." : `Pay $${total.toFixed(2)}`}
          </button>
        </form>
        
        <p className="security-note">🔒 Encrypted Secure Transaction</p>
      </div>
    </div>
  );
};

export default PaymentPage;