import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
        },
      })
    : null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export async function invokeSupabaseFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    const parsed = await parseFunctionError(error);
    const nextError = new Error(parsed.message || error.message || `Failed to invoke ${functionName}`) as Error & {
      code?: string;
    };
    nextError.code = parsed.code;
    throw nextError;
  }

  return data as TResponse;
}

async function parseFunctionError(error: any) {
  const context = error?.context;

  if (!context) {
    return {
      code: undefined,
      message: error?.message,
    };
  }

  try {
    if (typeof context.json === 'function') {
      const payload = await context.json();
      return {
        code: payload?.error,
        message: payload?.message || error?.message,
      };
    }

    if (typeof context.text === 'function') {
      const text = await context.text();
      const payload = JSON.parse(text);
      return {
        code: payload?.error,
        message: payload?.message || error?.message,
      };
    }
  } catch {
    return {
      code: undefined,
      message: error?.message,
    };
  }

  return {
    code: undefined,
    message: error?.message,
  };
}
