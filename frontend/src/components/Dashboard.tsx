import { useState } from "react";
import BookingFlow from "./BookingFlow";
import History from "./History";
import AdminView from "./AdminView";
import StaffManagement from "./StaffManagement";
import ScheduleManagement from "./ScheduleManagement";
import UserManagement from "./UserManagement";

type Tab = "book" | "history" | "admin" | "staff" | "schedule" | "users";

interface Props {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("book");
  const isAdmin = user.role === "admin";

  const renderContent = () => {
    switch (tab) {
      case "book": return <BookingFlow />;
      case "history": return <History />;
      case "admin": return <AdminView />;
      case "staff": return <StaffManagement />;
      case "schedule": return <ScheduleManagement />;
      case "users": return <UserManagement />;
    }
  };

  return (
    <div className="card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px"}}>
        <div style={{fontWeight:700}}>
          Hi, {user.email.split('@')[0]} 👋 {isAdmin && <span className="badge badge-admin">Admin</span>}
        </div>
        <a href="#" onClick={e => { e.preventDefault(); onLogout(); }} style={{fontSize:"0.8rem", color:"var(--text-muted)"}}>登出</a>
      </div>
      <div className="nav-tabs">
        <div className={`tab ${tab === 'book' ? 'active' : ''}`} onClick={() => setTab('book')}>預約服務</div>
        <div className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>我的預約</div>
        {isAdmin && <>
          <div className={`tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>全部預約</div>
          <div className={`tab ${tab === 'staff' ? 'active' : ''}`} onClick={() => setTab('staff')}>美甲師管理</div>
          <div className={`tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>排班管理</div>
          <div className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>用戶管理</div>
        </>}
      </div>
      <div id="dashboard-content">{renderContent()}</div>
    </div>
  );
}
