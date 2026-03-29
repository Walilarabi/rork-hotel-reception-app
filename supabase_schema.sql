-- ============================================================
-- SCRIPT SQL COMPLET — Application Hôtelière Flowtym
-- À copier-coller dans le SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TYPES ENUM
-- ============================================================

CREATE TYPE hotel_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');
CREATE TYPE admin_user_role AS ENUM (
  'reception', 'gouvernante', 'femme_de_chambre',
  'maintenance', 'breakfast', 'direction',
  'super_admin', 'support'
);
CREATE TYPE room_status AS ENUM ('libre', 'occupe', 'depart', 'recouche', 'hors_service');
CREATE TYPE client_badge AS ENUM ('normal', 'vip', 'prioritaire');
CREATE TYPE cleaning_status AS ENUM ('none', 'en_cours', 'nettoyee', 'validee', 'refusee');
CREATE TYPE room_cleanliness_status AS ENUM ('propre', 'en_nettoyage', 'sale', 'inspectee');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE booking_source AS ENUM (
  'Booking', 'Expedia', 'Direct', 'Airbnb',
  'Telephone', 'Agoda', 'HRS', 'Ctrip', 'Walk-in', 'Autre'
);
CREATE TYPE maintenance_priority AS ENUM ('haute', 'moyenne', 'basse');
CREATE TYPE maintenance_status AS ENUM ('en_attente', 'en_cours', 'resolu');
CREATE TYPE maintenance_type_category AS ENUM ('chambre', 'parties_communes');
CREATE TYPE frequency_unit AS ENUM ('day', 'month', 'year');
CREATE TYPE inspection_status AS ENUM ('en_attente', 'valide', 'refuse');
CREATE TYPE lost_found_status AS ENUM ('en_attente', 'restitue', 'consigne');
CREATE TYPE breakfast_status AS ENUM ('a_preparer', 'prepare', 'en_livraison', 'servi');
CREATE TYPE breakfast_staff_position AS ENUM ('responsable', 'serveur', 'cuisinier', 'plongeur');
CREATE TYPE breakfast_location AS ENUM ('salle', 'chambre');
CREATE TYPE breakfast_product_category AS ENUM (
  'boissons', 'laitiers', 'viennoiseries',
  'charcuterie', 'fruits', 'cereales', 'autre'
);
CREATE TYPE consumable_category AS ENUM ('linge', 'accueil', 'minibar', 'menage');
CREATE TYPE stock_movement_type AS ENUM ('entree', 'sortie_consommation', 'sortie_perte', 'inventaire');
CREATE TYPE review_type AS ENUM ('room', 'breakfast');
CREATE TYPE review_recommendation AS ENUM ('yes', 'maybe', 'no');
CREATE TYPE alert_status AS ENUM ('active', 'resolved');
CREATE TYPE issue_status AS ENUM ('active', 'resolved');
CREATE TYPE log_action AS ENUM (
  'hotel_created', 'hotel_updated', 'hotel_suspended',
  'hotel_reactivated', 'hotel_deleted',
  'user_invited', 'user_suspended', 'user_reactivated', 'user_deleted',
  'support_mode_entered', 'support_mode_exited',
  'admin_login', 'pms_sync_forced', 'data_export'
);
CREATE TYPE mandate_status AS ENUM ('none', 'pending', 'sent', 'signed', 'expired');
CREATE TYPE cleaning_task_type AS ENUM ('departure_cleaning', 'stay_cleaning', 'deep_cleaning', 'inspection');
CREATE TYPE cleaning_task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE housekeeper_status AS ENUM ('available', 'busy', 'off');
CREATE TYPE billing_type AS ENUM ('one_time', 'monthly', 'yearly');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE promotion_status AS ENUM ('active', 'inactive', 'scheduled');
CREATE TYPE sub_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE import_file_type AS ENUM ('csv', 'excel', 'image', 'pdf', 'manual');
CREATE TYPE import_status AS ENUM ('success', 'partial', 'failed');
CREATE TYPE room_npd_status AS ENUM ('none', 'npd', 'blocked');

