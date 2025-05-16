'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { dictionaryService } from '@/lib/dictionary-service'
import { useTabState } from '@/hooks/useTabState'

interface DictionaryProps {
  isOpen: boolean
  onClose: () => void
}

interface DictionaryEntry {
  from: string
  to: string
}

export default function Dictionary({ isOpen, onClose }: DictionaryProps) {
  const [dictionaryEntries, setDictionaryEntries] = useTabState<DictionaryEntry[]>('dictionaryEntries', [])
  const [newEntry, setNewEntry] = useTabState('newDictionaryEntry', { from: '', to: '' })

  useEffect(() => {
    if (isOpen) {
      loadDictionaryEntries()
    }
  }, [isOpen])

  const loadDictionaryEntries = () => {
    const entries = dictionaryService.getAllEntries()
    setDictionaryEntries(entries)
  }

  const handleAddEntry = () => {
    if (newEntry.from && newEntry.to) {
      dictionaryService.addEntry(newEntry.from, newEntry.to)
      setNewEntry({ from: '', to: '' })
      loadDictionaryEntries()
    }
  }

  const handleRemoveEntry = (from: string) => {
    dictionaryService.removeEntry(from)
    loadDictionaryEntries()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Quản lý từ điển thay thế</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ gốc</label>
                <input
                  type="text"
                  value={newEntry.from}
                  onChange={(e) => setNewEntry({ ...newEntry, from: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nhập từ cần thay thế..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thay thế bằng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEntry.to}
                    onChange={(e) => setNewEntry({ ...newEntry, to: e.target.value })}
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Nhập từ thay thế..."
                  />
                  <button
                    onClick={handleAddEntry}
                    disabled={!newEntry.from || !newEntry.to}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Từ gốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thay thế bằng
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dictionaryEntries.map((entry) => (
                    <tr key={entry.from}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.from}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveEntry(entry.from)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
} 