import { api } from "./api.js";

const app = document.getElementById("app")!;
let currentUser: any = null;
let staffList: any[] = [];
let bookingState = { staffId: "", date: "", time: "" };

function toast(msg: string, isError = false) {
  alert(msg);
}

async function init() {
  const token = localStorage.getItem("nail_token");
  if (token) {
    try {
      const res = await api.getMe();
      currentUser = res.user;
      renderDashboard();
      return;
    } catch {
      localStorage.removeItem("nail_token");
    }
  }
  renderAuth("login");
}

function renderAuth(mode: "login" | "register") {
  app.innerHTML = `
    <div class="card">
      <h1>${mode === "login" ? "🌸 歡迎回來" : "🌸 建立帳號"}</h1>
      <p class="subtitle">漾彩美甲・專屬於您的精緻時光</p>
      <form id="auth-form">
        <div class="form-group">
          <label>電子信箱</label>
          <input type="email" name="email" required placeholder="example@mail.com" />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input type="password" name="password" required placeholder="••••••••" minlength="6" />
        </div>
        <button type="submit" id="submit-btn">${mode === "login" ? "立即登入" : "註冊並加入會員"}</button>
      </form>
      <button class="btn-ghost" style="margin-top:15px" id="switch-mode">
        ${mode === "login" ? "還沒有帳號？前往註冊" : "已經有帳號了？返回登入"}
      </button>
    </div>
  `;

  document.getElementById("switch-mode")!.onclick = () => renderAuth(mode === "login" ? "register" : "login");
  
  document.getElementById("auth-form")!.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    const btn = document.getElementById("submit-btn") as HTMLButtonElement;
    
    btn.disabled = true;
    try {
      const res = mode === "login" ? await api.login(data) : await api.register(data);
      localStorage.setItem("nail_token", res.token);
      currentUser = res.user;
      renderDashboard();
    } catch (err: any) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  };
}

