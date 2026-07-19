"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, Eye } from "lucide-react";
import AudioUploader from "@/components/audio/AudioUploader";
import AudioPlayer from "@/components/ui/AudioPlayer";
import FilterSheet from "@/components/session/FilterSheet";
import { insertSession, updateSession } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { Session } from "@/types/database";

type FilterKey = "instrument" | "genre" | "area";

const INSTRUMENT_SET = new Set([
  "ボーカル", "ギター", "ベース", "ドラム", "ピアノ", "キーボード", "ウクレレ",
  "サックス", "トランペット", "バイオリン", "和楽器", "その他",
]);
const GENRE_SET = new Set([
  "ロック", "J-POP", "ボカロ", "フォーク", "ジャズ", "ファンク",
  "R&B", "ブルース", "カントリー", "メタル", "アニソン", "洋楽",
]);

function parseSessionTags(tags: string[]): Record<FilterKey, string[]> {
  const result: Record<FilterKey, string[]> = { instrument: [], genre: [], area: [] };
  for (const tag of tags) {
    if (INSTRUMENT_SET.has(tag)) result.instrument.push(tag);
    else if (GENRE_SET.has(tag)) result.genre.push(tag);
    else result.area.push(tag);
  }
  return result;
}

interface Props {
  userId: string;
  isPracticeDefault: boolean;
  editSession?: Session | null;
}