-- ============================================================
-- 3. TABLES — Hôtels & Configuration
-- ============================================================

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  subscription_plan subscription_plan NOT NULL DEFAULT 'basic',
  subscription_start DATE,
  subscription_end DATE,
  status hotel_status NOT NULL DEFAULT 'trial',
  room_count INTEGER NOT NULL DEFAULT 0,
  user_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hotel_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  vat_number TEXT DEFAULT '',
  iban TEXT DEFAULT '',
  bic TEXT DEFAULT '',
  billing_address TEXT DEFAULT '',
  billing_email TEXT DEFAULT '',
  legal_representative TEXT DEFAULT '',
  mandate_reference TEXT DEFAULT '',
  mandate_created_at TIMESTAMPTZ,
  mandate_sent_at TIMESTAMPTZ,
  mandate_signed_at TIMESTAMPTZ,
  mandate_status mandate_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id)
);

CREATE TABLE hotel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  lost_found_retention_days INTEGER NOT NULL DEFAULT 30,
  default_checkout_time TIME DEFAULT '11:00',
  default_checkin_time TIME DEFAULT '15:00',
  breakfast_start_time TIME DEFAULT '07:00',
  breakfast_end_time TIME DEFAULT '10:30',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id)
);

CREATE TABLE hotel_floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, floor_number)
);

-- ============================================================
-- 4. TABLES — Utilisateurs
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role admin_user_role NOT NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invitation_accepted_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. TABLES — Chambres
-- ============================================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 0,
  room_type TEXT NOT NULL DEFAULT 'Double',
  room_category TEXT DEFAULT '',
  view_type TEXT DEFAULT 'Rue',
  bathroom_type TEXT DEFAULT 'Douche',
  room_size NUMERIC DEFAULT 0,
  capacity INTEGER DEFAULT 2,
  equipment TEXT[] DEFAULT '{}',
  dotation TEXT[] DEFAULT '{}',
  status room_status NOT NULL DEFAULT 'libre',
  client_badge client_badge NOT NULL DEFAULT 'normal',
  vip_instructions TEXT DEFAULT '',
  cleaning_status cleaning_status NOT NULL DEFAULT 'none',
  cleaning_assignee UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  cleaning_started_at TIMESTAMPTZ,
  cleaning_completed_at TIMESTAMPTZ,
  breakfast_included BOOLEAN NOT NULL DEFAULT false,
  cleanliness_status room_cleanliness_status DEFAULT 'propre',
  eta_arrival TEXT,
  booking_source booking_source,
  npd_status room_npd_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  pms_reservation_id TEXT,
  guest_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  preferences TEXT DEFAULT '',
  status reservation_status NOT NULL DEFAULT 'confirmed',
  booking_source booking_source,
  breakfast_included BOOLEAN NOT NULL DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE room_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TABLES — Ménage (Housekeeping)
-- ============================================================

