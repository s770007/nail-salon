import { useState, useEffect } from "react";
import { api } from "../api";

const ALL_SLOTS = ["11:00", "11:30", "13:30", "14:00", "16:00", "16:30", "19:00", "19:30"];

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface Props {
  staffId: string;
  staffName: string;
  date: string;
  onClose: () => void;
}

export default function ScheduleModal({ staffId, staffName, date, onClose }: Props) {
  const [activeSlots, setActiveSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  const isPastSlot = (t: string) => {
    if (date > todayStr) return false;
    if (date < todayStr) return true;
    const [h, m] = t.split(":").map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  };

  useEffect(() => {
    api.getSlots(staffId, date).then(res => {
      setBookedSlots(res.slots.filter((s: any) => s.isBooked).map((s: any) => s.time));
      setActiveSlots(res.slots.map((s: any) => s.time));
      setLoading(false);
    });
  }, []);

  const isBlocked = (t: string) => {
    if (activeSlots.includes(t)) return false;
    return activeSlots.some(a => Math.abs(toMinutes(a) - toMinutes(t)) <= 30);
  };

  const toggleSlot = (t: string) => {
    if (bookedSlots.includes(t) || isPastSlot(t) || isBlocked(t)) return;
    setActiveSlots(prev => prev.includes(t) ? prev.filter(s => s !== t) : [...prev, t]);
  };

  const selectAll = () => {
    const available = ALL_SLOTS.filter(t => !bookedSlots.includes(t) && !isPastSlot(t));
    setActiveSlots(available);
  };

  const clearAll = () => {
    setActiveSlots(prev => prev.filter(t => bookedSlots.includes(t)));
  };

  const handleSave = async () => {
    try {
      await api.adminUpdateSchedule({ staffId, date, slots: activeSlots });
      alert("排班已更新");
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content"><p>載入中...</p></div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{textAlign:"center", color:"var(--primary-dark)"}}>{date}</h3>
        <p style={{textAlign:"center", fontSize:"0.9rem", marginBottom:"20px"}}>{staffName} 的可服務時段</p>
        <div style={{display:"flex", gap:"10px", marginBottom:"15px"}}>
          <button className="btn-sm btn-outline" onClick={selectAll}>全選</button>
          <button className="btn-sm btn-outline" style={{color:"#ff5252", borderColor:"#ffcdd2"}} onClick={clearAll}>清除當天排班</button>
        </div>
        <div className="time-grid" style={{maxHeight:"300px", overflowY:"auto", padding:"5px"}}>
          {ALL_SLOTS.map(t => {
            const isActive = activeSlots.includes(t);
            const isBooked = bookedSlots.includes(t);
            const isPast = isPastSlot(t);
            const blocked = isBlocked(t);
            return (
              <div key={t}
                className={`time-slot ${isActive ? 'active' : ''} ${isBooked || isPast ? 'booked' : ''}`}
                style={{opacity: blocked ? 0.35 : 1, cursor: blocked ? 'not-allowed' : ''}}
                onClick={() => toggleSlot(t)}
                title={isPast ? '已過時段' : ''}
              >
                {t}{isPast ? ' ✕' : ''}
              </div>
            );
          })}
        </div>
        <button style={{marginTop:"25px"}} onClick={handleSave}>完成</button>
        <button className="btn-ghost" onClick={onClose}>取消</button>
      </div>
    </div>
  );
}
