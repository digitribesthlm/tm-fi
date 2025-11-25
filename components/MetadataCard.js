'use client'

import { useState, useEffect } from 'react'

export default function MetadataCard({ item, onAccept, onReject, onEdit }) {
  // State for tracking which title/meta is selected (for visual feedback)
  const [titleSelection, setTitleSelection] = useState(null) // 'original' | 'suggested' | null
  const [metaSelection, setMetaSelection] = useState(null) // 'original' | 'suggested' | null

  // Auto-select based on reviewed status
  useEffect(() => {
    if (item.status === 'accepted') {
      setTitleSelection('suggested')
      setMetaSelection('suggested')
    } else if (item.status === 'rejected') {
      setTitleSelection('original')
      setMetaSelection('original')
    } else if (item.status === 'edited') {
      // For edited, determine which one matches the final value
      if (item.final_title === item.original_title) {
        setTitleSelection('original')
      } else if (item.final_title === item.suggested_title) {
        setTitleSelection('suggested')
      } else {
        // Custom edit - highlight neither
        setTitleSelection(null)
      }

      if (item.final_meta === item.original_meta) {
        setMetaSelection('original')
      } else if (item.final_meta === item.suggested_meta) {
        setMetaSelection('suggested')
      } else {
        // Custom edit - highlight neither
        setMetaSelection(null)
      }
    }
  }, [item])

  const getStatusColor = () => {
    switch (item.status) {
      case 'accepted':
        return 'border-green-200 bg-green-50'
      case 'rejected':
        return 'border-red-200 bg-red-50'
      case 'edited':
        return 'border-orange-200 bg-orange-50'
      case 'pending':
      default:
        return 'border-amber-200 bg-amber-50'
    }
  }

  const getStatusBadge = () => {
    switch (item.status) {
      case 'accepted':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Accepted</span>
      case 'rejected':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>
      case 'edited':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Edited</span>
      case 'pending':
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>
    }
  }

  const isReviewed = item.status !== 'pending'

  // Helper function to get CSS classes for title sections
  const getTitleClasses = (type) => {
    const baseClasses = 'p-4 rounded-lg transition-all duration-200 border'
    const isSelected = titleSelection === type

    if (type === 'original') {
      return `${baseClasses} ${
        isSelected
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-gray-50 border-gray-200'
      } ${!isReviewed ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-300' : ''}`
    } else {
      return `${baseClasses} ${
        isSelected
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-orange-50 border-orange-200'
      } ${!isReviewed ? 'cursor-pointer hover:bg-orange-100 hover:border-orange-300' : ''}`
    }
  }

  // Helper function to get CSS classes for meta sections
  const getMetaClasses = (type) => {
    const baseClasses = 'p-4 rounded-lg transition-all duration-200 border'
    const isSelected = metaSelection === type

    if (type === 'original') {
      return `${baseClasses} ${
        isSelected
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-gray-50 border-gray-200'
      } ${!isReviewed ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-300' : ''}`
    } else {
      return `${baseClasses} ${
        isSelected
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-orange-50 border-orange-200'
      } ${!isReviewed ? 'cursor-pointer hover:bg-orange-100 hover:border-orange-300' : ''}`
    }
  }

  // Click handlers for title/meta selection
  const handleTitleClick = (type) => {
    if (!isReviewed) {
      setTitleSelection(type === titleSelection ? null : type)
    }
  }

  const handleMetaClick = (type) => {
    if (!isReviewed) {
      setMetaSelection(type === metaSelection ? null : type)
    }
  }

  // Helper function to determine selection type
  const getSelectionType = () => {
    const hasTitle = titleSelection !== null
    const hasMeta = metaSelection !== null

    if (!hasTitle && !hasMeta) return 'none'
    if (!hasTitle || !hasMeta) return 'partial'

    // Both selected
    if (titleSelection === 'suggested' && metaSelection === 'suggested') {
      return 'all-suggested'
    }
    if (titleSelection === 'original' && metaSelection === 'original') {
      return 'all-original'
    }
    // Mixed selection
    return 'mixed'
  }

  // Get the selected values for mixed mode
  const getSelectedValues = () => {
    const selectedTitle = titleSelection === 'original' ? item.original_title : item.suggested_title
    const selectedMeta = metaSelection === 'original' ? item.original_meta : item.suggested_meta
    return { title: selectedTitle, meta: selectedMeta }
  }

  // Handle "Use Selected" button click
  const handleUseSelected = () => {
    const selectionType = getSelectionType()

    if (selectionType === 'none' || selectionType === 'partial') {
      alert('Please select both a title and meta description first.')
      return
    }

    if (selectionType === 'all-suggested') {
      onAccept()
    } else if (selectionType === 'all-original') {
      onReject()
    } else if (selectionType === 'mixed') {
      // DIRECTLY save mixed selection without modal
      const { title, meta } = getSelectedValues()
      onEdit(title, meta)
    }
  }

  // Handle "Approve Selected Combination" button for mixed selections
  const handleApproveMixed = () => {
    const { title, meta } = getSelectedValues()
    // Call onEdit with pre-selected values, but signal direct save
    onEdit(title, meta)
  }

  // Get helper text for current selection
  const getSelectionHelpText = () => {
    const selectionType = getSelectionType()

    if (selectionType === 'none') return 'Click on title and meta to select'
    if (selectionType === 'partial') return 'Select both title and meta description'
    if (selectionType === 'all-suggested') return 'Using: All suggested changes'
    if (selectionType === 'all-original') return 'Using: All original content'
    if (selectionType === 'mixed') {
      const titleType = titleSelection === 'original' ? 'Original' : 'Suggested'
      const metaType = metaSelection === 'original' ? 'Original' : 'Suggested'
      return `Using: ${titleType} title + ${metaType} meta`
    }
    return ''
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${getStatusColor()}`}>
      <div className="p-6">
        {/* Header with URL and Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-hubspot-blue hover:text-hubspot-blue-hover font-medium break-all transition-colors"
          >
            {item.url}
          </a>
          {getStatusBadge()}
        </div>

        {/* Title Comparison */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            SEO Title
            {!isReviewed && (
              <span className="text-xs text-gray-500 font-normal">(Click to select)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">Original</div>
              <div
                className={getTitleClasses('original')}
                onClick={() => handleTitleClick('original')}
              >
                <p className="text-sm text-gray-800 leading-relaxed">{item.original_title}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {item.original_title.length} characters
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-hubspot-orange mb-2">Suggested</div>
              <div
                className={getTitleClasses('suggested')}
                onClick={() => handleTitleClick('suggested')}
              >
                <p className="text-sm text-gray-800 font-medium leading-relaxed">{item.suggested_title}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {item.suggested_title.length} characters
                  {item.suggested_title.length > 60 && (
                    <span className="text-red-600 ml-2 font-medium">Warning: Over 60 characters!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Description Comparison */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Meta Description
            {!isReviewed && (
              <span className="text-xs text-gray-500 font-normal">(Click to select)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">Original</div>
              <div
                className={getMetaClasses('original')}
                onClick={() => handleMetaClick('original')}
              >
                <p className="text-sm text-gray-800 leading-relaxed">{item.original_meta}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {item.original_meta.length} characters
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-hubspot-orange mb-2">Suggested</div>
              <div
                className={getMetaClasses('suggested')}
                onClick={() => handleMetaClick('suggested')}
              >
                <p className="text-sm text-gray-800 font-medium leading-relaxed">{item.suggested_meta}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {item.suggested_meta.length} characters
                  {item.suggested_meta.length > 160 && (
                    <span className="text-red-600 ml-2 font-medium">Warning: Over 160 characters!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info - Compact Single Dropdown */}
        {(item.used_target_keywords || item.changes_explanation) && (
          <details className="mb-4 border border-gray-200 rounded-md bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-between transition-colors">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Additional Info
              </span>
              <svg className="w-4 h-4 text-gray-400 transition-transform duration-200 chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              {/* Keywords - Inline, compact */}
              {item.used_target_keywords && (
                <div className="mb-2">
                  <span className="text-xs font-semibold text-gray-500 mr-2">Keywords:</span>
                  <div className="inline-flex flex-wrap gap-1">
                    {item.used_target_keywords.split(',').map((keyword, index) => (
                      <span key={index} className="inline-block px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation - compact */}
              {item.changes_explanation && (
                <div>
                  <span className="text-xs font-semibold text-gray-500">Reason:</span>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {item.changes_explanation}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Final Decision (shown if reviewed) */}
        {isReviewed && (
          <div className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Final Decision:</h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-600">Title: </span>
                <span className="text-sm text-gray-800">{item.final_title}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600">Meta: </span>
                <span className="text-sm text-gray-800">{item.final_meta}</span>
              </div>
              {item.reviewed_at && (
                <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reviewed: {new Date(item.reviewed_at).toLocaleString()}
                  </div>
                  {item.reviewed_by_name && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Reviewed by: {item.reviewed_by_name}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Help Text */}
        {!isReviewed && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">
              {getSelectionHelpText()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          {!isReviewed ? (
            <>
              {/* Conditional rendering based on selection type */}
              {(() => {
                const selectionType = getSelectionType()

                if (selectionType === 'mixed') {
                  // MIXED SELECTION: Show prominent "Approve Selected Combination" button
                  return (
                    <>
                      <button
                        className="px-5 py-2.5 bg-hubspot-orange text-white rounded-md font-semibold text-sm shadow-md hover:bg-hubspot-orange-hover transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                        onClick={handleApproveMixed}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve Selected Combination
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                        onClick={() => onEdit()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Custom Edit
                      </button>
                    </>
                  )
                } else if (selectionType === 'all-suggested') {
                  // ALL SUGGESTED: Show "Accept Suggested" as primary
                  return (
                    <>
                      <button
                        className="px-5 py-2.5 bg-green-600 text-white rounded-md font-semibold text-sm shadow-md hover:bg-green-700 transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                        onClick={onAccept}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept All Suggested
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-md font-medium text-sm hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex items-center gap-2"
                        onClick={onReject}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Keep All Original
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                        onClick={() => onEdit()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Custom Edit
                      </button>
                    </>
                  )
                } else if (selectionType === 'all-original') {
                  // ALL ORIGINAL: Show "Keep Original" as primary
                  return (
                    <>
                      <button
                        className="px-5 py-2.5 bg-gray-700 text-white rounded-md font-semibold text-sm shadow-md hover:bg-gray-800 transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                        onClick={onReject}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Keep All Original
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-md font-medium text-sm hover:bg-green-50 hover:border-green-400 transition-all duration-200 flex items-center gap-2"
                        onClick={onAccept}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept All Suggested
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                        onClick={() => onEdit()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Custom Edit
                      </button>
                    </>
                  )
                } else {
                  // NO SELECTION or PARTIAL: Show all three buttons equally
                  return (
                    <>
                      <button
                        className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-md font-medium text-sm hover:bg-green-50 hover:border-green-400 transition-all duration-200 flex items-center gap-2"
                        onClick={onAccept}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept All Suggested
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-md font-medium text-sm hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex items-center gap-2"
                        onClick={onReject}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Keep All Original
                      </button>
                      <button
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                        onClick={() => onEdit()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Custom Edit
                      </button>
                    </>
                  )
                }
              })()}
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">
              This item has been reviewed and cannot be changed.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
