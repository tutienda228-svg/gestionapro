export function KpiCard({ label, value, accent }: { label: string; value: string; accent?: "red" | "green" }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent === "red" ? "text-red-600" : accent === "green" ? "text-green-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}
