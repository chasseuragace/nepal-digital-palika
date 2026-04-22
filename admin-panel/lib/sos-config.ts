/**
 * SOS Module Dependency Injection Configuration
 * Factory for creating and managing datasource instances
 */

import type { ISOSDatasource } from './sos-datasource';
import { SupabaseSOSDatasource } from './supabase-sos-datasource';
import { FakeSOSDatasource } from './fake-sos-datasource';
import { supabaseClient } from './supabase';

let datasourceInstance: ISOSDatasource | null = null;

/**
 * Create datasource based on environment variable
 * NEXT_PUBLIC_USE_FAKE_DATASOURCES=true → Fake (development)
 * NEXT_PUBLIC_USE_FAKE_DATASOURCES=false → Supabase (production)
 */
export function createSOSDatasource(): ISOSDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true';

  if (useFake) {
    console.log('[SOSDatasource] Using FAKE datasource (development mode)');
    return new FakeSOSDatasource();
  }

  console.log('[SOSDatasource] Using SUPABASE datasource (production mode)');
  return new SupabaseSOSDatasource(supabaseClient);
}

/**
 * Get singleton instance with lazy initialization
 */
export function getSOSDatasource(): ISOSDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createSOSDatasource();
  }
  return datasourceInstance;
}

/**
 * Override datasource (for testing)
 */
export function setSOSDatasource(datasource: ISOSDatasource): void {
  datasourceInstance = datasource;
  console.log('[SOSDatasource] Datasource overridden (testing mode)');
}

/**
 * Reset to null (for testing)
 */
export function resetSOSDatasource(): void {
  datasourceInstance = null;
  console.log('[SOSDatasource] Datasource reset');
}
