import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Forest from './pages/Forest';
import AddPlant from './pages/AddPlant';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth'; // Импортируем новый компонент

// Верхняя плашка с именем и балансом (вынесем в отдельный мини-компонент для чистоты)
const Header = ({ user }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
    padding: "15px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid rgba(0,0,0,0.05)"
  }}>
    <div style={{ fontWeight: "800", color: "#6A996F", fontSize: "18px" }}>DeForest.</div>
    <div style={{ background: "#E8F5E9", padding: "6px 12px", borderRadius: "20px", color: "#166534", fontSize: "12px", fontWeight: "800" }}>
      {user?.username} • {user?.score} Lf
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверка при загрузке: есть ли юзер в localStorage?
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, [isAuthenticated]); // Перезапускать, если статус авторизации изменился

  return (
    <Router>
      <div style={{ fontFamily: "'Inter', sans-serif", background: "#F7F9FC", minHeight: "100vh", paddingBottom: "100px" }}>
        
        {/* Если НЕ авторизован - показываем только страницу входа */}
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<Auth setIsAuthenticated={setIsAuthenticated} />} />
          </Routes>
        ) : (
          /* Если авторизован - показываем приложение */
          <>
            <Header user={user} />
            <div style={{ paddingTop: "70px" }}> {/* Отступ под Header */}
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