import MypageClient from "@/app/(app)/mypage/MypageClient";
import { mockProfile, mockOwnSessions, mockSimilarUsers } from "@/lib/design-mock-data";

export default function DesignPreviewMypage() {
  return (
    <MypageClient
      profile={mockProfile}
      ownSessions={mockOwnSessions}
      similarUsers={mockSimilarUsers}
      userId={mockProfile.id}
    />
  );
}
