import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FriendEntry {
  friendId: string;
  nickname: string;
  avatarUrl: string | null;
  weeklyRank: number | null;
  weeklySaved: number;
  totalSaved: number;
  currency: string;
}

async function fetchFriends(userId: string): Promise<FriendEntry[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      profiles!friendships_friend_id_fkey (
        nickname,
        avatar_url,
        weekly_rank,
        weekly_saved,
        total_saved,
        currency
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const p = row.profiles;
    return {
      friendId: row.friend_id,
      nickname: p?.nickname ?? 'Unknown',
      avatarUrl: p?.avatar_url ?? null,
      weeklyRank: p?.weekly_rank ?? null,
      weeklySaved: p?.weekly_saved ?? 0,
      totalSaved: p?.total_saved ?? 0,
      currency: p?.currency ?? 'USD',
    };
  });
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: user.id, friend_id: friendId } as any);
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  const friendIds = new Set((query.data ?? []).map(f => f.friendId));

  return {
    friends: query.data ?? [],
    isLoading: query.isLoading,
    friendIds,
    addFriend: addFriendMutation.mutate,
  };
}
