import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const { id: idParams } = await params
    const id = parseInt(idParams, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const existingCategory = await prisma.category.findFirst({ where: { id, userId } })
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.color !== undefined) updateData.color = body.color
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.description !== undefined) updateData.description = body.description
    if (body.scopes !== undefined) updateData.scopes = body.scopes

    const category = await prisma.category.update({ where: { id }, data: updateData })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const { id: idParams } = await params
    const id = parseInt(idParams, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const generalCategory = await prisma.category.findFirst({ where: { userId, name: 'General' } })
    if (generalCategory) {
      await prisma.todo.updateMany({ where: { categoryId: id }, data: { categoryId: generalCategory.id } })
    }

    const result = await prisma.category.deleteMany({ where: { id, userId } })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
