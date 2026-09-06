"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import AudioUploader from "@/components/audio/AudioUploader";
import AudioPlayer from "@/components/ui/AudioPlayer";
import FilterSheet from "@/components/session/FilterSheet";
import SongPickerInput, { type SongPickerValue } from "@/components/session/SongPickerInput";
import { insertSession, updateSession, findOrCreateSong } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { Session, Song } from "@/types/database";

type FilterKey = "instrument" | "genre" | "area";

interface Props {
  userId: string;
  editSession?: (Session & { song: Song }) | null;
}

const BODY_PLACEHOLDER =
  "平日は21時以降、土日は昼から動けます。\nまだ人と合わせた経験が少ないので、ゆっくり進めてもらえると助かります。";

export default function PostClient({ userId, editSession }: Props) {
  const router = useRouter();
  const isEditMode = !!editSession;
  const sessionId = useRef(editSession?.id ?? crypto.randomUUID()).current;

  const [audioUrl, setAudioUrl] = useState<string | null>(editSession?.audio_url ?? null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(editSession?.waveform_peaks ?? null);
  const [song, setSong] = useState<SongPickerValue | null>(
    editSession
      ? {
          title: editSession.song.title,
          artist: editSession.song.artist,
          appleTrackId: editSession.song.apple_track_id,
          isOriginal: editSession.song.is_original,
        }
      : null
  );
  const [body, setBody] = useState(editSession?.body ?? "");
  const [part, setPart] = useState(editSession?.requested_part ?? "");
  const [area, setArea] = useState(editSession?.area ?? "");
  const [genre, setGenre] = useState(editSession?.genre ?? "");
  const [wip, setWip] = useState(editSession?.wip ?? false);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [tagSheetKey, setTagSheetKey] = useState<FilterKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  function resizeBodyTextarea() {
    const el = bodyTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => { resizeBodyTextarea(); }, []);

  const hasAllConditions = !!part && !!area && !!genre;

  const isDirty = isEditMode
    ? true
    : (!!audioUrl || !!song || body.length > 0 || hasAllConditions);

  const canPublish = isEditMode
    ? (!!song && hasAllConditions && body.length <= 150 && !submitting)
    : (!!audioUrl && !!song && hasAllConditions && body.length <= 150 && !submitting);

  function handleCancel() {
    if (isDirty) {
      if (!confirm(isEditMode ? "変更内容を破棄しますか?" : "入力内容を破棄してタイムラインに戻りますか?")) return;
    }
    router.push(isEditMode ? "/mypage" : "/timeline");
  }

  async function handlePublish() {
    if (!canPublish || !song) return;
    setSubmitting(true);

    try {
      const songId = await findOrCreateSong({
        title: song.title,
        artist: song.artist,
        appleTrackId: song.appleTrackId,
        isOriginal: song.isOriginal,
      });

      if (isEditMode && editSession) {
        await updateSession(editSession.id, userId, {
          song_id: songId,
          requested_part: part,
          area,
          genre,
          wip,
          body: body.trim() || null,
        });
        showToast("セッションを更新しました");
        router.push("/mypage");
        router.refresh();
      } else {
        if (!audioUrl) return;
        await insertSession({
          id: sessionId,
          author_id: userId,
          song_id: songId,
          requested_part: part,
          area,
          genre,
          body: body.trim() || null,
          audio_url: audioUrl,
          waveform_peaks: waveformPeaks,
          wip,
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

  const CONDITION_LABELS: Record<FilterKey, string> = {
    instrument: "募集パート",
    genre: "ジャンル",
    area: "エリア",
  };

  const CONDITION_VALUE: Record<FilterKey, string> = { instrument: part, genre, area };
  const CONDITION_SETTER: Record<FilterKey, (v: string) => void> = {
    instrument: setPart,
    genre: setGenre,
    area: setArea,
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
            color: "var(--accent-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "4px 0",
          }}
        >
          キャンセル
        </button>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--red)" }}>
          {isEditMode ? "セッションを編集" : "新しいセッション"}
        </span>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          style={{
            background: canPublish ? "var(--red)" : "transparent",
            border: `1px solid ${canPublish ? "var(--red)" : "var(--accent-muted)"}`,
            color: canPublish ? "white" : "var(--accent-muted)",
            fontSize: "13px",
            fontWeight: 700,
            padding: "7px 18px",
            borderRadius: "16px",
            cursor: canPublish ? "pointer" : "not-allowed",
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
                background: "var(--notice-well)",
                border: "1px solid var(--red-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Users size={15} color="var(--orange-lit)" strokeWidth={2} />
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
                足あとは残りません
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
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>音源</span>
          {!isEditMode && (
            <span style={{ fontSize: "11px", color: "var(--req)", fontWeight: 700 }}>
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
              <AudioPlayer src={editSession.audio_url} peaks={editSession.waveform_peaks} />
              <div style={{ fontSize: "11px", color: "var(--text3)", textAlign: "center", marginTop: "10px" }}>
                音源は変更できません
              </div>
            </div>
          ) : (
            <AudioUploader
              userId={userId}
              sessionId={sessionId}
              onUploaded={(url, peaks) => { setAudioUrl(url); setWaveformPeaks(peaks ?? null); }}
              onRemoved={() => { setAudioUrl(null); setWaveformPeaks(null); }}
            />
          )}
        </div>

        {/* 曲 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "18px 0 8px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>曲</span>
          <span style={{ fontSize: "11px", color: "var(--req)", fontWeight: 700 }}>必須</span>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <SongPickerInput value={song} onChange={setSong} />
        </div>

        {/* まだ練習中 */}
        <button
          type="button"
          onClick={() => setWip((w) => !w)}
          aria-pressed={wip ? "true" : "false"}
          style={{
            margin: "0 18px 20px",
            width: "calc(100% - 36px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "13px 16px",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)" }}>まだ練習中</div>
            <div style={{ marginTop: "2px", fontSize: "11.5px", color: "var(--text3)" }}>
              この曲はまだ仕上がっていない場合、任意でオンにできます
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              width: "40px",
              height: "23px",
              borderRadius: "12px",
              background: wip ? "var(--red)" : "var(--card2)",
              border: `1px solid ${wip ? "var(--red)" : "var(--border2)"}`,
              position: "relative",
              transition: "background 0.18s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: wip ? "19px" : "2px",
                width: "17px",
                height: "17px",
                borderRadius: "50%",
                background: "white",
                transition: "left 0.18s",
              }}
            />
          </div>
        </button>

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
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>本文</span>
          <span style={{ fontSize: "11px", color: "var(--text3)" }}>任意・150字以内</span>
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
            ref={bodyTextareaRef}
            value={body}
            onChange={(e) => { setBody(e.target.value.slice(0, 300)); resizeBodyTextarea(); }}
            onFocus={() => setBodyFocused(true)}
            onBlur={() => setBodyFocused(false)}
            placeholder={BODY_PLACEHOLDER}
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
              overflow: "hidden",
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

        {/* 募集条件（単一選択） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            margin: "0 0 8px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>募集条件</span>
          <span style={{ fontSize: "11px", color: "var(--req)", fontWeight: 700 }}>必須</span>
        </div>
        <div style={{ margin: "0 18px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {(["instrument", "genre", "area"] as FilterKey[]).map((key) => {
            const selected = CONDITION_VALUE[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setTagSheetKey(key); setTagSheetOpen(true); }}
                style={{
                  minHeight: "56px",
                  background: "var(--card)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text3)", flexShrink: 0 }}>
                  {CONDITION_LABELS[key]}
                </span>
                {selected ? (
                  <span
                    style={{
                      flex: 1,
                      textAlign: "right",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selected}
                  </span>
                ) : (
                  <span style={{ flex: 1, textAlign: "right", fontSize: "13px", color: "var(--accent-muted)" }}>
                    選択してください ›
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FilterSheet (単一選択: 選ぶと置き換わる) */}
      <FilterSheet
        open={tagSheetOpen}
        filterKey={tagSheetKey}
        selected={tagSheetKey ? [CONDITION_VALUE[tagSheetKey]].filter(Boolean) : []}
        onToggle={(opt) => {
          if (!tagSheetKey) return;
          const setter = CONDITION_SETTER[tagSheetKey];
          setter(CONDITION_VALUE[tagSheetKey] === opt ? "" : opt);
        }}
        onClear={() => {
          if (tagSheetKey) CONDITION_SETTER[tagSheetKey]("");
        }}
        onClose={() => setTagSheetOpen(false)}
      />
    </>
  );
}
