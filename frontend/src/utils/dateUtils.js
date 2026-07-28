function pad(n) {
  return String(n).padStart(2, "0");
}

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Local-calendar-date helpers. Deliberately avoid Date#toISOString() — it converts to UTC,
// which silently shifts the date backward in timezones ahead of UTC (e.g. IST, UTC+5:30).
export const todayStr = () => toLocalDateStr(new Date());

export const addDays = (dateStr, delta) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toLocalDateStr(dt);
};

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const min = pad(d.getMinutes());
  return `${dd}/${mm} ${h}:${min} ${ampm}`;
}
