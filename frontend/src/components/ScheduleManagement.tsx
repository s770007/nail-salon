import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Calendar from "./Calendar";
import ScheduleModal from "./ScheduleModal";

export default function ScheduleManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [calDate, setCalDate] = useState(new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<Record<string, string[]>>({});

  useEffect(() => { api.getStaff().then(res => setStaffList(res.staff)); }, []);

  const loadSchedules = useCallback(async (staffId: string) => {
    try {
      const res = await api.adminGetSchedules();
      const map: Record<string, string[]> = {};
      const todayStr = new Date().toISOString().split('T')[0];
      res.schedules
        .filter((s: any) => s.staffId === staffId && s.slots.length > 0 && s.date >= todayStr)
        .forEach((s: any) => { map[s.date] = s.slots; });
      setScheduleSlots(map);
    } catch {
      setScheduleSlots({});
    }
  }, []);

  useEffect(() => {
    if (selectedStaff) loadSchedules(selectedStaff);
    else setScheduleSlots({});
  }, [selectedStaff, loadSchedules]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCloseModal = () => {
    setModalDate(null);
    if (selectedStaff) loadSchedules(selectedStaff);
  };

  return (
    <div>
      <div className="form-group">
        <label>選擇美甲師</label>
        <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
          <option value="">請選擇...</option>
          {staffList.map(s => <option key={s.id} value={s.id}>{s.avatar} {s.name}</option>)}
        </select>
      </div>
      {selectedStaff && (
        <>
          <Calendar
            calDate={calDate}
            onChangeMonth={setCalDate}
            onSelectDate={setModalDate}
            isDisabled={(dateStr) => dateStr < todayStr}
            scheduleSlots={scheduleSlots}
          />
          <p style={{fontSize:"0.8rem", color:"var(--text-muted)", marginTop:"15px", textAlign:"center"}}>點擊日期設定可預約時段</p>
        </>
      )}
      {modalDate && selectedStaff && (
        <ScheduleModal
          staffId={selectedStaff}
          staffName={staffList.find(s => s.id === selectedStaff)?.name || ""}
          date={modalDate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
