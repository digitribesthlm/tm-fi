import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectDB } from '../../../../lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { action, title, meta } = body

    // Validate action
    if (!['accept', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: accept, reject, or edit' },
        { status: 400 }
      )
    }

    // Validate edit data if action is edit
    if (action === 'edit') {
      if (!title || !meta) {
        return NextResponse.json(
          { error: 'Title and meta are required for edit action' },
          { status: 400 }
        )
      }

      // Validate character limits
      if (title.length > 60) {
        return NextResponse.json(
          { error: 'Title must be 60 characters or less' },
          { status: 400 }
        )
      }

      if (meta.length > 160) {
        return NextResponse.json(
          { error: 'Meta description must be 160 characters or less' },
          { status: 400 }
        )
      }
    }

    // Connect to database
    const { db } = await connectDB()
    const collection = db.collection('seo_metadata')

    // Get the current document to determine final values
    const currentDoc = await collection.findOne({ _id: new ObjectId(id) })

    if (!currentDoc) {
      return NextResponse.json(
        { error: 'Metadata record not found' },
        { status: 404 }
      )
    }

    // Prepare update based on action
    let updateData = {
      status: action === 'reject' ? 'rejected' : (action === 'edit' ? 'edited' : 'accepted'),
      customer_action: action,
      reviewed_at: new Date(),
      updated_at: new Date(),
      reviewed_by: session.user.email || 'unknown',
      reviewed_by_name: session.user.name || session.user.email || 'Unknown User'
    }

    // Set final title and meta based on action
    if (action === 'accept') {
      updateData.final_title = currentDoc.suggested_title
      updateData.final_meta = currentDoc.suggested_meta
    } else if (action === 'reject') {
      updateData.final_title = currentDoc.original_title
      updateData.final_meta = currentDoc.original_meta
    } else if (action === 'edit') {
      updateData.final_title = title
      updateData.final_meta = meta
    }

    // Update the document
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update metadata record' },
        { status: 500 }
      )
    }

    // Fetch updated document
    const updatedDoc = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: `Metadata ${action}ed successfully`,
      data: {
        ...updatedDoc,
        _id: updatedDoc._id.toString()
      }
    })

  } catch (error) {
    console.error('Error updating metadata:', error)
    return NextResponse.json(
      { error: 'Failed to update metadata', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Connect to database
    const { db } = await connectDB()
    const collection = db.collection('seo_metadata')

    // Fetch single document
    const doc = await collection.findOne({ _id: new ObjectId(id) })

    if (!doc) {
      return NextResponse.json(
        { error: 'Metadata record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...doc,
        _id: doc._id.toString()
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
