import MypageClient from "@/app/(app)/mypage/MypageClient";
import { mockProfile, mockOwnSessions, mockSimilarUsers, mockWantSongs } from "@/lib/design-mock-data";

export default function DesignPreviewMypage() {
  return (
    <MypageClient
      profile={mockProfile}
      ownSessions={mockOwnSessions}
      similarUsers={mockSimilarUsers}
      wantSongs={mockWantSongs}
      userId={mockProfile.id}
    />
  );
}
