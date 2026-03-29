-- ============================================================
-- SCRIPT SQL COMPLET — Application de gestion hoteliere
-- A copier-coller dans le SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'super_admin', 'direction', 'gouvernante', 'reception',
  'femme_de_chambre', 'maintenance', 'breakfast_staff', 'economat'
);

CREATE TYPE room_status AS ENUM (
  'libre', 'occupe', 'en_nettoyage', 'en_maintenance',
  'hors_service', 'depart', 'recouche'
);

CREATE TYPE room_type AS ENUM (
  'single', 'double', 'twin', 'suite', 'junior_suite',
  'family', 'deluxe', 'penthouse', 'studio', 'accessible'
);

CREATE TYPE reservation_status AS ENUM (
  'confirmee', 'en_cours', 'check_in', 'check_out',
  'annulee', 'no_show'
);

CREATE TYPE cleaning_status AS ENUM (
  'a_faire', 'en_cours', 'termine', 'inspecte',
  'a_refaire', 'non_requis'
);

CREATE TYPE cleaning_type AS ENUM (
  'depart', 'recouche', 'en_cours_sejour', 'grande_fouille',
  'mise_en_blanc', 'controle_rapide'
);

CREATE TYPE inspection_result AS ENUM (
  'conforme', 'non_conforme', 'a_refaire'
);

CREATE TYPE maintenance_priority AS ENUM (
  'basse', 'normale', 'haute', 'urgente'
);

CREATE TYPE maintenance_status AS ENUM (
  'signale', 'en_attente_piece', 'en_cours',
  'termine', 'annule', 'reporte'
);

CREATE TYPE lost_found_status AS ENUM (
  'declare', 'en_consigne', 'restitue', 'detruit', 'don'
);

CREATE TYPE stock_movement_type AS ENUM (
  'entree', 'sortie', 'inventaire', 'ajustement', 'perte'
);

CREATE TYPE product_category AS ENUM (
  'linge', 'accueil', 'minibar', 'menage',
  'entretien', 'papeterie', 'divers'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'trial', 'suspended', 'cancelled', 'expired'
);

CREATE TYPE alert_severity AS ENUM (
  'info', 'warning', 'critical'
);

-- ============================================================
-- 3. TABLES — Hotels & Configuration
-- ============================================================

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  total_rooms INTEGER DEFAULT 0,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hotel_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  company_name TEXT,
  siret TEXT,
  tva_number TEXT,
  iban TEXT,
  bic TEXT,
  sepa_mandate_ref TEXT,
  billing_email TEXT,
  billing_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id)
);

CREATE TABLE hotel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  lost_found_retention_days INTEGER DEFAULT 90,
  checkout_time TIME DEFAULT '11:00',
  checkin_time TIME DEFAULT '15:00',
  auto_assign_cleaning BOOLEAN DEFAULT false,
  notify_maintenance_urgent BOOLEAN DEFAULT true,
  breakfast_start_time TIME DEFAULT '07:00',
  breakfast_end_time TIME DEFAULT '10:30',
  default_cleaning_duration_min INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'EUR',
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr',
  extra_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id)
);

CREATE TABLE hotel_floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  name TEXT,
  description TEXT,
  total_rooms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, floor_number)
);

