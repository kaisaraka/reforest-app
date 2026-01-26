import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { User, Sprout, Droplets, Star, RefreshCw } from 'lucide-react';

const Profile = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  // Функция загрузки истории
  const fetchHistory = useCallback(() => {
    if (user && user.id) {
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user.id);

      axios.post("https://reforest-app.onrender.com/user/history", formData)
        .then(res => {
          setHistory(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  // Загружаем при открытии страницы
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  if (!user) return <div style={{padding: "20px", textAlign:"center"}}>Please log in</div>;

  return (
    <div style={{ padding: "0 24px 100px 24px" }}>
      {/* Шапка профиля */}
      <div style={{ textAlign: "center", marginBottom: "30px", marginTop: "20px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px auto", border: "3px solid #6A996F" }}>
            <User size={40} color="#166534"/>
        </div>
        <h2 style={{ margin: "0", fontSize: "24px", fontWeight: "900", color: "#333" }}>{user.username}</h2>
        
        {/* Очки + Кнопка обновить */}
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#6A996F", color: "white", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px", boxShadow: "0 4px 10px rgba(106,153,111,0.4)" }}>
                <Star size={16} fill="white"/> {user.score} Lf
            </div>
            <button onClick={fetchHistory} style={{ background: "white", border: "1px solid #ddd", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#666" }}>
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      {/* Заголовок истории */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
         <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#555", margin: 0 }}>Activity History</h3>
      </div>
      
      {loading ? (
        <div style={{textAlign: "center", color: "#888", padding: "20px"}}>Loading history...</div>
      ) : history.length === 0 ? (
        <div style={{textAlign: "center", color: "#888", padding: "20px", background: "#f5f5f5", borderRadius: "15px"}}>No activity yet. Start planting! 🌱</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((item, index) => (
                <div key={index} style={{ 
                    background: "white", padding: "15px", borderRadius: "16px", 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #eee",
                    animation: `fadeIn 0.3s ease ${index * 0.1}s forwards`, opacity: 0
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ 
                            width: "40px", height: "40px", borderRadius: "12px", 
                            background: item.action === "planted" ? "#E8F5E9" : "#E0F2FE",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: item.action === "planted" ? "#166534" : "#0284c7"
                        }}>
                            {item.action === "planted" ? <Sprout size={20}/> : <Droplets size={20}/>}
                        </div>
                        <div>
                            <div style={{ fontWeight: "700", color: "#333", fontSize: "14px" }}>
                                {item.action === "planted" ? "Planted a Tree" : "Watered a Tree"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#888", display: "flex", alignItems: "center", gap: "4px" }}>
                                {item.details}
                            </div>
                            <div style={{ fontSize: "10px", color: "#aaa" }}>
                                {formatDate(item.timestamp)}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontWeight: "800", color: "#6A996F", fontSize: "14px" }}>
                        +{item.points}
                    </div>
                </div>
            ))}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default Profile;