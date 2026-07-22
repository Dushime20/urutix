import axios from "axios";

export function errorMessage(
  error: unknown,
  defaultError = "Unknown error"
): string {
  let err = defaultError;

  if (axios.isAxiosError(error) && error?.response?.data?.message) {
    const msg = error.response.data.message;
    err = Array.isArray(msg) ? msg.join(", ") : msg;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    err = (error as { message: string })?.message?.toString() ?? defaultError;
  }

  return err;
}
