
import { useState } from "react";

export type SortField = "event_date" | "severity" | "category";
export type SortOrder = "asc" | "desc";

export const useSorting = (defaultField: SortField = "event_date", defaultOrder: SortOrder = "desc") => {
  const [sortField, setSortField] = useState<SortField>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return {
    sortField,
    sortOrder,
    handleSort
  };
};
