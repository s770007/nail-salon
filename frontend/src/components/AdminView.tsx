import { useState, useEffect } from "react";
import { api } from "../api";
import Calendar from "./Calendar";

export default function AdminView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    Promise.all([api.adminGetAll(), api.getStaff()])
      .then(([apptRes, staffRes]) => {
        setAppointments(apptRes.appointments);
        setStaffList(staffRes.staff);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>載入中...</p>;
  if (error) return <p>無權限或載入失敗: {error}</p>;

  const filtered = appointments.filter(a =>
    a.status !== "cancelled" && (!selectedStaff || a.staffId === selectedStaff)
  );

  const markedDates = [...new Set(filtered.map(a => a.date))];

  const scheduleSlots: Record<string, string[]> | undefined = selectedStaff
    ? filtered.reduce((acc, a) => {
        if (!acc[a.date]) acc[a.date] = [];
        acc[a.date].push(a.time);
        acc[a.date].sort();
        return acc;
      }, {} as Record<string, string[]>)
    : undefined;

  const dateAppointments = selectedDate
    ? filtered.filter(a => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))
    : [];

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff(staffId);
    setSelectedDate("");
  };

  return (
    <div>
      <div className="form-group">
        <label>選擇美甲師</label>
        <select value={selectedStaff} onChange={e => handleSelectStaff(e.target.value)}>
          <option value="">全部美甲師</option>
          {staffList.map(s => <option key={s.id} value={s.id}>{s.avatar} {s.name}</option>)}
        </select>
      </div>
      <Calendar
        calDate={calDate}
        onChangeMonth={setCalDate}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
        isDisabled={() => false}
        markedDates={!selectedStaff ? markedDates : undefined}
        scheduleSlots={scheduleSlots}
      />
      {selectedDate && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontWeight: 700, marginBottom: "12px", color: "#333" }}>{selectedDate} 的預約</div>
          {dateAppointments.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>當天無預約</p>
          ) : (
            dateAppointments.map(a => (
              <div key={a.id} className="admin-item">
                <div className="admin-info">
                  <h4>{a.time} — {a.staffName}</h4>
                  <p>客戶：{a.userEmail}</p>
                </div>
                <span className={`badge ${a.status === "confirmed" ? "badge-confirmed" : "badge-pending"}`}>
                  {a.status === "confirmed" ? "已確認" : "待確認"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
