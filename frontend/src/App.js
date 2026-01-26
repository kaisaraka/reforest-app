import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import BottomNav from './components/BottomNav';
import Forest from './pages/Forest';
import AddPlant from './pages/AddPlant';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile'; // 🔥 Импорт

// Хедер обновлен: имя теперь кликабельное
const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
        padding: "15px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
    }}>
        <div style={{ fontWeight: "800", color: "#6A996F", fontSize: "18px" }}>DeForest.</div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Клик по плашке открывает профиль */}
        <div onClick={() => navigate("/profile")} style={{ background: "#E8F5E9", padding: "6px 12px", borderRadius: "20px", color: "#166534", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <UserIcon size={14}/> {user?.username} • {user?.score} Lf
        </div>

        <button onClick={onLogout} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e53e3e", padding: "5px" }} title="Log Out">
            <LogOut size={20} />
        </button>
        </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (user && user.id) {
      axios.post("https://reforest-app.onrender.com/verify-qr", {
        qr_data: "CHECK_USER_ALIVE", 
        user_id: user.id
      }).catch(err => {
        if (err.response && (err.response.status === 404 || err.response.data.detail === "User not found")) {
          handleLogout();
        }
      });
    }
  }, [user]); 

  return (
    <Router>
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#F7F9FC", minHeight: "100vh", paddingBottom: "100px" }}>
        
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<Auth setIsAuthenticated={setIsAuthenticated} />} />
          </Routes>
        ) : (
          <>
            <Header user={user} onLogout={handleLogout} />
            <div style={{ paddingTop: "70px" }}> 
              <Routes>
                <Route path="/forest" element={<Forest />} />
                <Route path="/plant" element={<AddPlant />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} /> {/* 🔥 Новый маршрут */}
                <Route path="*" element={<Navigate to="/forest" />} />
              </Routes>
            </div>
            <BottomNav />
          </>
        )}
      </div>
    </Router>
  );
}

export default App;