"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, Repeat, MessagesSquare } from "lucide-react";
import Aurora from "@/components/layout/Aurora";
import AuthGateDrawer from "@/components/auth/AuthGateDrawer";

const REAL_FLOW = [
  "弾ける(歌える)ようになった",
  "誰かとセッションしたい",
  "好きが似てる人を探す",
  "スタジオでセッションする",
];

const APP_FLOW = ["音源を聴く", "セッションしたい人を見つける", "スタジオで一緒に演奏する"];

const AUDIENCE = [
  "セッションを目標に練習している",
  "好きなアーティストや曲が似ている人とセッションしたい",
  "ずっと演奏や歌うことを好きでいたい",
];

const FEATURES = [
  {
    icon: Music,
    title: "音源タイムライン",
    desc: "まずは聴くだけでOK。気になった音源には、こっそり保存も。",
  },
  {
    icon: Repeat,
    title: "2通りのはじめ方",
    desc: "セッションカードを作って待つ。好きが似てる人を見つけて送る。どちらも、音源で気持ちを伝えます。",
  },
  {
    icon: MessagesSquare,
    title: "チャットからスタジオへ",
    desc: "通じ合えたらメッセージへ。日程を決めて、実際に音を鳴らそう。",
    note: "※スタジオの予約機能はありません。近くのスタジオ探しの参考としてご活用ください。",
  },
];

const MINI_FEATURES = [
  { icon: "🔰", title: "練習中バッジ", desc: "下手を謝らなくていい。初心者歓迎の印。" },
  { icon: "🎙️", title: "その場で録音", desc: "スマホでその場で録って、そのまま投稿できる。" },
  { icon: "🙈", title: "足あとの残らない保存", desc: "気になる音源を、こっそりブックマーク。" },
  { icon: "🛡️", title: "承認制+ブロック・通報", desc: "断りやすく、選べる。安心の仕組み。" },
  { icon: "📱", title: "ホーム画面に追加", desc: "アプリのようにすぐ開ける。" },
];

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="lp-page">
      <Aurora />
      <div className="lp-content">
        {/* ① Hero */}
        <section className="lp-hero">
          <h1 className="lp-hero-catch">僕らが好きな音楽を奏でよう</h1>
          <p className="lp-hero-sub">
            弾けるようになった、歌えるようになった。
            <br />
            その先の一歩を、Our Sessionで。
          </p>
          <button type="button" className="lp-cta" onClick={() => setAuthOpen(true)}>
            早速はじめる
          </button>
          <div className="lp-cta-note">アプリ不要。ブラウザですぐ始められます</div>
        </section>

        {/* ② 思想 */}
        <section className="lp-section lp-mission-lines">
          <p>演奏すること、歌うことは、とても楽しいこと。</p>
          <p>そして、誰かと演奏すること。</p>
          <p>それは、もっと楽しいこと。</p>
          <p>ずっと続けていける。</p>
          <p>ずっと好きでいられる。</p>
          <p>音を出す楽しさを、分かち合える誰かと。</p>
          <p className="lp-mission-emph">Our Sessionは、そんな喜びをつなぐサービスです。</p>
        </section>

        {/* ③ コアジャーニー */}
        <section className="lp-section">
          <h2 className="lp-section-title">Our Sessionでセッションしてみたい人を見つける</h2>
          <div className="lp-flow-wrap">
            <div className="lp-flow-col">
              <div className="lp-flow-label">現実の流れ</div>
              <div className="lp-flow-steps">
                {REAL_FLOW.map((step, i) => (
                  <div key={step}>
                    <div className="lp-flow-step">{step}</div>
                    {i < REAL_FLOW.length - 1 && <div className="lp-flow-arrow">↓</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-flow-col lp-flow-ours">
              <div className="lp-flow-label">Our Sessionでの流れ</div>
              <div className="lp-flow-steps">
                {APP_FLOW.map((step, i) => (
                  <div key={step}>
                    <div className="lp-flow-step">{step}</div>
                    {i < APP_FLOW.length - 1 && <div className="lp-flow-arrow">↓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ④ こんな人にオススメ */}
        <section className="lp-section">
          <h2 className="lp-section-title">こんな風に使ってみませんか？</h2>
          <div className="lp-audience-list">
            {AUDIENCE.map((item) => (
              <div key={item} className="lp-audience-item">
                {item}
              </div>
            ))}
          </div>
          <div className="lp-audience-closing">そんな方にオススメです</div>
        </section>

        {/* ⑤ 主要機能3つ */}
        <section className="lp-section">
          <h2 className="lp-section-title">主要機能</h2>
          <div className="lp-feature-list">
            {FEATURES.map(({ icon: Icon, title, desc, note }) => (
              <div key={title}>
                <div className="lp-feature-card">
                  <div className="lp-feature-icon">
                    <Icon size={20} color="var(--red2)" />
                  </div>
                  <div className="lp-feature-body">
                    <div className="lp-feature-title">{title}</div>
                    <div className="lp-feature-desc">{desc}</div>
                  </div>
                </div>
                {note && <div className="lp-feature-note">{note}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ⑥ その他の機能 */}
        <section className="lp-section">
          <h2 className="lp-section-title">その他の機能</h2>
          <div className="lp-mini-grid">
            {MINI_FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="lp-mini-feature">
                <span className="lp-mini-icon">{icon}</span>
                <div>
                  <div className="lp-mini-title">{title}</div>
                  <div className="lp-mini-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⑦ 再掲CTA + フッター */}
        <div className="lp-final-cta">
          <button type="button" className="lp-cta" onClick={() => setAuthOpen(true)}>
            早速はじめる
          </button>
        </div>
        <div className="lp-footer">
          <Link href="/terms" className="lp-footer-link">
            利用規約
          </Link>
          <Link href="/privacy" className="lp-footer-link">
            プライバシーポリシー
          </Link>
        </div>
      </div>

      <AuthGateDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
