import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Globe } from 'lucide-react'; // Добавили Globe
import BottomNav from './components/BottomNav';
import Forest from './pages/Forest';
import AddPlant from './pages/AddPlant';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

// Импортируем наш движок перевода
import { LanguageProvider, useLanguage } from './LanguageContext';

// Хедер с переключателем языка
const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage(); // Достаем функции из движка

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
        padding: "15px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
    }}>
        <div style={{ fontWeight: "900", color: "#6A996F", fontSize: "20px" }}>ReForest.</div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА */}
            <button 
                onClick={() => changeLanguage(language === 'en' ? 'ru' : 'en')}
                style={{ background: "#F0F2F5", border: "none", padding: "6px 10px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#555", fontWeight: "bold", fontSize: "12px" }}
            >
                <Globe size={14}/> {language.toUpperCase()}
            </button>

            <div onClick={() => navigate("/profile")} style={{ background: "#E8F5E9", padding: "6px 12px", borderRadius: "20px", color: "#166534", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <UserIcon size={14}/> {user?.username} • {user?.score} Lf
            </div>
            <button onClick={onLogout} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e53e3e", padding: "5px" }}>
                <LogOut size={20} />
            </button>
        </div>
    </div>
  );
};

// Главный компонент (Внутренности App)
const MainApp = () => {
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
    if (!user || !user.id) return;
    const interval = setInterval(() => {
      const formData = new FormData();
      formData.append("user_id", user.id);
      axios.post("https://reforest-app.onrender.com/user/refresh", formData)
        .then(res => {
          if (res.data.score !== user.score) {
            const updatedUser = { ...user, score: res.data.score };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        })
        .catch(err => {
          if (err.response && err.response.status === 404) handleLogout();
        });
    }, 3000); 
    return () => clearInterval(interval);
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
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/forest" />} />
              </Routes>
            </div>
            <BottomNav />
          </>
        )}
      </div>
    </Router>
  );
};

// Оборачиваем всё в LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

export default App;