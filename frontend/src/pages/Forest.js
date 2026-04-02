import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Droplets, Clock, MapPin, Leaf, Camera, Trophy, History } from 'lucide-react';

const TREE_IMG_URL = 'https://cdn-icons-png.flaticon.com/512/490/490091.png';

const createTreeIcon = (status, isSelected) => {
  const size = isSelected ? 48 : 32; 
  const anchor = [size / 2, size];
  let filterStyle = "";
  
  if (status === 'yellow') filterStyle = "sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)";
  else if (status === 'red') filterStyle = "grayscale(1) sepia(1) saturate(4) hue-rotate(-50deg) brightness(0.9)";
  
  if (isSelected) filterStyle += " drop-shadow(0px 5px 15px rgba(106, 153, 111, 0.6))"; 

  return new L.DivIcon({
    className: '',
    html: `<img src="${TREE_IMG_URL}" style="width:${size}px; height:${size}px; filter: ${filterStyle}; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);" alt="tree"/>`,
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
  const [watering, setWatering] = useState(false); 
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  const fileInputRef = useRef(null); 
  const user = JSON.parse(localStorage.getItem("user"));

  const center = [42.8953, 71.3737];
  const recommendedZone = { center: [42.881651, 71.319433], radius: 400 };

  const fetchTrees = async () => {
      try {
        const res = await axios.get("http://localhost:8000/forest");
        setTrees(res.data);
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
  }, []); 

  const handleWaterFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTree || !user) return;

    setWatering(true);
    const formData = new FormData();
    formData.append("tree_id", selectedTree.id);
    formData.append("username", user.username);
    formData.append("file", file);

    try {
        await axios.post("http://localhost:8000/water", formData);
        
        setEarnedPoints(30);
        setShowSuccess(true);
        
        fetchTrees(); 
    } catch (err) {
        alert("Error watering tree");
        console.error(err);
    } finally {
        setWatering(false);
    }
  };

  const getStatusColor = (status) => { if (status === 'red') return '#EF4444'; if (status === 'yellow') return '#F59E0B'; return '#10B981'; };

  return (
    <div style={{ padding: "0 24px 120px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", marginTop: "10px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#333", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Forest Map</h2>
        <button onClick={() => setShowRecommended(!showRecommended)} style={{ background: showRecommended ? "#6A996F" : "#fff", color: showRecommended ? "white" : "#555", border: "1px solid #eee", borderRadius: "20px", padding: "8px 14px", fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <MapPin size={14} /> {showRecommended ? "Hide Areas" : "Show Areas"}
        </button>
      </div>

      <div style={{ height: "400px", borderRadius: "24px", overflow: "hidden", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "4px solid #fff" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", background: "#e5e7eb" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {showRecommended && <><Circle center={recommendedZone.center} radius={recommendedZone.radius} pathOptions={{ stroke: false, fillColor: '#48bb78', fillOpacity: 0.2 }} interactive={false} /><Marker position={recommendedZone.center} icon={createZoneIcon()} interactive={false} /></>}
          {trees.map(t => (<Marker key={t.id} position={t.pos} icon={createTreeIcon(t.status, selectedTree && selectedTree.id === t.id)} eventHandlers={{ click: () => setSelectedTree(t) }} />))}
        </MapContainer>
      </div>

      {selectedTree && (
        <div style={{ marginTop: "20px", background: "#fff", borderRadius: "24px", padding: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", position: "relative", animation: "slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <button onClick={() => setSelectedTree(null)} style={{ position: "absolute", top: "15px", right: "15px", background: "#F3F4F6", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}>
            <X size={16} />
          </button>
          
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            {selectedTree.image_data ? (
                <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                    <img src={selectedTree.image_data} alt="Tree" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
            ) : (<div style={{ width: "80px", height: "80px", borderRadius: "16px", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}><Leaf color="#9CA3AF" /></div>)}

            <div style={{ flex: 1, paddingRight: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                 <span style={{ fontSize: "10px", fontWeight: "800", background: getStatusColor(selectedTree.status), color: "white", padding: "2px 8px", borderRadius: "10px" }}>
                    {selectedTree.status === 'green' ? 'HEALTHY' : 'NEEDS WATER'}
                 </span>
                 <span style={{ fontSize: "10px", color: "#9CA3AF" }}>ID: {selectedTree.id}</span>
              </div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "900", color: "#1F2937" }}>{selectedTree.tree_type}</h3>
              <p style={{ margin: "0", fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>Planted by <b style={{color: "#333"}}>{selectedTree.user}</b></p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
             <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#DBEAFE", padding: "8px", borderRadius: "10px", color: "#3B82F6" }}><Droplets size={18}/></div>
                <div><div style={{fontSize:"11px", color:"#6B7280", fontWeight:"600"}}>Water Needed</div><div style={{fontSize:"14px", fontWeight:"800", color:"#333"}}>{selectedTree.water_amount}</div></div>
             </div>
             <div style={{ background: "#F9FAFB", padding: "12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: selectedTree.status === 'green' ? "#D1FAE5" : "#FEE2E2", padding: "8px", borderRadius: "10px", color: selectedTree.status === 'green' ? "#10B981" : "#EF4444" }}><Clock size={18}/></div>
                <div><div style={{fontSize:"11px", color:"#6B7280", fontWeight:"600"}}>Next Watering</div><div style={{fontSize:"14px", fontWeight:"800", color:"#333"}}>{selectedTree.days_left} days</div></div>
             </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#374151", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><History size={16}/> Recent Care</div>
            <div style={{ background: "#F9FAFB", borderRadius: "16px", padding: "10px", maxHeight: "120px", overflowY: "auto", border: "1px solid #F3F4F6" }}>
                {selectedTree.history && selectedTree.history.length > 0 ? (
                    selectedTree.history.slice().reverse().map((event, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: idx !== selectedTree.history.length - 1 ? "1px solid #E5E7EB" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {event.image_data ? (
                                    <img src={event.image_data} style={{ width: "32px", height: "32px", borderRadius: "10px", objectFit: "cover" }} alt="proof"/>
                                ) : (<div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#E5E7EB" }}></div>)}
                                <div>
                                    <div style={{ fontWeight: "700", color: "#374151", fontSize: "12px" }}>{event.username}</div>
                                    <div style={{ color: "#9CA3AF", fontSize: "10px" }}>{formatDate(event.timestamp)}</div>
                                </div>
                            </div>
                            <div style={{ background: "#DBEAFE", color: "#2563EB", padding: "4px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: "700" }}>+30 Lf</div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: "12px", padding: "15px" }}>No history yet. Be the first hero!</div>
                )}
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleWaterFileSelect} accept="image/*" style={{ display: "none" }} />
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={watering}
            style={{ width: "100%", background: watering ? "#9CA3AF" : "#3B82F6", color: "white", border: "none", padding: "16px", borderRadius: "20px", fontSize: "14px", fontWeight: "800", cursor: watering ? "wait" : "pointer", boxShadow: watering ? "none" : "0 8px 20px rgba(59, 130, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "transform 0.1s" }}
            onMouseDown={(e) => !watering && (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => !watering && (e.currentTarget.style.transform = "scale(1)")}
          >
            {watering ? "Uploading Proof..." : <><Camera size={20}/> Water this Tree</>}
          </button>
        </div>
      )}

      {showSuccess && (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
            animation: "fadeIn 0.3s"
        }}>
            <div style={{
                background: "white", borderRadius: "30px", padding: "30px", textAlign: "center", width: "100%", maxWidth: "320px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
                <div style={{ width: "80px", height: "80px", background: "#D1FAE5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                    <Trophy size={40} color="#059669" fill="#059669" />
                </div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: "900", color: "#111" }}>Awesome!</h3>
                <p style={{ margin: "0 0 25px 0", color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                    You watered the tree successfully. <br/> Here is your reward:
                </p>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#059669", marginBottom: "30px" }}>
                    +{earnedPoints} Lf
                </div>
                <button 
                    onClick={() => setShowSuccess(false)}
                    style={{ width: "100%", padding: "15px", borderRadius: "18px", background: "#111", color: "white", fontSize: "14px", fontWeight: "bold", border: "none", cursor: "pointer" }}
                >
                    Continue
                </button>
            </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 
            0% { opacity: 0; transform: scale(0.3); } 
            50% { opacity: 1; transform: scale(1.05); } 
            70% { transform: scale(0.9); } 
            100% { transform: scale(1); } 
        }
        .zone-center-icon svg { filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); }
      `}</style>
    </div>
  );
};

export default Forest;