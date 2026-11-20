-- =========================================================
-- GestionaPro — Esquema inicial (Supabase / PostgreSQL)
-- Multiempresa con Row Level Security
-- =========================================================

-- ---------- EXTENSIONES ----------
create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type member_role as enum ('owner','admin','comercial','operativo','readonly');
create type quotation_status as enum ('draft','sent','accepted','rejected','expired');
create type project_status as enum ('pending','in_progress','paused','completed','cancelled');
create type task_status as enum ('pending','in_progress','done','blocked');
create type invoice_status as enum ('draft','sent','partially_paid','paid','overdue','cancelled');
create type reminder_channel as enum ('email','whatsapp_manual');
create type subscription_status as enum ('trialing','active','past_due','canceled','incomplete');

-- =========================================================
-- TABLAS BASE
-- =========================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  nit_or_tax_id text,
  phone text,
  email text,
  address text,
  logo_url text,
  plan text not null default 'inicial',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status subscription_status not null default 'trialing',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  quotation_seq int not null default 0,
  invoice_seq int not null default 0,
  created_at timestamptz not null default now()
);

-- Tabla de perfiles de usuario (espejo de auth.users, 1:1)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null default 'operativo',
  status text not null default 'active', -- invited | active | suspended
  invited_at timestamptz,
  joined_at timestamptz default now(),
  primary key (organization_id, user_id)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  tax_id text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company text,
  contact_name text,
  email text,
  phone text,
  source text,
  interest text,
  stage text not null default 'nuevo',
  expected_value numeric(14,2),
  owner_user_id uuid references users(id),
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id),
  lead_id uuid references leads(id),
  quotation_number text not null,
  title text not null,
  description text,
  currency text not null default 'COP',
  subtotal numeric(14,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status quotation_status not null default 'draft',
  public_token uuid not null default gen_random_uuid(),
  valid_until date,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, quotation_number)
);

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit text,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  position int not null default 0
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id),
  quotation_id uuid references quotations(id),
  name text not null,
  description text,
  status project_status not null default 'pending',
  start_date date,
  due_date date,
  budget numeric(14,2),
  estimated_cost numeric(14,2),
  responsible_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to_user_id uuid references users(id),
  status task_status not null default 'pending',
  due_date date,
  completed_at timestamptz
);

create table project_time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid references users(id),
  date date not null default current_date,
  hours numeric(6,2) not null,
  activity_description text,
  hourly_rate numeric(12,2),
  total_cost numeric(14,2) generated always as (hours * coalesce(hourly_rate,0)) stored
);

create table project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  quantity numeric(12,2) not null default 1,
  unit text,
  unit_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) generated always as (quantity * unit_cost) stored,
  supplier text,
  notes text
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'COP',
  subtotal numeric(14,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance_due numeric(14,2) generated always as (total - amount_paid) stored,
  status invoice_status not null default 'draft',
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit text,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  position int not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14,2) not null,
  payment_method text,
  reference text,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  type text not null, -- before_due | after_due | manual
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  channel reminder_channel not null default 'email',
  status text not null default 'pending',
  message text
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Crea el perfil espejo en public.users cuando se registra un auth.users
-- (cubre signUp normal y usuarios creados por admin.inviteUserByEmail).
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =========================================================
-- ÍNDICES
-- =========================================================
create index idx_members_user on organization_members(user_id);
create index idx_clients_org on clients(organization_id);
create index idx_leads_org on leads(organization_id);
create index idx_quotations_org on quotations(organization_id);
create index idx_quotations_token on quotations(public_token);
create index idx_projects_org on projects(organization_id);
create index idx_invoices_org on invoices(organization_id);
create index idx_invoices_status on invoices(organization_id, status);
create index idx_payments_invoice on payments(invoice_id);
create index idx_reminders_due on reminders(scheduled_at) where status = 'pending';
create index idx_activity_org on activity_logs(organization_id, created_at desc);

-- =========================================================
-- FUNCIONES Y TRIGGERS
-- =========================================================

-- Helper: ¿el usuario autenticado pertenece a la organización (y opcionalmente con rol mínimo)?
create or replace function is_org_member(target_org uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function has_org_role(target_org uuid, roles member_role[])
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(roles)
  );
$$;

-- Numeración consecutiva por organización (cotizaciones y facturas)
create or replace function next_quotation_number(org uuid)
returns text language plpgsql security definer as $$
declare n int;
begin
  update organizations set quotation_seq = quotation_seq + 1
    where id = org returning quotation_seq into n;
  return 'COT-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function next_invoice_number(org uuid)
returns text language plpgsql security definer as $$
declare n int;
begin
  update organizations set invoice_seq = invoice_seq + 1
    where id = org returning invoice_seq into n;
  return 'FAC-' || lpad(n::text, 4, '0');
end;
$$;

-- Evitar que organization_id sea modificado tras la creación (en cualquier tabla con esa columna)
create or replace function prevent_org_id_change()
returns trigger language plpgsql as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id no puede modificarse';
  end if;
  return new;
end;
$$;

create trigger trg_lock_org_clients before update on clients
  for each row execute function prevent_org_id_change();
create trigger trg_lock_org_quotations before update on quotations
  for each row execute function prevent_org_id_change();
create trigger trg_lock_org_projects before update on projects
  for each row execute function prevent_org_id_change();