-- ============================================================
-- 4. TABLES — Utilisateurs & Roles
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'reception',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TABLES — Chambres
-- ============================================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES hotel_floors(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  room_type room_type NOT NULL DEFAULT 'double',
  status room_status NOT NULL DEFAULT 'libre',
  capacity INTEGER DEFAULT 2,
  bed_type TEXT,
  surface_m2 NUMERIC(6,2),
  has_balcony BOOLEAN DEFAULT false,
  has_bathtub BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,
  equipments JSONB DEFAULT '[]',
  dotation JSONB DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_count INTEGER DEFAULT 1,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'confirmee',
  source TEXT DEFAULT 'direct',
  special_requests TEXT,
  pms_reservation_id TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. TABLES — Menage (Housekeeping)
-- ============================================================

CREATE TABLE housekeeping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES hotel_floors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  room_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE housekeeping_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES housekeeping_zones(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  room_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  assignment_id UUID REFERENCES housekeeping_assignments(id) ON DELETE SET NULL,
  cleaning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cleaning_type cleaning_type NOT NULL DEFAULT 'recouche',
  status cleaning_status NOT NULL DEFAULT 'a_faire',
  priority INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_min INTEGER,
  products_used JSONB DEFAULT '[]',
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  cleaning_task_id UUID REFERENCES room_cleaning_tasks(id) ON DELETE SET NULL,
  inspected_by UUID NOT NULL REFERENCES users(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  result inspection_result NOT NULL DEFAULT 'conforme',
  checklist JSONB DEFAULT '{}',
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  comments TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. TABLES — Maintenance
-- ============================================================

CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority maintenance_priority NOT NULL DEFAULT 'normale',
  status maintenance_status NOT NULL DEFAULT 'signale',
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  location TEXT,
  photos_before TEXT[] DEFAULT '{}',
  photos_after TEXT[] DEFAULT '{}',
  estimated_duration_min INTEGER,
  actual_duration_min INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  invoice_ref TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  default_priority maintenance_priority DEFAULT 'normale',
  estimated_duration_min INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  maintenance_type_id UUID REFERENCES maintenance_types(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  next_due_date DATE NOT NULL,
  last_executed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. TABLES — Objets trouves
-- ============================================================

CREATE TABLE lost_found_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  item_description TEXT NOT NULL,
  category TEXT,
  location_found TEXT,
  found_date DATE NOT NULL DEFAULT CURRENT_DATE,
  found_by UUID REFERENCES users(id),
  status lost_found_status NOT NULL DEFAULT 'declare',
  storage_location TEXT,
  photos TEXT[] DEFAULT '{}',
  guest_name TEXT,
  guest_contact TEXT,
  returned_to TEXT,
  returned_date DATE,
  returned_id_scan_url TEXT,
  destruction_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. TABLES — Petit-dejeuner
-- ============================================================

CREATE TABLE breakfast_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  adult_price NUMERIC(8,2) DEFAULT 0,
  child_price NUMERIC(8,2) DEFAULT 0,
  child_age_limit INTEGER DEFAULT 12,
  included_in_rate BOOLEAN DEFAULT false,
  service_start TIME DEFAULT '07:00',
  service_end TIME DEFAULT '10:30',
  max_capacity INTEGER DEFAULT 50,
  extra_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id)
);

CREATE TABLE breakfast_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  supplier TEXT,
  unit TEXT DEFAULT 'piece',
  unit_price NUMERIC(8,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE breakfast_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_start TIME,
  shift_end TIME,
  role TEXT DEFAULT 'service',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE breakfast_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_guests INTEGER DEFAULT 0,
  total_adults INTEGER DEFAULT 0,
  total_children INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE breakfast_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  service_id UUID REFERENCES breakfast_services(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name TEXT,
  adults_count INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,
  is_included BOOLEAN DEFAULT false,
  total_price NUMERIC(8,2) DEFAULT 0,
  order_time TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. TABLES — Economat & Stocks
-- ============================================================

CREATE TABLE consumable_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category product_category NOT NULL DEFAULT 'divers',
  sku TEXT,
  unit TEXT DEFAULT 'piece',
  unit_price NUMERIC(8,2) DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 10,
  supplier TEXT,
  supplier_ref TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE consumption_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES consumable_products(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  consumed_by UUID REFERENCES users(id),
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES consumable_products(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reference TEXT,
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. TABLES — Satisfaction client
-- ============================================================

CREATE TABLE client_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name TEXT,
  source TEXT DEFAULT 'interne',
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  breakfast_rating INTEGER CHECK (breakfast_rating BETWEEN 1 AND 5),
  comment TEXT,
  response TEXT,
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quality_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  severity alert_severity NOT NULL DEFAULT 'warning',
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recurring_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL,
  description TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_reported_at TIMESTAMPTZ DEFAULT now(),
  last_reported_at TIMESTAMPTZ DEFAULT now(),
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. TABLES — Administration
-- ============================================================

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pms_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  pms_name TEXT NOT NULL,
  api_url TEXT,
  api_key_encrypted TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_interval_min INTEGER DEFAULT 15,
  field_mapping JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id)
);

-- ============================================================
-- 13. TABLES — Abonnements (Super Admin)
-- ============================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_rooms INTEGER,
  max_users INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
  discount_amount NUMERIC(10,2),
  valid_from DATE,
  valid_until DATE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hotel_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  trial_ends_at DATE,
  addon_ids UUID[] DEFAULT '{}',
  promotion_id UUID REFERENCES promotions(id),
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id)
);

-- ============================================================
-- 14. FONCTIONS UTILITAIRES
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 15. TRIGGERS — updated_at automatique
-- ============================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'hotels', 'hotel_billing', 'hotel_settings',
      'users', 'rooms', 'reservations',
      'housekeeping_zones', 'housekeeping_assignments', 'room_cleaning_tasks',
      'maintenance_tasks', 'maintenance_schedules',
      'lost_found_items',
      'breakfast_config', 'breakfast_products', 'breakfast_services',
      'consumable_products', 'recurring_issues',
      'pms_configurations',
      'subscription_plans', 'addons', 'hotel_subscriptions'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- ============================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'hotels', 'hotel_billing', 'hotel_settings', 'hotel_floors',
      'users', 'rooms', 'reservations', 'room_history',
      'housekeeping_zones', 'housekeeping_assignments', 'room_cleaning_tasks', 'inspections',
      'maintenance_tasks', 'maintenance_comments', 'maintenance_costs',
      'maintenance_types', 'maintenance_schedules',
      'lost_found_items',
      'breakfast_config', 'breakfast_products', 'breakfast_staff',
      'breakfast_services', 'breakfast_orders',
      'consumable_products', 'consumption_logs', 'stock_movements',
      'client_reviews', 'quality_alerts', 'recurring_issues',
      'admin_logs', 'pms_configurations',
      'subscription_plans', 'features', 'addons', 'promotions', 'hotel_subscriptions'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END;
$$;

-- Helper: get current user's hotel_id from users table
CREATE OR REPLACE FUNCTION get_user_hotel_id()
RETURNS UUID AS $$
  SELECT hotel_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 17. POLITIQUES RLS — Acces par hotel
-- ============================================================

-- Hotels: users see only their hotel, super_admin sees all
CREATE POLICY "hotel_access" ON hotels
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR id = get_user_hotel_id()
  );

-- Generic hotel-scoped policies for all tables with hotel_id
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'hotel_billing', 'hotel_settings', 'hotel_floors',
      'rooms', 'reservations', 'room_history',
      'housekeeping_zones', 'housekeeping_assignments', 'room_cleaning_tasks', 'inspections',
      'maintenance_tasks', 'maintenance_types', 'maintenance_schedules',
      'lost_found_items',
      'breakfast_config', 'breakfast_products', 'breakfast_staff',
      'breakfast_services', 'breakfast_orders',
      'consumable_products', 'consumption_logs', 'stock_movements',
      'client_reviews', 'quality_alerts', 'recurring_issues',
      'admin_logs', 'pms_configurations', 'hotel_subscriptions'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "hotel_scope_%s" ON %I FOR ALL USING (
        get_user_role() = ''super_admin''
        OR hotel_id = get_user_hotel_id()
      );',
      t, t
    );
  END LOOP;
