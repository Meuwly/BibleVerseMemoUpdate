let installed = false;

const BUILD_FAILURE_PATTERNS = [
  /Unable to resolve module/i,
  /TransformError/i,
  /SyntaxError/i,
  /TypeError/i,
  /ReferenceError/i,
  /Invariant Violation/i,
  /Requiring unknown module/i,
  /Cannot find module/i,
  /while trying to resolve module/i,
];

const ABORT_ERROR_PATTERNS = [
  /aborterror/i,
  /signal is aborted without reason/i,
  /the operation was aborted/i,
  /request aborted/i,
  /operation aborted/i,
  /aborted/i,
];

function isPotentialBuildFailure(error: unknown): boolean {
  const text = error instanceof Error
    ? `${error.name}: ${error.message}`
    : typeof error === 'string'
      ? error
      : JSON.stringify(error);

  return BUILD_FAILURE_PATTERNS.some((pattern) => pattern.test(text));
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const description = describeError(error);
    return `${error.name}: ${description}${error.stack ? `\n${error.stack}` : ''}`;
  }

  if (typeof error === 'string') {
    return error;
  }

  return JSON.stringify(error);
}

function serializeUnknown(error: unknown): string | null {
  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch {
    // Fall through to other strategies.
  }

  return null;
}

function extractCandidateMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Error) {
    return value.message.trim().length > 0 ? value.message : null;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => extractCandidateMessage(entry))
      .filter((entry): entry is string => Boolean(entry));

    return parts.length > 0 ? parts.join(' | ') : null;
  }

  if (value && typeof value === 'object') {
    return extractObjectMessage(value as Record<string, unknown>);
  }

  return null;
}

function extractObjectMessage(error: Record<string, unknown>): string | null {
  const prioritizedKeys = [
    'message',
    'description',
    'reason',
    'details',
    'error_description',
    'msg',
    'error',
  ] as const;

  for (const key of prioritizedKeys) {
    const extracted = extractCandidateMessage(error[key]);
    if (extracted) {
      return extracted;
    }
  }

  const fallbackKeys = [
    'hint',
    'code',
    'status',
    'statusCode',
    'name',
    'type',
  ] as const;

  const fallbackParts = fallbackKeys
    .map((key) => {
      const extracted = extractCandidateMessage(error[key]);
      return extracted ? `${key}: ${extracted}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));

  if (fallbackParts.length > 0) {
    return fallbackParts.join(', ');
  }

  const serialized = serializeUnknown(error);
  if (serialized) {
    return serialized;
  }

  return null;
}

export function isAbortLikeError(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  const candidates = [
    error instanceof Error ? error.name : null,
    error instanceof Error ? error.message : null,
    extractCandidateMessage(error),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return candidates.some((candidate) => ABORT_ERROR_PATTERNS.some((pattern) => pattern.test(candidate)));
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const directMessage = extractCandidateMessage(error.message);
    const isLowSignalMessage = directMessage === '[object Object]'
      || Boolean(directMessage && directMessage.includes('[object Object]'));

    if (directMessage && !isLowSignalMessage) {
      return directMessage;
    }

    if (typeof error.cause !== 'undefined') {
      const causeMessage = extractCandidateMessage(error.cause);
      if (causeMessage && !causeMessage.includes('[object Object]')) {
        return causeMessage;
      }
    }

    const errorLike = error as Error & Record<string, unknown>;
    const extractedMessage = extractObjectMessage(errorLike);
    if (extractedMessage && !extractedMessage.includes('[object Object]')) {
      return extractedMessage;
    }

    if (directMessage) {
      return directMessage;
    }

    return error.name;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const extractedMessage = extractObjectMessage(error as Record<string, unknown>);
    if (extractedMessage) {
      return extractedMessage;
    }
  }

  const serialized = serializeUnknown(error);
  if (serialized) {
    return serialized;
  }

  return String(error);
}

export function isNetworkFetchFailure(error: unknown): boolean {
  const message = describeError(error).toLowerCase();

  return message.includes('failed to fetch')
    || message.includes('network request failed')
    || message.includes('load failed')
    || message.includes('econnrefused')
    || message.includes('err_connection')
    || message.includes('network');
}

export function installGlobalErrorLogging(): void {
  if (installed) {
    return;
  }

  installed = true;

  const globalErrorUtils = (globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
  }).ErrorUtils;

  const previousHandler = globalErrorUtils?.getGlobalHandler?.();

  globalErrorUtils?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
    const tag = isPotentialBuildFailure(error) ? '[BUILD/TRANSFORM]' : '[UNCAUGHT]';
    console.error(`${tag} ${formatError(error)}`);

    previousHandler?.(error, isFatal);
  });

  const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const tag = isPotentialBuildFailure(reason) ? '[BUILD/ASYNC]' : '[UNHANDLED_REJECTION]';
    console.error(`${tag} ${formatError(reason)}`);
  };

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', unhandledRejectionHandler);
  } else {
    const globalWithOnUnhandled = globalThis as typeof globalThis & {
      onunhandledrejection?: ((event: PromiseRejectionEvent) => void) | null;
    };

    const previousUnhandled = globalWithOnUnhandled.onunhandledrejection;

    globalWithOnUnhandled.onunhandledrejection = (event: PromiseRejectionEvent) => {
      unhandledRejectionHandler(event);
      previousUnhandled?.(event);
    };
  }

  console.log('[Diagnostics] Global Metro/Expo error logging installed');
}
