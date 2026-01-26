import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Droplets, Clock, AlertTriangle, MapPin, Leaf, Calendar, History, Camera } from 'lucide-react';

const TREE_IMG_URL = 'https://cdn-icons-png.flaticon.com/512/490/490091.png';

const createTreeIcon = (status, isSelected) => {
  const size = isSelected ? 42 : 32;
  const anchor = [size / 2, size];
  let filterStyle = "";
  if (status === 'yellow') filterStyle = "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)";
  else if (status === 'red') filterStyle = "grayscale(1) sepia(1) saturate(4) hue-rotate(-50deg) brightness(0.9)";
  if (isSelected) filterStyle += " drop-shadow(0px 0px 3px rgba(255,255,255,0.8))";

  return new L.DivIcon({
    className: '',
    html: `<img src="${TREE_IMG_URL}" style="width:${size}px; height:${size}px; filter: ${filterStyle}; transition: all 0.3s ease;" alt="tree"/>`,
    iconSize: [size, size],
    iconAnchor: anchor,
    popupAnchor: [0, -size]
  });
};

const createZoneIcon = () => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#48bb78" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
  return new L.DivIcon({ className: 'zone-center-icon', html: svgIcon, iconSize: [24, 24], iconAnchor: [12, 12] });
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
};

const Forest = () => {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const [watering, setWatering] = useState(false); // Статус загрузки полива
  
  const fileInputRef = useRef(null); // Ссылка на input для фото полива
  const user = JSON.parse(localStorage.getItem("user"));

  const center = [42.8953, 71.3737];
  const recommendedZone = { center: [42.881651, 71.319433], radius: 400 };

  const fetchTrees = async () => {
      try {
        const res = await axios.get("https://reforest-app.onrender.com/forest");
        setTrees(res.data);
        // Обновляем выбранное дерево, чтобы видеть новую историю сразу
        if (selectedTree) {
            const updated = res.data.find(t => t.id === selectedTree.id);
            if (updated) setSelectedTree(updated);
        }
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTrees();
    const interval = setInterval(fetchTrees, 5000);
    return () => clearInterval(interval);
  }, []); // убрал selectedTree из зависимостей чтобы не мигало

  // 🔥 ОБРАБОТКА ФОТО ПОЛИВА
  const handleWaterFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTree || !user) return;

    setWatering(true);
    const formData = new FormData();
    formData.append("tree_id", selectedTree.id);
    formData.append("username", user.username);
    formData.append("file", file);

    try {
        await axios.post("https://reforest-app.onrender.com/water", formData);
        alert("Thanks for watering! +1 Lf 💧");
        fetchTrees(); // Обновляем данные сразу
    } catch (err) {
        alert("Error watering tree");
        console.error(err);
    } finally {
        setWatering(false);
    }
  };

  const getStatusColor = (status) => { if (status === 'red') return '#e53e3e'; if (status === 'yellow') return '#d69e2e'; return '#38a169'; };

  return (
    <div style={{ padding: "0 24px 120px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", marginTop: "10px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: "800", color: "#333", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Forest Map</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {showRecommended && <div style={{ display: "flex", alignItems: "center", gap: "6px", animation: "fadeIn 0.3s ease" }}><Leaf size={14} color="#48bb78" fill="#48bb78" /><span style={{ fontSize: "10px", fontWeight: "800", color: "#333" }}>AREA</span></div>}
          <button onClick={() => setShowRecommended(!showRecommended)} style={{ background: showRecommended ? "#6A996F" : "#E0E0E0", color: showRecommended ? "white" : "#555", border: "none", borderRadius: "20px", padding: "6px 12px", fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={12} /> {showRecommended ? "Hide" : "Areas"}</button>
        </div>
      </div>

      <div style={{ height: "350px", borderRadius: "20px", overflow: "hidden", position: "relative", boxShadow: "inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff", border: "4px solid #EFEEEE" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", background: "#222" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {showRecommended && <><Circle center={recommendedZone.center} radius={recommendedZone.radius} pathOptions={{ stroke: false, fillColor: '#48bb78', fillOpacity: 0.15 }} interactive={false} /><Marker position={recommendedZone.center} icon={createZoneIcon()} interactive={false} /></>}
          {trees.map(t => (<Marker key={t.id} position={t.pos} icon={createTreeIcon(t.status, selectedTree && selectedTree.id === t.id)} eventHandlers={{ click: () => setSelectedTree(t) }} />))}
        </MapContainer>
      </div>

      {selectedTree && (
        <div style={{ marginTop: "25px", background: "#EFEEEE", borderRadius: "16px", padding: "20px", border: `2px solid ${getStatusColor(selectedTree.status)}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", animation: "slideUp 0.3s ease-out" }}>
          <button onClick={() => setSelectedTree(null)} style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", border: "none", cursor: "pointer", color: "#888" }}><X size={18} /></button>
          
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            {selectedTree.image_data ? (
                <div style={{ width: "70px", height: "70px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.1)", background: "#ddd" }}>
                    <img src={`data:image/jpeg;base64,${selectedTree.image_data}`} alt="Tree" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
            ) : (<div style={{ width: "70px", height: "70px", borderRadius: "12px", background: "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center" }}><Leaf color="white" /></div>)}

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "900", color: "#2d3748" }}>{selectedTree.tree_type}</h3>
              <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#718096", fontWeight: "500" }}>By {selectedTree.user}</p>
              <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#555" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Droplets size={12} color="#3182ce"/> {selectedTree.water_amount}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: getStatusColor(selectedTree.status), fontWeight: "bold" }}><Clock size={12}/> {selectedTree.days_left}d left</div>
              </div>
            </div>
          </div>

          {/* ИСТОРИЯ ПОЛИВА */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#555", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}><History size={14}/> Care History</div>
            <div style={{ background: "white", borderRadius: "10px", padding: "10px", maxHeight: "100px", overflowY: "auto" }}>
                {selectedTree.history && selectedTree.history.length > 0 ? (
                    selectedTree.history.slice().reverse().map((event, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {event.image_data ? (
                                    <img src={`data:image/jpeg;base64,${event.image_data}`} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} alt="proof"/>
                                ) : (<div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#eee" }}></div>)}
                                <div>
                                    <div style={{ fontWeight: "700", color: "#333" }}>{event.username}</div>
                                    <div style={{ color: "#888", fontSize: "10px" }}>{formatDate(event.timestamp)}</div>
                                </div>
                            </div>
                            <Droplets size={12} color="#3182ce" />
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", color: "#aaa", fontSize: "11px", padding: "10px" }}>No history yet. Be the first!</div>
                )}
            </div>
          </div>

          {/* КНОПКА ПОЛИВА (СКРЫТЫЙ INPUT) */}
          <input type="file" ref={fileInputRef} onChange={handleWaterFileSelect} accept="image/*" style={{ display: "none" }} />
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={watering}
            style={{ width: "100%", background: watering ? "#ccc" : "#3182ce", color: "white", border: "none", padding: "12px 20px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", cursor: watering ? "wait" : "pointer", boxShadow: "4px 4px 10px rgba(49, 130, 206, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {watering ? "Uploading Proof..." : <><Camera size={16}/> Water it (Upload Photo)</>}
          </button>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default Forest;