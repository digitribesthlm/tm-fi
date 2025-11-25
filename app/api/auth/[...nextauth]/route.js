import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '../../../../lib/mongodb'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { db } = await connectDB()

          const user = await db.collection('users').findOne({
            email: credentials.email
          })

          if (!user) {
            return null
          }

          // Check password: support both plain text and bcrypt
          let isPasswordValid = false

          // Check if password is bcrypt hashed (starts with $2a$ or $2b$)
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            // Use bcrypt compare for hashed passwords
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } else {
            // Plain text comparison for non-hashed passwords
            isPasswordValid = user.password === credentials.password
          }

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
