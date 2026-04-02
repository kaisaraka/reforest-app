import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Sprout, Droplets, Star, RefreshCw, GraduationCap, BookOpen, Home, Mail } from 'lucide-react';

const API_BASE_URL = "https://reforest-app-72zo.vercel.app/_backend";

const Profile = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const fetchHistory = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser || !currentUser.id) return;
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", currentUser.id);

      const userRes = await axios.post(`${API_BASE_URL}/user/refresh`, formData);
      const updatedUser = { ...currentUser, score: userRes.data.score };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      const historyRes = await axios.post(`${API_BASE_URL}/user/history`, formData);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  if (!user) return <div style={{padding: "20px", textAlign:"center"}}>Please log in</div>;

  return (
    <div style={{ padding: "0 24px 100px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "30px", marginTop: "20px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px auto", border: "3px solid #6A996F" }}>
            <User size={40} color="#166534"/>
        </div>
        
        <h2 style={{ margin: "0", fontSize: "24px", fontWeight: "900", color: "#333" }}>{user.username}</h2>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          {user.role && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#F0F2F5", color: "#555", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
              {user.role === 'teacher' ? <BookOpen size={14}/> : <GraduationCap size={14}/>}
              {user.role === 'teacher' ? 'Teacher' : 'Student'}
            </div>
          )}

          {user.role === 'student' && user.shanyraq && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#E8F5E9", color: "#166534", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
              <Home size={14}/>
              {user.shanyraq}
            </div>
          )}

          {user.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#F0F2F5", color: "#555", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
              <Mail size={14}/>
              {user.email}
            </div>
          )}
        </div>

        <div style={{ marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#6A996F", color: "white", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px", boxShadow: "0 4px 10px rgba(106,153,111,0.4)" }}>
                <Star size={16} fill="white"/> {user.score} Lf
            </div>
            <button onClick={fetchHistory} style={{ background: "white", border: "1px solid #ddd", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#666" }}>
                <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
        </div>
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#555", marginBottom: "15px" }}>Activity History</h3>
      
      {loading && history.length === 0 ? (
        <div style={{textAlign: "center", color: "#888", padding: "20px"}}>Loading history...</div>
      ) : history.length === 0 ? (
        <div style={{textAlign: "center", color: "#888", padding: "20px", background: "#f5f5f5", borderRadius: "15px"}}>
           No activity found for {user.username}. <br/> Try planting a tree!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((item, index) => (
                <div key={index} style={{ 
                    background: "white", padding: "15px", borderRadius: "16px", 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #eee"
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

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Profile;