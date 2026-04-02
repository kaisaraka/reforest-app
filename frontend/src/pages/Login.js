import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';

const API_BASE_URL = "https://reforest-app-72zo.vercel.app/_backend";

const Login = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username });
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/forest"); 
    } catch (error) {
      alert("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: "100vh", background: "#EFEEEE", 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
      padding: "20px", fontFamily: "'Inter', sans-serif", color: "#4F5D52"
    }}>
      
      {/* ЛОГОТИП */}
      <div style={{ marginBottom: "50px", textAlign: "center" }}>
        <div style={{ 
          width: "80px", height: "80px", borderRadius: "50%", background: "#EFEEEE",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto",
          // MЯГКАЯ ТЕНЬ: Прозрачный черный (5%) и белый
          boxShadow: "10px 10px 20px rgba(0,0,0,0.05), -10px -10px 20px rgba(255,255,255,0.8)"
        }}>
          <Sprout size={40} color="#6A996F" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#6A996F", margin: 0, letterSpacing: "-1px" }}>
          ReForest.
        </h1>
      </div>

      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "320px" }}>
        
        {/* INPUT: Нежная внутренняя тень (Inset) */}
        <div style={{ marginBottom: "25px" }}>
          <input 
            type="text" placeholder="Enter nickname" value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%", padding: "18px 25px", borderRadius: "50px", border: "none", 
              fontSize: "16px", outline: "none", background: "#EFEEEE", color: "#4F5D52", fontWeight: "600",
              boxSizing: "border-box", transition: "all 0.3s ease",
              // ОЧЕНЬ ЛЕГКАЯ ВНУТРЕННЯЯ ТЕНЬ
              boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.05), inset -4px -4px 10px rgba(255,255,255,0.8)"
            }}
          />
        </div>
        
        {/* BUTTON: Мягкая внешняя тень */}
        <button 
          type="submit" disabled={loading}
          style={{
            width: "100%", padding: "18px", borderRadius: "50px",
            background: "#6A996F", border: "none", color: "white", fontSize: "16px", fontWeight: "800", 
            letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", transition: "transform 0.1s ease",
            // ТЕНЬ ЦВЕТНАЯ, НО ПРОЗРАЧНАЯ
            boxShadow: "6px 6px 20px rgba(106, 153, 111, 0.3), -6px -6px 20px rgba(255,255,255,0.8)"
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {loading ? "Joining..." : "Get Started"}
        </button>
      </form>
    </div>
  );
};

export default Login;