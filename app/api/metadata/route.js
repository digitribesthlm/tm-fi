import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { connectDB } from '../../../lib/mongodb'

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, accepted, rejected, edited
    const search = searchParams.get('search') // search query
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // Pagination parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const skip = (page - 1) * limit

    // Connect to database
    const { db } = await connectDB()
    const collection = db.collection('seo_metadata')

    // Build query
    const query = {}
    if (status && status !== 'all') {
      query.status = status
    }

    // Add search functionality - search across multiple fields
    if (search && search.trim()) {
      query.$or = [
        { url: { $regex: search.trim(), $options: 'i' } },
        { used_target_keywords: { $regex: search.trim(), $options: 'i' } },
        { original_title: { $regex: search.trim(), $options: 'i' } },
        { suggested_title: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    // Build sort
    const sort = { [sortBy]: sortOrder }

    // Get total count for pagination
    const totalCount = await collection.countDocuments(query)
    const totalPages = Math.ceil(totalCount / limit)

    // Fetch metadata records with pagination
    const metadata = await collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get statistics (always total counts, not affected by pagination)
    const stats = {
      total: await collection.countDocuments(),
      pending: await collection.countDocuments({ status: 'pending' }),
      accepted: await collection.countDocuments({ status: 'accepted' }),
      rejected: await collection.countDocuments({ status: 'rejected' }),
      edited: await collection.countDocuments({ status: 'edited' })
    }

    // Convert _id to string for JSON serialization
    const metadataWithStringIds = metadata.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    }))

    return NextResponse.json({
      success: true,
      data: metadataWithStringIds,
      stats,
      count: metadataWithStringIds.length,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metadata', details: error.message },
      { status: 500 }
    )
  }
}
