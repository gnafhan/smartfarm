'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdWarning } from 'react-icons/md';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface Barn {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  sensors: string[];
  status: 'active' | 'inactive';
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Barn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const columnHelper = createColumnHelper<Barn>();

export default function BarnsPage() {
  const router = useRouter();
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchBarns = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      
      if (search) params.search = search;
      if (status) params.status = status;

      const response = await api.get<PaginatedResponse>('/api/barns', { params });
      setBarns(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching barns:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    fetchBarns();
  }, [fetchBarns]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this barn?')) return;
    
    try {
      await api.delete(`/api/barns/${id}`);
      fetchBarns();
    } catch (error: any) {
      console.error('Error deleting barn:', error);
      alert(error.response?.data?.message || 'Failed to delete barn');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'inactive':
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-green-500';
  };

  const columns = [
    columnHelper.accessor('code', {
      id: 'code',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">CODE</p>
      ),
      cell: (info) => (
        <p className="text-sm font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">NAME</p>
      ),
      cell: (info) => (
        <p className="text-sm font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('currentOccupancy', {
      id: 'occupancy',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">OCCUPANCY</p>
      ),
      cell: (info) => {
        const barn = info.row.original;
        const percentage = (barn.currentOccupancy / barn.capacity) * 100;
        const isExceeded = barn.currentOccupancy >= barn.capacity;
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${getOccupancyColor(barn.currentOccupancy, barn.capacity)}`}>
                  {barn.currentOccupancy} / {barn.capacity}
                </span>
                <span className="text-xs text-gray-500">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    percentage >= 100
                      ? 'bg-red-500'
                      : percentage >= 80
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
            {isExceeded && (
              <MdWarning className="text-red-500" size={20} title="Capacity exceeded" />
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('sensors', {
      id: 'sensors',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">SENSORS</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white">
          {info.getValue().length}
        </p>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">STATUS</p>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(info.getValue())}`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">ACTIONS</p>
      ),
      cell: (info) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/barns/${info.row.original.id}`)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
            title="View"
          >
            <MdVisibility size={20} />
          </button>
          <button
            onClick={() => router.push(`/barns/${info.row.original.id}/edit`)}
            className="text-green-500 hover:text-green-700 dark:text-green-400"
            title="Edit"
          >
            <MdEdit size={20} />
          </button>
          <button
            onClick={() => handleDelete(info.row.original.id)}
            className="text-red-500 hover:text-red-700 dark:text-red-400"
            title="Delete"
          >
            <MdDelete size={20} />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: barns,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="mt-5 h-full w-full">
      <Card extra="w-full h-full px-6 pb-6 sm:overflow-x-auto">
        {/* Header */}
        <div className="relative flex items-center justify-between pt-4">
          <div className="text-xl font-bold text-navy-700 dark:text-white">
            Barn Management
          </div>
          <button
            onClick={() => router.push('/barns/new')}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            <MdAdd size={20} />
            Add Barn
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
              />
              <button
                onClick={handleSearch}
                className="flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-white hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
              >
                <MdSearch size={20} />
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : barns.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No barns found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="!border-px !border-gray-400">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer border-b border-gray-200 pb-2 pr-4 pt-4 text-start dark:border-white/30"
                      >
                        <div className="items-center justify-between text-xs text-gray-200">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="min-w-[100px] border-white/0 py-3 pr-4"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && barns.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-navy-700 dark:text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
