import { useState, useEffect, useMemo } from 'react';

interface PaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  onPageChange?: (paginatedItems: T[], currentPage: number) => void;
}

const Pagination = <T,>({ items, itemsPerPage = 4, onPageChange }: PaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = useMemo(() => Math.ceil(items.length / itemsPerPage), [items.length, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);
    onPageChange?.(paginatedItems, currentPage);
  }, [currentPage, totalPages, itemsPerPage, onPageChange]);

  return (
    totalPages > 1 && (
      <div className="absolute w-full bottom-3.5 left-1/2 -translate-x-1/2 flex justify-center mt-4 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm md:text-base"
        >
          « Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
          )
          .map((page, index, arr) => {
            const isEllipsisBefore = index > 0 && arr[index - 1] !== page - 1;
            return (
              <span key={page}>
                {isEllipsisBefore && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`text-sm md:text-base px-3 py-1 rounded ${currentPage === page
                      ? "bg-[#f0924c] text-white"
                      : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                  {page}
                </button>
              </span>
            );
          })}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm md:text-base"
        >
          Next »
        </button>
      </div>
    )
  );
};

export default Pagination;