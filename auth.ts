import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  trustHost: true, // Required for NextAuth v5 in development
  basePath: '/api/auth', // Explicit base path for NextAuth routes
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // User will be saved to database in the API route callback
      // This just validates the sign-in is allowed
      return !!user.email;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add user info from token to session
        session.user.id = token.sub || '';
        session.user.email = token.email || '';
        session.user.name = token.name || '';
        session.user.image = token.picture || '';
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Store user info in JWT token on first sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
  },
  events: {
    // Save user to database after successful sign-in (Node.js context)
    async signIn({ user, account, profile, isNewUser }) {
      // This runs in Node.js runtime, not Edge Runtime
      // Database operations are safe here
      try {
        const { getDatabase } = await import('./lib/db.js');
        const db = getDatabase();
        await db.initialize();

        if (!user.email) return;

        // Check if user exists
        const existingUser = await db.queryOne(
          'SELECT * FROM users WHERE email = ?',
          [user.email]
        );

        if (!existingUser) {
          // Create new user
          await db.query(
            `INSERT INTO users (email, name, image, provider, provider_account_id, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
              user.email,
              user.name || '',
              user.image || '',
              account?.provider || 'google',
              account?.providerAccountId || '',
            ]
          );
          console.log(`✓ Created new user: ${user.email}`);
        } else {
          // Update last login
          await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?',
            [user.email]
          );
          console.log(`✓ Updated last login for user: ${user.email}`);
        }
      } catch (error) {
        console.error('Error saving user to database:', error);
        // Don't fail sign-in if database save fails
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
