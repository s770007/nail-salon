import { useState, useEffect } from "react";
import { api } from "../api";
import StaffModal from "./StaffModal";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const res = await api.getStaff();
    setStaffList(res.staff);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這位美甲師嗎？")) return;
    await api.adminDeleteStaff(id);
    load();
  };

  const openNew = () => { setEditingStaff(null); setShowModal(true); };
  const openEdit = (s: any) => { setEditingStaff(s); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const handleSaved = () => { closeModal(); load(); };

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px"}}>
        <h3>美甲師列表</h3>
        <button className="btn-sm btn-success" onClick={openNew}>+ 新增美甲師</button>
      </div>
      {staffList.map(s => (
        <div key={s.id} className="admin-item">
          <div style={{display:"flex", alignItems:"center", gap:"15px"}}>
            <div style={{fontSize:"1.5rem"}}>{s.avatar}</div>
            <div className="admin-info">
              <h4>{s.name}</h4>
              {s.specialty && <p style={{whiteSpace:"pre-wrap"}}>{s.specialty}</p>}
            </div>
          </div>
          <div style={{display:"flex", gap:"8px"}}>
            <button className="btn-sm btn-outline" onClick={() => openEdit(s)}>編輯</button>
            <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>刪除</button>
          </div>
        </div>
      ))}
      {showModal && <StaffModal staff={editingStaff} onClose={closeModal} onSaved={handleSaved} />}
    </div>
  );
}
