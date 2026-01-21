import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // ИСПРАВЛЕНА ССЫЛКА
    axios.get("https://reforest-app.onrender.com/leaderboard")
         .then(res => setUsers(res.data))
         .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px", color: "#6A996F" }}>
        <Trophy size={32} fill="#D4C183" color="#D4C183" />
        <h2 style={{ margin: "5px 0 0 0", fontSize: "22px", fontWeight: "bold" }}>Leaderboard</h2>
      </div>

      <div style={{ 
        background: "#EFEEEE", borderRadius: "20px", padding: "20px",
        boxShadow: "10px 10px 20px rgba(0,0,0,0.05), -10px -10px 20px rgba(255,255,255,0.8)"
      }}>
        {users.length === 0 ? (
          <div style={{textAlign: "center", color: "#888"}}>Loading...</div>
        ) : (
          users.map((user, index) => (
            <div key={user.id} style={{ 
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#EFEEEE", borderRadius: "12px", padding: "15px", marginBottom: "15px",
              boxShadow: "5px 5px 10px rgba(0,0,0,0.05), -5px -5px 10px rgba(255,255,255,0.8)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#888", width: "20px" }}>#{index + 1}</div>
                <div>
                  <div style={{ fontWeight: "800", color: "#333", fontSize: "15px" }}>{user.username}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>{user.score > 0 ? `${user.score / 50} trees` : "No trees"}</div>
                </div>
              </div>
              <div style={{ color: "#6A996F", fontWeight: "800", fontSize: "16px" }}>{user.score} Lf</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Leaderboard;