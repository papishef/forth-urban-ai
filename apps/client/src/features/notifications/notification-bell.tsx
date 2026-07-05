import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@forth-urban/ui";
import { useMarkNotificationRead, useNotifications } from "./notifications-api";

/**
 * Notification bell (PRODUCT_SPEC §14 in-app notification feed) — polls
 * GET /api/notifications/me and surfaces unread browser notifications both
 * as a badge in this dropdown and, when permitted, via the Web Notification
 * API so a user doesn't have to keep the tab focused to notice a new one.
 */
export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [isOpen, setIsOpen] = React.useState(false);
  const seenIdsRef = React.useRef<Set<string> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (seenIdsRef.current === null) {
      // First load: remember what's already there instead of notifying for it.
      seenIdsRef.current = new Set(notifications.map((n) => n.id));
      return;
    }

    const unseenUnread = notifications.filter((n) => !n.read && !seenIdsRef.current!.has(n.id));
    for (const n of unseenUnread) {
      seenIdsRef.current.add(n.id);
      if (Notification.permission === "granted") {
        new Notification(n.title, { body: n.body });
      }
    }
    for (const n of notifications) seenIdsRef.current.add(n.id);
  }, [notifications]);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        className="relative px-3"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5C4033] px-1 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-[#181818]/10 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-[#181818]/60">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={`block w-full border-b border-[#181818]/5 p-3 text-left text-sm last:border-b-0 ${
                  n.read ? "text-[#181818]/50" : "bg-[#FFECE4]/60 font-medium text-[#181818]"
                }`}
              >
                <p>{n.title}</p>
                <p className="mt-1 text-xs font-normal text-[#181818]/60">{n.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
