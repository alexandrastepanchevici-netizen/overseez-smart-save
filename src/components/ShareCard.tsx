import React, { useRef } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getCurrencySymbol } from '@/components/CurrencySwitcher';
import ShareableMonthCard from '@/components/ShareableMonthCard';
import html2canvas from 'html2canvas';

interface MonthlyStats {
  monthLabel: string;
  totalSaved: number;
  activeDays: number;
  savesLogged: number;
  topStore: string;
}

interface Props {
  displayCurrency: string;
  monthlyStats: MonthlyStats;
}

export default function ShareCard({ displayCurrency, monthlyStats }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sym = getCurrencySymbol(displayCurrency);

  const formattedTotal = `${sym}${monthlyStats.totalSaved.toFixed(2)}`;

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas capture failed');

      const file = new File([blob], 'overseez-savings.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My Overseez Savings',
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback: share without file (text only)
        await navigator.share({
          title: 'My Overseez Savings',
          text: `I saved ${formattedTotal} this month using Overseez!\n${monthlyStats.activeDays} active days · ${monthlyStats.savesLogged} saves logged · Top store: ${monthlyStats.topStore}\nhttps://overseez.co`,
        });
      } else {
        // Desktop fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'overseez-savings.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Savings card downloaded!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Could not share savings card');
      }
    }
  };

  return (
    <>
      <ShareableMonthCard
        ref={cardRef}
        monthLabel={monthlyStats.monthLabel}
        totalSaved={formattedTotal}
        activeDays={monthlyStats.activeDays}
        savesLogged={monthlyStats.savesLogged}
        topStore={monthlyStats.topStore}
      />
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
        <Share2 className="w-4 h-4" />
        Share my savings
      </Button>
    </>
  );
}
