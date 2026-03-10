import { Response } from "express";
import { randomUUID } from "crypto";
import { readData, writeData } from "./db.js";
import type { Appointment, Staff, User, Schedule } from "./types.js";

export async function getStaff(req: any, res: Response) {
  const staff = await readData<Staff>("staff");
  res.json({ success: true, staff });
}

export async function adminAddStaff(req: any, res: Response) {
  const { name, avatar } = req.body;
  const staff = await readData<Staff>("staff");
  const newStaff: Staff = { id: randomUUID(), name, avatar };
  staff.push(newStaff);
  await writeData("staff", staff);
  res.status(201).json({ success: true, staff: newStaff });
}

export async function adminUpdateStaff(req: any, res: Response) {
  const { id } = req.params;
  const { name, avatar } = req.body;
  const staff = await readData<Staff>("staff");
  const index = staff.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "找不到該美甲師" });
  staff[index] = { ...staff[index], name, avatar };
  await writeData("staff", staff);
  res.json({ success: true, staff: staff[index] });
}

export async function adminDeleteStaff(req: any, res: Response) {
  const { id } = req.params;
  let staff = await readData<Staff>("staff");
  staff = staff.filter(s => s.id !== id);
  await writeData("staff", staff);
  res.json({ success: true });
}

export async function adminGetSchedules(req: any, res: Response) {
  const schedules = await readData<Schedule>("schedules");
  res.json({ success: true, schedules });
}

export async function adminUpdateSchedule(req: any, res: Response) {
  const { staffId, date, slots } = req.body;
  const schedules = await readData<Schedule>("schedules");
  const index = schedules.findIndex(s => s.staffId === staffId && s.date === date);
  if (index !== -1) {
    if (slots.length === 0) {
      schedules.splice(index, 1);
    } else {
      schedules[index].slots = slots;
    }
  } else if (slots.length > 0) {
    schedules.push({ id: randomUUID(), staffId, date, slots });
  }
  await writeData("schedules", schedules);
  res.json({ success: true });
}

export async function getScheduledDates(req: any, res: Response) {
  const { staffId } = req.query;
  const schedules = await readData<Schedule>("schedules");
  const appointments = await readData<Appointment>("appointments");
  const relevant = schedules.filter(s => s.staffId === staffId && s.slots.length > 0);
  const dates = relevant.map(s => s.date);
  const slotsMap: Record<string, string[]> = {};
  relevant.forEach(s => {
    const booked = appointments
      .filter(a => a.staffId === staffId && a.date === s.date && a.status !== "cancelled")
      .map(a => a.time);
    const available = s.slots.filter(t => !booked.includes(t));
    if (available.length > 0) slotsMap[s.date] = available;
  });
  res.json({ success: true, dates, slotsMap });
}

export async function getAvailableSlots(req: any, res: Response) {
  const { staffId, date } = req.query;
  const schedules = await readData<Schedule>("schedules");
  const appointments = await readData<Appointment>("appointments");

  const schedule = schedules.find(s => s.staffId === staffId && s.date === date);
  if (!schedule) return res.json({ success: true, slots: [] });

  const bookedSlots = appointments
    .filter(a => a.staffId === staffId && a.date === date && a.status !== "cancelled")
    .map(a => a.time);

  const availableSlots = schedule.slots.map(s => ({
    time: s,
    isBooked: bookedSlots.includes(s)
  }));

  res.json({ success: true, slots: availableSlots });
}

export async function createAppointment(req: any, res: Response) {
  const { staffId, date, time } = req.body;
  const appointments = await readData<Appointment>("appointments");
  const staff = (await readData<Staff>("staff")).find(s => s.id === staffId);
  const users = await readData<User>("users");
  const user = users.find(u => u.id === req.userId);

  if (!staff || !user) return res.status(400).json({ success: false, message: "無效的請求" });

  // 簡單檢查衝突：同一美甲師、同一時間
  const isConflict = appointments.find(a => a.staffId === staffId && a.date === date && a.time === time && a.status !== "cancelled");
  if (isConflict) return res.status(409).json({ success: false, message: "此時段已被預約" });

  const newAppointment: Appointment = {
    id: randomUUID(),
    userId: user.id,
    userEmail: user.email,
    staffId: staff.id,
    staffName: staff.name,
    date,
    time,
    status: "pending",
    createdAt: new Date()
  };

  appointments.push(newAppointment);
  await writeData("appointments", appointments);
  res.status(201).json({ success: true, appointment: newAppointment });
}

export async function cancelAppointment(req: any, res: Response) {
  const { id } = req.params;
  const appointments = await readData<Appointment>("appointments");
  const index = appointments.findIndex(a => a.id === id && a.userId === req.userId);
  if (index === -1) return res.status(404).json({ success: false, message: "找不到該預約" });
  appointments[index].status = "cancelled";
  await writeData("appointments", appointments);
  res.json({ success: true });
}

export async function getMyAppointments(req: any, res: Response) {
  const appointments = await readData<Appointment>("appointments");
  const myData = appointments.filter(a => a.userId === req.userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, appointments: myData });
}

export async function adminGetAllAppointments(req: any, res: Response) {
  const appointments = await readData<Appointment>("appointments");
  res.json({ success: true, appointments });
}
