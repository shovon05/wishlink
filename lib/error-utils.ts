export interface AppErrorInfo {
  title: string
  message: string
  code?: string
  hint?: string
  details?: string
  isDatabaseError: boolean
  suggestion?: string
}

/**
 * Universal error parser for Supabase database errors, network failures,
 * authentication errors, and application runtime exceptions.
 * Ensures the user and developer can immediately understand and diagnose any issue.
 */
export function parseAppError(error: unknown, fallbackMessage = 'An unexpected issue occurred.'): AppErrorInfo {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: fallbackMessage,
      isDatabaseError: false,
    }
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    const code = (err.code || err.statusCode || err.status || undefined) as string | number | undefined
    const rawMessage = (err.message || err.error_description || (typeof err.toString === 'function' ? err.toString() : '')) as string
    const hint = (err.hint as string | undefined) || undefined
    const details = (err.details as string | undefined) || undefined

    const lowerMsg = rawMessage.toLowerCase()

    // 1. Supabase Row Level Security (RLS) & Permissions
    if (code === '42501' || lowerMsg.includes('row-level security') || lowerMsg.includes('permission denied')) {
      return {
        title: 'Database Permission Denied (RLS)',
        message: 'Your current session does not have permission to execute this operation on the database. This usually means you need to sign in again or your user role lacks ownership of this record.',
        code: String(code || '42501'),
        hint: hint || 'Check Supabase table Row-Level Security policies (RLS).',
        details: details || rawMessage,
        isDatabaseError: true,
        suggestion: 'Try signing out and signing back in to refresh your authentication tokens.',
      }
    }

    // 2. Duplicate Record / Unique Constraint Violation
    if (code === '23505' || lowerMsg.includes('unique constraint') || lowerMsg.includes('already exists')) {
      return {
        title: 'Duplicate Record Conflict',
        message: 'A record with this information already exists in the database (e.g. username taken, item already registered, or duplicate key).',
        code: '23505',
        hint: hint || 'Unique database index constraint triggered.',
        details: details || rawMessage,
        isDatabaseError: true,
        suggestion: 'Choose a different title, handle, or identifier and try again.',
      }
    }

    // 3. Foreign Key / Record Not Found
    if (code === '23503' || lowerMsg.includes('foreign key constraint')) {
      return {
        title: 'Referenced Record Not Found',
        message: 'The item, user account, or address referenced in this request is not available in the database.',
        code: '23503',
        hint: hint || 'Foreign key reference failed.',
        details: details || rawMessage,
        isDatabaseError: true,
        suggestion: 'Refresh the page to make sure you are working with the latest data.',
      }
    }

    // 4. Supabase Single Object Query Failed
    if (code === 'PGRST116') {
      return {
        title: 'Record Not Found',
        message: 'The requested profile, item, or reservation could not be found.',
        code: 'PGRST116',
        hint: 'Query expected a single row but returned 0 rows.',
        details: details || rawMessage,
        isDatabaseError: true,
        suggestion: 'Verify the link or ID you are trying to access.',
      }
    }

    // 5. Network / Offline / Connection Timeout
    if (
      lowerMsg.includes('failed to fetch') ||
      lowerMsg.includes('networkerror') ||
      lowerMsg.includes('timeout') ||
      lowerMsg.includes('econnrefused')
    ) {
      return {
        title: 'Database Connection Timeout',
        message: 'Unable to reach the Supabase cloud database server. Please check your internet connection or verify your project status.',
        code: code ? String(code) : 'NETWORK_OFFLINE',
        hint: 'Request to https://*.supabase.co failed.',
        details: rawMessage,
        isDatabaseError: true,
        suggestion: 'Check your internet connection and verify that your Supabase project is active.',
      }
    }

    // 6. Supabase Missing Key / Config Error
    if (lowerMsg.includes('supabasekey is required') || lowerMsg.includes('supabaseurl is required')) {
      return {
        title: 'Supabase Configuration Missing',
        message: 'The Supabase API URL or Anon Key is missing from the environment variables.',
        code: 'CONFIG_MISSING',
        hint: 'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
        details: rawMessage,
        isDatabaseError: true,
        suggestion: 'Check your environment variables in Vercel or your local .env file.',
      }
    }

    // 7. Reservation concurrency / Gift lock
    if (lowerMsg.includes('no longer available') || lowerMsg.includes('already reserved')) {
      return {
        title: 'Item Already Claimed',
        message: 'Another gifter has reserved this item moments ago to prevent double-gifting.',
        code: 'RESERVATION_LOCKED',
        details: rawMessage,
        isDatabaseError: false,
        suggestion: 'Please pick another lovely item from this registry.',
      }
    }

    // 8. Authentication Errors
    if (lowerMsg.includes('invalid login credentials')) {
      return {
        title: 'Authentication Failed',
        message: 'The email or password you entered is incorrect.',
        code: 'AUTH_INVALID_CREDENTIALS',
        details: rawMessage,
        isDatabaseError: false,
        suggestion: 'Check your email spelling or use password reset.',
      }
    }

    if (lowerMsg.includes('email not confirmed')) {
      return {
        title: 'Email Confirmation Required',
        message: 'Your account requires email verification before signing in. Please check your email inbox.',
        code: 'AUTH_EMAIL_UNCONFIRMED',
        details: rawMessage,
        isDatabaseError: false,
        suggestion: 'Click the verification link sent to your email address.',
      }
    }

    // Generic object with message
    if (rawMessage) {
      const isDb = Boolean(
        code &&
          (String(code).startsWith('23') ||
            String(code).startsWith('42') ||
            String(code).startsWith('PGRST') ||
            String(code).startsWith('22'))
      )
      return {
        title: isDb ? `Database Error (${code})` : 'Operation Notice',
        message: rawMessage,
        code: code ? String(code) : undefined,
        hint,
        details,
        isDatabaseError: isDb,
      }
    }
  }

  if (typeof error === 'string') {
    return {
      title: 'Notice',
      message: error,
      isDatabaseError: false,
    }
  }

  return {
    title: 'Unexpected Issue',
    message: fallbackMessage,
    isDatabaseError: false,
  }
}
