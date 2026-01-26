import React from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const score = user ? user.score : 0;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "#EFEEEE" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <Link to="/profile" style={{
          width: "40px", height: "40px", borderRadius: "50%", background: "#EFEEEE",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#6A996F", transition: "0.2s",
          // МЯГКАЯ ТЕНЬ КНОПКИ
          boxShadow: "5px 5px 10px rgba(0,0,0,0.05), -5px -5px 10px rgba(255,255,255,0.8)"
        }}>
          <User size={20} strokeWidth={2.5} />
        </Link>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#6A996F", letterSpacing: "-0.5px" }}>
          ReForest.
        </h1>
      </div>

      <div style={{ 
        background: "#EFEEEE", color: "#4F5D52", padding: "8px 16px", borderRadius: "20px",
        fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px",
        // МЯГКАЯ ВНУТРЕННЯЯ ТЕНЬ (INSET)
        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8)"
      }}>
        <span style={{ color: "#6A996F" }}>●</span> {score} Lf
      </div>
    </div>
  );
};

export default Header;