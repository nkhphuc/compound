import React from 'react';
import { useTranslation } from 'react-i18next';

const DOTS = '...';

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const usePagination = ({
  totalPages,
  currentPage,
  siblings = 1,
}: {
  totalPages: number;
  currentPage: number;
  siblings?: number;
}) => {
  const paginationRange = React.useMemo(() => {
    // Pages count is determined as siblings + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblings + 5;

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPages]
    */
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    /*
    	Calculate left and right sibling index and make sure they are within range 1 and totalPages
    */
    const leftSiblingIndex = Math.max(currentPage - siblings, 1);
    const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

    /*
      We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and totalPages. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPages - 2
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    /*
    	Case 2: No left dots to show, but rights dots to be shown
    */
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings;
      const leftRange = range(1, leftItemCount);

      return [...leftRange, DOTS, totalPages];
    }

    /*
    	Case 3: No right dots to show, but left dots to be shown
    */
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblings;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    /*
    	Case 4: Both left and right dots to be shown
    */
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }, [totalPages, currentPage, siblings]);

  return paginationRange || [];
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblings?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblings = 1,
}) => {
  const { t } = useTranslation();
  const paginationRange = usePagination({ currentPage, totalPages, siblings });

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const onPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  return (
    <nav aria-label="Page navigation">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            onClick={onPrevious}
            disabled={currentPage === 1}
            className="py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.previous')}
          </button>
        </li>
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <li key={`${DOTS}-${index}`}>
                <span className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300">
                  &#8230;
                </span>
              </li>
            );
          }

          return (
            <li key={pageNumber}>
              <button
                onClick={() => onPageChange(pageNumber as number)}
                className={`py-2 px-3 leading-tight ${
                  pageNumber === currentPage
                    ? 'text-blue-600 bg-blue-50 border-blue-300 hover:bg-blue-100 hover:text-blue-700'
                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}
        <li>
          <button
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.next')}
          </button>
        </li>
      </ul>
    </nav>
  );
};
