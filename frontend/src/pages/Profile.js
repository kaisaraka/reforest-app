import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    // Удаляем юзера и идем на логин
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div style={{ padding: "0 24px", fontFamily: "'Inter', sans-serif" }}>
      
      <h2 style={{ 
        color: "#4F5D52", fontSize: "20px", fontWeight: "bold", 
        marginTop: "10px", marginBottom: "30px", textAlign: "center", textTransform: "uppercase" 
      }}>
        My Profile
      </h2>

      {/* КАРТОЧКА ПРОФИЛЯ (Выпуклая) */}
      <div style={{ 
        background: "#EFEEEE", borderRadius: "20px", padding: "30px 20px",
        boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff",
        display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px"
      }}>
        
        {/* Аватарка (Вдавленная) */}
        <div style={{ 
          width: "100px", height: "100px", borderRadius: "50%",
          background: "#EFEEEE", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff",
          marginBottom: "20px", color: "#6A996F"
        }}>
          <UserIcon size={50} strokeWidth={1.5} />
        </div>

        <h3 style={{ margin: "0", fontSize: "24px", color: "#4F5D52", fontWeight: "800" }}>
          {user.username}
        </h3>
        
        <div style={{ 
          display: "flex", alignItems: "center", gap: "5px", 
          color: "#8898aa", fontSize: "14px", marginTop: "5px", fontWeight: "500" 
        }}>
          <MapPin size={14} /> Taraz, Kazakhstan
        </div>

        {/* Статистика */}
        <div style={{ 
          display: "flex", gap: "40px", marginTop: "30px", width: "100%", justifyContent: "center" 
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#6A996F" }}>{user.score / 50}</div>
            <div style={{ fontSize: "11px", color: "#8898aa", fontWeight: "bold", letterSpacing: "1px" }}>TREES</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#D4C183" }}>{user.score}</div>
            <div style={{ fontSize: "11px", color: "#8898aa", fontWeight: "bold", letterSpacing: "1px" }}>LEAVES</div>
          </div>
        </div>

      </div>

      {/* КНОПКА ВЫХОДА (Красная, мягкая) */}
      <button 
        onClick={handleLogout}
        style={{
          width: "100%", padding: "18px", borderRadius: "16px",
          background: "#EFEEEE", color: "#e53e3e", border: "none",
          fontWeight: "bold", fontSize: "16px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          // Тень делает её кнопкой
          boxShadow: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff",
          transition: "0.2s"
        }}
        onMouseDown={(e) => e.currentTarget.style.boxShadow = "inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff"} // Эффект нажатия
        onMouseUp={(e) => e.currentTarget.style.boxShadow = "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff"}
      >
        <LogOut size={20} /> Switch Account
      </button>

    </div>
  );
};

export default Profile;