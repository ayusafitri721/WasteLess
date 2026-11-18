export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

export function formatQuantity(quantity: number, unit: string) {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(quantity)} ${unit}`;
}

export function formatDeadline(value: string) {
  const target = new Date(value).getTime();
  const diff = target - Date.now();

  if (Number.isNaN(target)) return "-";
  if (diff <= 0) return "Batas pengambilan sudah lewat";

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / (60 * 1000)));
    return `Sisa ${minutes} menit`;
  }
  if (hours < 24) {
    return `Sisa ${hours} jam`;
  }
  const days = Math.floor(hours / 24);
  return `Sisa ${days} hari`;
}

export function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
