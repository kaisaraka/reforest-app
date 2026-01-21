import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Droplets, Clock, AlertTriangle, MapPin, Leaf } from 'lucide-react';

// URL картинки дерева
const TREE_IMG_URL = 'https://cdn-icons-png.flaticon.com/512/490/490091.png';

// --- ИКОНКА ДЕРЕВА ---
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

// --- ИКОНКА ЛЕПЕСТКА ДЛЯ ЦЕНТРА ЗОНЫ ---
const createZoneIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#48bb78" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  `;
  return new L.DivIcon({ className: 'zone-center-icon', html: svgIcon, iconSize: [24, 24], iconAnchor: [12, 12] });
};

const Forest = () => {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const center = [42.8953, 71.3737];
  const recommendedZone = { center: [42.881651, 71.319433], radius: 400 };

  useEffect(() => {
    const fetchTrees = async () => {
      try {
        const res = await axios.get("https://https://reforest-app.onrender.comonrender.com/forest");
        setTrees(res.data);
        setSelectedTree(prev => prev ? res.data.find(t => t.id === prev.id) || prev : null);
      } catch (err) { console.error(err); }
    };
    fetchTrees();
    const interval = setInterval(fetchTrees, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWater = () => { alert("Watering logic needs backend implementation!"); setSelectedTree(null); };
  const getStatusColor = (status) => { if (status === 'red') return '#e53e3e'; if (status === 'yellow') return '#d69e2e'; return '#38a169'; };

  return (
    <div style={{ padding: "0 24px 120px 24px" }}>
      
      {/* ХЕДЕР СТРАНИЦЫ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", marginTop: "10px" }}>
        
        {/* ЛЕВАЯ ЧАСТЬ */}
        <h2 style={{ fontSize: "13px", fontWeight: "800", color: "#333", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
          Forest Map
        </h2>

        {/* ПРАВАЯ ЧАСТЬ: Легенда + Кнопка */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          {/* ЛЕГЕНДА С ТИРЕ */}
          {showRecommended && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", animation: "fadeIn 0.3s ease" }}>
              <Leaf size={14} color="#48bb78" fill="#48bb78" />
              
              {/* Тире */}
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#333" }}>-</span>
              
              {/* Текст */}
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#333", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recommended Area
              </span>
            </div>
          )}

          {/* Кнопка переключения */}
          <button 
            onClick={() => setShowRecommended(!showRecommended)}
            style={{
              background: showRecommended ? "#6A996F" : "#E0E0E0",
              color: showRecommended ? "white" : "#555",
              border: "none", borderRadius: "20px", padding: "6px 12px",
              fontSize: "11px", fontWeight: "700", cursor: "pointer",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px",
              boxShadow: showRecommended ? "0 3px 8px rgba(106, 153, 111, 0.3)" : "none"
            }}
          >
            <MapPin size={12} /> {showRecommended ? "Hide" : "Areas"}
          </button>
        </div>

      </div>

      {/* КАРТА */}
      <div style={{ height: "350px", borderRadius: "20px", overflow: "hidden", position: "relative", boxShadow: "inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff", border: "4px solid #EFEEEE" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", background: "#222" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          
          {showRecommended && (
            <>
              {/* Круг */}
              <Circle 
                center={recommendedZone.center} 
                radius={recommendedZone.radius}
                pathOptions={{ stroke: false, fillColor: '#48bb78', fillOpacity: 0.15 }} 
                interactive={false}
              />
              {/* Иконка лепестка */}
              <Marker position={recommendedZone.center} icon={createZoneIcon()} interactive={false} />
            </>
          )}

          {trees.map(t => (
            <Marker key={t.id} position={t.pos} icon={createTreeIcon(t.status, selectedTree && selectedTree.id === t.id)} eventHandlers={{ click: () => setSelectedTree(t) }} />
          ))}
        </MapContainer>
      </div>

      {/* КАРТОЧКА ДЕРЕВА */}
      {selectedTree && (
        <div style={{ marginTop: "25px", background: "#EFEEEE", borderRadius: "16px", padding: "20px", border: `2px solid ${getStatusColor(selectedTree.status)}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", animation: "slideUp 0.3s ease-out" }}>
          <button onClick={() => setSelectedTree(null)} style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", border: "none", cursor: "pointer", color: "#888" }}><X size={18} /></button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "900", color: "#2d3748" }}>{selectedTree.tree_type}</h3>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#718096", fontWeight: "500" }}>Owner: {selectedTree.user}</p>
              <div style={{ display: "flex", gap: "15px", fontSize: "12px", color: "#555" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Droplets size={14} color="#3182ce"/> {selectedTree.water_amount}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: getStatusColor(selectedTree.status), fontWeight: "bold" }}><Clock size={14}/> {selectedTree.days_left <= 0 ? "Urgent!" : `${selectedTree.days_left} days left`}</div>
              </div>
            </div>
            <button onClick={handleWater} style={{ background: "#6A996F", color: "white", border: "none", padding: "10px 20px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "4px 4px 10px rgba(106, 153, 111, 0.3)", marginTop: "10px" }}>Water it</button>
          </div>
          {selectedTree.status === 'red' && <div style={{ marginTop: "10px", fontSize: "11px", color: "#e53e3e", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={12}/> Needs water urgently!</div>}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .zone-center-icon svg { filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); }
      `}</style>
    </div>
  );
};

export default Forest;