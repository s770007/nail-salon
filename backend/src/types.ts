export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userEmail: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
}

export interface Schedule {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  slots: string[]; // ["10:00", "11:00", ...]
}

export interface RegisterBody {
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; role: "admin" | "user" };
  message?: string;
}
