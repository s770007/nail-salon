import { useState, useEffect } from "react";
import { api } from "../api";

export default function AdminView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetAll()
      .then(res => setAppointments(res.appointments))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>載入中...</p>;
  if (error) return <p>無權限或載入失敗: {error}</p>;

  return (
    <div>
      <div style={{marginBottom:"15px", fontSize:"0.8rem", color:"var(--text-muted)"}}>共 {appointments.length} 筆預約資料</div>
      {appointments.length === 0 ? <p>尚無預約</p> : appointments.map((a: any) => (
        <div key={a.id} className="admin-item">
          <div className="admin-info">
            <div className="apt-date">{a.date} {a.time}</div>
            <p>客戶：{a.userEmail}</p>
            <p>美甲師：{a.staffName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
