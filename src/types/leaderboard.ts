export type LeaderboardPeriod = 'week' | 'month' | 'year';

export interface LeaderboardEntry {
  rank:          number;
  userId:        string;
  nickname:      string;
  avatarUrl:     string | null;
  saveCount?:    number;
  isCurrentUser: boolean;
  isBot?:        boolean;
}
