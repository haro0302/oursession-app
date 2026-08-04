import MessagesClient from "@/app/(app)/messages/MessagesClient";
import { mockMessageRows, mockProfile } from "@/lib/design-mock-data";

export default function DesignPreviewMessages() {
  return <MessagesClient rows={mockMessageRows} currentUserId={mockProfile.id} />;
}
