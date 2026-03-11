import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleLogin, handleRegister, handleMe, authMiddleware, adminMiddleware, adminGetUsers, adminUpdateUserRole } from "./auth.js";
import { getStaff, createAppointment, cancelAppointment, getMyAppointments, adminGetAllAppointments, adminAddStaff, adminUpdateStaff, adminDeleteStaff, adminGetSchedules, adminUpdateSchedule, getAvailableSlots, getScheduledDates } from "./booking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Auth
app.post("/api/auth/register", handleRegister);
app.post("/api/auth/login", handleLogin);
app.get("/api/auth/me", authMiddleware, handleMe);

// Booking
app.get("/api/staff", getStaff);
app.get("/api/scheduled-dates", getScheduledDates);
app.get("/api/slots", getAvailableSlots);
app.post("/api/appointments", authMiddleware, createAppointment);
app.patch("/api/appointments/:id/cancel", authMiddleware, cancelAppointment);
app.get("/api/appointments/my", authMiddleware, getMyAppointments);

// Admin
app.get("/api/admin/appointments", authMiddleware, adminMiddleware, adminGetAllAppointments);
app.post("/api/admin/staff", authMiddleware, adminMiddleware, adminAddStaff);
app.put("/api/admin/staff/:id", authMiddleware, adminMiddleware, adminUpdateStaff);
app.delete("/api/admin/staff/:id", authMiddleware, adminMiddleware, adminDeleteStaff);
app.get("/api/admin/schedules", authMiddleware, adminMiddleware, adminGetSchedules);
app.post("/api/admin/schedules", authMiddleware, adminMiddleware, adminUpdateSchedule);
app.get("/api/admin/users", authMiddleware, adminMiddleware, adminGetUsers);
app.patch("/api/admin/users/:id/role", authMiddleware, adminMiddleware, adminUpdateUserRole);

// 提供前端靜態檔案
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`美甲預約系統啟動：http://localhost:${PORT}`);
});
