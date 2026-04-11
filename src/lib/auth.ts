import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MOCK_USER_A } from "@/data/mock-channels";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          prompt: "select_account consent",  // 계정 선택 + YouTube scope 매번 재동의
          access_type: "offline",            // refresh_token 발급
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "mock-secret",
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.googleId = account.providerAccountId;
      }
      // Mock 모드에서는 테스트 토큰 주입
      if (isMockMode && !token.accessToken) {
        token.accessToken = "mock-youtube-access-token";
        token.googleId = MOCK_USER_A.googleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).accessToken = token.accessToken;
        (session as any).googleId = token.googleId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/connect",
    error: "/connect",
  },
  debug: process.env.NODE_ENV === "development",
});
