import { useState, useEffect } from "react";
import { api } from "../api";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetUsers();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user: any) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const label = newRole === "admin" ? "升級為管理員" : "降為一般用戶";
    if (!confirm(`確定要將 ${user.email} ${label}？`)) return;
    try {
      await api.adminUpdateUserRole(user.id, newRole);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>載入中...</p>;
  if (error) return <p>載入失敗：{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: "15px", fontSize: "0.8rem", color: "var(--text-muted)" }}>共 {users.length} 位用戶</div>
      {users.map(u => (
        <div key={u.id} className="admin-item">
          <div className="admin-info">
            <h4>{u.email} {u.role === "admin" && <span className="badge badge-admin">Admin</span>}</h4>
            <p>加入時間：{new Date(u.createdAt).toLocaleDateString("zh-TW")}</p>
          </div>
          <button
            className={`btn-sm ${u.role === "admin" ? "btn-outline" : "btn-success"}`}
            onClick={() => toggleRole(u)}
          >
            {u.role === "admin" ? "降為用戶" : "升為管理員"}
          </button>
        </div>
      ))}
    </div>
  );
}
