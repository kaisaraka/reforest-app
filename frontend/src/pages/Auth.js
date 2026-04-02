import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Leaf, User, Lock, ArrowRight, Mail, Home, ChevronDown, KeyRound } from 'lucide-react';
import { useLanguage } from '../LanguageContext'; 

const API_BASE_URL = "https://reforest-app-72zo.vercel.app/_backend";

const Auth = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [role, setRole] = useState('student'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); 
  const [recoveryCode, setRecoveryCode] = useState('');
  
  const { t } = useLanguage(); 

  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', patronymic: '', shanyraq: ''
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const shanyraqs = ["Kausar", "Altyn Orda", "Eldos Smetov"];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg(null); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/forgot-password`, { email: formData.email });
      setRecoveryStep(2);
      setSuccessMsg(`${t('codeSent')} ${res.data.message}`); 
    } catch (err) {
      setError(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg(null); setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/reset-password`, { 
        email: formData.email, 
        token: recoveryCode, 
        new_password: formData.password 
      });
      setSuccessMsg(t('passwordChanged'));
      setIsForgotPassword(false); 
      setRecoveryStep(1);
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      setError(typeof errorDetail === 'string' ? errorDetail : t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg(null);

    if (formData.password.length < 7) {
      setError("Password must contain at least 7 characters!");
      return;
    }

    if (!isLogin && role === 'student' && !formData.shanyraq) { setError(t('chooseShanyraq') + '!'); return; }
    
    setLoading(true);
    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin ? { email: formData.email, password: formData.password } : {
        role, first_name: formData.firstName, last_name: formData.lastName,
        patronymic: formData.patronymic || null, email: formData.email, password: formData.password,
        shanyraq: role === 'student' ? formData.shanyraq : null
      };
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      localStorage.setItem("user", JSON.stringify(response.data));
      setIsAuthenticated(true); navigate("/forest");
    } catch (err) { 
      const errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        setError(`Missing field: '${errorDetail[0].loc[1]}'`); 
      } else if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else {
        setError(t('serverError'));
      }
    } finally { setLoading(false); }
  };

  const containerStyle = { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "#f7f7f7" };
  const cardStyle = { background: "white", padding: "30px", borderRadius: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", textAlign: "center" };
  const inputGroupStyle = { background: "#F0F2F5", borderRadius: "16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", transition: "0.2s" };
  const inputStyle = { border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "15px", fontWeight: "600", color: "#333" };
  const buttonStyle = { width: "100%", padding: "16px", borderRadius: "20px", background: "#6A996F", color: "white", border: "none", fontSize: "16px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer", marginTop: "10px", display: "flex", justifyContent: "center", gap: "8px", boxShadow: "0 8px 20px rgba(106, 153, 111, 0.4)" };
  const roleBtnStyle = (isActive) => ({ flex: 1, padding: "10px", borderRadius: "12px", border: "none", background: isActive ? "#6A996F" : "#F0F2F5", color: isActive ? "white" : "#888", fontWeight: "800", cursor: "pointer", transition: "0.2s" });

  if (isForgotPassword) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#333" }}>{t('forgotPasswordTitle')}</h2>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
            {recoveryStep === 1 ? t('forgotPasswordDesc1') : t('forgotPasswordDesc2')}
          </p>

          <form onSubmit={recoveryStep === 1 ? handleRequestCode : handleResetPassword}>
            <div style={inputGroupStyle}>
              <Mail size={20} color="#888" />
              <input type="email" name="email" placeholder={t('email')} value={formData.email} onChange={handleChange} style={inputStyle} required readOnly={recoveryStep === 2} />
            </div>

            {recoveryStep === 2 && (
              <>
                <div style={inputGroupStyle}>
                  <KeyRound size={20} color="#888" />
                  <input type="text" placeholder={t('sixDigitCode')} value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} style={inputStyle} required />
                </div>
                <div style={inputGroupStyle}>
                  <Lock size={20} color="#888" />
                  <input type="password" name="password" placeholder={t('newPassword')} value={formData.password} onChange={handleChange} style={inputStyle} required />
                </div>
              </>
            )}

            {error && <div style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "15px", fontWeight: "600" }}>{error}</div>}
            {successMsg && <div style={{ color: "#166534", fontSize: "13px", marginBottom: "15px", fontWeight: "600", background: "#E8F5E9", padding: "10px", borderRadius: "10px" }}>{successMsg}</div>}

            <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.7 : 1}}>
              {loading ? t('processing') : (recoveryStep === 1 ? t('getCodeBtn') : t('resetPasswordBtn'))} <ArrowRight size={18}/>
            </button>
          </form>

          <button onClick={() => { setIsForgotPassword(false); setRecoveryStep(1); setError(null); setSuccessMsg(null); }} style={{ marginTop: "20px", background: "transparent", border: "none", color: "#888", fontWeight: "600", cursor: "pointer" }}>
            {t('backToLoginBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
        <div style={{ background: "#6A996F", padding: "10px", borderRadius: "12px" }}>
           <Leaf color="white" size={28} />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#333", margin: 0 }}>ReForest.</h1>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#333", marginBottom: "5px" }}>{isLogin ? t('welcomeBack') : t('joinMission')}</h2>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "25px" }}>{isLogin ? t('loginDesc') : t('registerDesc')}</p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button type="button" onClick={() => setRole('student')} style={roleBtnStyle(role === 'student')}>{t('student')}</button>
              <button type="button" onClick={() => setRole('teacher')} style={roleBtnStyle(role === 'teacher')}>{t('teacher')}</button>
            </div>
          )}

          {!isLogin && (
            <>
              <div style={inputGroupStyle}><User size={20} color="#888" /><input type="text" name="lastName" placeholder={t('lastName')} value={formData.lastName} onChange={handleChange} style={inputStyle} required /></div>
              <div style={inputGroupStyle}><User size={20} color="#888" /><input type="text" name="firstName" placeholder={t('firstName')} value={formData.firstName} onChange={handleChange} style={inputStyle} required /></div>
              <div style={inputGroupStyle}><User size={20} color="#888" /><input type="text" name="patronymic" placeholder={t('patronymic')} value={formData.patronymic} onChange={handleChange} style={inputStyle} /></div>
            </>
          )}

          <div style={inputGroupStyle}><Mail size={20} color="#888" /><input type="email" name="email" placeholder={t('email')} value={formData.email} onChange={handleChange} style={inputStyle} required /></div>
          <div style={inputGroupStyle}><Lock size={20} color="#888" /><input type="password" name="password" placeholder={t('password')} value={formData.password} onChange={handleChange} style={inputStyle} required /></div>

          {!isLogin && role === 'student' && (
            <div style={{ position: "relative", width: "100%", marginBottom: "15px" }}>
              <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{...inputGroupStyle, marginBottom: 0, cursor: "pointer", justifyContent: "space-between"}}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                  <Home size={20} color="#888" />
                  <span style={{...inputStyle, color: formData.shanyraq ? "#333" : "#888", textAlign: "left"}}>{formData.shanyraq || t('chooseShanyraq')}</span>
                </div>
                <ChevronDown size={20} color="#888" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
              </div>
              {isDropdownOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", borderRadius: "16px", marginTop: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0", zIndex: 100, overflow: "hidden" }}>
                  {shanyraqs.map((sh, idx) => (
                    <div key={idx} onClick={() => { setFormData({ ...formData, shanyraq: sh }); setIsDropdownOpen(false); }} style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#333", cursor: "pointer", borderBottom: idx !== shanyraqs.length - 1 ? "1px solid #f5f5f5" : "none" }} onMouseEnter={(e) => e.target.style.background = "#E8F5E9"} onMouseLeave={(e) => e.target.style.background = "transparent"}>{sh}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "15px", fontWeight: "600" }}>{error}</div>}
          {successMsg && <div style={{ color: "#166534", fontSize: "13px", marginBottom: "15px", fontWeight: "600", background: "#E8F5E9", padding: "10px", borderRadius: "10px" }}>{successMsg}</div>}

          <button type="submit" disabled={loading} style={{...buttonStyle, opacity: loading ? 0.7 : 1}}>
            {loading ? t('processing') : (isLogin ? t('loginBtn') : t('signupBtn'))} <ArrowRight size={18}/>
          </button>
        </form>

        {isLogin && (
          <div style={{ marginTop: "15px" }}>
            <button onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }} style={{ background: "transparent", border: "none", color: "#6A996F", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
              {t('forgotPasswordBtn')}
            </button>
          </div>
        )}

        <div style={{ marginTop: "15px", fontSize: "13px", color: "#666" }}>
          {isLogin ? t('newHere') : t('alreadyHaveAcc')}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{ background: "transparent", border: "none", color: "#6A996F", fontWeight: "800", cursor: "pointer" }}>
            {isLogin ? t('createAcc') : t('loginBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;