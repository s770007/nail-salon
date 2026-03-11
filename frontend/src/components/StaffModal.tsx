import { useState } from "react";
import { api } from "../api";

const AVATAR_OPTIONS = [
  "👩‍🎨","👩","👩‍🦰","👩‍🦱","👩‍🦳","👩‍🦲",
  "🧑‍🎨","👨‍🎨","💅","🌸","🌺","🌻",
  "✨","💎","🦋","🌈","🎀","💄",
  "🌷","🪷","🌹","💐","🍀","⭐"
];

interface Props {
  staff: any | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function StaffModal({ staff, onClose, onSaved }: Props) {
  const [name, setName] = useState(staff?.name || "");
  const [avatar, setAvatar] = useState(staff?.avatar || "👩‍🎨");
  const [specialty, setSpecialty] = useState(staff?.specialty || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (staff) await api.adminUpdateStaff(staff.id, { name, avatar, specialty });
      else await api.adminAddStaff({ name, avatar, specialty });
      onSaved();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{staff ? "編輯美甲師" : "新增美甲師"}</h3>
        <form onSubmit={handleSubmit} style={{marginTop:"20px"}}>
          <div className="form-group">
            <label>姓名</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>專長備註</label>
            <textarea placeholder="例：法式、凝膠、美甲彩繪..." value={specialty} onChange={e => setSpecialty(e.target.value)} rows={3} style={{resize:"vertical"}} />
          </div>
          <div className="form-group">
            <label>頭像</label>
            <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px"}}>
              <div style={{fontSize:"2.5rem", width:"56px", height:"56px", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", borderRadius:"50%", border:"2px solid var(--primary)"}}>
                {avatar}
              </div>
              <span style={{fontSize:"0.85rem", color:"var(--text-muted)"}}>點擊下方選擇頭像</span>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"8px"}}>
              {AVATAR_OPTIONS.map(a => (
                <div key={a} onClick={() => setAvatar(a)}
                  style={{fontSize:"1.6rem", textAlign:"center", padding:"6px", borderRadius:"8px", cursor:"pointer",
                    border:`2px solid ${a === avatar ? 'var(--primary-dark)' : 'transparent'}`, background:"var(--bg)"}}>
                  {a}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex", gap:"10px", marginTop:"20px"}}>
            <button type="button" className="btn-outline" onClick={onClose}>取消</button>
            <button type="submit">{staff ? "更新" : "新增"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
