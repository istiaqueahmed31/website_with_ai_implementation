create table public.product_business_rules (
  product_id uuid primary key
    references public.products(id)
    on delete cascade,

  cost_price numeric not null
    check (cost_price >= 0),

  minimum_margin_percent numeric not null default 10
    check (
      minimum_margin_percent >= 0
      and minimum_margin_percent <= 100
    ),

  maximum_discount_percent numeric not null default 20
    check (
      maximum_discount_percent >= 0
      and maximum_discount_percent <= 100
    ),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.bulk_pricing_rules (
  id uuid primary key default gen_random_uuid(),

  product_id uuid
    references public.products(id)
    on delete cascade,

  minimum_quantity integer not null
    check (minimum_quantity > 0),

  discount_percent numeric not null
    check (
      discount_percent >= 0
      and discount_percent <= 100
    ),

  is_active boolean default true,

  created_at timestamptz default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete set null,

  visitor_id text,

  conversation_type text not null default 'customer'
    check (
      conversation_type in ('customer', 'admin')
    ),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null
    references public.ai_conversations(id)
    on delete cascade,

  role text not null
    check (
      role in ('user', 'assistant', 'tool')
    ),

  content text not null,

  tool_name text,

  created_at timestamptz default now()
);

create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id),

  order_item_id uuid
    references public.order_items(id),

  user_id uuid
    references auth.users(id),

  reason text not null,

  description text,

  eligibility_result text
    check (
      eligibility_result in (
        'eligible',
        'not_eligible',
        'manual_review'
      )
    ),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'resolved'
      )
    ),

  ai_summary text,
  admin_notes text,

  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table public.product_relationships (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  related_product_id uuid not null
    references public.products(id)
    on delete cascade,

  relationship_type text default 'complementary',

  score numeric default 1,

  is_active boolean default true,

  created_at timestamptz default now(),

  unique(product_id, related_product_id)
);

create table public.ai_offer_drafts (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  discount_percent numeric
    check (
      discount_percent >= 0
      and discount_percent <= 100
    ),

  marketing_text text,

  banner_title text,
  banner_subtitle text,
  banner_cta text,

  ai_reasoning_summary text,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'approved',
        'rejected'
      )
    ),

  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),

  created_at timestamptz default now(),
  approved_at timestamptz
);

create table public.ai_offer_draft_items (
  id uuid primary key default gen_random_uuid(),

  offer_draft_id uuid not null
    references public.ai_offer_drafts(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id),

  quantity integer default 1
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  discount_percent numeric not null,

  start_at timestamptz,
  end_at timestamptz,

  is_active boolean default false,

  approved_by uuid references auth.users(id),

  created_at timestamptz default now()
);

create table public.offer_items (
  id uuid primary key default gen_random_uuid(),

  offer_id uuid not null
    references public.offers(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id),

  quantity integer default 1
);

create table public.ai_banner_drafts (
  id uuid primary key default gen_random_uuid(),

  product_id uuid
    references public.products(id),

  offer_draft_id uuid
    references public.ai_offer_drafts(id),

  image_url text,

  title_en text,
  title_bn text,

  subtitle_en text,
  subtitle_bn text,

  cta_en text,
  cta_bn text,

  link text,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'approved',
        'rejected'
      )
    ),

  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),

  created_at timestamptz default now(),
  approved_at timestamptz
);

alter table public.product_business_rules enable row level security;
alter table public.bulk_pricing_rules enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.refund_requests enable row level security;
alter table public.product_relationships enable row level security;
alter table public.ai_offer_drafts enable row level security;
alter table public.ai_offer_draft_items enable row level security;
alter table public.offers enable row level security;
alter table public.offer_items enable row level security;
alter table public.ai_banner_drafts enable row level security;

