import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const getButtonStyle = (isActive) => ({
    flex: 1, textAlign: "center", padding: "16px 0", borderRadius: "30px",
    textDecoration: "none", fontWeight: "800", fontSize: "14px", letterSpacing: "1px", color: "white",
    transition: "0.2s",
    background: isActive ? "#6A996F" : "#D4C183",
    // МЯГКИЕ ТЕНИ ДЛЯ КНОПОК
    boxShadow: isActive 
      ? "0 10px 25px -5px rgba(106, 153, 111, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)" 
      : "0 8px 15px -5px rgba(212, 193, 131, 0.4)",
    transform: isActive ? "translateY(-2px)" : "none"
  });

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      padding: '20px 24px 30px 24px', 
      background: 'linear-gradient(to top, #EFEEEE 80%, transparent)',
      display: 'flex', gap: '15px', zIndex: 1000
    }}>
      <Link to="/forest" style={getButtonStyle(path === '/forest' || path === '/')}>FOREST</Link>
      <Link to="/plant" style={getButtonStyle(path === '/plant')}>PLANT</Link>
      <Link to="/leaderboard" style={getButtonStyle(path === '/leaderboard')}>TOP USERS</Link>
    </div>
  );
};

export default BottomNav;