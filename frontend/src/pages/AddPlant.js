import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { QrCode, Camera, CheckCircle, XCircle, Sprout, ScanLine, MapPin, RefreshCw, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const treeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/490/490091.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

// Список деревьев для выбора
const TREE_OPTIONS = [
    "Oak (Дуб)",
    "Pine (Сосна)",
    "Birch (Береза)",
    "Maple (Клен)",
    "Spruce (Ель)",
    "Apple Tree (Яблоня)",
    "Cherry (Вишня)",
    "Wild Tree (Дикое)"
];

const AddPlant = () => {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Waiting for GPS...");
  const [gpsError, setGpsError] = useState(false);

  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrData, setQrData] = useState(null); // Данные из QR

  // Если без QR - пользователь выбирает тип сам
  const [selectedTreeType, setSelectedTreeType] = useState(TREE_OPTIONS[0]);

  const [plantFile, setPlantFile] = useState(null);
  const [plantPreview, setPlantPreview] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const API_BASE_URL = "https://reforest-app.onrender.com";

  const requestLocation = () => {
    setGpsError(false);
    setLocationStatus("Locating you...");
    if (!("geolocation" in navigator)) { setLocationStatus("Geolocation not supported"); setGpsError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocationStatus("GPS Location Found");
        setGpsError(false);
      },
      (err) => {
        console.error(err);
        setGpsError(true);
        if (err.code === 1) setLocationStatus("Permission Denied (Enable GPS)");
        else if (err.code === 2) setLocationStatus("Position Unavailable");
        else setLocationStatus("GPS Error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { if (step === 2) requestLocation(); }, [step]);

  const resetState = () => {
    setError(null); setLoading(false);
    setQrData(null); setFinalResult(null);
    setQrFile(null); setQrPreview(null);
    setPlantFile(null); setPlantPreview(null);
    setDeviceCoords(null);
    setStep(0);
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    if (type === 'qr') { setQrFile(file); setQrPreview(previewUrl); }
    else { setPlantFile(file); setPlantPreview(previewUrl); }
  };

  const handleSkipQr = () => {
    setQrData(null); // QR нет
    setSelectedTreeType(TREE_OPTIONS[0]); // Сброс выбора на первый элемент
    setStep(2);
  };

  const handleVerifyQr = async () => {
    if (!qrFile || !user) return;
    setLoading(true); setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-qr`, { qr_data: "ELM-001", user_id: user.id });
      setQrData({ ...response.data, tree_type: "Elm (Вяз)" }); 
      setStep(2);
    } catch (err) { setError("QR Code Invalid"); } finally { setLoading(false); }
  };

  const handleSubmitPlant = async () => {
    if (!plantFile || !user) return;
    setLoading(true); setError(null);

    const formData = new FormData();
    formData.append("file", plantFile);
    formData.append("username", user.username);
    
    // Определяем имя дерева
    if (qrData) {
        formData.append("tree_type", qrData.tree_type);
        formData.append("qr_code_id", qrData.qr_code);
    } else {
        formData.append("tree_type", selectedTreeType);
    }

    if (deviceCoords) {
      formData.append("lat", deviceCoords.lat);
      formData.append("lon", deviceCoords.lon);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      if (response.data.success) setFinalResult(response.data);
      else setError(response.data.message || "Analysis failed");
    } catch (err) { setError("Server Error"); } finally { setLoading(false); }
  };

  // Styles
  const uploadBoxStyle = { background: "#EFEEEE", borderRadius: "20px", height: "180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "20px", cursor: "pointer", border: "2px solid #E5E7EB", boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff" };
  const buttonStyle = (isActive) => ({ width: "100%", padding: "16px", borderRadius: "30px", background: isActive ? "#6A996F" : "#D1D1D1", border: "none", color: "white", fontWeight: "800", fontSize: "14px", cursor: isActive ? "pointer" : "default", boxShadow: isActive ? "0 4px 10px rgba(106, 153, 111, 0.3)" : "none", transition: "all 0.3s ease" });
  const modeCardStyle = { background: "#EFEEEE", padding: "20px", borderRadius: "20px", marginBottom: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "15px", boxShadow: "5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff", transition: "transform 0.1s" };

  return (
    <div style={{ padding: "20px 24px 120px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "450px", textAlign: "center" }}>
        
        <h2 style={{ color: "#333", fontSize: "18px", fontWeight: "800", marginBottom: "25px", textTransform: "uppercase" }}>
          {step === 0 && "Choose Mode"}
          {step === 1 && "Scan QR"}
          {step === 2 && "Take Photo"}
        </h2>

        {step === 0 && (
          <div style={{ animation: "fadeIn 0.5s" }}>
            <div style={modeCardStyle} onClick={() => setStep(1)}>
              <div style={{ background: "#6A996F", padding: "12px", borderRadius: "12px", color: "white" }}><ScanLine size={24} /></div>
              <div style={{ textAlign: "left" }}><div style={{ fontWeight: "800", color: "#333", fontSize: "15px" }}>I have a QR Tag</div><div style={{ fontSize: "12px", color: "#888", fontWeight: "500" }}>Scan code to identify tree</div></div>
            </div>
            <div style={modeCardStyle} onClick={handleSkipQr}>
              <div style={{ background: "#D4C183", padding: "12px", borderRadius: "12px", color: "white" }}><Sprout size={24} /></div>
              <div style={{ textAlign: "left" }}><div style={{ fontWeight: "800", color: "#333", fontSize: "15px" }}>Plant without QR</div><div style={{ fontSize: "12px", color: "#888", fontWeight: "500" }}>Select tree type & plant</div></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{animation: "fadeIn 0.5s"}}>
             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {qrPreview ? <img src={qrPreview} alt="QR" style={{width:"100%", height:"100%", objectFit:"contain", borderRadius: "15px"}}/> : <div style={{color: "#999", fontWeight: "600"}}><QrCode size={32}/> <br/> Upload QR</div>}
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'qr')} accept="image/*" style={{display:"none"}}/>
             </div>
             <div style={{display: "flex", gap: "10px"}}>
               <button onClick={() => setStep(0)} style={{...buttonStyle(false), background: "#EFEEEE", color: "#888", boxShadow: "none", border: "1px solid #ddd"}}>Back</button>
               <button onClick={handleVerifyQr} disabled={!qrFile || loading} style={buttonStyle(qrFile && !loading)}>{loading ? "Verifying..." : "Next"}</button>
             </div>
          </div>
        )}

        {step === 2 && !finalResult && (
          <div style={{animation: "fadeIn 0.5s"}}>
             
             {/* ВЫБОР ДЕРЕВА (ЕСЛИ БЕЗ QR) */}
             {!qrData ? (
                 <div style={{ marginBottom: "20px", textAlign: "left" }}>
                     <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555", marginLeft: "10px" }}>Select Tree Type:</label>
                     <div style={{ position: "relative", marginTop: "5px" }}>
                         <select 
                            value={selectedTreeType}
                            onChange={(e) => setSelectedTreeType(e.target.value)}
                            style={{ 
                                width: "100%", padding: "12px 15px", borderRadius: "15px", 
                                border: "1px solid #ddd", background: "white", appearance: "none",
                                fontSize: "14px", fontWeight: "600", color: "#333",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                            }}
                         >
                             {TREE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                         </select>
                         <ChevronDown size={16} style={{ position: "absolute", right: "15px", top: "14px", color: "#888", pointerEvents: "none" }}/>
                     </div>
                 </div>
             ) : (
                <div style={{ marginBottom: "20px", padding: "10px", background: "#E8F5E9", borderRadius: "12px", color: "#166534", fontWeight: "700", fontSize: "14px" }}>
                    Verified: {qrData.tree_type}
                </div>
             )}

             {/* GPS СТАТУС */}
             <div style={{ marginBottom: "15px", padding: "10px", borderRadius: "12px", background: deviceCoords ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${deviceCoords ? "#BBF7D0" : "#FECACA"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: deviceCoords ? "#166534" : "#991B1B" }}><MapPin size={16} /> {locationStatus}</div>
                {!deviceCoords && <button onClick={requestLocation} style={{ background: "white", border: "1px solid #ccc", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "bold" }}><RefreshCw size={12}/> Retry</button>}
             </div>

             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {plantPreview ? <img src={plantPreview} alt="Tree" style={{width:"100%", height:"100%", objectFit:"cover", borderRadius: "15px"}}/> : <div style={{color: "#999", fontWeight: "600"}}><Camera size={32}/> <br/> Take Photo</div>}
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'plant')} accept="image/*" style={{display:"none"}}/>
             </div>
             <div style={{display: "flex", gap: "10px"}}>
               <button onClick={() => setStep(0)} style={{...buttonStyle(false), background: "#EFEEEE", color: "#888", boxShadow: "none", border: "1px solid #ddd"}}>Cancel</button>
               <button onClick={handleSubmitPlant} disabled={!plantFile || loading} style={buttonStyle(plantFile && !loading)}>{loading ? "Analyzing..." : "Confirm & Plant"}</button>
             </div>
          </div>
        )}

        {finalResult && (
           <div style={{padding: "25px", background: "#fff", borderRadius: "24px", boxShadow: "0 15px 30px rgba(0,0,0,0.08)", animation: "slideUp 0.5s"}}>
             <CheckCircle color="#6A996F" size={48} style={{marginBottom: "15px"}} />
             <h3 style={{color: "#333", margin: "0 0 10px 0", fontSize: "20px", fontWeight: "900"}}>Perfectly Planted!</h3>
             <p style={{fontSize: "13px", color: "#666", marginBottom: "20px"}}>{finalResult.message}</p>
             {finalResult.coords && (
                <div style={{ height: "200px", borderRadius: "20px", overflow: "hidden", border: "4px solid #EFEEEE" }}><MapContainer center={finalResult.coords} zoom={15} style={{ height: "100%" }} zoomControl={false}><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" /><Marker position={finalResult.coords} icon={treeIcon}></Marker></MapContainer></div>
             )}
             <button onClick={resetState} style={{...buttonStyle(true), marginTop:"25px"}}>Go to Forest</button>
           </div>
        )}
        {error && <div style={{marginTop:"20px", padding: "15px", background: "#FFE4E6", borderRadius: "15px", color:"#9B1C1C", fontWeight: "800", animation: "shake 0.4s"}}>{error}</div>}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }`}</style>
    </div>
  );
};

export default AddPlant;