async function renderDashboard(tab: "book" | "history" | "admin" | "staff" | "schedule" = "book") {
  const isAdmin = currentUser.role === "admin";
  app.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div style="font-weight:700">Hi, ${currentUser.email.split('@')[0]} 👋 ${isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}</div>
        <a href="#" id="logout" style="font-size:0.8rem; color:var(--text-muted)">登出</a>
      </div>
      
      <div class="nav-tabs">
        <div class="tab ${tab === 'book' ? 'active' : ''}" data-tab="book">預約服務</div>
        <div class="tab ${tab === 'history' ? 'active' : ''}" data-tab="history">我的預約</div>
        ${isAdmin ? `
          <div class="tab ${tab === 'admin' ? 'active' : ''}" data-tab="admin">全部預約</div>
          <div class="tab ${tab === 'staff' ? 'active' : ''}" data-tab="staff">美甲師管理</div>
          <div class="tab ${tab === 'schedule' ? 'active' : ''}" data-tab="schedule">排班管理</div>
        ` : ''}
      </div>

      <div id="dashboard-content">載入中...</div>
    </div>
  `;

  document.getElementById("logout")!.onclick = () => {
    localStorage.removeItem("nail_token");
    location.reload();
  };

  document.querySelectorAll(".tab").forEach(el => {
    el.addEventListener("click", () => renderDashboard(el.getAttribute("data-tab") as any));
  });

  const content = document.getElementById("dashboard-content")!;
  if (tab === "book") renderBookingFlow(content);
  else if (tab === "history") renderHistory(content);
  else if (tab === "admin") renderAdminView(content);
  else if (tab === "staff") renderStaffManagement(content);
  else if (tab === "schedule") renderScheduleManagement(content);
}

async function renderBookingFlow(container: HTMLElement) {
  try {
    if (staffList.length === 0) {
      const res = await api.getStaff();
      staffList = res.staff;
    }

    container.innerHTML = `
      <div id="step-1">
        <label style="margin-bottom:15px">1. 選擇美甲師</label>
        <div class="staff-grid">
          ${staffList.map(s => `
            <div class="staff-card ${bookingState.staffId === s.id ? 'active' : ''}" data-id="${s.id}">
              <div class="staff-avatar">${s.avatar}</div>
              <div class="staff-name">${s.name}</div>
              <div class="staff-specialty">${s.specialty}</div>
            </div>
          `).join("")}
        </div>
      </div>
      <div id="step-2" style="display:none">
        <label style="margin-bottom:15px">2. 選擇日期</label>
        <div id="booking-calendar-container"></div>
        
        <div id="step-3" style="display:none; margin-top:20px">
          <label style="margin-bottom:15px">3. 選擇時段</label>
          <div class="time-grid" id="time-slots"></div>
        </div>

        <button id="confirm-booking" style="margin-top:25px" disabled>確認預約</button>
        <button class="btn-ghost" id="back-to-staff" style="margin-top:10px">回上一步</button>
      </div>
    `;

    const step1 = document.getElementById("step-1")!;
    const step2 = document.getElementById("step-2")!;
    const step3 = document.getElementById("step-3")!;
    const confirmBtn = document.getElementById("confirm-booking") as HTMLButtonElement;

    let scheduledDates: string[] = [];

    document.querySelectorAll(".staff-card").forEach(el => {
      el.addEventListener("click", async () => {
        bookingState.staffId = el.getAttribute("data-id")!;
        document.querySelectorAll(".staff-card").forEach(x => x.classList.remove("active"));
        el.classList.add("active");
        step1.style.display = "none";
        step2.style.display = "block";
        const calContainer = document.getElementById("booking-calendar-container")!;
        calContainer.innerHTML = "載入排班中...";
        try {
          const datesRes = await api.getScheduledDates(bookingState.staffId);
          scheduledDates = datesRes.dates;
        } catch {
          scheduledDates = [];
        }
        renderBookingCalendar(calContainer);
      });
    });

    document.getElementById("back-to-staff")!.onclick = () => {
      step1.style.display = "block";
      step2.style.display = "none";
    };

    function renderBookingCalendar(calContainer: HTMLElement) {
      const year = currentCalDate.getFullYear();
      const month = currentCalDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthName = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(currentCalDate);
      const todayStr = new Date().toISOString().split('T')[0];

      calContainer.innerHTML = `
        <div class="calendar-container">
          <div class="calendar-header">
            <div class="calendar-month">${monthName}</div>
            <div class="calendar-nav">
              <button class="calendar-btn" id="book-cal-prev">&lt;</button>
              <button class="calendar-btn" id="book-cal-next">&gt;</button>
            </div>
          </div>
          <div class="calendar-grid">
            ${['日', '一', '二', '三', '四', '五', '六'].map(d => `<div class="calendar-day-header">${d}</div>`).join("")}
            ${Array(firstDay).fill(0).map(() => `<div class="calendar-day disabled"></div>`).join("")}
            ${Array(daysInMonth).fill(0).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isDisabled = dateStr < todayStr || !scheduledDates.includes(dateStr);
              const isSelected = bookingState.date === dateStr;
              return `<div class="calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">${day}</div>`;
            }).join("")}
          </div>
          <div class="calendar-legend">
            <div class="legend-item"><div class="legend-dot" style="background:var(--primary-dark)"></div><span>已選擇</span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#eee"></div><span>未開放</span></div>
          </div>
        </div>
      `;

      document.getElementById("book-cal-prev")!.onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderBookingCalendar(calContainer);
      };
      document.getElementById("book-cal-next")!.onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderBookingCalendar(calContainer);
      };

      document.querySelectorAll(".calendar-day:not(.disabled)").forEach(el => {
        el.addEventListener("click", async () => {
          bookingState.date = el.getAttribute("data-date")!;
          bookingState.time = "";
          document.querySelectorAll(".calendar-day").forEach(x => x.classList.remove("selected"));
          el.classList.add("selected");
          await fetchAndRenderSlots();
        });
      });
    }

    async function fetchAndRenderSlots() {
      step3.style.display = "block";
      const slotsContainer = document.getElementById("time-slots")!;
      slotsContainer.innerHTML = "載入中...";
      confirmBtn.disabled = true;

      try {
        const res = await api.getSlots(bookingState.staffId, bookingState.date);
        if (res.slots.length === 0) {
          slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:20px">當天暫無可預約時段</p>';
          return;
        }

        slotsContainer.innerHTML = res.slots.map((s: any) => `
          <div class="time-slot ${s.isBooked ? 'booked' : ''} ${bookingState.time === s.time ? 'active' : ''}" data-time="${s.time}">
            ${s.time}
          </div>
        `).join("");

        document.querySelectorAll(".time-slot:not(.booked)").forEach(el => {
          el.addEventListener("click", () => {
            document.querySelectorAll(".time-slot").forEach(x => x.classList.remove("active"));
            el.classList.add("active");
            bookingState.time = el.getAttribute("data-time")!;
            confirmBtn.disabled = false;
          });
        });
      } catch (err: any) {
        slotsContainer.innerHTML = "載入失敗: " + err.message;
      }
    }

    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      try {
        await api.createAppointment(bookingState);
        toast("預約成功！我們將保留您的時段 ✨");
        bookingState = { staffId: "", date: "", time: "" }; // 重置狀態
        renderDashboard("history");
      } catch (err: any) {
        toast(err.message, true);
        confirmBtn.disabled = false;
      }
    };
  } catch (err: any) {
    container.innerHTML = `<p style="color:red; text-align:center">載入失敗: ${err.message}</p>`;
  }
}

async function renderHistory(container: HTMLElement) {
  try {
    const res = await api.getMyAppointments();
    container.innerHTML = res.appointments.map((a: any) => `
      <div class="apt-card">
        <div class="apt-info">
          <div class="apt-date">${a.date} ${a.time}</div>
          <div style="font-size:0.85rem">美甲師：${a.staffName}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px">
          <div class="apt-status ${a.status === 'cancelled' ? 'status-cancelled' : ''}">${a.status === 'pending' ? '待服務' : a.status === 'cancelled' ? '已取消' : a.status}</div>
          ${a.status === 'pending' ? `<button class="btn-sm btn-danger cancel-apt" data-id="${a.id}">取消</button>` : ''}
        </div>
      </div>
    `).join("") || '<p style="text-align:center; color:var(--text-muted)">尚無預約紀錄</p>';

    container.querySelectorAll(".cancel-apt").forEach(el => {
      (el as HTMLElement).onclick = async () => {
        if (!confirm("確定要取消這筆預約嗎？")) return;
        try {
          await api.cancelAppointment(el.getAttribute("data-id")!);
          renderHistory(container);
        } catch (err: any) {
          toast(err.message, true);
        }
      };
    });
  } catch (err: any) {
    container.textContent = "載入失敗: " + err.message;
  }
}

async function renderAdminView(container: HTMLElement) {
  try {
    const res = await api.adminGetAll();
    container.innerHTML = `
      <div style="margin-bottom:15px; font-size:0.8rem; color:var(--text-muted)">共 ${res.appointments.length} 筆預約資料</div>
      ${res.appointments.map((a: any) => `
        <div class="admin-item">
          <div class="admin-info">
            <div class="apt-date">${a.date} ${a.time}</div>
            <p>客戶：${a.userEmail}</p>
            <p>美甲師：${a.staffName}</p>
          </div>
        </div>
      `).join("") || "尚無預約"}
    `;
  } catch (err: any) {
    container.textContent = "無權限或載入失敗: " + err.message;
  }
}

async function renderStaffManagement(container: HTMLElement) {
  try {
    const res = await api.getStaff();
    staffList = res.staff;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3>美甲師列表</h3>
        <button class="btn-sm btn-success" id="add-staff-btn">+ 新增美甲師</button>
      </div>
      <div id="staff-list">
        ${staffList.map(s => `
          <div class="admin-item">
            <div style="display:flex; align-items:center; gap:15px">
              <div style="font-size:1.5rem">${s.avatar}</div>
              <div class="admin-info">
                <h4>${s.name}</h4>
                <p>${s.specialty}</p>
              </div>
            </div>
            <div style="display:flex; gap:8px">
              <button class="btn-sm btn-outline edit-staff" data-id="${s.id}">編輯</button>
              <button class="btn-sm btn-danger delete-staff" data-id="${s.id}">刪除</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("add-staff-btn")!.onclick = () => showStaffModal();
    document.querySelectorAll(".edit-staff").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const staff = staffList.find(s => s.id === id);
        showStaffModal(staff);
      });
    });
    document.querySelectorAll(".delete-staff").forEach(el => {
      el.addEventListener("click", async () => {
        if (confirm("確定要刪除這位美甲師嗎？")) {
          await api.adminDeleteStaff(el.getAttribute("data-id")!);
          renderStaffManagement(container);
        }
      });
    });
  } catch (err: any) {
    container.textContent = "載入失敗: " + err.message;
  }
}

