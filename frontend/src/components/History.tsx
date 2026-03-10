import { useState, useEffect } from "react";
import { api } from "../api";

export default function History() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await api.getMyAppointments();
      setAppointments(res.appointments.filter((a: any) => a.status !== 'cancelled'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("確定要取消這筆預約嗎？")) return;
    try {
      await api.cancelAppointment(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>載入中...</p>;
  if (error) return <p style={{color:"red"}}>載入失敗: {error}</p>;
  if (appointments.length === 0) return <p style={{textAlign:"center", color:"var(--text-muted)"}}>尚無預約紀錄</p>;

  return (
    <div>
      {appointments.map((a: any) => (
        <div key={a.id} className="apt-card">
          <div className="apt-info">
            <div className="apt-date">{a.date} {a.time}</div>
            <div style={{fontSize:"0.85rem"}}>美甲師：{a.staffName}</div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
            <div className="apt-status">{a.status === 'pending' ? '待服務' : a.status}</div>
            {a.status === 'pending' && (
              <button className="btn-sm btn-danger" onClick={() => handleCancel(a.id)}>取消</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
