import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol, convertCurrency } from '@/components/CurrencySwitcher';
import { Plus, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  currency: string;
  emoji: string;
  progress: number;
}

const EMOJI_PRESETS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '🏖️', '💻'];

export default function GoalCard() {
  const { user, profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');

  const profileCurrency = profile?.currency ?? 'USD';
  const sym = getCurrencySymbol(profileCurrency);

  const loadGoals = useCallback(async () => {
    if (!user) return;

    const { data: goalRows } = await supabase
      .from('savings_goals' as any)
      .select('id, name, target_amount, currency, emoji')
      .eq('user_id', user.id)
      .order('created_at');

    if (!goalRows?.length) { setGoals([]); return; }

    // Aggregate progress per goal from savings_entries
    const { data: entries } = await supabase
      .from('savings_entries')
      .select('goal_id, amount_saved, currency')
      .eq('user_id', user.id)
      .not('goal_id', 'is', null);

    const withProgress: Goal[] = (goalRows as any[]).map(g => {
      const linked = (entries ?? []).filter((e: any) => e.goal_id === g.id);
      const progress = linked.reduce((sum: number, e: any) => {
        return sum + convertCurrency(Number(e.amount_saved), e.currency, g.currency);
      }, 0);
      return { ...g, progress };
    });

    setGoals(withProgress);
  }, [user]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const createGoal = async () => {
    const target = parseFloat(newTarget);
    if (!user || !newName.trim() || isNaN(target) || target <= 0) return;

    const { error } = await supabase.from('savings_goals' as any).insert({
      user_id: user.id,
      name: newName.trim(),
      target_amount: target,
      currency: profileCurrency,
      emoji: newEmoji,
    });

    if (error) { toast.error('Failed to create goal'); return; }

    toast.success('Goal created!');
    setCreating(false);
    setNewName('');
    setNewTarget('');
    setNewEmoji('🎯');
    loadGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('savings_goals' as any).delete().eq('id', id).eq('user_id', user!.id);
    loadGoals();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Savings Goals</h3>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="text-xs text-overseez-blue hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New goal
          </button>
        )}
      </div>

      {goals.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">
          No goals yet — create one and tag savings toward it in the Search page.
        </p>
      )}

      <div className="space-y-4">
        {goals.map(g => {
          const pct = Math.min((g.progress / g.target_amount) * 100, 100);
          const done = pct >= 100;
          return (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{g.emoji} {g.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {sym}{g.progress.toFixed(2)} / {sym}{g.target_amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-muted-foreground/40 hover:text-overseez-red transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-overseez-green' : 'bg-overseez-blue'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {done && (
                <p className="text-xs text-overseez-green mt-1 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Goal reached!</p>
              )}
            </div>
          );
        })}
      </div>

      {creating && (
        <div className="mt-4 border-t border-border pt-4 space-y-3">
          {/* Emoji picker */}
          <div className="flex gap-1.5 flex-wrap">
            {EMOJI_PRESETS.map(e => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${
                  newEmoji === e
                    ? 'bg-overseez-blue/20 border border-overseez-blue/40'
                    : 'bg-muted/40 hover:bg-muted/70'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Goal name (e.g. Holiday fund)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-shrink-0">{sym} Target</span>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={newTarget}
              onChange={e => setNewTarget(e.target.value)}
              className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setCreating(false); setNewName(''); setNewTarget(''); setNewEmoji('🎯'); }}>
              Cancel
            </Button>
            <Button variant="hero" size="sm" onClick={createGoal} disabled={!newName.trim() || !newTarget}>
              Create
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
