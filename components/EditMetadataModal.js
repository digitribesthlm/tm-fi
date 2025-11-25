'use client'

import { useState, useEffect } from 'react'

export default function EditMetadataModal({ item, onSave, onCancel, preSelectedTitle, preSelectedMeta }) {
  const [title, setTitle] = useState('')
  const [meta, setMeta] = useState('')
  const [titleError, setTitleError] = useState('')
  const [metaError, setMetaError] = useState('')

  // Initialize with pre-selected values or suggested values
  useEffect(() => {
    if (item) {
      // Use pre-selected values if provided, otherwise use suggested values
      setTitle(preSelectedTitle || item.suggested_title)
      setMeta(preSelectedMeta || item.suggested_meta)
    }
  }, [item, preSelectedTitle, preSelectedMeta])

  // Validate on change
  useEffect(() => {
    if (title.length > 60) {
      setTitleError(`Over limit by ${title.length - 60} characters`)
    } else {
      setTitleError('')
    }
  }, [title])

  useEffect(() => {
    if (meta.length > 160) {
      setMetaError(`Over limit by ${meta.length - 160} characters`)
    } else {
      setMetaError('')
    }
  }, [meta])

  const handleSave = () => {
    // Final validation
    if (title.length > 60) {
      alert('Title must be 60 characters or less')
      return
    }
    if (meta.length > 160) {
      alert('Meta description must be 160 characters or less')
      return
    }
    if (!title.trim() || !meta.trim()) {
      alert('Title and meta description are required')
      return
    }

    onSave(title, meta)
  }

  const getTitleColorClass = () => {
    if (title.length > 60) return 'text-error'
    if (title.length > 55) return 'text-warning'
    return 'text-success'
  }

  const getMetaColorClass = () => {
    if (meta.length > 160) return 'text-error'
    if (meta.length > 150) return 'text-warning'
    return 'text-success'
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Modal Header */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit SEO Metadata</h3>

            {/* URL Display */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-hubspot-blue hover:text-hubspot-blue-hover font-medium break-all transition-colors"
              >
                {item.url}
              </a>
            </div>

            {/* Title Field */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">SEO Title</label>
                <span className={`text-xs font-medium ${
                  title.length > 60 ? 'text-red-600' : title.length > 55 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {title.length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  titleError
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-hubspot-orange/20 focus:border-hubspot-orange'
                }`}
                placeholder="Enter SEO title"
              />
              {titleError && (
                <p className="mt-1 text-xs text-red-600">{titleError}</p>
              )}
            </div>

            {/* Meta Description Field */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Meta Description</label>
                <span className={`text-xs font-medium ${
                  meta.length > 160 ? 'text-red-600' : meta.length > 150 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {meta.length} / 160 characters
                </span>
              </div>
              <textarea
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none h-24 ${
                  metaError
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-hubspot-orange/20 focus:border-hubspot-orange'
                }`}
                placeholder="Enter meta description"
              />
              {metaError && (
                <p className="mt-1 text-xs text-red-600">{metaError}</p>
              )}
            </div>

            {/* Reference Section */}
            <details className="bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors rounded-lg">
                View Original and Suggested Values
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Original Title:</div>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                    {item.original_title}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-hubspot-orange mb-1">Suggested Title:</div>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                    {item.suggested_title}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Original Meta:</div>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                    {item.original_meta}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-hubspot-orange mb-1">Suggested Meta:</div>
                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                    {item.suggested_meta}
                  </div>
                </div>
              </div>
            </details>

            {/* Target Keywords Reference */}
            {item.used_target_keywords && (
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-700 mb-2">Target Keywords:</div>
                <div className="flex flex-wrap gap-2">
                  {item.used_target_keywords.split(',').map((keyword, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-hubspot-orange text-white rounded-md font-medium text-sm shadow-sm hover:bg-hubspot-orange-hover transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleSave}
                disabled={!!titleError || !!metaError || !title.trim() || !meta.trim()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