function showStaffModal(staff: any = null) {
  const avatarOptions = [
    "👩‍🎨","👩","👩‍🦰","👩‍🦱","👩‍🦳","👩‍🦲",
    "🧑‍🎨","👨‍🎨","💅","🌸","🌺","🌻",
    "✨","💎","🦋","🌈","🎀","💄",
    "🌷","🪷","🌹","💐","🍀","⭐"
  ];
  let selectedAvatar = staff?.avatar || "👩‍🎨";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>${staff ? "編輯美甲師" : "新增美甲師"}</h3>
      <form id="staff-form" style="margin-top:20px">
        <div class="form-group">
          <label>姓名</label>
          <input type="text" name="name" required value="${staff?.name || ''}" />
        </div>
        <div class="form-group">
          <label>頭像</label>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px">
            <div id="avatar-preview" style="font-size:2.5rem; width:56px; height:56px; display:flex; align-items:center; justify-content:center; background:var(--bg); border-radius:50%; border:2px solid var(--primary)">${selectedAvatar}</div>
            <span style="font-size:0.85rem; color:var(--text-muted)">點擊下方選擇頭像</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:8px">
            ${avatarOptions.map(a => `
              <div class="avatar-option${a === selectedAvatar ? ' selected' : ''}" data-avatar="${a}"
                style="font-size:1.6rem; text-align:center; padding:6px; border-radius:8px; cursor:pointer; border:2px solid ${a === selectedAvatar ? 'var(--primary-dark)' : 'transparent'}; background:var(--bg)">
                ${a}
              </div>
            `).join("")}
          </div>
          <input type="hidden" name="avatar" id="avatar-input" value="${selectedAvatar}" />
        </div>
        <div style="display:flex; gap:10px; margin-top:20px">
          <button type="button" class="btn-outline" id="modal-cancel">取消</button>
          <button type="submit">${staff ? "更新" : "新增"}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll(".avatar-option").forEach(el => {
    el.addEventListener("click", () => {
      selectedAvatar = el.getAttribute("data-avatar")!;
      (document.getElementById("avatar-input") as HTMLInputElement).value = selectedAvatar;
      document.getElementById("avatar-preview")!.textContent = selectedAvatar;
      overlay.querySelectorAll(".avatar-option").forEach(x => {
        (x as HTMLElement).style.borderColor = "transparent";
        x.classList.remove("selected");
      });
      (el as HTMLElement).style.borderColor = "var(--primary-dark)";
    });
  });

  document.getElementById("modal-cancel")!.onclick = () => overlay.remove();
  document.getElementById("staff-form")!.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    try {
      if (staff) await api.adminUpdateStaff(staff.id, data);
      else await api.adminAddStaff(data);
      overlay.remove();
      renderDashboard("staff");
    } catch (err: any) {
      toast(err.message, true);
    }
  };
}

