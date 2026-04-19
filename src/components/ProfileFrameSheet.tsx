import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Medal, Award, Zap, Camera, Trash2, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ProfileAvatar from '@/components/ProfileAvatar';

interface FrameInfo {
  rank:       number;
  icon:       React.ElementType;
  iconColor:  string;
  ringClass:  string;
  label:      string;
  unlockDesc: string;
  bonusDesc:  string;
}

const FRAMES: FrameInfo[] = [
  {
    rank:       1,
    icon:       Crown,
    iconColor:  'text-overseez-gold',
    ringClass:  'ring-2 ring-overseez-gold shadow-[0_0_14px_3px_hsl(43_96%_56%_/_0.65)]',
    label:      'Gold Frame',
    unlockDesc: 'Finish #1 on the weekly leaderboard',
    bonusDesc:  '12 hours off your next search reset',
  },
  {
    rank:       2,
    icon:       Medal,
    iconColor:  'text-slate-300',
    ringClass:  'ring-2 ring-slate-300 shadow-[0_0_10px_2px_rgba(203,213,225,0.55)]',
    label:      'Silver Frame',
    unlockDesc: 'Finish #2 on the weekly leaderboard',
    bonusDesc:  '8 hours off your next search reset',
  },
  {
    rank:       3,
    icon:       Award,
    iconColor:  'text-amber-600',
    ringClass:  'ring-2 ring-amber-600 shadow-[0_0_10px_2px_rgba(180,83,9,0.5)]',
    label:      'Bronze Frame',
    unlockDesc: 'Finish #3 on the weekly leaderboard',
    bonusDesc:  '6 hours off your next search reset',
  },
];

interface ProfileFrameSheetProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  weeklyRank:    number | null;
  avatarUrl:     string | null;
  nickname:      string;
  onChangePhoto: () => void;
  onRemovePhoto?: () => void;
}

export default function ProfileFrameSheet({
  open,
  onOpenChange,
  weeklyRank,
  avatarUrl,
  nickname,
  onChangePhoto,
  onRemovePhoto,
}: ProfileFrameSheetProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg">Profile Photo</SheetTitle>
        </SheetHeader>

        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <ProfileAvatar
            size="lg"
            avatarUrl={avatarUrl}
            nickname={nickname}
            weeklyRank={weeklyRank}
          />
          <p className="text-sm text-muted-foreground">@{nickname}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={onChangePhoto}
            className="flex-1 flex items-center justify-center gap-2 bg-overseez-blue text-white font-semibold py-3 rounded-xl"
          >
            <Camera className="w-4 h-4" />
            Change Photo
          </button>
          {avatarUrl && onRemovePhoto && (
            <button
              onClick={onRemovePhoto}
              className="flex items-center justify-center gap-2 border border-border text-muted-foreground px-4 py-3 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Profile frames section */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
            Profile Frames
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Earn a frame by finishing in the top 3 of the weekly leaderboard. Frames reset every Monday at midnight.
          </p>

          <div className="flex flex-col gap-3">
            {FRAMES.map(frame => {
              const isActive = weeklyRank === frame.rank;
              const Icon = frame.icon;

              return (
                <div
                  key={frame.rank}
                  className={`flex items-center gap-4 rounded-xl p-4 border transition-colors ${
                    isActive
                      ? 'bg-overseez-gold/5 border-overseez-gold/30'
                      : 'bg-card border-border'
                  }`}
                >
                  {/* Mini avatar preview with frame */}
                  <div className={`w-12 h-12 rounded-full bg-overseez-blue/20 flex items-center justify-center flex-shrink-0 ${frame.ringClass}`}>
                    <Icon className={`w-6 h-6 ${frame.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{frame.label}</p>
                      {isActive && (
                        <span className="text-[10px] font-bold text-overseez-gold bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-2 py-0.5">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{frame.unlockDesc}</p>
                    <p className="text-xs text-overseez-green flex items-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3" />
                      {frame.bonusDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Link to leaderboard */}
          <button
            onClick={() => { onOpenChange(false); navigate('/leaderboard'); }}
            className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-overseez-blue py-2"
          >
            View Leaderboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
