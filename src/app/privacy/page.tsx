import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | TuneMatch",
  description: "TuneMatch 개인정보처리방침",
};

const LAST_UPDATED = "2026년 4월 14일";
const SERVICE_NAME = "TuneMatch";
const OPERATOR_NAME = "Jeongyong Huh";
const CONTACT_EMAIL = "huhjungyong@gmail.com";
const SERVICE_URL = "https://tunematch-f3ss.vercel.app";

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
          <p className="text-sm text-gray-400">시행일: 2026년 1월 1일 &nbsp;|&nbsp; 최종 수정일: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed text-sm">

          {/* 1. 총칙 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제1조 (목적 및 총칙)</h2>
            <p>
              {SERVICE_NAME}(이하 "서비스" 또는 "회사")은 이용자의 개인정보를 중요하게 여기며,
              「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
            </p>
            <p className="mt-2">
              본 방침은 서비스가 이용자로부터 수집하는 개인정보의 항목, 수집 목적, 보유 기간,
              제3자 제공 현황 및 이용자의 권리에 대해 안내합니다.
            </p>
          </section>

          {/* 2. 수집 항목 및 방법 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제2조 (수집하는 개인정보 항목 및 방법)</h2>
            <p className="mb-4">서비스는 Google 계정 연동 시 아래 정보를 수집합니다.</p>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-1/3">항목</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">수집 내용</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-1/4">수집 방법</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">Google 계정 정보</td>
                    <td className="px-4 py-3 text-gray-600">이름, 이메일 주소</td>
                    <td className="px-4 py-3 text-gray-600">Google OAuth 2.0</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">YouTube 구독 채널</td>
                    <td className="px-4 py-3 text-gray-600">채널명, 채널 ID, 구독일시</td>
                    <td className="px-4 py-3 text-gray-600">YouTube Data API v3</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">YouTube 좋아요 영상</td>
                    <td className="px-4 py-3 text-gray-600">영상 제목, 카테고리 ID</td>
                    <td className="px-4 py-3 text-gray-600">YouTube Data API v3</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-800 mb-2">수집하지 않는 정보</p>
              <p className="text-gray-600">
                시청 기록, 검색 기록, 댓글, 재생목록, 결제 정보, 위치 정보는 수집하지 않습니다.
                서비스는 <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs">youtube.readonly</code> 스코프만 요청하며,
                유튜브 데이터에 대한 쓰기 권한을 요청하지 않습니다.
              </p>
            </div>
          </section>

          {/* 3. 수집 목적 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제3조 (개인정보의 수집 및 이용 목적)</h2>
            <div className="space-y-2">
              {[
                { title: "취향 분석", desc: "구독 채널을 8개 카테고리로 분류하여 이용자의 콘텐츠 취향 유형을 파악합니다." },
                { title: "궁합 비교", desc: "두 이용자 간 구독 채널 겹침률 및 카테고리 유사도를 계산하여 취향 궁합 점수를 산출합니다." },
                { title: "채널 추천", desc: "취향 분석 결과를 기반으로 이용자가 관심 가질 채널을 추천합니다." },
                { title: "서비스 운영", desc: "이메일을 통해 궁합 결과 완료 알림을 발송합니다." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                  <p><strong className="text-gray-800">{item.title}</strong>: {item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-500">
              수집된 YouTube 데이터는 위 목적 외의 용도로 사용되지 않으며,
              제3자에게 판매·임대되거나 광고 목적으로 활용되지 않습니다.
            </p>
          </section>

          {/* 4. 보유 및 삭제 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제4조 (개인정보의 보유 기간 및 파기)</h2>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="font-semibold text-green-800 mb-1">YouTube 원본 데이터 (구독 목록, 좋아요 영상)</p>
                <p className="text-green-700">
                  취향 분석 처리에 사용된 직후 <strong>즉시 파기</strong>됩니다.
                  원본 채널 목록 및 영상 데이터는 서버에 저장되지 않습니다.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="font-semibold text-blue-800 mb-1">분석 결과 데이터 (점수, 취향 유형, 공통 채널)</p>
                <p className="text-blue-700">
                  궁합 비교 결과는 서비스 제공을 위해 <strong>생성 후 30일간</strong> 보관 후 자동 파기됩니다.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Google 계정 정보 (이름, 이메일)</p>
                <p className="text-gray-700">
                  서비스 이용 세션 유지 목적으로만 사용되며, 세션 만료 시 삭제됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 5. 제3자 제공 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제5조 (개인정보의 제3자 제공)</h2>
            <p>
              서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 아래의 경우는 예외로 합니다.
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>• 이용자가 사전에 동의한 경우</li>
              <li>• 법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          {/* 6. 위탁 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제6조 (개인정보 처리 위탁)</h2>
            <p className="mb-3">서비스는 원활한 서비스 제공을 위해 아래 업체에 처리를 위탁합니다.</p>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">수탁 업체</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">위탁 업무</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">Google LLC</td>
                    <td className="px-4 py-3 text-gray-600">사용자 인증 (OAuth 2.0), YouTube API</td>
                    <td className="px-4 py-3 text-gray-600">위탁 계약 기간</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">Supabase Inc.</td>
                    <td className="px-4 py-3 text-gray-600">분석 결과 데이터베이스 저장</td>
                    <td className="px-4 py-3 text-gray-600">보유 기간 준용</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-800">Vercel Inc.</td>
                    <td className="px-4 py-3 text-gray-600">서비스 호스팅 및 배포</td>
                    <td className="px-4 py-3 text-gray-600">위탁 계약 기간</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. 이용자 권리 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제7조 (이용자의 권리 및 행사 방법)</h2>
            <p className="mb-3">이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
            <div className="space-y-2">
              {[
                { right: "열람 요청", desc: "보유 중인 개인정보의 열람을 요청할 수 있습니다." },
                { right: "정정·삭제 요청", desc: "부정확한 정보의 정정 또는 삭제를 요청할 수 있습니다." },
                { right: "처리 정지 요청", desc: "개인정보 처리의 정지를 요청할 수 있습니다." },
                { right: "Google 권한 철회", desc: `Google 계정 설정(myaccount.google.com/permissions)에서 ${SERVICE_NAME}의 YouTube 접근 권한을 직접 철회할 수 있습니다.` },
              ].map((item) => (
                <div key={item.right} className="flex gap-3">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                  <p><strong className="text-gray-800">{item.right}</strong>: {item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-gray-500">
              권리 행사는 아래 연락처로 요청하시면 영업일 기준 3일 이내 처리합니다.
            </p>
          </section>

          {/* 8. 쿠키 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제8조 (쿠키의 운용 및 거부)</h2>
            <p>
              서비스는 로그인 세션 유지를 위해 세션 쿠키를 사용합니다.
              쿠키는 브라우저 종료 시 삭제되며, 브라우저 설정에서 비활성화할 수 있습니다.
              단, 비활성화 시 로그인 기능이 정상 동작하지 않을 수 있습니다.
            </p>
          </section>

          {/* 9. 미성년자 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제9조 (만 14세 미만 아동 보호)</h2>
            <p>
              서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
              만 14세 미만 이용자는 법정 대리인의 동의를 받아 서비스를 이용해야 합니다.
              만 14세 미만 아동의 정보가 수집된 것을 발견한 경우 즉시 삭제합니다.
            </p>
          </section>

          {/* 10. 방침 변경 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제10조 (개인정보처리방침의 변경)</h2>
            <p>
              본 방침은 법령·정책 변경 또는 서비스 업데이트에 따라 수정될 수 있습니다.
              변경 시 시행일 7일 전부터 서비스 내 공지사항을 통해 고지합니다.
              중요한 변경의 경우 이메일로 별도 고지할 수 있습니다.
            </p>
          </section>

          {/* 11. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제11조 (개인정보 보호책임자 및 연락처)</h2>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">서비스명</p>
                  <p className="font-semibold text-gray-900">{SERVICE_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">개인정보 보호책임자</p>
                  <p className="font-semibold text-gray-900">{OPERATOR_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">이메일</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-blue-600 underline">
                    {CONTACT_EMAIL}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">서비스 URL</p>
                  <a href={SERVICE_URL} className="font-semibold text-blue-600 underline text-xs break-all">
                    {SERVICE_URL}
                  </a>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                개인정보 관련 문의는 위 이메일로 접수해 주세요. 영업일 기준 3일 이내 답변 드립니다.
              </p>
            </div>
          </section>

          {/* 권익 침해 구제 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">제12조 (권익 침해 구제 방법)</h2>
            <p className="mb-2">
              개인정보 침해에 관한 신고나 상담은 아래 기관에 문의하실 수 있습니다.
            </p>
            <ul className="space-y-1.5 text-gray-600">
              <li>• 개인정보분쟁조정위원회: <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">kopico.go.kr</a> / 1833-6972</li>
              <li>• 개인정보침해신고센터: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">privacy.kisa.or.kr</a> / (국번없이) 118</li>
              <li>• 대검찰청 사이버범죄수사단: <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">spo.go.kr</a> / 02-3480-3573</li>
              <li>• 경찰청 사이버안전국: <a href="https://cyberbureau.police.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">cyberbureau.police.go.kr</a> / (국번없이) 182</li>
            </ul>
          </section>

        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            본 방침은 {LAST_UPDATED}부터 시행됩니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">© 2026 {SERVICE_NAME} · {OPERATOR_NAME}. All rights reserved.</p>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 underline mt-3 block">
            서비스 홈으로 돌아가기
          </Link>
        </div>

      </div>
    </main>
  );
}
