export type LeaderboardPeriod = 'week' | 'month' | 'year';
export type LeaderboardType   = 'searches' | 'savings';

export interface LeaderboardEntry {
  rank:          number;
  userId:        string;
  nickname:      string;
  avatarUrl:     string | null;
  searchCount?:  number;
  amountSaved?:  number;
  currency?:     string;
  isCurrentUser: boolean;
  isBot?:        boolean;
}
