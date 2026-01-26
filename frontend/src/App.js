import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import BottomNav from './components/BottomNav';
import Forest from './pages/Forest';
import AddPlant from './pages/AddPlant';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

// Хедер
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

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  // 1. Загрузка при старте
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // 2. 🔥 АВТО-ОБНОВЛЕНИЕ ОЧКОВ (POLLING)
  useEffect(() => {
    // Если пользователя нет, ничего не делаем
    if (!user || !user.id) return;

    // Запускаем интервал каждые 3000 мс (3 секунды)
    const interval = setInterval(() => {
      const formData = new FormData();
      formData.append("user_id", user.id);

      axios.post("https://reforest-app.onrender.com/user/refresh", formData)
        .then(res => {
          // Если очки на сервере отличаются от того, что у нас на экране
          if (res.data.score !== user.score) {
            console.log("Score updated!", res.data.score);
            
            // Обновляем состояние и память
            const updatedUser = { ...user, score: res.data.score };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        })
        .catch(err => {
          // Если сервер ответил, что пользователя нет (404) - выкидываем
          if (err.response && err.response.status === 404) {
            handleLogout();
          }
        });
    }, 3000); 

    // Очищаем интервал при уходе со страницы
    return () => clearInterval(interval);
  }, [user]); // Перезапуск, если user изменился

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
}

export default App;