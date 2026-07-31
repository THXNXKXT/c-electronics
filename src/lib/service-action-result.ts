export const SERVICE_ACTION_GENERIC_ERROR =
  "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

export class ServiceUserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUserFacingError";
  }
}

export type ServiceActionFailure = { ok: false; error: string };

export type ServiceActionResult<T extends object = Record<never, never>> =
  | ({ ok: true } & T)
  | ServiceActionFailure;

export function toServiceActionFailure(
  error: unknown,
  logUnexpected: (error: unknown) => void = console.error,
): ServiceActionFailure {
  if (error instanceof ServiceUserFacingError) {
    return { ok: false, error: error.message };
  }

  logUnexpected(error);
  return { ok: false, error: SERVICE_ACTION_GENERIC_ERROR };
}

export async function runAuthorizedServiceAction<T extends object>(
  authorize: () => Promise<unknown>,
  operation: () => Promise<T>,
  logUnexpected?: (error: unknown) => void,
): Promise<ServiceActionResult<T>> {
  await authorize();
  try {
    return { ok: true, ...(await operation()) };
  } catch (error) {
    return toServiceActionFailure(error, logUnexpected);
  }
}

export function unwrapServiceActionResult<T extends object>(
  result: ServiceActionResult<T>,
): T {
  if (!result.ok) throw new ServiceUserFacingError(result.error);
  const data = { ...result } as Record<string, unknown>;
  delete data.ok;
  return data as T;
}

export function toSafeServiceClientError(error: unknown): string {
  return error instanceof ServiceUserFacingError
    ? error.message
    : SERVICE_ACTION_GENERIC_ERROR;
}
