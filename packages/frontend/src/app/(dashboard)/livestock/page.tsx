'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch } from 'react-icons/md';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface Livestock {
  id: string;
  earTagId: string;
  name: string;
  species: string;
  gender: 'male' | 'female';
  status: 'active' | 'sold' | 'deceased';
  weight: number;
  dateOfBirth: string;
  currentBarnId?: string;
}

interface PaginatedResponse {
  data: Livestock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const columnHelper = createColumnHelper<Livestock>();

export default function LivestockPage() {
  const router = useRouter();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      
      if (search) params.search = search;
      if (species) params.species = species;
      if (status) params.status = status;

      const response = await api.get<PaginatedResponse>('/api/livestock', { params });
      setLivestock(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching livestock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivestock();
  }, [page, search, species, status]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this livestock?')) return;
    
    try {
      await api.delete(`/api/livestock/${id}`);
      fetchLivestock();
    } catch (error) {
      console.error('Error deleting livestock:', error);
      alert('Failed to delete livestock');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'sold':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'deceased':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const columns = [
    columnHelper.accessor('earTagId', {
      id: 'earTagId',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">EAR TAG</p>
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
    columnHelper.accessor('species', {
      id: 'species',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">SPECIES</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white capitalize">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('gender', {
      id: 'gender',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">GENDER</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white capitalize">
          {info.getValue()}
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
    columnHelper.accessor('weight', {
      id: 'weight',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">WEIGHT (kg)</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
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
            onClick={() => router.push(`/livestock/${info.row.original.id}`)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="View"
            aria-label="View livestock details"
          >
            <MdVisibility size={20} />
          </button>
          <button
            onClick={() => router.push(`/livestock/${info.row.original.id}/edit`)}
            className="text-green-500 hover:text-green-700 dark:text-green-400 p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Edit"
            aria-label="Edit livestock"
          >
            <MdEdit size={20} />
          </button>
          <button
            onClick={() => handleDelete(info.row.original.id)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Delete"
            aria-label="Delete livestock"
          >
            <MdDelete size={20} />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: livestock,
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
            Livestock Management
          </div>
          <button
            onClick={() => router.push('/livestock/new')}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300 touch-manipulation min-h-[44px]"
            aria-label="Add new livestock"
          >
            <MdAdd size={20} />
            <span className="hidden sm:inline">Add Livestock</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name or ear tag..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
              />
              <button
                onClick={handleSearch}
                className="flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-white hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300 touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label="Search livestock"
              >
                <MdSearch size={20} />
              </button>
            </div>
          </div>

          {/* Species Filter */}
          <div>
            <select
              value={species}
              onChange={(e) => {
                setSpecies(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
            >
              <option value="">All Species</option>
              <option value="cattle">Cattle</option>
              <option value="goat">Goat</option>
              <option value="sheep">Sheep</option>
              <option value="pig">Pig</option>
              <option value="chicken">Chicken</option>
            </select>
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
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : livestock.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No livestock found</p>
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
        {!loading && livestock.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
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
    </div>
  );
}
