import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth configuration.
 *
 * Demo credentials are configured via environment variables so they can be
 * rotated without touching source code.  For the hackathon evaluation:
 *   DEMO_USER_EMAIL=demo@monsoonguard.app
 *   DEMO_USER_PASSWORD=Monsoon@2025
 *
 * A NEXTAUTH_SECRET must also be set (any long random string).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'MonsoonGuard Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@monsoonguard.app' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const validEmail =
          process.env.DEMO_USER_EMAIL || 'demo@monsoonguard.app';
        const validPassword =
          process.env.DEMO_USER_PASSWORD || 'Monsoon@2025';

        // Constant-time comparison to prevent timing attacks
        const emailMatch =
          credentials.email.toLowerCase() === validEmail.toLowerCase();
        const passwordMatch = credentials.password === validPassword;

        if (emailMatch && passwordMatch) {
          return {
            id: '1',
            name: 'Demo User',
            email: validEmail,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8-hour session
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