CREATE TABLE housekeeping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  floor_id UUID REFERENCES hotel_floors(id) ON DELETE SET NULL,
  floor_number INTEGER NOT NULL DEFAULT 0,
  room_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE housekeeping_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status housekeeper_status NOT NULL DEFAULT 'available',
  max_rooms_per_day INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE housekeeping_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES housekeeping_zones(id) ON DELETE SET NULL,
  zone_name TEXT DEFAULT '',
  staff_id UUID REFERENCES housekeeping_staff(id) ON DELETE SET NULL,
  staff_name TEXT DEFAULT '',
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  room_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE room_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cleaning_type cleaning_task_type NOT NULL DEFAULT 'stay_cleaning',
  status cleaning_task_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES housekeeping_staff(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT,
  floor INTEGER,
  cleaned_by TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status inspection_status NOT NULL DEFAULT 'en_attente',
  checklist_results JSONB DEFAULT '{}',
  comments TEXT DEFAULT '',
  guest_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. TABLES — Maintenance
-- ============================================================

CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority maintenance_priority NOT NULL DEFAULT 'moyenne',
  status maintenance_status NOT NULL DEFAULT 'en_attente',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  photos TEXT[] DEFAULT '{}',
  resolution_notes TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  schedule_id UUID,
  is_periodic BOOLEAN NOT NULL DEFAULT false,
  cost_total NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Autre',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category maintenance_type_category NOT NULL DEFAULT 'chambre',
  frequency_value INTEGER NOT NULL DEFAULT 1,
  frequency_unit frequency_unit NOT NULL DEFAULT 'month',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  maintenance_type_id UUID NOT NULL REFERENCES maintenance_types(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  common_area TEXT,
  last_done TIMESTAMPTZ,
  next_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. TABLES — Objets trouvés
-- ============================================================

CREATE TABLE lost_found_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT DEFAULT '',
  reported_by TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  found_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status lost_found_status NOT NULL DEFAULT 'en_attente',
  returned_to TEXT DEFAULT '',
  returned_date TIMESTAMPTZ,
  returned_id_photo_uri TEXT DEFAULT '',
  consigned_date TIMESTAMPTZ,
  consigned_location TEXT DEFAULT '',
  consigned_observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. TABLES — Petit-déjeuner
-- ============================================================

CREATE TABLE breakfast_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  adult_price_dining NUMERIC NOT NULL DEFAULT 0,
  adult_price_room NUMERIC NOT NULL DEFAULT 0,
  child_price NUMERIC NOT NULL DEFAULT 0,
  child_age_limit INTEGER NOT NULL DEFAULT 12,
  seating_capacity INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id)
);

CREATE TABLE breakfast_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position breakfast_staff_position NOT NULL DEFAULT 'serveur',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE breakfast_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  included BOOLEAN NOT NULL DEFAULT false,
  person_count INTEGER NOT NULL DEFAULT 1,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  formule TEXT DEFAULT 'Continental',
  boissons TEXT[] DEFAULT '{}',
  options TEXT[] DEFAULT '{}',
  status breakfast_status NOT NULL DEFAULT 'a_preparer',
  served_at TIMESTAMPTZ,
  billing_notification_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  guest_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE breakfast_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT DEFAULT '',
  staff_id UUID REFERENCES breakfast_staff(id) ON DELETE SET NULL,
  staff_name TEXT DEFAULT '',
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  adults INTEGER NOT NULL DEFAULT 0,
  children INTEGER NOT NULL DEFAULT 0,
  location breakfast_location NOT NULL DEFAULT 'salle',
  included BOOLEAN NOT NULL DEFAULT false,
  amount NUMERIC NOT NULL DEFAULT 0,
  served_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  satisfaction_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE breakfast_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category breakfast_product_category NOT NULL DEFAULT 'autre',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. TABLES — Économat & Stocks
-- ============================================================

CREATE TABLE consumable_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  category consumable_category NOT NULL DEFAULT 'menage',
  unit TEXT DEFAULT '',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  current_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consumption_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT DEFAULT '',
  product_id UUID REFERENCES consumable_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_icon TEXT DEFAULT '',
  category consumable_category,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  product_id UUID REFERENCES consumable_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  movement_type stock_movement_type NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT,
  reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. TABLES — Satisfaction client
-- ============================================================

