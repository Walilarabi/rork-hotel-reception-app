import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  BUILTIN_ROLES,
  MOBILE_MODULES,
  type MobileModuleId,
  type RoleDefinition,
  findRole,
  roleCanAccess,
  roleLandingModule,
} from '@/constants/roles';

const STORAGE_KEY = 'flowtym_custom_roles_v1';

// Persistance locale des rôles personnalisés.
// TODO(checkin): remplacer par les tables Supabase `roles` / `role_modules`
// du backend Flowtym Check-in une fois la session connectée.
async function loadCustomRoles(): Promise<RoleDefinition[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RoleDefinition[];
    return Array.isArray(parsed) ? parsed.filter((r) => !r.builtin) : [];
  } catch (e) {
    console.warn('[RolesProvider] Failed to load custom roles', e);
    return [];
  }
}

async function persistCustomRoles(roles: RoleDefinition[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(roles.filter((r) => !r.builtin)));
  } catch (e) {
    console.warn('[RolesProvider] Failed to persist custom roles', e);
  }
}

export interface CustomRoleInput {
  label: string;
  color: string;
  modules: MobileModuleId[];
  landing: MobileModuleId;
}

export const [RolesProvider, useRoles] = createContextHook(() => {
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>([]);

  const customRolesQuery = useQuery({
    queryKey: ['custom-roles'],
    queryFn: loadCustomRoles,
  });

  useEffect(() => {
    if (customRolesQuery.data) {
      setCustomRoles(customRolesQuery.data);
    }
  }, [customRolesQuery.data]);

  // Liste complète : builtin (système) + personnalisés.
  const roles = useMemo<RoleDefinition[]>(
    () => [...BUILTIN_ROLES, ...customRoles],
    [customRoles],
  );

  const addRole = useCallback((input: CustomRoleInput): RoleDefinition => {
    const newRole: RoleDefinition = {
      id: `custom_${Date.now()}`,
      label: input.label.trim(),
      color: input.color,
      builtin: false,
      modules: input.modules.length > 0 ? input.modules : [MOBILE_MODULES[0].id],
      landing: input.modules.includes(input.landing) ? input.landing : input.modules[0] ?? MOBILE_MODULES[0].id,
    };
    setCustomRoles((prev) => {
      const next = [...prev, newRole];
      void persistCustomRoles(next);
      return next;
    });
    return newRole;
  }, []);

  const updateRole = useCallback((id: string, patch: Partial<CustomRoleInput>) => {
    setCustomRoles((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id || r.builtin) return r;
        const modules = patch.modules ?? r.modules;
        const landing = patch.landing ?? r.landing;
        return {
          ...r,
          label: patch.label?.trim() ?? r.label,
          color: patch.color ?? r.color,
          modules,
          landing: modules.includes(landing) ? landing : modules[0] ?? r.landing,
        };
      });
      void persistCustomRoles(next);
      return next;
    });
  }, []);

  const deleteRole = useCallback((id: string) => {
    setCustomRoles((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target || target.builtin) return prev;
      const next = prev.filter((r) => r.id !== id);
      void persistCustomRoles(next);
      return next;
    });
  }, []);

  const getRole = useCallback(
    (roleId: string | null | undefined) => findRole(roles, roleId),
    [roles],
  );

  const canAccess = useCallback(
    (roleId: string | null | undefined, moduleId: MobileModuleId) => roleCanAccess(roles, roleId, moduleId),
    [roles],
  );

  const getLanding = useCallback(
    (roleId: string | null | undefined) => roleLandingModule(roles, roleId),
    [roles],
  );

  return useMemo(
    () => ({
      roles,
      customRoles,
      isReady: !customRolesQuery.isLoading,
      addRole,
      updateRole,
      deleteRole,
      getRole,
      canAccess,
      getLanding,
    }),
    [roles, customRoles, customRolesQuery.isLoading, addRole, updateRole, deleteRole, getRole, canAccess, getLanding],
  );
});
