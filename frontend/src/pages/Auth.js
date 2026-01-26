import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Leaf, User, Lock, ArrowRight } from 'lucide-react';

const Auth = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true); // Переключатель Вход / Регистрация
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/login" : "/register";
    
    try {
      const response = await axios.post(`https://reforest-app.onrender.com${endpoint}`, {
        username,
        password
      });

      // Если успех
      localStorage.setItem("user", JSON.stringify(response.data));
      setIsAuthenticated(true);
      navigate("/forest"); // Перекидываем в лес
    } catch (err) {
      setError(err.response?.data?.detail || "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  // СТИЛИ
  const containerStyle = {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "24px",
    background: "#f7f7f7"
  };

  const cardStyle = {
    background: "white", padding: "30px", borderRadius: "24px",
    width: "100%", maxWidth: "400px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    textAlign: "center"
  };

  const inputGroupStyle = {
    background: "#F0F2F5", borderRadius: "16px", padding: "12px 16px",
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px",
    border: "2px solid transparent", transition: "0.2s"
  };

  const inputStyle = {
    border: "none", background: "transparent", outline: "none",
    width: "100%", fontSize: "15px", fontWeight: "600", color: "#333"
  };

  const buttonStyle = {
    width: "100%", padding: "16px", borderRadius: "20px",
    background: "#6A996F", color: "white", border: "none",
    fontSize: "16px", fontWeight: "800", textTransform: "uppercase",
    letterSpacing: "1px", cursor: "pointer", marginTop: "10px",
    boxShadow: "0 8px 20px rgba(106, 153, 111, 0.4)",
    display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
  };

  return (
    <div style={containerStyle}>
      {/* Логотип */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
        <div style={{ background: "#6A996F", padding: "10px", borderRadius: "12px" }}>
           <Leaf color="white" size={28} />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#333", margin: 0 }}>ReForest.</h1>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#333", marginBottom: "5px" }}>
          {isLogin ? "Welcome Back!" : "Join the Mission"}
        </h2>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "25px" }}>
          {isLogin ? "Enter your details to access your forest." : "Create an account to start planting."}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={inputGroupStyle}>
            <User size={20} color="#888" />
            <input 
              type="text" placeholder="Username" 
              value={username} onChange={e => setUsername(e.target.value)}
              style={inputStyle} required
            />
          </div>

          {/* Password */}
          <div style={inputGroupStyle}>
            <Lock size={20} color="#888" />
            <input 
              type="password" placeholder="Password" 
              value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} required
            />
          </div>

          {error && <div style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "15px", fontWeight: "600" }}>{error}</div>}

          <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.7 : 1}}>
            {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")} <ArrowRight size={18}/>
          </button>
        </form>

        {/* Переключатель */}
        <div style={{ marginTop: "20px", fontSize: "13px", color: "#666" }}>
          {isLogin ? "New here? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: "transparent", border: "none", color: "#6A996F", fontWeight: "800", cursor: "pointer" }}
          >
            {isLogin ? "Create Account" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;