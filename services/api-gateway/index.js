const SERVICES = {    
  PRODUCT: 'http://localhost:3002', 
  ORDER: 'http://localhost:3003',  
  USER: 'http://localhost:3004' 
};

app.use('/auth', createProxyMiddleware({ 
  target: SERVICES.USER, 
  changeOrigin: true,
  pathRewrite: { '^/auth': '' } 
}));

app.use('/products', createProxyMiddleware({ 
  target: SERVICES.PRODUCT, 
  changeOrigin: true,
  pathRewrite: { '^/products': '' } 
}));

app.use('/orders', createProxyMiddleware({ 
  target: SERVICES.ORDER, 
  changeOrigin: true,
  pathRewrite: { '^/orders': '' } 
}));