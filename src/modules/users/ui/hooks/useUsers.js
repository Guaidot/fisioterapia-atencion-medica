import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContainer } from '../../../../app/container.jsx';

export function useUsers() {
  const container = useContainer();
  const useCases = container.getUserUseCases();

  return useQuery({
    queryKey: ['users'],
    queryFn: () => useCases.list.execute(),
  });
}

export function useMyProfile() {
  const container = useContainer();
  const useCases = container.getUserUseCases();

  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => useCases.myProfile.execute(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getUserUseCases();

  return useMutation({
    mutationFn: (input) => useCases.create.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserRole() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getUserUseCases();

  return useMutation({
    mutationFn: ({ id, role }) => useCases.updateRole.execute(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}

export function useDeactivateUser() {
  const container = useContainer();
  const queryClient = useQueryClient();
  const useCases = container.getUserUseCases();

  return useMutation({
    mutationFn: (id) => useCases.deactivate.execute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useSendUserPasswordReset() {
  const container = useContainer();
  const useCases = container.getUserUseCases();

  return useMutation({
    mutationFn: (email) => useCases.sendPasswordReset.execute(email),
  });
}