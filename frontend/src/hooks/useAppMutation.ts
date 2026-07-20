import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { QueryKeyPrefix } from '../lib/queryKeys';
import { queryClient } from '../lib/queryClient';

type AppMutationOptions<TData, TError, TVariables, TContext> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> & {
  /** Extra query keys to invalidate on success (in addition to axios auto-sync) */
  invalidateKeys?: QueryKeyPrefix[];
};

/**
 * Thin wrapper around useMutation that supports explicit invalidation.
 * Most mutations through the shared axios instance are auto-synced via mutationSync;
 * use invalidateKeys for component-specific or extra cache updates.
 */
export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: AppMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { invalidateKeys, onSuccess, ...rest } = options;

  return useMutation({
    ...rest,
    onSuccess: async (data, variables, context) => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
      await onSuccess?.(data, variables, context);
    },
  });
}
