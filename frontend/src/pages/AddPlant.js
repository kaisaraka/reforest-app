import React, { useState, useRef } from 'react';
import axios from 'axios';
import { QrCode, Camera, CheckCircle, XCircle, Sprout, ScanLine } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const treeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/490/490091.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const AddPlant = () => {
  // 0 = Выбор режима, 1 = QR, 2 = Фото
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrData, setQrData] = useState(null);

  const [plantFile, setPlantFile] = useState(null);
  const [plantPreview, setPlantPreview] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const fileInputRef = useRef(null);

  // Достаем данные пользователя
  const user = JSON.parse(localStorage.getItem("user"));
  const API_BASE_URL = "https://reforest-app.onrender.com";

  const resetState = () => {
    setError(null); setLoading(false);
    setQrData(null); setFinalResult(null);
    setQrFile(null); setQrPreview(null);
    setPlantFile(null); setPlantPreview(null);
    setStep(0); // Возвращаемся к выбору режима
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    if (type === 'qr') { setQrFile(file); setQrPreview(previewUrl); }
    else { setPlantFile(file); setPlantPreview(previewUrl); }
  };

  // --- ЛОГИКА: БЕЗ QR ---
  const handleSkipQr = () => {
    // Создаем "фиктивные" данные QR, чтобы логика шага 2 не сломалась
    setQrData({ 
        tree_type: "Wild Tree", // Тип по умолчанию
        id: null 
    });
    setStep(2); // Сразу прыгаем к фото
  };

  // --- ШАГ 1: ПРОВЕРКА QR ---
  const handleVerifyQr = async () => {
    if (!qrFile || !user) return;
    setLoading(true); setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-qr`, {
        qr_data: "ELM-001", 
        user_id: user.id
      });
      
      setQrData({ ...response.data, tree_type: "Elm (Вяз)" }); 
      setStep(2);
    } catch (err) {
      console.error(err);
      let msg = "QR Code Invalid";
      if (err.response && err.response.data) {
        if (typeof err.response.data.detail === 'string') {
            msg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
            msg = "Ошибка данных: " + err.response.data.detail[0].msg;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- ШАГ 2: ПРЕДСКАЗАНИЕ И ПОСАДКА ---
  const handleSubmitPlant = async () => {
    if (!plantFile || !user) return;
    setLoading(true); setError(null);

    const formData = new FormData();
    formData.append("file", plantFile);
    formData.append("username", user.username);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      
      if (response.data.success) {
        setFinalResult(response.data);
      } else {
        setError(response.data.message || "Analysis failed");
      }
    } catch (err) {
      setError("AI Service unavailable (Demo mode)");
    } finally {
      setLoading(false);
    }
  };

  // --- СТИЛИ ---
  const uploadBoxStyle = { 
    background: "#EFEEEE", borderRadius: "20px", height: "180px", 
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
    marginBottom: "20px", cursor: "pointer", border: "3px solid #E0E0E0",
    boxShadow: "inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff"
  };
  
  const buttonStyle = (isActive) => ({ 
    width: "100%", padding: "16px", borderRadius: "30px", 
    background: isActive ? "#6A996F" : "#D1D1D1", border: "none", 
    color: "white", fontWeight: "800", fontSize: "14px",
    cursor: isActive ? "pointer" : "default",
    boxShadow: isActive ? "0 8px 15px rgba(106, 153, 111, 0.3)" : "none",
    transition: "all 0.3s ease"
  });

  const modeCardStyle = {
    background: "#EFEEEE", padding: "20px", borderRadius: "20px",
    marginBottom: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "15px",
    boxShadow: "6px 6px 12px #bebebe, -6px -6px 12px #ffffff", transition: "transform 0.1s"
  };

  return (
    <div style={{ padding: "20px 24px 120px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "450px", textAlign: "center" }}>
        
        {/* ЗАГОЛОВОК ЗАВИСИТ ОТ ШАГА */}
        <h2 style={{ color: "#333", fontSize: "20px", fontWeight: "900", marginBottom: "20px" }}>
          {step === 0 && "CHOOSE MODE"}
          {step === 1 && "SCAN QR"}
          {step === 2 && "TAKE PHOTO"}
        </h2>

        {/* --- ШАГ 0: ВЫБОР РЕЖИМА --- */}
        {step === 0 && (
          <div style={{ animation: "fadeIn 0.5s" }}>
            
            {/* Карточка: С QR кодом */}
            <div style={modeCardStyle} onClick={() => setStep(1)}>
              <div style={{ background: "#6A996F", padding: "12px", borderRadius: "12px", color: "white" }}>
                <ScanLine size={24} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "800", color: "#333" }}>I have a QR Tag</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Scan code to identify tree</div>
              </div>
            </div>

            {/* Карточка: Без QR кода */}
            <div style={modeCardStyle} onClick={handleSkipQr}>
              <div style={{ background: "#D4C183", padding: "12px", borderRadius: "12px", color: "white" }}>
                <Sprout size={24} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "800", color: "#333" }}>Plant without QR</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Just take a photo & plant</div>
              </div>
            </div>

          </div>
        )}

        {/* --- ШАГ 1: ЗАГРУЗКА QR --- */}
        {step === 1 && (
          <div style={{animation: "fadeIn 0.5s"}}>
             <p style={{color: "#666", fontSize: "14px", marginBottom: "20px"}}>Scan the tag to identify the tree.</p>
             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {qrPreview ? 
                  <img src={qrPreview} alt="QR" style={{width:"100%", height:"100%", objectFit:"contain", borderRadius: "15px"}}/> : 
                  <div style={{color: "#888", fontWeight: "700"}}><QrCode size={40} style={{marginBottom: "10px"}}/> <br/> Upload QR Image</div>
                }
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'qr')} accept="image/*" style={{display:"none"}}/>
             </div>
             
             <div style={{display: "flex", gap: "10px"}}>
               <button onClick={() => setStep(0)} style={{...buttonStyle(false), background: "#EFEEEE", color: "#666", boxShadow: "none", border: "2px solid #ddd"}}>
                 Back
               </button>
               <button onClick={handleVerifyQr} disabled={!qrFile || loading} style={buttonStyle(qrFile && !loading)}>
                 {loading ? "Verifying..." : "Next"}
               </button>
             </div>
          </div>
        )}

        {/* --- ШАГ 2: ФОТО ДЕРЕВА --- */}
        {step === 2 && !finalResult && (
          <div style={{animation: "fadeIn 0.5s"}}>
             <p style={{color: "#666", fontSize: "14px", marginBottom: "20px"}}>
               Tree Type: <b>{qrData?.tree_type}</b>. <br/> Take a photo of the tree.
             </p>
             <div style={uploadBoxStyle} onClick={() => fileInputRef.current.click()}>
                {plantPreview ? 
                  <img src={plantPreview} alt="Tree" style={{width:"100%", height:"100%", objectFit:"cover", borderRadius: "15px"}}/> : 
                  <div style={{color: "#888", fontWeight: "700"}}><Camera size={40} style={{marginBottom: "10px"}}/> <br/> Take Photo</div>
                }
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'plant')} accept="image/*" style={{display:"none"}}/>
             </div>

             <div style={{display: "flex", gap: "10px"}}>
               <button onClick={() => setStep(0)} style={{...buttonStyle(false), background: "#EFEEEE", color: "#666", boxShadow: "none", border: "2px solid #ddd"}}>
                 Cancel
               </button>
               <button onClick={handleSubmitPlant} disabled={!plantFile || loading} style={buttonStyle(plantFile && !loading)}>
                 {loading ? "Analyzing..." : "Confirm & Plant"}
               </button>
             </div>
          </div>
        )}

        {/* --- РЕЗУЛЬТАТ --- */}
        {finalResult && (
           <div style={{padding: "25px", background: "#fff", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", animation: "slideUp 0.5s"}}>
             <CheckCircle color="#6A996F" size={48} style={{marginBottom: "15px"}} />
             <h3 style={{color: "#333", margin: "0 0 10px 0", fontSize: "22px", fontWeight: "900"}}>Perfectly Planted!</h3>
             <p style={{fontSize: "14px", color: "#666", marginBottom: "20px"}}>{finalResult.message}</p>
             
             {finalResult.coords && (
                <div style={{ height: "200px", borderRadius: "20px", overflow: "hidden", border: "5px solid #EFEEEE" }}>
                    <MapContainer center={finalResult.coords} zoom={15} style={{ height: "100%" }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <Marker position={finalResult.coords} icon={treeIcon}></Marker>
                    </MapContainer>
                </div>
             )}

             <button onClick={resetState} style={{...buttonStyle(true), marginTop:"25px"}}>Go to Forest</button>
           </div>
        )}

        {error && (
          <div style={{marginTop:"20px", padding: "15px", background: "#FFE4E6", borderRadius: "15px", color:"#9B1C1C", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", animation: "shake 0.4s"}}>
            <XCircle size={20}/>
            <span style={{fontSize: "14px", fontWeight: "800"}}>{error}</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
};

export default AddPlant;