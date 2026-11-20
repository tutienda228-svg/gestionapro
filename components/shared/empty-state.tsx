import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 p-10 text-center">
      <p className="font-medium text-neutral-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-4">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
