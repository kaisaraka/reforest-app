import React, { useState, useRef } from 'react';
import axios from 'axios';
import { QrCode, Camera, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Иконка дерева для карты
const treeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/490/490091.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const AddPlant = () => {
  const [step, setStep] = useState(1); // 1=QR, 2=Photo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrData, setQrData] = useState(null); // Данные о дереве из QR

  const [plantFile, setPlantFile] = useState(null);
  const [plantPreview, setPlantPreview] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  // СБРОС
  const resetState = () => {
    setError(null); setLoading(false);
    setQrData(null); setFinalResult(null);
    setQrFile(null); setQrPreview(null);
    setPlantFile(null); setPlantPreview(null);
    setStep(1);
  };

  // ФУНКЦИЯ ВЫБОРА ФАЙЛА
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    if (type === 'qr') { setQrFile(file); setQrPreview(previewUrl); }
    else { setPlantFile(file); setPlantPreview(previewUrl); }
  };

  // ШАГ 1: ПРОВЕРКА QR
  const handleVerifyQr = async () => {
    if (!qrFile) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append("file", qrFile);
    try {
      // Бэкенд проверит, есть ли QR в базе
      const response = await axios.post("https://deforest-api.onrender.com/verify-qr", formData);
      setQrData(response.data); // Сохраняем тип дерева и ID
      setStep(2); // ПЕРЕХОДИМ К ФОТО
    } catch (err) {
      setError(err.response?.data?.detail || "QR Code Invalid");
    } finally {
      setLoading(false);
    }
  };

  // ШАГ 2: ЗАГРУЗКА ФОТО ДЕРЕВА (С GPS)
  const handleSubmitPlant = async () => {
    if (!plantFile || !user || !qrData) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append("file", plantFile);
    formData.append("username", user.username);
    formData.append("qr_code", qrData.qr_code); // Передаем ID из 1 шага

    try {
      const response = await axios.post("https://deforest-api.onrender.com/predict", formData);
      if (!response.data.success) {
          setError(response.data.message);
      } else {
          setFinalResult(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error analyzing photo");
    } finally {
      setLoading(false);
    }
  };

  // Стили
  const uploadBoxStyle = { 
    background: "#E0E0E0", borderRadius: "20px", height: "160px", 
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
    marginBottom: "20px", cursor: "pointer", border: "2px dashed #c0c0c0",
    boxShadow: "inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff"
  };
  
  const buttonStyle = (isActive) => ({ 
    width: "100%", padding: "15px", borderRadius: "30px", 
    background: isActive ? "#6A996F" : "#c0c0c0", border: "none", 
    color: "white", fontWeight: "800", fontSize: "14px", textTransform: "uppercase",
    cursor: isActive ? "pointer" : "default",
    boxShadow: isActive ? "0 8px 15px rgba(106, 153, 111, 0.4)" : "none"
  });

  return (
    <div style={{ padding: "20px 24px 120px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}>
        
        <h2 style={{ color: "#6A996F", fontSize: "18px", fontWeight: "800", marginBottom: "20px", textTransform: "uppercase" }}>
          {step === 1 ? "Step 1: Scan QR" : `Step 2: Plant ${qrData?.tree_type}`}
        </h2>

        {/* ШАГ 1: QR */}
        {step === 1 && (
          <>
             <p style={{color: "#666", fontSize: "13px", marginBottom: "15px"}}>Scan the tag to identify the tree.</p>
             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {qrPreview ? <img src={qrPreview} alt="QR Preview" style={{width:"100%", height:"100%", objectFit:"contain"}}/> : <div><QrCode size={30} color="#555"/> Upload QR</div>}
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'qr')} accept="image/*" style={{display:"none"}}/>
             </div>
             <button onClick={handleVerifyQr} disabled={!qrFile || loading} style={buttonStyle(qrFile && !loading)}>
               {loading ? "Verifying..." : "Next"}
             </button>
          </>
        )}

        {/* ШАГ 2: ФОТО */}
        {step === 2 && !finalResult && (
          <>
             <p style={{color: "#666", fontSize: "13px", marginBottom: "15px"}}>
               Identity Verified: <b>{qrData.tree_type}</b>.<br/>
               Now upload a photo of the planted tree with GPS.
             </p>
             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {plantPreview ? <img src={plantPreview} alt="Plant Preview" style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <div><Camera size={30} color="#555"/> Tree Photo</div>}
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'plant')} accept="image/*" style={{display:"none"}}/>
             </div>
             <button onClick={handleSubmitPlant} disabled={!plantFile || loading} style={buttonStyle(plantFile && !loading)}>
               {loading ? "Analyze..." : "Confirm & Plant"}
             </button>
          </>
        )}

        {/* РЕЗУЛЬТАТ */}
        {finalResult && (
           <div style={{padding: "20px", background: "#F0FDF4", borderRadius: "20px", boxShadow: "0 10px 20px rgba(0,0,0,0.05)"}}>
             <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px"}}>
                <CheckCircle color="green" size={32} />
                <h3 style={{color: "#166534", margin: 0}}>Tree Planted!</h3>
             </div>
             <p style={{fontSize: "13px", color: "#166534"}}>{finalResult.message}</p>
             
             {finalResult.coords && (
                <div style={{ height: "180px", borderRadius: "15px", overflow: "hidden", border: "4px solid white", marginTop: "15px" }}>
                    <MapContainer center={finalResult.coords} zoom={15} style={{ height: "100%" }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <Marker position={finalResult.coords} icon={treeIcon}><Popup>New Tree!</Popup></Marker>
                    </MapContainer>
                </div>
             )}

             <button onClick={resetState} style={{...buttonStyle(true), marginTop:"20px"}}>Done</button>
           </div>
        )}

        {error && (
          <div style={{marginTop:"20px", padding: "15px", background: "#FFE4E6", borderRadius: "15px", color:"#9B1C1C", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"}}>
            <XCircle size={20}/>
            <span style={{fontSize: "14px", fontWeight: "bold"}}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlant;