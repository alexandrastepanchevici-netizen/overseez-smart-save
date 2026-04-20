import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/components/CurrencySwitcher';
import { toast } from 'sonner';
import Mascot from '@/components/Mascot';

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null) return <span className="text-xs text-muted-foreground">—</span>;
  const colours =
    rank === 1
      ? 'bg-yellow-400/20 text-yellow-500'
      : rank === 2
      ? 'bg-slate-400/20 text-slate-400'
      : rank === 3
      ? 'bg-amber-600/20 text-amber-600'
      : 'bg-muted text-muted-foreground';
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colours}`}>
      #{rank}
    </span>
  );
}

function FriendAvatar({ avatarUrl, nickname }: { avatarUrl: string | null; nickname: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-overseez-blue/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
      {avatarUrl ? (
        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-overseez-blue">
          {nickname.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function FriendsList() {
  const { profile } = useAuth();
  const { friends, isLoading } = useFriends();

  const handleShareLink = async () => {
    const nick = profile?.nickname;
    if (!nick) return;
    const link = `https://overseez.co/?ref=${encodeURIComponent(nick)}#/register`;
    const text = `Join me on Overseez — the app that finds you the best prices near you!\n${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Join Overseez', text, url: link }); } catch {}
    } else {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center gap-3">
        <Mascot pose="shrug" size="lg" />
        <div>
          <p className="font-display font-semibold mb-1">No friends yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Share your invite link so friends can join and you'll both appear here.
          </p>
        </div>
        <button
          onClick={handleShareLink}
          className="flex items-center gap-2 bg-overseez-blue/10 border border-overseez-blue/30 text-overseez-blue text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-overseez-blue/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite a Friend
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {friends.map(friend => {
        const sym = getCurrencySymbol(friend.currency);
        return (
          <div
            key={friend.friendId}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
          >
            <FriendAvatar avatarUrl={friend.avatarUrl} nickname={friend.nickname} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">@{friend.nickname}</p>
              <p className="text-xs text-muted-foreground">
                {friend.weeklySaved.toLocaleString()} saves this week
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <RankBadge rank={friend.weeklyRank} />
              <span className="text-xs font-medium text-foreground">
                {sym}{friend.totalSaved.toLocaleString()} saved
              </span>
            </div>
          </div>
        );
      })}

      <button
        onClick={handleShareLink}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-overseez-blue/10 border border-overseez-blue/20 text-overseez-blue text-sm font-medium px-4 py-3 rounded-xl hover:bg-overseez-blue/20 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invite more friends
      </button>
    </div>
  );
}
