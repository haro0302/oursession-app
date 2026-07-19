import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "利用規約 | our SESSION",
  description: "our SESSION の利用規約です。",
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link href="/timeline" className="legal-back" aria-label="タイムラインへ戻る">
          <ChevronLeft size={18} />
        </Link>
        <div className="legal-header-title">利用規約</div>
      </div>

      <div className="legal-body">
        <h1 className="legal-title">利用規約</h1>
        <p className="legal-meta">制定日：2026年7月19日</p>

        <p className="legal-p">
          この利用規約（以下「本規約」といいます）は、Our Session（以下「当サービス」といいます）の利用条件を定めるものです。利用者の皆さま（以下「ユーザー」といいます）には、本規約に同意のうえ当サービスをご利用いただきます。
        </p>

        <div className="legal-section">
          <h2 className="legal-h2">第1条（サービス概要）</h2>
          <p className="legal-p">
            当サービスは、音源（MP3）を聴いて「この人と演奏したい」と感じた相手とつながり、実際のスタジオでのセッションへと発展させることを目的とした音楽マッチングサービスです。上手さを競う場ではなく、「下手でいい。好きでつながる。」を大切にしています。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第2条（利用資格）</h2>
          <p className="legal-p">
            当サービスは、実際に対面してセッションを行う機会につながるサービスであるため、安全確保の観点から
            <span className="legal-strong">満18歳以上の方</span>
            のみご利用いただけます。18歳未満であることが判明した場合、運営は当該アカウントの利用を制限・停止できるものとします。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第3条（アカウント登録）</h2>
          <ul className="legal-ul">
            <li>ユーザーは、メールアドレスまたはGoogleアカウントを用いて登録するものとします。</li>
            <li>登録情報は正確な内容を入力するものとし、虚偽の情報による登録を行ってはなりません。</li>
            <li>アカウントの管理責任はユーザー本人が負うものとし、第三者への譲渡・貸与はできません。</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第4条（投稿コンテンツ）</h2>
          <ul className="legal-ul">
            <li>投稿・アンサーとして送信できる音源は、MP3形式（audio/mpeg）・5MB以下・90秒以内のものに限ります。</li>
            <li>ユーザーは、自身が投稿する音源・文章について、投稿に必要な権利（著作権・実演家の権利等）を有していることを保証するものとします。</li>
            <li>投稿コンテンツの著作権はユーザーに帰属しますが、ユーザーは当サービス上での表示・再生・配信に必要な範囲で、運営に対し無償の利用許諾を行うものとします。</li>
            <li>投稿を削除した場合、運営は保存されている該当の音源ファイルを速やかに削除します。</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第5条（禁止事項）</h2>
          <p className="legal-p">ユーザーは、当サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul className="legal-ul">
            <li>他者になりすます行為、虚偽の情報を登録する行為</li>
            <li>他人の著作権・肖像権その他の権利を侵害するコンテンツを投稿する行為</li>
            <li>他のユーザーに対する嫌がらせ、誹謗中傷、迷惑行為</li>
            <li>営利目的の宣伝・勧誘、スパム行為</li>
            <li>他のユーザーの個人情報を無断で収集・公開する行為</li>
            <li>アップロード制限（形式・サイズ・長さ）を回避、または不正に迂回しようとする行為</li>
            <li>当サービスの運営を妨げる行為、システムに不正アクセスする行為</li>
            <li>法令または公序良俗に違反する行為</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第6条（対面でのセッションに関する注意事項）</h2>
          <p className="legal-p">
            当サービスは、音源を通じたユーザー間のマッチング機会を提供するものであり、その後の対面でのやり取り・スタジオでのセッション等、リアルな場での活動については当事者間の責任において行っていただきます。
          </p>
          <p className="legal-p">
            運営は、マッチングした相手の身元・言動・対面時の安全性について保証するものではありません。ユーザーは、初対面の相手と会う際は、日中・人目のある場所を選ぶ、事前に信頼できる人へ共有するなど、ご自身の安全確保に十分ご留意のうえご利用ください。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第7条（通報・ブロック）</h2>
          <p className="legal-p">
            ユーザーは、不適切な投稿や迷惑行為に遭遇した場合、通報機能・ブロック機能を利用できます。運営は、通報内容を確認のうえ、必要に応じて該当コンテンツの削除やアカウントの利用制限を行う場合があります。通報を行ったこと自体が相手に伝わることはありません。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第8条（利用制限・登録抹消）</h2>
          <p className="legal-p">
            運営は、ユーザーが本規約に違反した場合、または当サービスの運営上支障があると判断した場合、事前の通知なく当該ユーザーの利用を制限し、または登録を抹消することができるものとします。
          </p>
          <p className="legal-p">
            ユーザーは、設定画面からいつでも自らアカウントを削除（退会）することができます。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第9条（免責事項）</h2>
          <p className="legal-p">
            運営は、当サービスの利用によってユーザーに生じた損害について、運営の故意または重大な過失による場合を除き、一切の責任を負わないものとします。運営は、当サービスの内容変更・中断・終了、データの消失等について、事前に通知のうえ実施する場合があります。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第10条（規約の変更）</h2>
          <p className="legal-p">
            運営は、必要と判断した場合、ユーザーへの通知をもって本規約を変更できるものとします。変更後の規約は、当サービス上に掲載した時点から効力を生じます。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第11条（準拠法・管轄裁判所）</h2>
          <p className="legal-p">
            本規約の解釈にあたっては日本法を準拠法とします。当サービスに関して紛争が生じた場合には、運営の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">第12条（お問い合わせ窓口）</h2>
          <div className="legal-contact">
            運営者：Our Session<br />
            お問い合わせ：<a href="mailto:our-session@zohomail.com" style={{ color: "var(--red2)" }}>our-session@zohomail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
