import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // Импортируем иконку выхода
import BottomNav from './components/BottomNav';
import Forest from './pages/Forest';
import AddPlant from './pages/AddPlant';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';

// --- ХЕДЕР (С кнопкой выхода) ---
const Header = ({ user, onLogout }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
    padding: "15px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid rgba(0,0,0,0.05)"
  }}>
    {/* Логотип */}
    <div style={{ fontWeight: "800", color: "#6A996F", fontSize: "18px" }}>DeForest.</div>
    
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {/* Баланс и Имя */}
      <div style={{ background: "#E8F5E9", padding: "6px 12px", borderRadius: "20px", color: "#166534", fontSize: "12px", fontWeight: "800" }}>
        {user?.username} • {user?.score} Lf
      </div>

      {/* Кнопка Выхода */}
      <button 
        onClick={onLogout}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#e53e3e", padding: "5px"
        }}
        title="Log Out"
      >
        <LogOut size={20} />
      </button>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Функция полного выхода (сбрасываем всё)
  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("user"); // Чистим память
    setUser(null);
    setIsAuthenticated(false);
  };

  // 1. ПЕРВИЧНАЯ ЗАГРУЗКА: Достаем юзера из памяти телефона
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // 2. 🔥 ЗАЩИТА ОТ "ЗОМБИ" (Авто-выход, если юзера нет в базе)
  useEffect(() => {
    if (user && user.id) {
      // Делаем проверочный запрос. Используем verify-qr с фейковым кодом.
      // Нам важен не код QR, а ответ сервера про User ID.
      axios.post("https://reforest-app.onrender.com/verify-qr", {
        qr_data: "CHECK_USER_ALIVE", 
        user_id: user.id
      })
      .then(() => {
        // Если 200 OK — значит юзер жив. Всё супер.
      })
      .catch(err => {
        // Если ошибка 404 (User not found) — значит юзера удалили из базы!
        if (err.response && (err.response.status === 404 || err.response.data.detail === "User not found")) {
          console.warn("User deleted from server. Auto-logging out.");
          handleLogout(); // <--- АВТОМАТИЧЕСКИ ВЫКИДЫВАЕМ
        }
      });
    }
  }, [user]); 

  return (
    <Router>
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#F7F9FC", minHeight: "100vh", paddingBottom: "100px" }}>
        
        {/* Если НЕ авторизован - показываем страницу входа */}
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<Auth setIsAuthenticated={setIsAuthenticated} />} />
          </Routes>
        ) : (
          /* Если авторизован - показываем приложение */
          <>
            {/* Передаем функцию выхода в Хедер */}
            <Header user={user} onLogout={handleLogout} />
            
            <div style={{ paddingTop: "70px" }}> 
              <Routes>
                <Route path="/forest" element={<Forest />} />
                <Route path="/plant" element={<AddPlant />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
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