/**
 * デザインプレビュー専用のダミーデータ。
 * 実データ取得ロジックとは独立させている（src/app/design-preview/** からのみ参照する想定）。
 */
import type { Database } from "@/types/database";
import type { SessionWithAuthor } from "@/lib/db";
import type { MsgRow } from "@/app/(app)/messages/page";
import type { AnswerWithContext, ActiveChat } from "@/components/notifications/NotificationsView";
import type { MessageWithSender } from "@/app/chat/[answerId]/page";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

const now = new Date().toISOString();

export const mockProfile: ProfileRow = {
  id: "design-preview-user",
  nickname: "はるお",
  area: "東京都",
  is_practice: true,
  instruments: ["ギター", "ボーカル"],
  genres: ["ロック", "ポップ"],
  favorite_artists: ["Mr.Children", "back number"],
  favorite_tracks: ["Tomorrow never knows"],
  bio: "土日に練習中。一緒にセッションできる人募集してます🎸",
  avatar_url: null,
  sns_links: {},
  onboarded_at: now,
  created_at: now,
  updated_at: now,
};

export const mockPartner: ProfileRow = {
  id: "design-preview-partner",
  nickname: "みずき",
  area: "神奈川県",
  is_practice: false,
  instruments: ["ドラム"],
  genres: ["ファンク", "ジャズ"],
  favorite_artists: ["東京事変"],
  favorite_tracks: [],
  bio: null,
  avatar_url: null,
  sns_links: {},
  onboarded_at: now,
  created_at: now,
  updated_at: now,
};

const mockSimilarUser: ProfileRow = {
  ...mockPartner,
  id: "design-preview-similar-1",
  nickname: "そら",
};

const mockSessionBase: SessionRow = {
  id: "design-preview-session-1",
  author_id: mockProfile.id,
  title: "弾き語りでカバーしてみました",
  body: "初めて投稿します。よかったら聴いてください🎵",
  audio_url: "/mock-audio.mp3",
  waveform_peaks: null,
  is_practice: true,
  tags: ["ギター", "ロック", "東京都"],
  created_at: now,
};

export const mockOwnSessions: SessionWithAuthor[] = [
  { ...mockSessionBase, author: mockProfile },
  {
    ...mockSessionBase,
    id: "design-preview-session-2",
    title: "弾いてみた第2弾",
    author: mockProfile,
  },
];

export const mockSimilarUsers: ProfileRow[] = [mockSimilarUser, mockPartner];

export const mockMessageRows: MsgRow[] = [
  {
    roomId: "design-preview-answer-1",
    sessionId: mockSessionBase.id,
    sessionTitle: mockSessionBase.title,
    partnerNickname: mockPartner.nickname,
    partnerUserId: mockPartner.id,
    partnerAvatarUrl: mockPartner.avatar_url,
    partnerIsPractice: mockPartner.is_practice,
    role: "host",
    previewText: "新しいアンサーが届きました",
    previewState: "alert",
    rawTime: now,
    badge: 1,
  },
  {
    roomId: "design-preview-answer-2",
    sessionId: "design-preview-session-3",
    sessionTitle: "セッション相手募集中です",
    partnerNickname: mockProfile.nickname,
    partnerUserId: mockProfile.id,
    partnerAvatarUrl: mockProfile.avatar_url,
    partnerIsPractice: mockProfile.is_practice,
    role: "host",
    previewText: "セッションアンサーはまだいません",
    previewState: "empty",
    rawTime: now,
    badge: 0,
  },
];

const mockAnswer: AnswerRow = {
  id: "design-preview-answer-1",
  session_id: mockSessionBase.id,
  sender_id: mockPartner.id,
  audio_url: "/mock-audio.mp3",
  waveform_peaks: null,
  message: "めちゃくちゃいい曲ですね！一緒にやってみたいです。",
  status: "pending",
  created_at: now,
};

export const mockPendingAnswers: AnswerWithContext[] = [
  {
    ...mockAnswer,
    sender: mockPartner,
    session: { id: mockSessionBase.id, title: mockSessionBase.title },
  },
];

export const mockActiveChats: ActiveChat[] = [
  {
    answerId: "design-preview-answer-2",
    sessionTitle: "弾いてみた第2弾",
    partnerNickname: mockSimilarUser.nickname,
    partnerAvatarUrl: mockSimilarUser.avatar_url,
    partnerIsPractice: mockSimilarUser.is_practice,
  },
];

const mockMessage: MessageRow = {
  id: "design-preview-message-1",
  answer_id: "design-preview-answer-2",
  session_id: mockSessionBase.id,
  sender_id: mockPartner.id,
  body: "今度の週末どこかスタジオ空いてますか?",
  created_at: now,
};

export const mockChatMessages: MessageWithSender[] = [
  { ...mockMessage, sender: mockPartner },
  {
    ...mockMessage,
    id: "design-preview-message-2",
    sender_id: mockProfile.id,
    body: "土曜の午後なら空いてます!",
    sender: mockProfile,
  },
];