END;
$$;

-- Users table: users see only users from their hotel
CREATE POLICY "users_hotel_access" ON users
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR hotel_id = get_user_hotel_id()
    OR auth_id = auth.uid()
  );

-- Maintenance comments: access via task's hotel
CREATE POLICY "maintenance_comments_access" ON maintenance_comments
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR task_id IN (SELECT id FROM maintenance_tasks WHERE hotel_id = get_user_hotel_id())
  );

-- Maintenance costs: access via task's hotel
CREATE POLICY "maintenance_costs_access" ON maintenance_costs
  FOR ALL USING (
    get_user_role() = 'super_admin'
    OR task_id IN (SELECT id FROM maintenance_tasks WHERE hotel_id = get_user_hotel_id())
  );

-- Features: readable by all (linked to plans)
CREATE POLICY "features_read" ON features
  FOR SELECT USING (true);

-- Subscription plans: readable by all
CREATE POLICY "plans_read" ON subscription_plans
  FOR SELECT USING (true);

-- Addons: readable by all
CREATE POLICY "addons_read" ON addons
  FOR SELECT USING (true);

-- Promotions: readable by all
CREATE POLICY "promotions_read" ON promotions
  FOR SELECT USING (true);

-- Super admin full access on plans/features/addons/promotions
CREATE POLICY "plans_admin" ON subscription_plans
  FOR ALL USING (get_user_role() = 'super_admin');

