import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-it'
const key = new TextEncoder().encode(SECRET_KEY)

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
    const expiresCount = 24 * 60 * 60 * 1000 // 1 day
    const expires = new Date(Date.now() + expiresCount)

    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'lax',
        path: '/',
    })

    return token
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        return null
    }
}

export async function getCurrentUser() {
    const session = await getSession()
    if (!session || typeof session.userId !== 'string') return null

    try {
        console.log('getCurrentUser: fetching user for id:', session.userId);
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                tagline: true,
            },
        })
        if (!user) console.warn('getCurrentUser: User not found in DB for id:', session.userId);
        return user
    } catch (error) {
        console.error('getCurrentUser: Database error during fetch:', error);
        return null
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
