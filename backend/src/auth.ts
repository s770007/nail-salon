import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { readData, writeData } from "./db.js";
import type { User, AuthResponse, RegisterBody, LoginBody } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET || "nail-secret";
const JWT_EXPIRES = "7d";

export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function authMiddleware(req: any, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "未登入" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token 無效" });
  }
}

export async function adminMiddleware(req: any, res: Response, next: NextFunction) {
  const users = await readData<User>("users");
  const user = users.find(u => u.id === req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ success: false, message: "權限不足" });
  }
  next();
}

export async function handleRegister(req: Request<{}, AuthResponse, RegisterBody>, res: Response<AuthResponse>) {
  const { email, password } = req.body;
  const users = await readData<User>("users");
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ success: false, message: "此信箱已註冊" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: randomUUID(),
    email,
    passwordHash,
    role: users.length === 0 ? "admin" : "user", // 第一個註冊的是管理員
    createdAt: new Date()
  };

  users.push(newUser);
  await writeData("users", users);
  
  const token = createToken(newUser.id);
  res.status(201).json({ success: true, token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
}

export async function handleLogin(req: Request<{}, AuthResponse, LoginBody>, res: Response<AuthResponse>) {
  const { email, password } = req.body;
  const users = await readData<User>("users");
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
  }

  const token = createToken(user.id);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
}

export async function handleMe(req: any, res: Response) {
  const users = await readData<User>("users");
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ success: false, message: "找不到使用者" });
  res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}

export async function adminGetUsers(req: any, res: Response) {
  const users = await readData<User>("users");
  res.json({ success: true, users: users.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })) });
}

export async function adminUpdateUserRole(req: any, res: Response) {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== "admin" && role !== "user") return res.status(400).json({ success: false, message: "無效的角色" });
  if (id === req.userId) return res.status(400).json({ success: false, message: "無法修改自己的權限" });
  const users = await readData<User>("users");
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "找不到使用者" });
  users[index].role = role;
  await writeData("users", users);
  res.json({ success: true });
}
