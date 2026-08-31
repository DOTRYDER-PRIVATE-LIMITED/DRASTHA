import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseStatus {
    connected: boolean;
    provider: 'supabase' | 'in_memory_fallback';
    url?: string;
    lastError?: string | null;
    timestamp: string;
}

let supabaseInstance: SupabaseClient | null = null;
let lastDbError: string | null = null;
let isDbOperational = false;

export function getSupabaseClient(): SupabaseClient | null {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    try {
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        isDbOperational = true;
        return supabaseInstance;
    } catch (err: any) {
        lastDbError = err.message || 'Failed to initialize Supabase client';
        console.warn('[Database] Supabase initialization failed, continuing with fallback:', lastDbError);
        return null;
    }
}

export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
    const client = getSupabaseClient();
    const supabaseUrl = process.env.SUPABASE_URL?.trim();

    if (!client) {
        return {
            connected: false,
            provider: 'in_memory_fallback',
            lastError: lastDbError || (supabaseUrl ? 'Invalid credentials' : 'SUPABASE_URL not configured in environment (operating in local resilient cache mode)'),
            timestamp: new Date().toISOString()
        };
    }

    try {
        const { error } = await client.from('devices').select('id').limit(1);
        if (error) {
            isDbOperational = false;
            lastDbError = error.message;
            return {
                connected: false,
                provider: 'supabase',
                url: supabaseUrl,
                lastError: error.message,
                timestamp: new Date().toISOString()
            };
        }
        isDbOperational = true;
        lastDbError = null;
        return {
            connected: true,
            provider: 'supabase',
            url: supabaseUrl,
            lastError: null,
            timestamp: new Date().toISOString()
        };
    } catch (err: any) {
        isDbOperational = false;
        lastDbError = err.message || 'Connection check failed';
        return {
            connected: false,
            provider: 'supabase',
            url: supabaseUrl,
            lastError: lastDbError,
            timestamp: new Date().toISOString()
        };
    }
}

export function isDatabaseConnected(): boolean {
    return isDbOperational && supabaseInstance !== null;
}
