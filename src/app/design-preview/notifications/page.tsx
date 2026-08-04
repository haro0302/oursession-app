import NotificationsView from "@/components/notifications/NotificationsView";
import { mockPendingAnswers, mockActiveChats, mockProfile } from "@/lib/design-mock-data";

export default function DesignPreviewNotifications() {
  return (
    <NotificationsView
      pendingAnswers={mockPendingAnswers}
      activeChats={mockActiveChats}
      currentUserId={mockProfile.id}
    />
  );
}
