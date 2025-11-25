const { MongoClient } = require('mongodb')
const { readFileSync } = require('fs')
const { join } = require('path')

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://patrik:BM3OzAIln9DJByMy@task-manager.vttgc.mongodb.net/?retryWrites=true&w=majority&appName=task-manager'
const DATABASE_NAME = process.env.DATABASE_NAME || 'task-manager'

async function importCSV() {
  let client

  try {
    console.log('🚀 Starting CSV import...')
    console.log('📁 Database:', DATABASE_NAME)

    // Read CSV file
    const csvPath = join(__dirname, '..', 'K89Climber.csv')
    console.log('📄 Reading CSV from:', csvPath)

    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())

    console.log(`📊 Found ${lines.length - 1} data rows (excluding header)`)

    // Parse CSV
    const headers = lines[0].split(',')
    console.log('📋 CSV Headers:', headers)

    const records = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Handle CSV parsing with quoted fields
      const values = []
      let currentValue = ''
      let insideQuotes = false

      for (let char of line) {
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim()) // Push last value

      if (values.length >= 7) {
        const record = {
          url: values[0],
          original_title: values[1],
          suggested_title: values[2],
          original_meta: values[3],
          suggested_meta: values[4],
          used_target_keywords: values[5],
          changes_explanation: values[6],
          // Additional tracking fields
          status: 'pending',
          customer_action: null,
          final_title: null,
          final_meta: null,
          reviewed_at: null,
          customer_id: null,
          created_at: new Date(),
          updated_at: new Date()
        }
        records.push(record)
      }
    }

    console.log(`✅ Parsed ${records.length} records`)

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db(DATABASE_NAME)
    const collection = db.collection('seo_metadata')

    // Clear existing data
    console.log('🗑️  Clearing existing seo_metadata collection...')
    const deleteResult = await collection.deleteMany({})
    console.log(`   Deleted ${deleteResult.deletedCount} existing records`)

    // Insert new records
    console.log('💾 Inserting new records...')
    const insertResult = await collection.insertMany(records)
    console.log(`✅ Successfully inserted ${insertResult.insertedCount} records`)

    // Create indexes for better query performance
    console.log('🔧 Creating indexes...')
    await collection.createIndex({ status: 1 })
    await collection.createIndex({ url: 1 })
    await collection.createIndex({ customer_id: 1 })
    console.log('✅ Indexes created')

    // Show summary
    console.log('\n📊 IMPORT SUMMARY:')
    console.log('   Total records imported:', insertResult.insertedCount)
    console.log('   Status: All set to "pending"')
    console.log('   Collection: seo_metadata')
    console.log('   Database:', DATABASE_NAME)

    console.log('\n🎉 Import completed successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 Database connection closed')
    }
  }
}

// Run the import
importCSV()