export default function PostClient({ userId, isPracticeDefault, editSession }: Props) {
  const router = useRouter();
  const isEditMode = !!editSession;
  const sessionId = useRef(editSession?.id ?? crypto.randomUUID()).current;

  const [audioUrl, setAudioUrl] = useState<string | null>(editSession?.audio_url ?? null);
  const [title, setTitle] = useState(editSession?.title ?? "");
  const [body, setBody] = useState(editSession?.body ?? "");
  const [postTags, setPostTags] = useState<Record<FilterKey, string[]>>(
    () => editSession ? parseSessionTags(editSession.tags) : { instrument: [], genre: [], area: [] }
  );
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [tagSheetKey, setTagSheetKey] = useState<FilterKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);

  const hasAnyTag =
    postTags.instrument.length > 0 ||
    postTags.genre.length > 0 ||
    postTags.area.length > 0;

  const isDirty = isEditMode
    ? true
    : (!!audioUrl || title.length > 0 || body.length > 0 || hasAnyTag);

  const canPublish = isEditMode
    ? (title.trim().length > 0 && title.length <= 30 && body.length <= 150 && hasAnyTag && !submitting)
    : (!!audioUrl && title.trim().length > 0 && title.length <= 30 && body.length <= 150 && hasAnyTag && !submitting);

  function handleCancel() {
    if (isDirty) {
      if (!confirm(isEditMode ? "変更内容を破棄しますか?" : "入力内容を破棄してタイムラインに戻りますか?")) return;
    }
    router.push(isEditMode ? "/mypage" : "/timeline");
  }

  async function handlePublish() {
    if (!canPublish) return;
    setSubmitting(true);

    const tags = [...postTags.instrument, ...postTags.genre, ...postTags.area];

    try {
      if (isEditMode && editSession) {
        await updateSession(editSession.id, userId, {
          title: title.trim(),
          body: body.trim() || null,
          tags,
        });
        showToast("セッションを更新しました");
        router.push("/mypage");
        router.refresh();
      } else {
        if (!audioUrl) return;
        await insertSession({
          id: sessionId,
          author_id: userId,
          title: title.trim(),
          body: body.trim() || null,
          audio_url: audioUrl,
          is_practice: isPracticeDefault,
          tags,
        });
        showToast("あなたの音、届きました🎵\n仲間が見つかったらお知らせします。");
        router.push("/timeline");
        router.refresh();
      }
    } catch {
      showToast("うまく送れませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  function removeTag(key: FilterKey, value: string) {
    setPostTags((prev) => ({
      ...prev,
      [key]: prev[key].filter((t) => t !== value),
    }));
  }

  const TAG_LABELS: Record<FilterKey, string> = {
    instrument: "楽器",
    genre: "ジャンル",
    area: "エリア",
  };

  return (
    <>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "rgba(21,21,26,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text2)",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "4px 0",
          }}
        >
          キャンセル
        </button>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
          {isEditMode ? "セッションを編集" : "新しいセッション"}
        </span>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          style={{
            background: canPublish ? "var(--red)" : "var(--card2)",
            border: `1px solid ${canPublish ? "var(--red)" : "var(--border)"}`,
            color: canPublish ? "white" : "var(--text3)",
            fontSize: "13px",
            fontWeight: 700,
            padding: "7px 18px",
            borderRadius: "16px",
            cursor: canPublish ? "pointer" : "not-allowed",
            boxShadow: canPublish ? "0 4px 14px rgba(232,74,95,0.4)" : "none",
            transition: "all 0.18s",
            fontFamily: "inherit",
          }}
        >
          {submitting ? (isEditMode ? "更新中…" : "投稿中…") : (isEditMode ? "更新" : "公開")}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ paddingBottom: "100px" }}>
        {/* 安心ブロック: 新規投稿時のみ表示 */}
        {!isEditMode && (
          <>
            {/* 安心ブロック①: 孤独感解消（緑） */}
            <div
              style={{
                background: "var(--card)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "14px 16px",
                margin: "12px 18px 12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "11px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(126,200,138,0.12)",
                  border: "1px solid rgba(126,200,138,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={15} color="#7ec88a" strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--text)",
                    lineHeight: 1.5,
                    marginBottom: "3px",
                  }}
                >
                  同じギター好きが <b>23人</b> いま探しています
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text2)",
                    lineHeight: 1.55,
                  }}
                >
                  あなたの投稿を待っている仲間がいます。スマホで録ったものでOKです。
                </div>
              </div>
            </div>

            {/* 安心ブロック②: 公開範囲（琥珀） */}
            <div
              style={{
                background: "var(--card)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "14px 16px",
                margin: "0 18px 12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "11px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(232,140,90,0.12)",
                  border: "1px solid rgba(232,140,90,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Eye size={15} color="#e88c5a" strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--text)",
                    lineHeight: 1.5,
                    marginBottom: "3px",
                  }}
                >
                  公開範囲: <b>全員</b> ・ 足あとは残りません
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text2)",
                    lineHeight: 1.55,
                  }}
                >
                  アプリ利用者なら誰でも聴けます。誰が聴いたかは表示されないので、安心して投稿できます。
                </div>
              </div>
            </div>
          </>
        )}

        {/* 音源セクション */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "18px 0 8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text2)",
              letterSpacing: "0.3px",
            }}
          >
            音源
          </span>
          {!isEditMode && (
            <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 700 }}>
              必須・90秒/5MBまで
            </span>
          )}
        </div>
        <div style={{ padding: "0 18px", marginBottom: "20px" }}>
          {isEditMode && editSession ? (
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "14px 16px",
              }}
            >
              <AudioPlayer src={editSession.audio_url} />
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text3)",
                  textAlign: "center",
                  marginTop: "10px",
                }}
              >
                音源は変更できません
              </div>
            </div>
          ) : (
            <AudioUploader
              userId={userId}
              sessionId={sessionId}
              onUploaded={(url) => setAudioUrl(url)}
              onRemoved={() => setAudioUrl(null)}
            />
          )}
        </div>

        {/* タイトル */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "18px 0 8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text2)",
              letterSpacing: "0.3px",
            }}
          >
            タイトル
          </span>
          <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 700 }}>
            必須・30字以内
          </span>
        </div>
        <div
          style={{
            position: "relative",
            margin: "0 18px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${titleFocused ? "var(--red-border)" : "var(--border)"}`,
            borderRadius: "14px",
            padding: "13px 16px",
            transition: "border-color 0.18s",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="例: 山下達郎「Sparkle」コピー"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: 500,
              paddingRight: "50px",
              WebkitAppearance: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "6px",
              right: "12px",
              fontSize: "10px",
              color: title.length > 30 ? "var(--red)" : "var(--text3)",
              fontWeight: 500,
            }}
          >
            {title.length} / 30
          </div>
        </div>

        {/* 本文 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "0 0 8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text2)",
              letterSpacing: "0.3px",
            }}
          >
            本文
          </span>
          <span style={{ fontSize: "9px", color: "var(--text3)" }}>
            任意・150字以内
          </span>
        </div>
        <div
          style={{
            position: "relative",
            margin: "0 18px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${bodyFocused ? "var(--red-border)" : "var(--border)"}`,
            borderRadius: "14px",
            padding: "13px 16px",
            transition: "border-color 0.18s",
            marginBottom: "20px",
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 300))}
            onFocus={() => setBodyFocused(true)}
            onBlur={() => setBodyFocused(false)}
            placeholder="どんなセッションがしたいか、どんな人を探しているかを書いてみよう。"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "14px",
              lineHeight: 1.6,
              minHeight: "90px",
              resize: "none",
              paddingBottom: "12px",
              WebkitAppearance: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "6px",
              right: "12px",
              fontSize: "10px",
              color: body.length > 150 ? "var(--red)" : "var(--text3)",
              fontWeight: 500,
            }}
          >
            {body.length} / 150
          </div>
        </div>

        {/* タグセクション */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "0 0 8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text2)",
              letterSpacing: "0.3px",
            }}
          >
            セッションアンサー希望
          </span>
          <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 700 }}>
            必須・1つ以上
          </span>
        </div>
        <div
          style={{
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            margin: "0 18px 20px",
            padding: "0 16px",
          }}
        >
          {(["instrument", "genre", "area"] as FilterKey[]).map((key, i) => {
            const tags = postTags[key];
            return (
              <div
                key={key}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: tags.length > 0 ? "10px" : "0",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {TAG_LABELS[key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTagSheetKey(key);
                      setTagSheetOpen(true);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "var(--card2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "5px 11px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text2)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.18s",
                    }}
                  >
                    <PlusIcon />
                    追加
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    minHeight: tags.length > 0 ? "26px" : "0",
                  }}
                >
                  {tags.length === 0 ? (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text3)",
                        fontStyle: "italic",
                      }}
                    >
                      未選択
                    </span>
                  ) : (
                    tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "var(--red-bg)",
                          border: "1px solid var(--red-border)",
                          borderRadius: "14px",
                          padding: "4px 6px 4px 10px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "var(--red2)",
                        }}
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(key, t)}
                          aria-label={`${t}を削除`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "rgba(232,74,95,0.10)",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            flexShrink: 0,
                            transition: "background 0.15s",
                          }}
                        >
                          <XSmallIcon />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FilterSheet (always in DOM for animation) */}
      <FilterSheet
        open={tagSheetOpen}
        filterKey={tagSheetKey}
        selected={tagSheetKey ? postTags[tagSheetKey] : []}
        onToggle={(opt) => {
          if (!tagSheetKey) return;
          setPostTags((prev) => {
            const arr = prev[tagSheetKey];
            return {
              ...prev,
              [tagSheetKey]: arr.includes(opt)
                ? arr.filter((x) => x !== opt)
                : [...arr, opt],
            };
          });
        }}
        onClear={() => {
          if (tagSheetKey)
            setPostTags((prev) => ({ ...prev, [tagSheetKey]: [] }));
        }}
        onClose={() => setTagSheetOpen(false)}
      />
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 12 12"
      fill="none"
      stroke="var(--red2)"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  );
}