async function renderScheduleManagement(container: HTMLElement) {
  try {
    if (staffList.length === 0) {
      const res = await api.getStaff();
      staffList = res.staff;
    }

    container.innerHTML = `
      <div class="form-group">
        <label>選擇美甲師</label>
        <select id="schedule-staff-select">
          <option value="">請選擇...</option>
          ${staffList.map(s => `<option value="${s.id}">${s.avatar} ${s.name}</option>`).join("")}
        </select>
      </div>
      <div id="schedule-calendar-container"></div>
    `;

    const select = document.getElementById("schedule-staff-select") as HTMLSelectElement;
    select.onchange = () => {
      if (select.value) renderScheduleCalendar(document.getElementById("schedule-calendar-container")!, select.value);
      else document.getElementById("schedule-calendar-container")!.innerHTML = "";
    };
  } catch (err: any) {
    container.textContent = "載入失敗: " + err.message;
  }
}

let currentCalDate = new Date();

function renderScheduleCalendar(container: HTMLElement, staffId: string) {
  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(currentCalDate);

  container.innerHTML = `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="calendar-month">${monthName}</div>
        <div class="calendar-nav">
          <button class="calendar-btn" id="cal-prev">&lt;</button>
          <button class="calendar-btn" id="cal-next">&gt;</button>
        </div>
      </div>
      <div class="calendar-grid">
        ${['日', '一', '二', '三', '四', '五', '六'].map(d => `<div class="calendar-day-header">${d}</div>`).join("")}
        ${Array(firstDay).fill(0).map(() => `<div class="calendar-day disabled"></div>`).join("")}
        ${Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isDisabled = dateStr < new Date().toISOString().split('T')[0];
          return `<div class="calendar-day ${isDisabled ? 'disabled' : ''}" data-date="${dateStr}">${day}</div>`;
        }).join("")}
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:15px; text-align:center">點擊日期設定可預約時段</p>
    </div>
  `;

  document.getElementById("cal-prev")!.onclick = () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderScheduleCalendar(container, staffId);
  };
  document.getElementById("cal-next")!.onclick = () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderScheduleCalendar(container, staffId);
  };

  document.querySelectorAll(".calendar-day:not(.disabled)").forEach(el => {
    el.addEventListener("click", () => showScheduleModal(staffId, el.getAttribute("data-date")!));
  });
}

