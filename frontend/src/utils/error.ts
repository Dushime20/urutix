import axios from "axios";

export function errorMessage(
  error: unknown,
  defaultError = "Unknown error"
): string {
  let err = defaultError;

  if (axios.isAxiosError(error) && error?.response?.data?.message) {
    err = error.response.data.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    err = (error as { message: string })?.message?.toString() ?? defaultError;
  }

  return err;
}
