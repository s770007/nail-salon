import { useState, useEffect } from "react";
import { api } from "./api";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nail_token");
    if (token) {
      api.getMe()
        .then(res => setUser(res.user))
        .catch(() => localStorage.removeItem("nail_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="card" style={{textAlign:"center"}}>載入中...</div>;
  if (!user) return <Auth onLogin={(u: any, token: string) => { localStorage.setItem("nail_token", token); setUser(u); }} />;
  return <Dashboard user={user} onLogout={() => { localStorage.removeItem("nail_token"); setUser(null); }} />;
}
