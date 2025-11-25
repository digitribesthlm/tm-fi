import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectDB } from '../../../../lib/mongodb'

/**
 * CSV Export API Route
 * Exports all reviewed metadata items (non-pending) to CSV format
 */
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

    // Connect to database
    const { db } = await connectDB()
    const collection = db.collection('seo_metadata')

    // Query all reviewed items (non-pending)
    const metadata = await collection
      .find({ status: { $ne: 'pending' } })
      .sort({ reviewed_at: -1 })
      .toArray()

    // Generate CSV content
    const csvRows = []

    // CSV Header
    csvRows.push([
      'url',
      'status',
      'final_title',
      'final_meta',
      'original_title',
      'original_meta',
      'suggested_title',
      'suggested_meta',
      'reviewed_by',
      'reviewed_by_name',
      'reviewed_at',
      'used_target_keywords',
      'changes_explanation'
    ].join(','))

    // CSV Data Rows
    for (const item of metadata) {
      const row = [
        escapeCsvField(item.url || ''),
        escapeCsvField(item.status || ''),
        escapeCsvField(item.final_title || ''),
        escapeCsvField(item.final_meta || ''),
        escapeCsvField(item.original_title || ''),
        escapeCsvField(item.original_meta || ''),
        escapeCsvField(item.suggested_title || ''),
        escapeCsvField(item.suggested_meta || ''),
        escapeCsvField(item.reviewed_by || ''),
        escapeCsvField(item.reviewed_by_name || ''),
        escapeCsvField(item.reviewed_at ? new Date(item.reviewed_at).toISOString() : ''),
        escapeCsvField(item.used_target_keywords || ''),
        escapeCsvField(item.changes_explanation || '')
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `seo-metadata-export-${date}.csv`

    // Return CSV file with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error exporting metadata:', error)
    return NextResponse.json(
      { error: 'Failed to export metadata', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Helper function to escape CSV fields
 * Handles quotes, commas, and newlines properly
 */
function escapeCsvField(field) {
  if (field === null || field === undefined) {
    return '""'
  }

  const stringField = String(field)

  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }

  return `"${stringField}"`
}
