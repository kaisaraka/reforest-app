import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, X, Sprout, Droplets, GraduationCap, BookOpen, Home } from 'lucide-react';

const API_BASE_URL = "https://reforest-app-72zo.vercel.app/_backend";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [roleFilter, setRoleFilter] = useState('all'); 
  const [shanyraqFilter, setShanyraqFilter] = useState('all');
  
//Алаш
//Алтын Орда
//Аманат
//Атамекен
//Азат
//Әулиеата
//Болашақ
//Е.Сметов
//Жалын
//Каусар
//Көне Тараз
//Парасат
//Ұлытау
//Хан Тәңірі

  const shanyraqs = ["Алаш", "Алтын Орда", "Аманат", "Атамекен", "Азат", "Әулиеата", "Болашақ", "Е.Сметов", "Жалын", "Каусар", "Көне Тараз", "Парасат", "Ұлытау", "Хан Тәңірі"];

  useEffect(() => {
    axios.get(`${API_BASE_URL}/leaderboard`)
         .then(res => setUsers(res.data))
         .catch(err => console.error(err));
  }, []);

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setLoadingHistory(true);
    setHistory([]);

    try {
      const formData = new FormData();
      formData.append("user_id", user.id);
      
      const res = await axios.post(`${API_BASE_URL}/user/history`, formData);
      setHistory(res.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setHistory([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter === 'student') {
      if (user.role !== 'student') return false;
      if (shanyraqFilter !== 'all' && user.shanyraq !== shanyraqFilter) return false;
      return true;
    }
    if (roleFilter === 'teacher') {
      return user.role === 'teacher';
    }
    return true; 
  });

  const filterBtnStyle = (isActive) => ({
    flex: 1, padding: "8px", borderRadius: "10px", border: "none",
    background: isActive ? "#6A996F" : "#EFEEEE",
    color: isActive ? "white" : "#666",
    fontWeight: "bold", cursor: "pointer", fontSize: "13px",
    boxShadow: isActive ? "0 4px 10px rgba(106,153,111,0.3)" : "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8)",
    transition: "0.2s"
  });

  return (
    <div style={{ padding: "0 24px 100px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "20px", color: "#6A996F" }}>
        <Trophy size={32} fill="#D4C183" color="#D4C183" />
        <h2 style={{ margin: "5px 0 0 0", fontSize: "22px", fontWeight: "bold" }}>Leaderboard</h2>
        <p style={{ fontSize: "12px", color: "#888" }}>Tap on a user to see activity</p>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setRoleFilter('all')} style={filterBtnStyle(roleFilter === 'all')}>All</button>
          <button onClick={() => setRoleFilter('student')} style={filterBtnStyle(roleFilter === 'student')}>Students</button>
          <button onClick={() => setRoleFilter('teacher')} style={filterBtnStyle(roleFilter === 'teacher')}>Teachers</button>
        </div>

        {roleFilter === 'student' && (
          <select 
            value={shanyraqFilter} 
            onChange={(e) => setShanyraqFilter(e.target.value)}
            style={{ 
              width: "100%", padding: "10px", borderRadius: "10px", border: "none", outline: "none",
              background: "#EFEEEE", color: "#333", fontWeight: "bold",
              boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8)" 
            }}
          >
            <option value="all">All shanyraqs</option>
            {shanyraqs.map((sh, idx) => (
              <option key={idx} value={sh}>{sh}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ 
        background: "#EFEEEE", borderRadius: "20px", padding: "20px",
        boxShadow: "10px 10px 20px rgba(0,0,0,0.05), -10px -10px 20px rgba(255,255,255,0.8)"
      }}>
        {users.length === 0 ? (
          <div style={{textAlign: "center", color: "#888"}}>Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{textAlign: "center", color: "#888"}}>No one found</div>
        ) : (
          filteredUsers.map((user, index) => (
            <div 
              key={user.id} 
              onClick={() => handleUserClick(user)} 
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#EFEEEE", borderRadius: "12px", padding: "15px", marginBottom: "15px",
                boxShadow: "5px 5px 10px rgba(0,0,0,0.05), -5px -5px 10px rgba(255,255,255,0.8)",
                cursor: "pointer", transition: "transform 0.1s"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ 
                    fontSize: "16px", fontWeight: "900", 
                    color: index === 0 ? "#D4C183" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "#888", 
                    width: "24px", textAlign: "center" 
                }}>
                    {index + 1}
                </div>
                <div>
                  <div style={{ fontWeight: "800", color: "#333", fontSize: "15px" }}>{user.username}</div>
                  
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    {user.role === 'teacher' ? (
                      <span style={{ fontSize: "10px", background: "#E8F5E9", color: "#166534", padding: "2px 6px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "3px" }}>
                        <BookOpen size={10}/> Teacher
                      </span>
                    ) : user.role === 'student' ? (
                      <>
                        <span style={{ fontSize: "10px", background: "#F0F2F5", color: "#555", padding: "2px 6px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "3px" }}>
                          <GraduationCap size={10}/> Student
                        </span>
                        {user.shanyraq && (
                          <span style={{ fontSize: "10px", background: "#E0F2FE", color: "#0284c7", padding: "2px 6px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Home size={10}/> {user.shanyraq}
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{ color: "#6A996F", fontWeight: "800", fontSize: "16px" }}>{user.score} Lf</div>
            </div>
          ))
        )}
      </div>

      {selectedUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          animation: "fadeIn 0.2s"
        }} onClick={closeModal}>
          
          <div style={{ 
            background: "#fff", width: "100%", maxWidth: "350px", borderRadius: "24px", padding: "25px",
            position: "relative", animation: "slideUp 0.3s", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "transparent", border: "none", cursor: "pointer", color: "#888" }}>
              <X size={20} />
            </button>

            <h3 style={{ margin: "0 0 5px 0", fontSize: "20px", fontWeight: "800", color: "#333" }}>{selectedUser.username}</h3>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "13px" }}>Last 3 Activities</p>

            {loadingHistory ? (
              <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>Loading...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "20px", background: "#f9f9f9", borderRadius: "12px" }}>
                No recent activity.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px", borderRadius: "12px", background: "#F7F9FC", border: "1px solid #eee"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ 
                          padding: "8px", borderRadius: "8px", 
                          background: item.action === "planted" ? "#E8F5E9" : "#E0F2FE",
                          color: item.action === "planted" ? "#166534" : "#0284c7"
                      }}>
                        {item.action === "planted" ? <Sprout size={16}/> : <Droplets size={16}/>}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#333" }}>
                            {item.action === "planted" ? "Planted Tree" : "Watered Tree"}
                        </div>
                        <div style={{ fontSize: "10px", color: "#888" }}>{formatDate(item.timestamp)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#6A996F" }}>+{item.points}</div>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={closeModal} style={{ width: "100%", marginTop: "20px", padding: "12px", borderRadius: "15px", border: "none", background: "#EFEEEE", color: "#555", fontWeight: "bold", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Leaderboard;