CREATE TABLE client_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type review_type NOT NULL DEFAULT 'room',
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT,
  ratings JSONB NOT NULL DEFAULT '{}',
  has_problem BOOLEAN NOT NULL DEFAULT false,
  problem_description TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  recommendation review_recommendation NOT NULL DEFAULT 'yes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quality_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT,
  review_id UUID REFERENCES client_reviews(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  client_comment TEXT DEFAULT '',
  status alert_status NOT NULL DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recurring_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  category TEXT NOT NULL,
  occurrences INTEGER NOT NULL DEFAULT 0,
  period_days INTEGER NOT NULL DEFAULT 30,
  average_score NUMERIC NOT NULL DEFAULT 0,
  status issue_status NOT NULL DEFAULT 'active',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- 12. TABLES — Administration
-- ============================================================

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action log_action NOT NULL,
  details TEXT DEFAULT '',
  hotel_name TEXT,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pms_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  pms_type TEXT NOT NULL DEFAULT 'other',
  connection_name TEXT DEFAULT '',
  hotel_identifier TEXT DEFAULT '',
  api_key TEXT DEFAULT '',
  api_url TEXT DEFAULT '',
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  api_version TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id)
);

-- ============================================================
-- 13. TABLES — Abonnements (Super Admin)
-- ============================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  max_rooms INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_hotels INTEGER NOT NULL DEFAULT 1,
  extra_hotel_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  feature_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Modules',
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  billing_type billing_type NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  duration_months INTEGER,
  start_date DATE,
  end_date DATE,
  max_uses INTEGER,
  max_uses_per_customer INTEGER NOT NULL DEFAULT 1,
  first_purchase_only BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_uses INTEGER NOT NULL DEFAULT 0,
  applicable_plan_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hotel_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  hotel_name TEXT DEFAULT '',
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  plan_name TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status sub_status NOT NULL DEFAULT 'trial',
  price_at_subscription NUMERIC NOT NULL DEFAULT 0,
  promo_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscription_global_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_currency TEXT NOT NULL DEFAULT 'EUR',
  default_billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  trial_days INTEGER NOT NULL DEFAULT 14,
  terms_url TEXT DEFAULT '',
  billing_email TEXT DEFAULT '',
  reminder_days_before INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. TABLES — Import
-- ============================================================

CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type import_file_type NOT NULL DEFAULT 'csv',
  imported_by TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_imported INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error_log TEXT DEFAULT '',
  status import_status NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. TABLES — Prévisions Housekeeping
-- ============================================================

CREATE TABLE housekeeping_forecast_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  default_max_rooms_per_housekeeper INTEGER NOT NULL DEFAULT 12,
  max_departs_per_housekeeper INTEGER,
  depart_coefficient NUMERIC NOT NULL DEFAULT 1.0,
  stayover_coefficient NUMERIC NOT NULL DEFAULT 0.7,
  use_room_type_coefficients BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id)
);

-- ============================================================
-- 16. INDEX pour performances
-- ============================================================

