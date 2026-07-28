const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

type RequiredEnvKey = (typeof requiredEnv)[number]

function readEnv(key: RequiredEnvKey): () => string {
  return () => {
    const value = import.meta.env[key]

    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(
        `Missing environment variable "${key}". Copy .env.example to .env.local and fill it in.`,
      )
    }

    return value
  }
}

export const env = {
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
}