async function showScheduleModal(staffId: string, date: string) {
  const staff = staffList.find(s => s.id === staffId);
  const res = await api.getSlots(staffId, date);
  const bookedSlots = res.slots.filter((s: any) => s.isBooked).map((s: any) => s.time);
  const activeSlots = res.slots.map((s: any) => s.time);

  const allPossibleSlots = ["11:00", "11:30", "13:30", "14:00", "16:00", "16:30", "19:00", "19:30"];

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const isPastSlot = (slotTime: string) => {
    if (date > todayStr) return false;
    if (date < todayStr) return true;
    const [h, m] = slotTime.split(":").map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <h3 style="text-align:center; color:var(--primary-dark)">${date}</h3>
      <p style="text-align:center; font-size:0.9rem; margin-bottom:20px">${staff.name} 的可服務時段</p>

      <div style="display:flex; gap:10px; margin-bottom:15px">
        <button class="btn-sm btn-outline" id="select-all-slots">全選</button>
        <button class="btn-sm btn-outline" id="clear-all-slots" style="color:#ff5252; border-color:#ffcdd2">清除當天排班</button>
      </div>

      <div class="time-grid" style="max-height:300px; overflow-y:auto; padding:5px">
        ${allPossibleSlots.map(t => {
          const isActive = activeSlots.includes(t);
          const isBooked = bookedSlots.includes(t);
          const isPast = isPastSlot(t);
          return `
            <div class="time-slot ${isActive ? 'active' : ''} ${isBooked || isPast ? 'booked' : ''}" data-time="${t}" title="${isPast ? '已過時段' : ''}">
              ${t}${isPast ? ' ✕' : ''}
            </div>
          `;
        }).join("")}
      </div>

      <button id="save-schedule" style="margin-top:25px">完成</button>
      <button class="btn-ghost" id="modal-cancel">取消</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function toMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function updateSlotStates() {
    const activeTimes = Array.from(overlay.querySelectorAll(".time-slot.active"))
      .map(el => el.getAttribute("data-time")!);

    overlay.querySelectorAll(".time-slot:not(.booked)").forEach(el => {
      const t = el.getAttribute("data-time")!;
      if (el.classList.contains("active")) return;
      const isNear = activeTimes.some(a => Math.abs(toMinutes(a) - toMinutes(t)) <= 30);
      el.classList.toggle("slot-blocked", isNear);
      (el as HTMLElement).style.opacity = isNear ? "0.35" : "";
      (el as HTMLElement).style.cursor = isNear ? "not-allowed" : "";
    });
  }

  overlay.querySelectorAll(".time-slot:not(.booked)").forEach(el => {
    el.addEventListener("click", () => {
      if (el.classList.contains("slot-blocked")) return;
      el.classList.toggle("active");
      updateSlotStates();
    });
  });

  updateSlotStates();

  document.getElementById("select-all-slots")!.onclick = () => {
    overlay.querySelectorAll(".time-slot:not(.booked):not(.slot-blocked)").forEach(el => el.classList.add("active"));
    updateSlotStates();
  };
  document.getElementById("clear-all-slots")!.onclick = () => {
    overlay.querySelectorAll(".time-slot:not(.booked)").forEach(el => {
      el.classList.remove("active", "slot-blocked");
      (el as HTMLElement).style.opacity = "";
      (el as HTMLElement).style.cursor = "";
    });
    updateSlotStates();
  };

  document.getElementById("modal-cancel")!.onclick = () => overlay.remove();
  document.getElementById("save-schedule")!.onclick = async () => {
    const selectedSlots = Array.from(document.querySelectorAll(".time-slot.active")).map(el => el.getAttribute("data-time")!);
    try {
      await api.adminUpdateSchedule({ staffId, date, slots: selectedSlots });
      overlay.remove();
      toast("排班已更新");
    } catch (err: any) {
      toast(err.message, true);
    }
  };
}

init();