CREATE INDEX idx_users_hotel ON users(hotel_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_status ON rooms(hotel_id, status);
CREATE INDEX idx_rooms_floor ON rooms(hotel_id, floor);
CREATE INDEX idx_rooms_cleaning ON rooms(hotel_id, cleaning_status);

CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_room ON reservations(room_id);
CREATE INDEX idx_reservations_dates ON reservations(hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(hotel_id, status);

CREATE INDEX idx_room_history_room ON room_history(room_id);
CREATE INDEX idx_room_history_hotel ON room_history(hotel_id);

CREATE INDEX idx_housekeeping_zones_hotel ON housekeeping_zones(hotel_id);
CREATE INDEX idx_housekeeping_assignments_hotel ON housekeeping_assignments(hotel_id);
CREATE INDEX idx_housekeeping_assignments_date ON housekeeping_assignments(hotel_id, assignment_date);
CREATE INDEX idx_cleaning_tasks_hotel ON room_cleaning_tasks(hotel_id);
CREATE INDEX idx_cleaning_tasks_date ON room_cleaning_tasks(hotel_id, task_date);

CREATE INDEX idx_inspections_hotel ON inspections(hotel_id);
CREATE INDEX idx_inspections_room ON inspections(room_id);
CREATE INDEX idx_inspections_status ON inspections(hotel_id, status);

CREATE INDEX idx_maintenance_hotel ON maintenance_tasks(hotel_id);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(hotel_id, status);
CREATE INDEX idx_maintenance_room ON maintenance_tasks(room_id);
CREATE INDEX idx_maintenance_comments_task ON maintenance_comments(task_id);
CREATE INDEX idx_maintenance_costs_task ON maintenance_costs(task_id);
CREATE INDEX idx_maintenance_types_hotel ON maintenance_types(hotel_id);
CREATE INDEX idx_maintenance_schedules_hotel ON maintenance_schedules(hotel_id);

CREATE INDEX idx_lost_found_hotel ON lost_found_items(hotel_id);
CREATE INDEX idx_lost_found_status ON lost_found_items(hotel_id, status);
CREATE INDEX idx_lost_found_date ON lost_found_items(hotel_id, found_date);

CREATE INDEX idx_breakfast_orders_hotel ON breakfast_orders(hotel_id);
CREATE INDEX idx_breakfast_orders_date ON breakfast_orders(hotel_id, order_date);
CREATE INDEX idx_breakfast_services_hotel ON breakfast_services(hotel_id);
CREATE INDEX idx_breakfast_services_date ON breakfast_services(hotel_id, service_date);
CREATE INDEX idx_breakfast_products_hotel ON breakfast_products(hotel_id);
CREATE INDEX idx_breakfast_staff_hotel ON breakfast_staff(hotel_id);

CREATE INDEX idx_consumable_products_hotel ON consumable_products(hotel_id);
CREATE INDEX idx_consumption_logs_hotel ON consumption_logs(hotel_id);
CREATE INDEX idx_consumption_logs_date ON consumption_logs(hotel_id, reported_at);
CREATE INDEX idx_stock_movements_hotel ON stock_movements(hotel_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);

CREATE INDEX idx_client_reviews_hotel ON client_reviews(hotel_id);
CREATE INDEX idx_client_reviews_type ON client_reviews(hotel_id, type);
CREATE INDEX idx_quality_alerts_hotel ON quality_alerts(hotel_id);
CREATE INDEX idx_quality_alerts_status ON quality_alerts(hotel_id, status);
CREATE INDEX idx_recurring_issues_hotel ON recurring_issues(hotel_id);

CREATE INDEX idx_admin_logs_user ON admin_logs(user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_date ON admin_logs(created_at);

CREATE INDEX idx_hotel_subscriptions_hotel ON hotel_subscriptions(hotel_id);
CREATE INDEX idx_import_logs_hotel ON import_logs(hotel_id);

-- ============================================================
-- 17. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_forecast_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 18. POLITIQUES RLS — Accès temporaire complet (anon + authenticated)
-- Ces politiques sont permissives pour le développement.
-- En production, il faudra les restreindre par rôle et hotel_id.
-- ============================================================

-- Politique globale : accès complet pour le développement
-- Vous pourrez les remplacer par des politiques plus restrictives plus tard.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'hotels', 'hotel_billing', 'hotel_settings', 'hotel_floors',
      'users', 'rooms', 'reservations', 'room_history',
      'housekeeping_zones', 'housekeeping_staff', 'housekeeping_assignments',
      'room_cleaning_tasks', 'inspections',
      'maintenance_tasks', 'maintenance_comments', 'maintenance_costs',
      'maintenance_types', 'maintenance_schedules',
      'lost_found_items',
      'breakfast_config', 'breakfast_staff', 'breakfast_orders',
      'breakfast_services', 'breakfast_products',
      'consumable_products', 'consumption_logs', 'stock_movements',
      'client_reviews', 'quality_alerts', 'recurring_issues',
      'admin_logs', 'pms_configurations',
      'subscription_plans', 'features', 'addons', 'promotions',
      'hotel_subscriptions', 'subscription_global_config',
      'import_logs', 'housekeeping_forecast_config'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Allow full access for dev" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 19. FONCTIONS UTILES
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers auto-update updated_at
CREATE TRIGGER trg_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_hotel_billing_updated_at
  BEFORE UPDATE ON hotel_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_hotel_settings_updated_at
  BEFORE UPDATE ON hotel_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_maintenance_tasks_updated_at
  BEFORE UPDATE ON maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lost_found_updated_at
  BEFORE UPDATE ON lost_found_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_breakfast_config_updated_at
  BEFORE UPDATE ON breakfast_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_consumable_products_updated_at
  BEFORE UPDATE ON consumable_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pms_config_updated_at
  BEFORE UPDATE ON pms_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscription_global_config_updated_at
  BEFORE UPDATE ON subscription_global_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 20. DONNÉES INITIALES (Seed)
-- ============================================================

-- Config globale abonnements
INSERT INTO subscription_global_config (default_currency, default_billing_cycle, trial_days, billing_email, reminder_days_before)
VALUES ('EUR', 'monthly', 14, 'billing@flowtym.com', 7);

-- Plans d'abonnement par défaut
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_rooms, max_users, max_hotels, sort_order, is_active) VALUES
  ('Basique', 'Pour les petits établissements', 49, 470, 50, 10, 1, 1, true),
  ('Premium', 'Pour les hôtels de taille moyenne', 99, 950, 200, 50, 3, 2, true),
  ('Enterprise', 'Pour les chaînes hôtelières', 249, 2390, 999, 999, 99, 3, true);

-- Fonctionnalités
INSERT INTO features (name, category, description, icon) VALUES
  ('Housekeeping', 'Modules', 'Gestion du ménage et des femmes de chambre', '🧹'),
  ('Réception', 'Modules', 'Interface de réception et planning', '🏨'),
  ('Maintenance', 'Modules', 'Gestion des interventions techniques', '🔧'),
  ('Objets trouvés', 'Modules', 'Suivi des objets trouvés et restitutions', '📦'),
  ('Petit-déjeuner', 'Modules', 'Gestion des commandes petit-déjeuner', '🥐'),
  ('Économat', 'Modules', 'Gestion des stocks et consommations', '📊'),
  ('Satisfaction client', 'Modules', 'Avis clients par QR code', '⭐'),
  ('QR Codes', 'QR Codes', 'Génération de QR codes pour chambres', '📱'),
  ('Intégration PMS', 'Intégrations', 'Connexion avec les PMS hôteliers', '🔗'),
  ('Rapports PDF', 'Rapports', 'Export des rapports en PDF', '📄'),
  ('Support prioritaire', 'Support', 'Support technique prioritaire', '🎧');

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- Résumé des tables créées :
-- 1.  hotels
-- 2.  hotel_billing
-- 3.  hotel_settings
-- 4.  hotel_floors
-- 5.  users
-- 6.  rooms
-- 7.  reservations
-- 8.  room_history
-- 9.  housekeeping_zones
-- 10. housekeeping_staff
-- 11. housekeeping_assignments
-- 12. room_cleaning_tasks
-- 13. inspections
-- 14. maintenance_tasks
-- 15. maintenance_comments
-- 16. maintenance_costs
-- 17. maintenance_types
-- 18. maintenance_schedules
-- 19. lost_found_items
-- 20. breakfast_config
-- 21. breakfast_staff
-- 22. breakfast_orders
-- 23. breakfast_services
-- 24. breakfast_products
-- 25. consumable_products
-- 26. consumption_logs
-- 27. stock_movements
-- 28. client_reviews
-- 29. quality_alerts
-- 30. recurring_issues
-- 31. admin_logs
-- 32. pms_configurations
-- 33. subscription_plans
-- 34. features
-- 35. addons
-- 36. promotions
-- 37. hotel_subscriptions
-- 38. subscription_global_config
-- 39. import_logs
-- 40. housekeeping_forecast_config
-- ============================================================
