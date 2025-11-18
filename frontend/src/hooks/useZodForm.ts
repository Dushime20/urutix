import {
  useForm,
  type UseFormProps,
  type UseFormReturn,
  type FieldValues,
  type Resolver
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";

/**
 * useZodForm - a custom hook to simplify react-hook-form + zod integration
 * @param schema - Zod schema for form validation
 * @param options - Additional react-hook-form options
 * @returns UseFormReturn instance with proper typing
 */
export function useZodForm<T extends FieldValues = FieldValues>(
  schema: ZodSchema<T, FieldValues>,
  options?: Omit<UseFormProps<T>, "resolver">
): UseFormReturn<T> {
  return useForm<T>({
    ...options,
    resolver: zodResolver(schema) as Resolver<T>,
  });
}
