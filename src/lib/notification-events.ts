/** ให้ NotificationBell โหลดรายการใหม่หลังมีเหตุการณ์แจ้งเตือน */
export function emitNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mis:notifications-changed"));
  }
}
