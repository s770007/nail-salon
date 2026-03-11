const API_BASE = "/api";

function getToken() { return localStorage.getItem("nail_token"); }

export async function request(url: string, options: any = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "發生錯誤");
  return data;
}

export const api = {
  login: (body: any) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: any) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  getMe: () => request("/auth/me"),
  getStaff: () => request("/staff"),
  getScheduledDates: (staffId: string) => request(`/scheduled-dates?staffId=${staffId}`),
  getSlots: (staffId: string, date: string) => request(`/slots?staffId=${staffId}&date=${date}`),
  createAppointment: (body: any) => request("/appointments", { method: "POST", body: JSON.stringify(body) }),
  cancelAppointment: (id: string) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
  getMyAppointments: () => request("/appointments/my"),
  adminGetAll: () => request("/admin/appointments"),
  adminAddStaff: (body: any) => request("/admin/staff", { method: "POST", body: JSON.stringify(body) }),
  adminUpdateStaff: (id: string, body: any) => request(`/admin/staff/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adminDeleteStaff: (id: string) => request(`/admin/staff/${id}`, { method: "DELETE" }),
  adminGetSchedules: () => request("/admin/schedules"),
  adminUpdateSchedule: (body: any) => request("/admin/schedules", { method: "POST", body: JSON.stringify(body) }),
  adminGetUsers: () => request("/admin/users"),
  adminUpdateUserRole: (id: string, role: string) => request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) })
};
