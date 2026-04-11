/**
 * 카카오 공유 SDK
 * Mock 모드: console.log + alert로 대체
 * 실제: Kakao.Share.sendDefault() 사용
 */

const isMockMode = process.env.NEXT_PUBLIC_KAKAO_APP_KEY?.startsWith("mock");

export function initKakao(): void {
  if (isMockMode) {
    console.log("[Mock] 카카오 SDK 초기화");
    return;
  }
  if (typeof window === "undefined") return;
  const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  if (!appKey) return;

  const kakao = (window as any).Kakao;
  if (kakao && !kakao.isInitialized()) {
    kakao.init(appKey);
  }
}

export function shareKakao(params: {
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
}): void {
  if (isMockMode) {
    console.log("📱 [Mock 카카오 공유]", params);
    alert(`[카카오 공유 시뮬레이션]\n\n제목: ${params.title}\n설명: ${params.description}\n링크: ${params.linkUrl}`);
    return;
  }

  const kakao = (window as any).Kakao;
  if (!kakao?.isInitialized()) {
    initKakao();
  }

  kakao?.Share?.sendDefault({
    objectType: "feed",
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl || `${params.linkUrl}/api/og/default`,
      link: {
        mobileWebUrl: params.linkUrl,
        webUrl: params.linkUrl,
      },
    },
    buttons: [
      {
        title: "결과 보러가기",
        link: {
          mobileWebUrl: params.linkUrl,
          webUrl: params.linkUrl,
        },
      },
    ],
  });
}
