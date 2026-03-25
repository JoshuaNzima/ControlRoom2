import React from 'react';
import { router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';

interface Link {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Link[];
}

interface Props {
  links: PaginationData;
}

export default function CommonPagination({ links }: Props) {
  const handlePageChange = (page: number) => {
    router.get(window.location.pathname, { page }, { preserveState: true });
  };

  return (
    <Pagination
      currentPage={links.current_page}
      totalPages={links.last_page}
      onPageChange={handlePageChange}
    />
  );
}
