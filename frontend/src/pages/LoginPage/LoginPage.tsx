import React, { useState } from 'react';
import { api } from '../../services/api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await api.login({ 
          email: form.email, 
          password: form.password 
        });
        const token = response.data.token;
        onLoginSuccess(token);
        alert("Welcome back!");
      } else {
        await api.register(form);
        alert("Account created successfully! Please sign in.");
        setIsLogin(true); 
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(isLogin ? "Login failed. Please check your credentials." : "Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="login-card">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="subtitle">
          {isLogin ? "Sign in to your account" : "Join our bookstore community"}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="First Name" 
                value={form.firstName}
                onChange={e => setForm({...form, firstName: e.target.value})} 
                required
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                value={form.lastName}
                onChange={e => setForm({...form, lastName: e.target.value})} 
                required
              />
            </>
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
            required
          />
          
          <button type="submit">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;