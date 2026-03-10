import { useState } from "react";
import { api } from "../api";

interface Props {
  onLogin: (user: any, token: string) => void;
}

export default function Auth({ onLogin }: Props) {
  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = mode === "login"
        ? await api.login({ email, password })
        : await api.register({ email, password });
      onLogin(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1>{mode === "login" ? "🌸 歡迎回來" : "🌸 建立帳號"}</h1>
      <p className="subtitle">漾彩美甲・專屬於您的精緻時光</p>
      {error && <p style={{color:"red", marginBottom:"10px"}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>電子信箱</label>
          <input type="email" required placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>密碼</label>
          <input type="password" required placeholder="••••••••" minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>{mode === "login" ? "立即登入" : "註冊並加入會員"}</button>
      </form>
      <button className="btn-ghost" style={{marginTop:"15px"}} onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "還沒有帳號？前往註冊" : "已經有帳號了？返回登入"}
      </button>
    </div>
  );
}
