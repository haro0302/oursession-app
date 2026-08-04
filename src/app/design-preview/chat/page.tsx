import ChatRoom from "@/components/chat/ChatRoom";
import { mockProfile, mockPartner, mockChatMessages } from "@/lib/design-mock-data";

export default function DesignPreviewChat() {
  return (
    <ChatRoom
      answerId="design-preview-answer-2"
      sessionTitle="弾いてみた第2弾"
      sessionAudioUrl="/mock-audio.mp3"
      sessionAuthorNickname={mockProfile.nickname}
      partnerNickname={mockPartner.nickname}
      partnerId={mockPartner.id}
      partnerAvatarUrl={mockPartner.avatar_url}
      myAvatarUrl={mockProfile.avatar_url}
      initialMessages={mockChatMessages}
      currentUserId={mockProfile.id}
      role="host"
      pendingAnswer={null}
      initialAssistAnswers={{}}
      initialStudioProposals={[]}
    />
  );
}
