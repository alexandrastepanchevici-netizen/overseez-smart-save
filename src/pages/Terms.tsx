import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-1">
            <OverseezLogo size={72} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none">Overseez</span>
          </Link>
          <Link to="/register" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-foreground/85 leading-relaxed">
          <section>
            <h2 className="text-lg font-display font-semibold mb-3">1. Price Accuracy</h2>
            <p>Overseez provides AI-generated price comparisons based on available data. We do not guarantee the accuracy of prices displayed. Actual prices may vary depending on the retailer, time of purchase, location, and ongoing promotions. Always verify prices at the point of sale before making a purchase decision.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">2. No Liability</h2>
            <p>Overseez is not responsible for any financial decisions made based on the information provided through our platform. The comparisons, savings estimates, and recommendations are for informational purposes only. Users assume full responsibility for their purchasing decisions.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">3. Offers May Change</h2>
            <p>Promotions, sales, and offers displayed on Overseez are subject to change without notice. Overseez is not affiliated with any retailers, supermarkets, or service providers shown in search results. We aggregate publicly available data to provide price comparisons.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">4. Data Usage</h2>
            <p>Your search queries and savings data are stored securely and used to improve your experience. We do not sell personal data to third parties. Location data is used only to provide relevant nearby results and is not stored permanently. You can delete your account and all associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">5. Subscription</h2>
            <p>Premium features require a paid subscription at £10/month. You can cancel at any time through your account settings. Refunds are handled on a case-by-case basis. Free tier users receive 10 AI questions per 24-hour period, which resets automatically.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">6. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials. Do not share your password with others. Overseez reserves the right to suspend accounts that violate these terms or engage in abusive behaviour.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">7. Intellectual Property</h2>
            <p>All content, design, and technology on the Overseez platform are owned by Overseez and protected by copyright law. You may not reproduce, distribute, or create derivative works from any content without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold mb-3">8. Changes to Terms</h2>
            <p>Overseez reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-4">By creating an account, you agree to these terms.</p>
          <Link to="/register" className="text-sm text-overseez-blue hover:underline">
            ← Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
