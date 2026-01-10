import axios from 'axios';

const PRODUCT_URL = 'http://localhost:3002';
const ORDER_URL = 'http://localhost:3003';
const USER_URL = 'http://localhost:3004';
const PAYMENT_URL = 'http://localhost:3005';

export const api = {
  // USER SERVICE
  login: (credentials: any) => axios.post(`${USER_URL}/login`, credentials),
  register: (data: any) => axios.post(`${USER_URL}/register`, data),

  // PRODUCT SERVICE
  getProducts: () => axios.get(`${PRODUCT_URL}/products`),
  addBook: (bookData: any) => axios.post(`${PRODUCT_URL}/products`, bookData),

  // ORDER SERVICE
  placeOrder: (orderData: any, token: string) => 
    axios.post(`${ORDER_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    
  getMyOrders: (token: string) => 
    axios.get(`${ORDER_URL}/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getAllOrders: (token: string) => 
    axios.get(`${ORDER_URL}/admin/orders`, { 
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  // PAYMENT SERVICE 
  processPayment: (paymentData: { orderId: number; amount: number; cardDetails: any }) => 
    axios.post(`${PAYMENT_URL}/process-payment`, paymentData),
};