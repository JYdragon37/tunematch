import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | TuneMatch",
  description: "TuneMatch 개인정보처리방침",
};

const LAST_UPDATED = "2026년 4월 14일";
const SERVICE_NAME = "TuneMatch";
const CONTACT_EMAIL = "support@tunematch.app";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-12">

        {/* 헤더 */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
            ← TuneMatch 홈으로
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">개인정보처리방침</h1>
          <p className="text-sm text-gray-400">최종 수정일: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. 개요 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. 개요</h2>
            <p>
              {SERVICE_NAME}(이하 "서비스")은 사용자의 유튜브 구독 취향을 분석하여 친구와의 콘텐츠 궁합을 알아보는 서비스입니다.
              본 방침은 서비스가 수집하는 정보의 종류, 사용 목적, 보관 기간, 삭제 방법에 대해 설명합니다.
            </p>
          </section>

          {/* 2. 수집하는 정보 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. 수집하는 정보</h2>
            <p className="mb-4">서비스는 Google 계정 연동 시 아래 정보를 수집합니다.</p>

            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <div>
                <p className="font-semibold text-gray-900 mb-1">✅ 수집하는 정보</p>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>구독 채널 목록</strong>: 채널명, 채널 ID, 구독 날짜 (YouTube Data API v3 - subscriptions)</li>
                  <li>• <strong>좋아요 누른 영상</strong>: 영상 제목, 카테고리 (YouTube Data API v3 - videos)</li>
                  <li>• <strong>Google 계정 기본 정보</strong>: 이름, 이메일 주소 (로그인 식별용)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">❌ 수집하지 않는 정보</p>
                <ul className="space-y-1 text-sm">
                  <li>• 시청 기록 (watch history)</li>
                  <li>• 검색 기록</li>
                  <li>• 댓글, 재생목록</li>
                  <li>• 결제 정보</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 수집 목적 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. 수집 목적 및 이용</h2>
            <ul className="space-y-2 text-sm">
              <li>• <strong>취향 분석</strong>: 구독 채널을 카테고리별로 분류하여 사용자의 콘텐츠 취향 유형을 파악합니다.</li>
              <li>• <strong>궁합 비교</strong>: 두 사용자의 구독 채널 겹침률 및 카테고리 유사도를 계산합니다.</li>
              <li>• <strong>채널 추천</strong>: 취향 분석 결과를 바탕으로 관심 있을 채널을 추천합니다.</li>
            </ul>
            <p className="mt-3 text-sm">
              수집된 YouTube 데이터는 위 목적 이외의 용도로 사용되지 않으며, 제3자에게 판매되거나 광고 목적으로 활용되지 않습니다.
            </p>
          </section>

          {/* 4. 데이터 보관 및 삭제 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. 데이터 보관 및 삭제</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="font-semibold text-green-800 mb-1">🔒 채널 데이터 (구독 목록, 좋아요)</p>
                <p className="text-green-700">
                  취향 분석에 사용된 후 <strong>분석 완료 즉시 원본 데이터는 삭제</strong>됩니다.
                  분석 결과(카테고리 비중, 점수)만 저장되며, 원본 채널 목록은 서버에 남지 않습니다.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">📊 분석 결과 데이터</p>
                <p className="text-gray-700">
                  궁합 비교 결과(점수, 공통 채널 수, 취향 유형)는 서비스 제공을 위해 최대 30일간 보관됩니다.
                  보관 기간 이후 자동으로 삭제됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 5. 제3자 서비스 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. 제3자 서비스</h2>
            <p className="text-sm mb-3">서비스는 아래 제3자 서비스를 이용합니다.</p>
            <ul className="space-y-2 text-sm">
              <li>
                <strong>Google / YouTube Data API</strong>: 구독 채널 및 좋아요 데이터 접근.
                Google의 개인정보처리방침은{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  policies.google.com/privacy
                </a>를 참고하세요.
              </li>
              <li>
                <strong>Google OAuth 2.0</strong>: 사용자 인증. 서비스는 YouTube 읽기 전용 권한
                (<code className="bg-gray-100 px-1 rounded text-xs">youtube.readonly</code>)만 요청합니다.
              </li>
              <li>
                <strong>Supabase</strong>: 분석 결과 데이터 저장. 원본 YouTube 데이터는 Supabase에 저장되지 않습니다.
              </li>
            </ul>
          </section>

          {/* 6. 사용자 권리 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. 사용자 권리</h2>
            <ul className="space-y-2 text-sm">
              <li>• <strong>접근 권리</strong>: 수집된 개인정보의 열람을 요청할 수 있습니다.</li>
              <li>• <strong>삭제 요청</strong>: 저장된 분석 결과 데이터의 삭제를 요청할 수 있습니다.</li>
              <li>
                • <strong>Google 권한 철회</strong>: Google 계정 설정({" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  myaccount.google.com/permissions
                </a>
                )에서 TuneMatch의 YouTube 접근 권한을 언제든지 철회할 수 있습니다.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              권리 행사는 아래 연락처로 요청하시면 영업일 기준 3일 이내 처리됩니다.
            </p>
          </section>

          {/* 7. 쿠키 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. 쿠키 및 세션</h2>
            <p className="text-sm">
              서비스는 로그인 상태 유지를 위해 세션 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 비활성화할 수 있으나,
              이 경우 로그인 기능이 정상 동작하지 않을 수 있습니다.
            </p>
          </section>

          {/* 8. 미성년자 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. 미성년자 보호</h2>
            <p className="text-sm">
              서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
              만 14세 미만은 보호자의 동의 없이 서비스를 이용할 수 없습니다.
            </p>
          </section>

          {/* 9. 방침 변경 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. 방침 변경</h2>
            <p className="text-sm">
              본 방침은 서비스 변경 또는 법적 요구에 따라 수정될 수 있습니다.
              중요한 변경 시 서비스 내 공지를 통해 사전에 안내합니다.
            </p>
          </section>

          {/* 10. 연락처 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. 연락처</h2>
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-900 mb-1">개인정보 관련 문의</p>
              <p>이메일: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a></p>
              <p className="text-gray-500 mt-1">문의 접수 후 영업일 3일 이내 답변 드립니다.</p>
            </div>
          </section>

        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">© 2026 TuneMatch. All rights reserved.</p>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 underline mt-2 block">
            서비스 홈으로 돌아가기
          </Link>
        </div>

      </div>
    </main>
  );
}
