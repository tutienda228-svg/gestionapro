import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Paginación simple basada en querystring (?page=N), server-friendly. */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][]
    );
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-neutral-500">
        {total} resultado{total === 1 ? "" : "s"} · página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          className={cn(
            "rounded-lg border border-neutral-300 px-3 py-1.5",
            page <= 1 && "pointer-events-none opacity-40"
          )}
        >
          Anterior
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          className={cn(
            "rounded-lg border border-neutral-300 px-3 py-1.5",
            page >= totalPages && "pointer-events-none opacity-40"
          )}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
