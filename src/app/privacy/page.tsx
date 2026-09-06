import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "プライバシーポリシー | our SESSION",
  description: "our SESSION のプライバシーポリシーです。",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/timeline" className="legal-back" aria-label="タイムラインへ戻る">
          <ChevronLeft size={18} />
        </Link>
        <div className="legal-header-title">プライバシーポリシー</div>
      </div>

      <div className="legal-body">
        <h1 className="legal-title">プライバシーポリシー</h1>
        <p className="legal-meta">制定日：2026年7月19日</p>

        <p className="legal-p">
          Our Session（以下「当サービス」といいます）は、音源をきっかけにリアルなセッションへつながる音楽マッチングサービスです。当サービスの運営者（以下「運営」といいます）は、利用者の個人情報を含む各種情報（以下「取得情報」といいます）を以下の方針に基づき取り扱います。
        </p>

        <div className="legal-section">
          <h2 className="legal-h2">1. 取得する情報</h2>
          <p className="legal-p">当サービスは、ご利用にあたり以下の情報を取得します。</p>
          <ul className="legal-ul">
            <li><span className="legal-strong">アカウント情報：</span>メールアドレス（メール認証・Googleログインを利用する場合）、Googleアカウントの基本プロフィール情報（Googleログインを利用する場合のみ）</li>
            <li><span className="legal-strong">プロフィール情報：</span>ニックネーム、エリア、練習中フラグ、楽器・ジャンル・好きなアーティスト／やりたい曲、自己紹介、アバター画像、SNSリンク</li>
            <li><span className="legal-strong">年齢確認情報：</span>生年月日（18歳以上であることの確認にのみ使用し、プロフィール等で第三者に公開することはありません）</li>
            <li><span className="legal-strong">投稿コンテンツ：</span>投稿・アンサーとして送信されるMP3音源ファイル、タイトル・本文・タグ</li>
            <li><span className="legal-strong">コミュニケーション情報：</span>承認済みの相手とのチャットメッセージ（第三者には非公開です）</li>
            <li><span className="legal-strong">安全機能に関する情報：</span>通報・ブロックの記録</li>
            <li><span className="legal-strong">技術情報：</span>認証セッションの維持に必要なCookie、アクセスログ、端末・ブラウザ情報</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. 利用目的</h2>
          <ul className="legal-ul">
            <li>ユーザー認証、アカウント管理、および18歳以上であることの確認（年齢確認）</li>
            <li>セッション相手とのマッチング機能の提供（音源投稿・アンサー・承認・メッセージ）</li>
            <li>通知の送信（新着アンサー、承認、メッセージ等）</li>
            <li>通報・ブロックへの対応、不正利用の防止・調査</li>
            <li>お問い合わせへの対応</li>
            <li>サービスの維持・改善、不具合の調査</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. 第三者への提供・業務委託</h2>
          <p className="legal-p">当サービスは、以下の外部サービスを利用して情報を処理しています。委託先には適切な安全管理を求めます。</p>
          <ul className="legal-ul">
            <li><span className="legal-strong">Supabase：</span>データベース、認証、音源ファイルの保存（ストレージ）</li>
            <li><span className="legal-strong">Vercel：</span>アプリケーションのホスティング</li>
            <li><span className="legal-strong">Google：</span>Googleアカウントによるログイン機能（OAuth認証）</li>
          </ul>
          <p className="legal-p">
            上記の場合を除き、法令に基づく場合や利用者本人の同意がある場合を除いて、取得情報を第三者に提供することはありません。
          </p>
          <p className="legal-p">
            Googleアカウントとの連携により取得した情報の取り扱いは、
            <span className="legal-strong">Google API Services User Data Policy（Limited Use要件を含む）</span>
            を遵守します。当該情報は本ポリシーに記載した利用目的の範囲内でのみ利用し、広告目的での利用や第三者への販売は行いません。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Cookieについて</h2>
          <p className="legal-p">
            当サービスは、ログイン状態を維持するための認証用Cookieのみを使用します。広告配信を目的としたトラッキングCookieは使用していません。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. 情報の開示・訂正・削除</h2>
          <p className="legal-p">
            ニックネームや自己紹介などのプロフィール情報は、マイページの編集機能からいつでもご自身で変更できます。投稿した音源・カードは投稿者本人が削除できます。
          </p>
          <p className="legal-p">
            アカウントの削除をご希望の場合は、設定画面のアカウント削除機能からお手続きいただけます。削除が完了すると、プロフィール・投稿・アンサー・メッセージ・音源ファイルを含む関連情報は速やかに削除されます。
          </p>
          <p className="legal-p">
            退会後の情報は、法令上保存が必要なものを除き、合理的な期間内に削除します。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. 未成年者の利用について</h2>
          <p className="legal-p">
            当サービスは実際に会って演奏するリアルなセッションへの橋渡しを目的とするサービスであるため、安全確保の観点から
            <span className="legal-strong">18歳未満の方はご利用いただけません</span>
            （詳細は利用規約をご確認ください）。18歳未満と判明したアカウントについては、利用停止・削除の対応を行う場合があります。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">7. 安全管理措置</h2>
          <p className="legal-p">
            チャットメッセージは、当該セッションで承認された参加者のみが閲覧できるようデータベースのアクセス制御（Row Level Security）により保護されています。取得情報は、不正アクセス・漏えい・滅失・毀損の防止のため、適切な安全管理措置を講じます。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">8. ポリシーの変更</h2>
          <p className="legal-p">
            当サービスは、法令の変更やサービス内容の変更に応じて本ポリシーを改定することがあります。重要な変更がある場合は、アプリ内の通知等でお知らせします。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">9. お問い合わせ窓口</h2>
          <div className="legal-contact">
            運営者：Our Session<br />
            お問い合わせ：<a href="mailto:our-session@zohomail.com" style={{ color: "var(--red2)" }}>our-session@zohomail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
