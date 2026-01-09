'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import Card from '@/components/card';
import { MdEdit, MdDelete, MdArrowUpward, MdArrowDownward } from 'react-icons/md';

interface WeightEntry {
  id: string;
  livestockId: string;
  weight: number;
  measurementDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: WeightEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface WeightHistoryTableProps {
  livestockId: string;
  onEdit?: (entry: WeightEntry) => void;
  onRefresh?: () => void;
}

export default function WeightHistoryTable({ livestockId, onEdit, onRefresh }: WeightHistoryTableProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWeightEntries();
  }, [livestockId, page, sortOrder]);

  const fetchWeightEntries = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      const response = await api.get<PaginatedResponse>(
        `/api/livestock/${livestockId}/weight-entries`,
        { params }
      );
      
      // Sort entries by date
      const sortedEntries = [...response.data.data].sort((a, b) => {
        const dateA = new Date(a.measurementDate).getTime();
        const dateB = new Date(b.measurementDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      setEntries(sortedEntries);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching weight entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return;
    }

    try {
      setDeletingId(entryId);
      await api.delete(`/api/livestock/${livestockId}/weight-entries/${entryId}`);
      
      // Refresh the list
      await fetchWeightEntries();
      
      // Notify parent component
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error deleting weight entry:', error);
      alert(error.response?.data?.message || 'Failed to delete weight entry');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <Card extra="w-full h-full p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
          Weight History
        </h3>
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
          aria-label={`Sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
        >
          {sortOrder === 'desc' ? <MdArrowDownward size={18} /> : <MdArrowUpward size={18} />}
          Date
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No weight entries recorded</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Weight (kg)
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Notes
                </th>
                <th className="pb-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <td className="py-3 text-sm text-navy-700 dark:text-white">
                    {new Date(entry.measurementDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm font-semibold text-navy-700 dark:text-white">
                    {entry.weight.toFixed(1)}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {entry.notes || '-'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(entry)}
                          className="rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 touch-manipulation min-h-[36px] min-w-[36px]"
                          aria-label="Edit entry"
                        >
                          <MdEdit size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 touch-manipulation min-h-[36px] min-w-[36px]"
                        aria-label="Delete entry"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && entries.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-navy-700 dark:text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
