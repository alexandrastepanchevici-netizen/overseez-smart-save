import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getCurrencySymbol } from '@/components/CurrencySwitcher';

interface Props {
  totalSaved: number;
  displayCurrency: string;
  streak?: number;
  badgeCount?: number;
}

export default function ShareCard({ totalSaved, displayCurrency, streak = 0, badgeCount = 0 }: Props) {
  const sym = getCurrencySymbol(displayCurrency);

  const handleShare = async () => {
    const lines = [
      `💰 I've saved ${sym}${totalSaved.toFixed(2)} using Overseez!`,
    ];
    if (streak > 1) lines.push(`🔥 ${streak}-day saving streak`);
    if (badgeCount > 0) lines.push(`🏆 ${badgeCount} badge${badgeCount !== 1 ? 's' : ''} earned`);
    lines.push('Find the best prices near you → https://overseez.co');

    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Overseez Savings', text, url: 'https://overseez.co' });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Savings recap copied to clipboard!');
      } catch {
        toast.error('Could not copy to clipboard');
      }
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      <Share2 className="w-4 h-4" />
      Share my savings
    </Button>
  );
}
