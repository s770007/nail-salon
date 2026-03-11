import { useState, useEffect } from "react";
import { api } from "../api";
import Calendar from "./Calendar";

export default function BookingFlow() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [step, setStep] = useState<1|2>(1);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [scheduleSlotsMap, setScheduleSlotsMap] = useState<Record<string, string[]>>({});
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => { api.getStaff().then(res => setStaffList(res.staff)); }, []);

  const handleSelectStaff = async (staffId: string) => {
    setSelectedStaff(staffId);
    setSelectedDate("");
    setSelectedTime("");
    setSlots([]);
    setStep(2);
    try {
      const res = await api.getScheduledDates(staffId);
      const today = new Date().toISOString().split('T')[0];
      setScheduledDates(res.dates);
      const filteredMap: Record<string, string[]> = {};
      Object.entries(res.slotsMap || {}).forEach(([date, slots]) => {
        if (date >= today) filteredMap[date] = slots as string[];
      });
      setScheduleSlotsMap(filteredMap);
    } catch {
      setScheduledDates([]);
      setScheduleSlotsMap({});
    }
  };

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setLoadingSlots(true);
    try {
      const res = await api.getSlots(selectedStaff, date);
      setSlots(res.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await api.createAppointment({ staffId: selectedStaff, date: selectedDate, time: selectedTime });
      alert("預約成功！我們將保留您的時段 ✨");
      setStep(1);
      setSelectedStaff("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (step === 1) {
    return (
      <div>
        <label style={{marginBottom:"15px", display:"block"}}>1. 選擇美甲師</label>
        <div>
          {staffList.map(s => (
            <div key={s.id} className={`admin-item booking-staff-item ${selectedStaff === s.id ? 'active' : ''}`} onClick={() => handleSelectStaff(s.id)}>
              <div style={{display:"flex", alignItems:"center", gap:"15px"}}>
                <div style={{fontSize:"1.5rem"}}>{s.avatar}</div>
                <div className="admin-info">
                  <h4>{s.name}</h4>
                  {s.specialty && <p style={{whiteSpace:"pre-wrap"}}>{s.specialty}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedStaffInfo = staffList.find(s => s.id === selectedStaff);

  return (
    <div>
      {selectedStaffInfo && (
        <div className="admin-item" style={{marginBottom:"20px", cursor:"default"}}>
          <div style={{display:"flex", alignItems:"center", gap:"15px"}}>
            <div style={{fontSize:"1.5rem"}}>{selectedStaffInfo.avatar}</div>
            <div className="admin-info">
              <h4>{selectedStaffInfo.name}</h4>
              {selectedStaffInfo.specialty && <p style={{whiteSpace:"pre-wrap"}}>{selectedStaffInfo.specialty}</p>}
            </div>
          </div>
        </div>
      )}
      <label style={{marginBottom:"15px", display:"block"}}>2. 選擇日期</label>
      <Calendar
        calDate={calDate}
        onChangeMonth={setCalDate}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
        isDisabled={(dateStr) => dateStr < todayStr || !scheduledDates.includes(dateStr)}
        scheduleSlots={scheduleSlotsMap}
        showLegend
      />
      {selectedDate && (
        <div style={{marginTop:"20px"}}>
          <label style={{marginBottom:"15px", display:"block"}}>3. 選擇時段</label>
          <div className="time-grid">
            {loadingSlots ? <p>載入中...</p> : slots.length === 0 ? (
              <p style={{gridColumn:"1/-1", textAlign:"center", color:"var(--text-muted)", padding:"20px"}}>當天暫無可預約時段</p>
            ) : slots.map((s: any) => (
              <div key={s.time}
                className={`time-slot ${s.isBooked ? 'booked' : ''} ${selectedTime === s.time ? 'active' : ''}`}
                onClick={() => !s.isBooked && setSelectedTime(s.time)}
              >{s.time}</div>
            ))}
          </div>
        </div>
      )}
      <button style={{marginTop:"25px"}} disabled={!selectedTime} onClick={handleConfirm}>確認預約</button>
      <button className="btn-ghost" onClick={() => setStep(1)} style={{marginTop:"10px"}}>回上一步</button>
    </div>
  );
}
