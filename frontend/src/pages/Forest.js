import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Droplets, Clock, MapPin, Leaf, Camera, Trophy, History } from 'lucide-react';

const TREE_IMG_URL = 'https://cdn-icons-png.flaticon.com/512/490/490091.png';
const API_BASE_URL = "https://reforest-app-72zo.vercel.app/_backend";

// ── Массивы зон ──
const GREEN_ZONES = [
  // 1. Левая склеенная зона
  [
    [42.882953, 71.319487],
    [42.882780, 71.319637],
    [42.881255, 71.317588],
    [42.880280, 71.318532],
    [42.880170, 71.318243],
    [42.881413, 71.317180],
    [42.881570, 71.317416]
  ],
  // 2. Правая склеенная зона
  [
    [42.882993, 71.319959],
    [42.883118, 71.320442],
    [42.881994, 71.321397],
    [42.880894, 71.322341],
    [42.880681, 71.321515],
    [42.881625, 71.320807],
    [42.881837, 71.321021]
  ]
];

const YELLOW_ZONES = [
  // Желтая зона
  [
    [42.880949, 71.321193], [42.880776, 71.321311], [42.879502, 71.318854], [42.879722, 71.318618],
    [42.880147, 71.318221], [42.880273, 71.318564], [42.879958, 71.318951], [42.880296, 71.319659],
    [42.880257, 71.319863]
  ]
];

