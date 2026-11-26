import { type ReactNode, useRef } from "react";

import { useSlashToSearch } from "@/lib/use-slash-to-search";

import { SearchField } from "./search-field";

type ListSectionProps = {
  query: string;
  onQuery: (query: string) => void;
  placeholder: string;
  /** A `Segmented` filter, shown before the search field. */
  filter?: ReactNode;
  /** The list: a `DataTable` or an `EmptyState`. */
  children: ReactNode;
};

/**
 * A list with its filter row. The row sticks to the top as the list scrolls and the table's
 * header sticks right under it, so filters and column names stay in reach on a long list.
 */
export function ListSection({ query, onQuery, placeholder, filter, children }: ListSectionProps) {
  const search = useRef<HTMLInputElement>(null);
  useSlashToSearch(search);
  return (
    <section className="[--table-top:44px]">
      <div className="sticky top-0 z-[3] flex h-11 items-center gap-2 bg-bg px-5">
        {filter}
        <SearchField
          ref={search}
          value={query}
          onChange={onQuery}
          placeholder={placeholder}
          shortcut="/"
          className="w-[220px]"
        />
      </div>
      <div className="pb-[72px]">{children}</div>
    </section>
  );
}
