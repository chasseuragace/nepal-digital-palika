import { NextResponse, NextRequest } from 'next/server'
import { BlogPostsService } from '@/services/blog-posts.service'
import { getBlogPostsDatasource } from '@/lib/blog-posts-config'

const service = new BlogPostsService(getBlogPostsDatasource())

export async function GET(req: NextRequest) {
  try {
    const filters: any = {}
    const { searchParams } = new URL(req.url)

    // Optional filters from query params
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }
    if (searchParams.get('author_id')) {
      filters.author_id = searchParams.get('author_id')
    }
    if (searchParams.get('palika_id')) {
      filters.palika_id = parseInt(searchParams.get('palika_id') || '0')
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await service.getAll(filters, { page, limit })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json()
    const result = await service.create(input)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}