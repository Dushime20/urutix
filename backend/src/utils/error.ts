export function errorMessage(
  error: unknown,
  defaultError = 'Unknown error',
): string {
  let err = defaultError;
  if (typeof error === 'object' && error !== null && 'message' in error)
    err = (error as { message: string })?.message?.toString() ?? defaultError;

  return err;
}
