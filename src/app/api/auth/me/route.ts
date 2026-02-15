import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
    const user = await getCurrentUser();
    console.log('PATCH /api/auth/me - user auth check:', user ? 'Authorized' : 'Unauthorized');

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email, tagline } = body;
        console.log('PATCH /api/auth/me request:', { name, email, tagline });

        // Simple validation
        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                console.log('Email already in use:', email);
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }
        }

        console.log('Updating user in database...', user.id);
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name !== undefined ? name : user.name,
                email: email !== undefined ? email : user.email,
                tagline: tagline !== undefined ? tagline : user.tagline,
            },
        });
        console.log('User updated successfully:', updatedUser.id);

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error('Failed to update user profile:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
