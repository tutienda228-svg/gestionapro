import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { InviteForm } from "./invite-form";
import { MemberRow } from "./member-row";

export default async function UsuariosPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role, status, invited_at, joined_at, users(full_name, email)")
    .eq("organization_id", current.organization.id)
    .order("joined_at", { ascending: true });

  const canManage = current.role === "owner" || current.role === "admin";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Usuarios y roles</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Invita personas de tu equipo y controla qué pueden hacer en {current.organization.name}.
      </p>

      {canManage && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
          <InviteForm />
        </div>
      )}

      <div className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {!members || members.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">Aún no hay usuarios. Invita al primero arriba.</p>
        ) : (
          members.map((m: any) => (
            <MemberRow
              key={m.user_id}
              userId={m.user_id}
              name={m.users?.full_name}
              email={m.users?.email}
              role={m.role}
              status={m.status}
              canManage={canManage}
              isSelfOwner={current.role === "owner" && m.role === "owner"}
            />
          ))
        )}
      </div>
    </div>
  );
}
