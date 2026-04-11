import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          prompt: "select_account consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // OAuth 완료 직후 — access_token 저장
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.googleId = account.providerAccountId;
        console.log("[Auth] JWT callback: access_token =", account.access_token ? "있음" : "없음");
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).googleId = token.googleId;
      return session;
    },
  },
  pages: {
    signIn: "/connect",
    error: "/connect",
  },
  debug: process.env.NODE_ENV === "development",
});