CREATE POLICY "features_admin" ON features
  FOR ALL USING (get_user_role() = 'super_admin');

CREATE POLICY "addons_admin" ON addons
  FOR ALL USING (get_user_role() = 'super_admin');

CREATE POLICY "promotions_admin" ON promotions
  FOR ALL USING (get_user_role() = 'super_admin');

-- ============================================================
-- 18. INDEX — Performance
-- ============================================================

CREATE INDEX idx_users_hotel ON users(hotel_id);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_status ON rooms(hotel_id, status);
CREATE INDEX idx_rooms_floor ON rooms(floor_id);

CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_room ON reservations(room_id);
CREATE INDEX idx_reservations_dates ON reservations(hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(hotel_id, status);

CREATE INDEX idx_room_history_room ON room_history(room_id);
CREATE INDEX idx_room_history_hotel ON room_history(hotel_id);

CREATE INDEX idx_cleaning_tasks_hotel ON room_cleaning_tasks(hotel_id);
CREATE INDEX idx_cleaning_tasks_room ON room_cleaning_tasks(room_id);
CREATE INDEX idx_cleaning_tasks_date ON room_cleaning_tasks(hotel_id, cleaning_date);
CREATE INDEX idx_cleaning_tasks_status ON room_cleaning_tasks(hotel_id, status);
CREATE INDEX idx_cleaning_tasks_assigned ON room_cleaning_tasks(assigned_to);

CREATE INDEX idx_inspections_hotel ON inspections(hotel_id);
CREATE INDEX idx_inspections_room ON inspections(room_id);

CREATE INDEX idx_assignments_hotel ON housekeeping_assignments(hotel_id);
CREATE INDEX idx_assignments_date ON housekeeping_assignments(hotel_id, assignment_date);
CREATE INDEX idx_assignments_user ON housekeeping_assignments(user_id);

CREATE INDEX idx_maintenance_hotel ON maintenance_tasks(hotel_id);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(hotel_id, status);
CREATE INDEX idx_maintenance_priority ON maintenance_tasks(hotel_id, priority);
CREATE INDEX idx_maintenance_room ON maintenance_tasks(room_id);
CREATE INDEX idx_maintenance_assigned ON maintenance_tasks(assigned_to);

CREATE INDEX idx_maintenance_comments_task ON maintenance_comments(task_id);
CREATE INDEX idx_maintenance_costs_task ON maintenance_costs(task_id);

CREATE INDEX idx_lost_found_hotel ON lost_found_items(hotel_id);
CREATE INDEX idx_lost_found_status ON lost_found_items(hotel_id, status);
CREATE INDEX idx_lost_found_date ON lost_found_items(hotel_id, found_date);

CREATE INDEX idx_breakfast_orders_hotel ON breakfast_orders(hotel_id);
CREATE INDEX idx_breakfast_orders_service ON breakfast_orders(service_id);
CREATE INDEX idx_breakfast_services_date ON breakfast_services(hotel_id, service_date);

CREATE INDEX idx_consumables_hotel ON consumable_products(hotel_id);
CREATE INDEX idx_consumables_category ON consumable_products(hotel_id, category);
CREATE INDEX idx_consumption_logs_hotel ON consumption_logs(hotel_id);
CREATE INDEX idx_consumption_logs_product ON consumption_logs(product_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);

CREATE INDEX idx_reviews_hotel ON client_reviews(hotel_id);
CREATE INDEX idx_reviews_room ON client_reviews(room_id);
CREATE INDEX idx_quality_alerts_hotel ON quality_alerts(hotel_id);

CREATE INDEX idx_admin_logs_hotel ON admin_logs(hotel_id);
CREATE INDEX idx_admin_logs_user ON admin_logs(user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);

CREATE INDEX idx_hotel_subscriptions_hotel ON hotel_subscriptions(hotel_id);
CREATE INDEX idx_hotel_subscriptions_status ON hotel_subscriptions(status);

-- ============================================================
-- FIN DU SCRIPT
-- Toutes les tables, RLS, index et triggers sont crees.
-- ============================================================
