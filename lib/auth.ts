import type { NextAuthOptions } from "next-auth"
import MicrosoftProvider from "next-auth/providers/microsoft"

export const authOptions: NextAuthOptions = {
  providers: [
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email User.Read Files.ReadWrite",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
}

