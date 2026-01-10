import axios from 'axios';

const PRODUCT_URL = 'http://localhost:3002';
const ORDER_URL = 'http://localhost:3003';
const USER_URL = 'http://localhost:3004';
const PAYMENT_URL = 'http://localhost:3005';

export const api = {
  login: (credentials: any) => axios.post(`${USER_URL}/login`, credentials),
  register: (data: any) => axios.post(`${USER_URL}/register`, data),

  getProducts: () => axios.get(`${PRODUCT_URL}/products`),

  placeOrder: (orderData: any, token: string) => 
    axios.post(`${ORDER_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    
  getMyOrders: (token: string) => 
    axios.get(`${ORDER_URL}/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
    processPayment: (paymentData: { orderId: number; amount: number; cardDetails: any }) => 
    axios.post(`${PAYMENT_URL}/process-payment`, paymentData)
};
