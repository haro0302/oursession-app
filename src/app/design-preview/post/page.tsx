import PostClient from "@/app/(app)/post/PostClient";
import { mockProfile } from "@/lib/design-mock-data";

export default function DesignPreviewPost() {
  return (
    <PostClient
      userId={mockProfile.id}
      isPracticeDefault={mockProfile.is_practice}
      editSession={null}
    />
  );
}
