import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol, normalizeCurrencyCode } from '@/components/CurrencySwitcher';
import { MapPin, ChevronLeft, Trash2, ShoppingBag, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useTranslation } from 'react-i18next';
import { useXP, XP_EVENTS } from '@/hooks/useXP';
import { useStreak } from '@/hooks/useStreak';

interface SavingListItem {
  id: string;
  user_id: string;
  store_name: string;
  average_price: number | null;
  displayed_price: number | null;
  currency: string;
  search_query: string | null;
  city: string | null;
  expires_at: string;
  created_at: string;
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  return 'Less than 1 hour left';
}

const QUICK_SEARCHES = [
  { label: '🥛 Milk', q: 'Milk' },
  { label: '⛽ Petrol', q: 'Petrol & fuel stations' },
  { label: '☕ Coffee', q: 'Coffee shops & cafés' },
  { label: '🍞 Bread', q: 'Bread & bakery' },
];

export default function SavingListPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addXP } = useXP();
  const { recordActivity } = useStreak();

  const profileCurrency = normalizeCurrencyCode(profile?.currency || 'USD');
  const [displayCurrency, setDisplayCurrency] = useState(
    () => localStorage.getItem('overseez_display_currency') || profileCurrency
  );
  const sym = getCurrencySymbol(displayCurrency);

  const [items, setItems] = useState<SavingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [spendModal, setSpendModal] = useState<{
    open: boolean;
    item: SavingListItem | null;
  }>({ open: false, item: null });
  const [spendInput, setSpendInput] = useState('');
  const [userGoals, setUserGoals] = useState<{ id: string; name: string; emoji: string }[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('saving_list_items' as any)
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as SavingListItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  // Load goals when spend modal opens
  useEffect(() => {
    if (!spendModal.open || !user) return;
    setSelectedGoalId(null);
    supabase
      .from('savings_goals' as any)
      .select('id, name, emoji')
      .eq('user_id', user.id)
      .order('created_at')
      .then(({ data }) => setUserGoals((data as any[]) ?? []));
  }, [spendModal.open, user]);

  const openSpendModal = (item: SavingListItem) => {
    setSpendModal({ open: true, item });
    const prefilledAmount = item.displayed_price != null
      ? convertCurrency(item.displayed_price, item.currency || profileCurrency, displayCurrency).toFixed(2)
      : '';
    setSpendInput(prefilledAmount);
  };

  const logSaving = async () => {
    if (!spendModal.item || !user) return;
    const spent = parseFloat(spendInput);
    if (isNaN(spent) || spent < 0) return;

    const avgVal = spendModal.item.average_price != null
      ? convertCurrency(spendModal.item.average_price, spendModal.item.currency || profileCurrency, displayCurrency)
      : spent;
    const saved = avgVal - spent;

    const { data: entryData, error: insertError } = await supabase
      .from('savings_entries')
      .insert({
        user_id: user.id,
        store_name: spendModal.item.store_name,
        amount_saved: Math.max(0, saved),
        amount_spent: spent,
        average_price: avgVal,
        currency: displayCurrency,
        search_query: spendModal.item.search_query,
        ...(selectedGoalId ? { goal_id: selectedGoalId } : {}),
      } as any)
      .select('id')
      .single();

    if (insertError) {
      toast.error(`Failed to log saving: ${insertError.message}`);
      return;
    }

    if (saved > 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('total_saved')
        .eq('user_id', user.id)
        .single();
      if (prof) {
        const savedInProfile = convertCurrency(Math.max(0, saved), displayCurrency, profileCurrency);
        await supabase
          .from('profiles')
          .update({ total_saved: Number(prof.total_saved) + savedInProfile })
          .eq('user_id', user.id);
      }
      addXP(XP_EVENTS.SAVE);
      toast.success(`You saved ${sym}${saved.toFixed(2)}!`);
    } else {
      toast.info('Logged!');
    }

    // Remove from saving list
    await supabase
      .from('saving_list_items' as any)
      .delete()
      .eq('id', spendModal.item.id);

    setItems(prev => prev.filter(i => i.id !== spendModal.item!.id));
    setSpendModal({ open: false, item: null });
    setSpendInput('');
    setSelectedGoalId(null);

    await recordActivity();
  };

  const removeItem = async (id: string) => {
    await supabase.from('saving_list_items' as any).delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent pb-20 md:pb-0">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative pb-20 md:pb-0">
      <AppNav />

      {/* Header */}
      <div className="sticky top-14 z-40 border-b border-border bg-overseez-mid px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-semibold text-base">{t('savingList.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('savingList.subtitle')}</p>
            </div>
          </div>
          <CurrencySwitcher value={displayCurrency} onChange={(c) => { setDisplayCurrency(c); localStorage.setItem('overseez_display_currency', c); }} compact />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-overseez-blue/10 border border-overseez-blue/20 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-overseez-blue/60" />
            </div>
            <h2 className="font-display font-semibold text-lg mb-1">{t('savingList.empty')}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{t('savingList.emptyPrompt')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_SEARCHES.map(s => (
                <button
                  key={s.q}
                  onClick={() => navigate('/search', { state: { prefillQuery: s.q } })}
                  className="text-sm font-medium bg-muted/40 border border-border rounded-full px-4 py-2 hover:bg-muted/70 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up">
            {items.map(item => {
              const mapsUrl = item.city
                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.store_name + ' ' + item.city)}&travelmode=walking`
                : `https://www.google.com/maps/search/${encodeURIComponent(item.store_name)}`;
              const displayedPrice = item.displayed_price != null
                ? convertCurrency(item.displayed_price, item.currency || profileCurrency, displayCurrency)
                : null;
              const timeLeft = formatTimeLeft(item.expires_at);
              const isExpiringSoon = new Date(item.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.store_name}</p>
                      {item.city && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.city}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${
                          isExpiringSoon
                            ? 'text-overseez-red bg-overseez-red/10 border-overseez-red/25'
                            : 'text-muted-foreground bg-muted/40 border-border'
                        }`}>
                          {timeLeft}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {displayedPrice != null && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold">{sym}{displayedPrice.toFixed(2)}</p>
                        <p className="text-[11px] text-muted-foreground">est. price</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openExternalUrl(mapsUrl)}
                        className="text-xs text-overseez-blue hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Get Directions
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-overseez-red transition-colors"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => openSpendModal(item)}
                      className="text-sm font-semibold bg-overseez-green/20 border border-overseez-green/40 text-overseez-green rounded-lg px-4 py-1.5 hover:bg-overseez-green/30 transition-colors active:scale-95 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" /> {t('savingList.iSavedHere')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spend Modal */}
      {spendModal.open && spendModal.item && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setSpendModal({ open: false, item: null }); setSelectedGoalId(null); }}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold mb-1">{t('search.spendTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('search.spendDesc', { name: spendModal.item.store_name })}
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={spendInput}
              onChange={e => setSpendInput(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-foreground/30 mb-3"
            />
            {userGoals.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1.5">Count toward a goal? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {userGoals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoalId(selectedGoalId === g.id ? null : g.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedGoalId === g.id
                          ? 'bg-overseez-blue/20 border-overseez-blue/50 text-overseez-blue font-medium'
                          : 'bg-muted/40 border-border text-foreground/70 hover:bg-muted/70'
                      }`}
                    >
                      {g.emoji} {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSpendModal({ open: false, item: null }); setSelectedGoalId(null); }}
              >
                {t('search.cancel')}
              </Button>
              <Button variant="hero" size="sm" onClick={logSaving}>
                {t('search.logSaving')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
