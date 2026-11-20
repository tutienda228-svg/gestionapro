"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

/**
 * Buscador + filtro por select, sincronizados con la URL (?q=&status=).
 * Server Components vecinos (page.tsx) leen esos mismos searchParams.
 */
export function SearchBar({
  placeholder,
  filterOptions,
  filterParam = "status",
}: {
  placeholder: string;
  filterOptions?: { value: string; label: string }[];
  filterParam?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // reinicia paginación al cambiar filtros
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        placeholder={placeholder}
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        className="sm:max-w-xs"
      />
      {filterOptions && (
        <Select
          defaultValue={searchParams.get(filterParam) ?? ""}
          onChange={(e) => updateParam(filterParam, e.target.value)}
          className="sm:max-w-xs"
        >
          <option value="">Todos</option>
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