const createTreeIcon = (status, isSelected) => {
  const size = isSelected ? 48 : 32;
  let filter = '';
  if (status === 'yellow') filter = 'sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)';
  else if (status === 'red') filter = 'grayscale(1) sepia(1) saturate(4) hue-rotate(-50deg) brightness(0.9)';
  if (isSelected) filter += ' drop-shadow(0px 5px 15px rgba(106,153,111,0.6))';
  
  return new L.DivIcon({
    className: '',
    html: `<img src="${TREE_IMG_URL}" style="width:${size}px;height:${size}px;filter:${filter};transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);" alt="tree"/>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const formatDate = (d) => {
  if (!d) return 'Unknown';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusColor = (s) => s === 'red' ? '#EF4444' : s === 'yellow' ? '#F59E0B' : '#10B981';

export default function Forest() {
  const [trees, setTrees]               = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [showZones, setShowZones]       = useState(false);
  const [watering, setWatering]         = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  // Центр карты выставлен прямо на твои зоны
  const center = [42.881, 71.319];

  const fetchTrees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/forest`);
      setTrees(res.data);
      if (selectedTree) {
        const u = res.data.find(t => t.id === selectedTree.id);
        if (u) setSelectedTree(u);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTrees();
    const id = setInterval(fetchTrees, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── полив ──
  const handleWaterFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTree || !user) return;
    setWatering(true);
    const fd = new FormData();
    fd.append('tree_id', selectedTree.id);
    fd.append('username', user.username);
    fd.append('file', file);
    try {
      await axios.post(`${API_BASE_URL}/water`, fd);
      setEarnedPoints(30);
      setShowSuccess(true);
      fetchTrees();
    } catch (err) {
      alert('Error watering tree');
      console.error(err);
    } finally {
      setWatering(false);
    }
  };

  return (
    <div style={{ padding: '0 24px 120px 24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#333', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Forest Map
        </h2>
        <button onClick={() => setShowZones(!showZones)} style={btnStyle(showZones, '#6A996F')}>
          <MapPin size={14} /> {showZones ? 'Hide' : 'Show'} Areas
        </button>
      </div>

      {/* ── Legend ── */}
      {showZones && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, fontWeight: 600, color: '#555' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,197,94,0.4)', border: '2px solid #22c55e', flexShrink: 0 }} />
            Только полив
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(234,179,8,0.4)', border: '2px solid #eab308', flexShrink: 0 }} />
            Полив и посадка
          </span>
        </div>
      )}

      {/* ── Map ── */}
      <div style={{
        height: 400, borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        border: '4px solid #fff',
        cursor: 'grab',
      }}>
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {/* Отрисовка зелёных зон */}
          {showZones && GREEN_ZONES.map((zone, i) => (
            <Polygon key={`green-${i}`} positions={zone} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2.5 }} />
          ))}

          {/* Отрисовка жёлтых зон */}
          {showZones && YELLOW_ZONES.map((zone, i) => (
            <Polygon key={`yellow-${i}`} positions={zone} pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.35, weight: 2.5 }} />
          ))}

          {trees.map(t => (
            <Marker
              key={t.id} position={t.pos}
              icon={createTreeIcon(t.status, selectedTree?.id === t.id)}
              eventHandlers={{ click: () => setSelectedTree(t) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* ── Tree Card ── */}
      {selectedTree && (
        <div style={{ marginTop: 20, background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', position: 'relative', animation: 'slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
          <button onClick={() => setSelectedTree(null)} style={{ position: 'absolute', top: 15, right: 15, background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
            {selectedTree.image_data
              ? <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}><img src={selectedTree.image_data} alt="Tree" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              : <div style={{ width: 80, height: 80, borderRadius: 16, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf color="#9CA3AF" /></div>
            }
            <div style={{ flex: 1, paddingRight: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: statusColor(selectedTree.status), color: 'white', padding: '2px 8px', borderRadius: 10 }}>
                  {selectedTree.status === 'green' ? 'HEALTHY' : 'NEEDS WATER'}
                </span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>ID: {selectedTree.id}</span>
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 900, color: '#1F2937' }}>{selectedTree.tree_type}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Planted by <b style={{ color: '#333' }}>{selectedTree.user}</b></p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <StatCard icon={<Droplets size={18} />} bg="#DBEAFE" color="#3B82F6" label="Water Needed" value={selectedTree.water_amount} />
            <StatCard
              icon={<Clock size={18} />}
              bg={selectedTree.status === 'green' ? '#D1FAE5' : '#FEE2E2'}
              color={selectedTree.status === 'green' ? '#10B981' : '#EF4444'}
              label="Next Watering" value={`${selectedTree.days_left} days`}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={16} /> Recent Care
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 10, maxHeight: 120, overflowY: 'auto', border: '1px solid #F3F4F6' }}>
              {selectedTree.history?.length > 0
                ? selectedTree.history.slice().reverse().map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: i !== selectedTree.history.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {ev.image_data
                        ? <img src={ev.image_data} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }} alt="proof" />
                        : <div style={{ width: 32, height: 32, borderRadius: 10, background: '#E5E7EB' }} />
                      }
                      <div>
                        <div style={{ fontWeight: 700, color: '#374151', fontSize: 12 }}>{ev.username}</div>
                        <div style={{ color: '#9CA3AF', fontSize: 10 }}>{formatDate(ev.timestamp)}</div>
                      </div>
                    </div>
                    <div style={{ background: '#DBEAFE', color: '#2563EB', padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>+30 Lf</div>
                  </div>
                ))
                : <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 15 }}>No history yet. Be the first hero!</div>
              }
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleWaterFile} accept="image/*" style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current.click()} disabled={watering}
            style={{ width: '100%', background: watering ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: 16, borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: watering ? 'wait' : 'pointer', boxShadow: watering ? 'none' : '0 8px 20px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseDown={e => !watering && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !watering && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {watering ? 'Uploading Proof...' : <><Camera size={20} /> Water this Tree</>}
          </button>
        </div>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s' }}>
          <div style={{ background: 'white', borderRadius: 30, padding: 30, textAlign: 'center', width: '100%', maxWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trophy size={40} color="#059669" fill="#059669" />
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#111' }}>Awesome!</h3>
            <p style={{ margin: '0 0 25px', color: '#666', fontSize: 14, lineHeight: 1.5 }}>You watered the tree successfully.<br />Here is your reward:</p>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', marginBottom: 30 }}>+{earnedPoints} Lf</div>
            <button onClick={() => setShowSuccess(false)} style={{ width: '100%', padding: 15, borderRadius: 18, background: '#111', color: 'white', fontSize: 14, fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              Continue
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)} }
        @keyframes bounceIn { 0%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.05)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ── helpers ──
const StatCard = ({ icon, bg, color, label, value }) => (
  <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ background: bg, padding: 8, borderRadius: 10, color }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#333' }}>{value}</div>
    </div>
  </div>
);

const btnStyle = (active, activeColor) => ({
  background: active ? activeColor : '#fff',
  color: active ? 'white' : '#555',
  border: '1px solid #eee', borderRadius: 20,
  padding: '8px 14px', fontSize: 11, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
});