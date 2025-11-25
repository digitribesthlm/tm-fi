'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MetadataCard from '../../components/MetadataCard'
import EditMetadataModal from '../../components/EditMetadataModal'

export default function ReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [metadata, setMetadata] = useState([])
  const [filteredMetadata, setFilteredMetadata] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    edited: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [preSelectedTitle, setPreSelectedTitle] = useState(null)
  const [preSelectedMeta, setPreSelectedMeta] = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch metadata on mount and when page/filter/search changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMetadata()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pagination.page, activeFilter, debouncedSearchQuery])

  const fetchMetadata = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }

      if (debouncedSearchQuery.trim()) {
        params.append('search', debouncedSearchQuery.trim())
      }

      const response = await fetch(`/api/metadata?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch metadata')
      }

      const result = await response.json()
      setMetadata(result.data)
      setFilteredMetadata(result.data) // Since API now filters, we use data directly
      setStats(result.stats)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Error fetching metadata:', error)
      alert('Failed to load metadata. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action, editData = null) => {
    try {
      const body = { action }
      if (action === 'edit' && editData) {
        body.title = editData.title
        body.meta = editData.meta
      }

      const response = await fetch(`/api/metadata/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update metadata')
      }

      const result = await response.json()

      // Update local state
      setMetadata(prevMetadata =>
        prevMetadata.map(item =>
          item._id === id ? result.data : item
        )
      )

      // Close edit modal if open
      setEditingItem(null)

      // Re-fetch metadata to update stats counter
      await fetchMetadata()

      // Show success message
      const actionPastTense = action === 'accept' ? 'accepted' : (action === 'reject' ? 'rejected' : 'updated')
      alert(`Metadata ${actionPastTense} successfully!`)

    } catch (error) {
      console.error('Error updating metadata:', error)
      alert(error.message || 'Failed to update metadata. Please try again.')
    }
  }

  const handleEdit = (item, preTitle = null, preMeta = null) => {
    setEditingItem(item)
    setPreSelectedTitle(preTitle)
    setPreSelectedMeta(preMeta)
  }

  const handleSaveEdit = (title, meta) => {
    if (editingItem) {
      handleAction(editingItem._id, 'edit', { title, meta })
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setPreSelectedTitle(null)
    setPreSelectedMeta(null)
  }

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    // Reset to page 1 when changing filters
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    // Reset to page 1 when searching
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const { page, totalPages } = pagination
    const pageNumbers = []

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      if (page > 3) {
        pageNumbers.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      if (page < totalPages - 2) {
        pageNumbers.push('...')
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/metadata/export')

      if (!response.ok) {
        throw new Error('Failed to export metadata')
      }

      // Get the CSV blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seo-metadata-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('CSV export successful!')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/login',
      redirect: true
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-800 hover:text-hubspot-orange transition-colors">
                TM-FI
              </Link>
              <span className="hidden sm:inline-block text-sm text-gray-500">SEO Review</span>
            </div>

            {/* Right: User info and Logout */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* User info - hidden on small screens */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-medium text-gray-800">{session?.user?.name || session?.user?.email}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total URLs Stat */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-hubspot-blue/10 rounded-lg">
                <svg className="w-6 h-6 text-hubspot-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Total URLs</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-xs text-gray-500">All metadata records</div>
          </div>

          {/* Pending Stat */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Pending</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</div>
            <div className="text-xs text-gray-500">Awaiting review</div>
          </div>

          {/* Accepted Stat */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Accepted</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.accepted}</div>
            <div className="text-xs text-gray-500">Approved suggestions</div>
          </div>

          {/* Rejected Stat */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.rejected}</div>
            <div className="text-xs text-gray-500">Kept original</div>
          </div>

          {/* Edited Stat */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-hubspot-orange/10 rounded-lg">
                <svg className="w-6 h-6 text-hubspot-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Edited</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.edited}</div>
            <div className="text-xs text-gray-500">Custom changes</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'all'
                  ? 'bg-hubspot-orange text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterChange('all')}
            >
              All ({stats.total})
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'pending'
                  ? 'bg-hubspot-orange text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterChange('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'accepted'
                  ? 'bg-hubspot-orange text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterChange('accepted')}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'rejected'
                  ? 'bg-hubspot-orange text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterChange('rejected')}
            >
              Rejected ({stats.rejected})
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === 'edited'
                  ? 'bg-hubspot-orange text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleFilterChange('edited')}
            >
              Edited ({stats.edited})
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault() // Prevent form submission/page reload
                }
              }}
              placeholder="Search by URL or keywords..."
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hubspot-orange focus:border-hubspot-orange transition-all duration-200 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {debouncedSearchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              {pagination.total === 0 ? (
                <span className="text-red-600">No results found for "{debouncedSearchQuery}"</span>
              ) : (
                <span>Found {pagination.total} result{pagination.total !== 1 ? 's' : ''} for "{debouncedSearchQuery}"</span>
              )}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="flex justify-end mb-6">
          <button
            className="px-5 py-2.5 bg-hubspot-orange text-white rounded-md font-medium text-sm shadow-sm hover:bg-hubspot-orange-hover transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleExportCSV}
            disabled={stats.accepted + stats.rejected + stats.edited === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Results
          </button>
        </div>

        {/* Metadata Cards */}
        <div className="space-y-6">
          {filteredMetadata.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-700 font-medium">
                {debouncedSearchQuery ? `No results found for "${debouncedSearchQuery}"` : 'No metadata records found for this filter.'}
              </p>
              {debouncedSearchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="mt-3 text-sm text-hubspot-orange hover:text-hubspot-orange-hover font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredMetadata.map(item => (
              <MetadataCard
                key={item._id}
                item={item}
                onAccept={() => handleAction(item._id, 'accept')}
                onReject={() => handleAction(item._id, 'reject')}
                onEdit={(preTitle, preMeta) => handleEdit(item, preTitle, preMeta)}
              />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 mb-4">
            {/* Page Info */}
            <div className="text-center text-sm text-gray-600 mb-4">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
            </div>

            {/* Pagination Buttons */}
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                  pagination.hasPrevPage
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      pagination.page === pageNum
                        ? 'bg-hubspot-orange text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                  pagination.hasNextPage
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditMetadataModal
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          preSelectedTitle={preSelectedTitle}
          preSelectedMeta={preSelectedMeta}
        />
      )}
    </div>
  )
}
