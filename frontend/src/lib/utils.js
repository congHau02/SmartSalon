import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function toLocalDateISO(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftLocalDateISO(dateStr, deltaDays) {
  const [year, month, day] = String(dateStr || toLocalDateISO())
    .split("-")
    .map(Number);
  const d = new Date(year, (month || 1) - 1, (day || 1) + deltaDays);
  return toLocalDateISO(d);
}

/**
 * Calculates a sanitized and clamped discount amount:
 * Non-negative and capped at max(0, subtotal - depositDeducted).
 */
export function calculateClampedDiscount(rawDiscount, subtotal = 0, depositDeducted = 0) {
  const parsed = parseFloat(rawDiscount);
  const validParsed = Number.isFinite(parsed) ? parsed : 0;
  const maxAllowed = Math.max(0, Number(subtotal || 0) - Number(depositDeducted || 0));
  return Math.min(maxAllowed, Math.max(0, validParsed));
}

/**
 * Safely copies text to the clipboard with fallback for non-HTTPS LAN environments.
 * Returns a boolean promise indicating success, never throwing unhandled errors.
 */
export async function copyToClipboard(text) {
  const str = String(text ?? "");
  if (!str) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      // Fall through to DOM fallback
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = str;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return Boolean(success);
    } catch {
      return false;
    }
  }

  return false;
}