create trigger trg_lock_org_invoices before update on invoices
  for each row execute function prevent_org_id_change();

-- Recalcular estado de factura vencida
create or replace function mark_overdue_invoices()
returns void language sql as $$
  update invoices
    set status = 'overdue'
    where status in ('sent','partially_paid')
      and due_date < current_date
      and balance_due > 0;
$$;
-- Se invoca desde app/api/cron/vencimientos/route.ts (Vercel Cron) una vez al día.

-- Actualizar amount_paid / status de factura al registrar un pago
create or replace function apply_payment()
returns trigger language plpgsql as $$
declare v_total numeric(14,2); v_paid numeric(14,2);
begin
  update invoices
    set amount_paid = amount_paid + new.amount
    where id = new.invoice_id
    returning total, amount_paid into v_total, v_paid;

  update invoices set status = case
      when v_paid >= v_total then 'paid'
      when v_paid > 0 then 'partially_paid'
      else status
    end
    where id = new.invoice_id;

  insert into activity_logs(organization_id, user_id, entity_type, entity_id, action, description)
    values (new.organization_id, new.created_by, 'invoice', new.invoice_id, 'payment_registered',
            'Pago registrado por ' || new.amount);
  return new;
end;
$$;

create trigger trg_apply_payment after insert on payments
  for each row execute function apply_payment();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table organization_members enable row level security;
alter table clients enable row level security;
alter table leads enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;
alter table projects enable row level security;
alter table project_tasks enable row level security;
alter table project_time_entries enable row level security;
alter table project_materials enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table reminders enable row level security;
alter table activity_logs enable row level security;

-- ---- organizations ----
create policy org_select on organizations for select
  using (is_org_member(id));
create policy org_update on organizations for update
  using (has_org_role(id, array['owner','admin']::member_role[]));
-- el insert de organizations se hace vía función RPC "create_organization" (security definer),
-- no con insert directo del cliente, para crear a la vez la membresía owner de forma atómica.

-- ---- users ----
create policy users_select_self on users for select
  using (id = auth.uid());
create policy users_update_self on users for update
  using (id = auth.uid());

-- ---- organization_members ----
create policy members_select on organization_members for select
  using (is_org_member(organization_id));
create policy members_insert on organization_members for insert
  with check (has_org_role(organization_id, array['owner','admin']::member_role[]));
create policy members_update on organization_members for update
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));
create policy members_delete on organization_members for delete
  using (has_org_role(organization_id, array['owner']::member_role[]));

-- ---- clients ----
create policy clients_select on clients for select using (is_org_member(organization_id));
create policy clients_write on clients for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy clients_update on clients for update
  using (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy clients_delete on clients for delete
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));

-- ---- leads ----
create policy leads_select on leads for select using (is_org_member(organization_id));
create policy leads_write on leads for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy leads_update on leads for update
  using (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy leads_delete on leads for delete
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));

-- ---- quotations & items ----
create policy quotations_select on quotations for select using (is_org_member(organization_id));
create policy quotations_write on quotations for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy quotations_update on quotations for update
  using (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy quotations_delete on quotations for delete
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));

create policy quotation_items_select on quotation_items for select
  using (exists (select 1 from quotations q where q.id = quotation_id and is_org_member(q.organization_id)));
create policy quotation_items_write on quotation_items for all
  using (exists (select 1 from quotations q where q.id = quotation_id
                 and has_org_role(q.organization_id, array['owner','admin','comercial']::member_role[])));

-- ---- projects y relacionadas (patrón igual para tasks/time/materials) ----
create policy projects_select on projects for select using (is_org_member(organization_id));
create policy projects_write on projects for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy projects_update on projects for update
  using (has_org_role(organization_id, array['owner','admin','operativo']::member_role[]));
create policy projects_delete on projects for delete
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));

create policy project_tasks_rw on project_tasks for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy project_time_rw on project_time_entries for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy project_materials_rw on project_materials for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

-- ---- invoices, items, payments, reminders ----
create policy invoices_select on invoices for select using (is_org_member(organization_id));
create policy invoices_write on invoices for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy invoices_update on invoices for update
  using (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));
create policy invoices_delete on invoices for delete
  using (has_org_role(organization_id, array['owner','admin']::member_role[]));

create policy invoice_items_rw on invoice_items for all
  using (exists (select 1 from invoices i where i.id = invoice_id and is_org_member(i.organization_id)));

create policy payments_select on payments for select using (is_org_member(organization_id));
create policy payments_write on payments for insert
  with check (has_org_role(organization_id, array['owner','admin','comercial']::member_role[]));

create policy reminders_rw on reminders for all using (is_org_member(organization_id));

-- ---- activity_logs (solo lectura desde el cliente; se escribe vía triggers/RPC) ----
create policy activity_logs_select on activity_logs for select using (is_org_member(organization_id));

-- =========================================================
-- RPC para creación atómica de organización + membresía owner
-- =========================================================
create or replace function create_organization(org_name text, org_slug text)
returns uuid language plpgsql security definer as $$
declare new_org_id uuid;
begin
  insert into organizations(name, slug) values (org_name, org_slug) returning id into new_org_id;
  insert into organization_members(organization_id, user_id, role, status, joined_at)
    values (new_org_id, auth.uid(), 'owner', 'active', now());
  return new_org_id;
end;
$$;
