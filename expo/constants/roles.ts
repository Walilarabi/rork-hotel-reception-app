// ============================================================
// Registre des modules mobiles & modèle de rôles dynamiques
// ------------------------------------------------------------
// Source de vérité unique pour : quels modules existent dans
// l'app mobile « terrain », quel rôle voit quels modules, et
// où atterrir après connexion.
//
// Conçu pour être, à terme, alimenté par Supabase (tables
// `roles` / `role_modules` de Flowtym Check-in). En attendant,
// les rôles intégrés (builtin) servent de valeurs par défaut et
// les rôles personnalisés sont fusionnés par RolesProvider.
//
// NB : la Réception a été volontairement retirée de l'app mobile
// (elle reste gérée par le poste web Flowtym Check-in). Son code
// est conservé mais n'est plus exposé comme onglet.
// ============================================================

export type MobileModuleId =
  | 'housekeeping'
  | 'gouvernante'
  | 'maintenance'
  | 'breakfast'
  | 'direction';

export interface MobileModule {
  id: MobileModuleId;
  /** Nom du segment de route Expo Router dans app/(tabs)/ */
  routeName: string;
  /** Chemin complet pour router.replace / href */
  route: string;
  /** Libellé court affiché dans la barre d'onglets */
  label: string;
  /** Clé d'icône, mappée vers un composant lucide dans _layout */
  icon: string;
}

// Ordre = ordre d'affichage des onglets sur mobile.
export const MOBILE_MODULES: MobileModule[] = [
  { id: 'housekeeping', routeName: 'housekeeping', route: '/(tabs)/housekeeping', label: 'Ménage', icon: 'bed' },
  { id: 'gouvernante', routeName: 'gouvernante', route: '/(tabs)/gouvernante', label: 'Contrôle', icon: 'clipboard-check' },
  { id: 'maintenance', routeName: 'maintenance', route: '/(tabs)/maintenance', label: 'Maintenance', icon: 'wrench' },
  { id: 'breakfast', routeName: 'breakfast', route: '/(tabs)/breakfast', label: 'Petit-déj', icon: 'coffee' },
  { id: 'direction', routeName: 'direction', route: '/(tabs)/direction', label: 'Direction', icon: 'bar-chart' },
];

export interface RoleDefinition {
  /** Identifiant : valeur de AdminUserRole pour les builtin, ou `custom_xxx` */
  id: string;
  label: string;
  color: string;
  /** true = rôle système non supprimable */
  builtin: boolean;
  /** Modules visibles pour ce rôle (onglets) */
  modules: MobileModuleId[];
  /** Module d'atterrissage après connexion */
  landing: MobileModuleId;
}

// Rôles « terrain » mobiles intégrés.
// (super_admin / support / reception sont gérés côté web Check-in.)
export const BUILTIN_ROLES: RoleDefinition[] = [
  {
    id: 'direction',
    label: 'Direction',
    color: '#1A4D5C',
    builtin: true,
    modules: ['direction', 'housekeeping', 'gouvernante', 'maintenance', 'breakfast'],
    landing: 'direction',
  },
  {
    id: 'gouvernante',
    label: 'Gouvernante',
    color: '#00897B',
    builtin: true,
    modules: ['gouvernante', 'housekeeping'],
    landing: 'gouvernante',
  },
  {
    id: 'femme_de_chambre',
    label: 'Femme de chambre',
    color: '#FB8C00',
    builtin: true,
    modules: ['housekeeping'],
    landing: 'housekeeping',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    color: '#78909C',
    builtin: true,
    modules: ['maintenance'],
    landing: 'maintenance',
  },
  {
    id: 'breakfast',
    label: 'Petit-déjeuner',
    color: '#E53935',
    builtin: true,
    modules: ['breakfast'],
    landing: 'breakfast',
  },
];

// Rôles purement « web » : ne disposent pas de l'app mobile terrain.
// Servent au routage (redirection) et au thème (mode bureau).
export const WEB_ONLY_ROLES: string[] = ['super_admin', 'support', 'reception'];

/** Un rôle utilise-t-il l'app mobile terrain (vs poste web) ? */
export function isMobileRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return !WEB_ONLY_ROLES.includes(role);
}

/** Retrouve la définition d'un rôle dans une liste donnée. */
export function findRole(roles: RoleDefinition[], roleId: string | null | undefined): RoleDefinition | null {
  if (!roleId) return null;
  return roles.find((r) => r.id === roleId) ?? null;
}

/** Le rôle a-t-il accès au module donné ? */
export function roleCanAccess(roles: RoleDefinition[], roleId: string | null | undefined, moduleId: MobileModuleId): boolean {
  const role = findRole(roles, roleId);
  return role ? role.modules.includes(moduleId) : false;
}

/** Module d'atterrissage après connexion (avec repli sûr). */
export function roleLandingModule(roles: RoleDefinition[], roleId: string | null | undefined): MobileModule | null {
  const role = findRole(roles, roleId);
  if (!role) return null;
  const landingId = role.modules.includes(role.landing) ? role.landing : role.modules[0];
  return MOBILE_MODULES.find((m) => m.id === landingId) ?? null;
}
