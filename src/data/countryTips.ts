export const COUNTRY_TIPS: Record<string, string[]> = {
  GB: [
    'Tesco Clubcard gives up to 10% off every week — scan at the till, no cost to join.',
    'Most universities offer NUS/TOTUM cards for student discounts at 100s of shops.',
    'Lidl and Aldi are usually 20–30% cheaper than Tesco or Sainsbury\'s for weekly shops.',
  ],
  AU: [
    'Woolworths Everyday Rewards and Coles Flybuys points add up fast — both are free to join.',
    'Student Edge and UNiDAYS unlock discounts on food, tech, clothing and more.',
    'Aldi and Coles Budget range are significantly cheaper for staples like rice, pasta, and tinned goods.',
  ],
  US: [
    'Most stores price-match competitors — just show them the lower price on your phone.',
    'Amazon Prime Student is 50% off and includes Whole Foods discounts.',
    'Apps like Flipp and Ibotta show local grocery deals and cash-back offers each week.',
  ],
  CA: [
    'PC Optimum (Loblaws/Shoppers) is one of the best grocery loyalty programs — sign up free.',
    'Student ID unlocks discounts at many Canadian retailers including Cineplex and H&M.',
    'No Frills and Food Basics are the cheapest grocery options in most cities.',
  ],
  DE: [
    'Lidl and Aldi are the cheapest for weekly shops — no loyalty card needed.',
    'Studentenwerk offers subsidised canteen (Mensa) meals for under €3 with a student ID.',
    'Deutschlandticket (€29/month) covers all local public transport — big savings on commuting.',
  ],
  NL: [
    'Albert Heijn Bonus Card gives weekly personalised discounts — free to get.',
    'OV-chipkaart with student travel product gives free public transport on weekdays.',
    'Lidl and Jumbo are 15–25% cheaper than Albert Heijn for most items.',
  ],
  FR: [
    'Student ISIC card unlocks discounts at museums, transport, and cinemas.',
    'Lidl and Aldi (Leader Price) are cheapest for grocery shopping.',
    'Carte Jeune SNCF gives up to 75% off train tickets for under 27s.',
  ],
  IE: [
    'Tesco Clubcard and SuperValu Real Rewards give free savings on weekly shops.',
    'Student Leap Card gives 50% off all Dublin Bus, DART, and Luas fares.',
    'Aldi and Lidl Ireland are significantly cheaper than SuperValu and Dunnes.',
  ],
  IN: [
    'JioMart and BigBasket often have 10–20% off on grocery orders above ₹500.',
    'Student discounts are available on Swiggy and Zomato with college email verification.',
    'Government fair price shops (ration stores) offer subsidised essentials with proper ID.',
  ],
  NG: [
    'Market days at local markets (Balogun, Mile 12) offer the best prices for fresh produce.',
    'PalmPay and Opay cashback promotions regularly give 5–10% back on grocery purchases.',
    'Buying in bulk at wholesalers like Park N Shop saves significantly versus small shops.',
  ],
  ZA: [
    'Checkers Xtra Savings and Pick n Pay Smart Shopper loyalty cards give weekly discounts.',
    'Woolworths student discount applies at the till with a valid student card.',
    'Shoprite is usually the most affordable option for staples — check their weekly specials.',
  ],
  KE: [
    'Naivas and Quickmart supermarkets have weekly promotion flyers — check them before shopping.',
    'M-Pesa Pochi La Biashara gives cashback on purchases at participating local shops.',
    'Buying produce at Wakulima Market (Nairobi) is 30–50% cheaper than supermarkets.',
  ],
  SG: [
    'FairPrice On (NTUC) has student discounts and weekly specials — check the app each week.',
    'Kopitiam and hawker centres are 50–70% cheaper than restaurants for daily meals.',
    'SimplyGo transit card auto-applies student concession fares — register with your student ID.',
  ],
  HK: [
    'Wellcome and ParknShop have student loyalty apps with weekly coupon pushes.',
    'MTR student Octopus card gives 50% off all public transport.',
    'Wet markets in Mong Kok and Sham Shui Po are 30–40% cheaper than supermarkets for fresh produce.',
  ],
  AE: [
    'Noon and Amazon.ae frequently run student discount promotions on tech and essentials.',
    'Carrefour UAE Fidelity card and LuLu loyalty app give points on every purchase.',
    'Sharjah Cooperative Society offers subsidised prices on many daily essentials.',
  ],
  PL: [
    'Biedronka and Lidl are the cheapest supermarkets — check their weekly leaflets.',
    'ISIC card gives student discounts at museums, cinemas, and transport across Poland.',
    'PKP Intercity trains give 51% student discount with valid ISIC or school ID.',
  ],
  BR: [
    'Cartão de Estudante (Student ID) gives 50% off on public transport and cinemas.',
    'Atacadão and Assaí are wholesale-style supermarkets with the lowest grocery prices.',
    'Rappi and iFood often have "meu primeiro pedido" (first order) promo codes.',
  ],
  MX: [
    'INAPAM and INJU student cards give discounts on transport, cinemas, and some shops.',
    'Walmart, Chedraui and Soriana weekly "ofertas" apps show the best grocery deals.',
    'Tianguis (street markets) on weekends are the cheapest source for fresh produce.',
  ],
  TR: [
    'Student Öğrenci ID gives 50% off on all TCDD trains and most city buses.',
    'BİM and A101 discount supermarkets are 20–30% cheaper than Migros for staples.',
    'Yemeksepeti student promotions give weekly discounts on food delivery.',
  ],
  KR: [
    'T-Money student card gives discounted fares on Seoul Metro and buses.',
    'Coupang Rocket Fresh offers student sign-up discounts on groceries delivered next-day.',
    'University area markets near campus (대학가) sell meals and produce much cheaper.',
  ],
  CN: [
    'Alibaba\'s 88VIP student tier gives extra discounts on Taobao and Tmall.',
    'Meituan and Ele.me food delivery apps run student coupon campaigns each semester.',
    'Campus canteens (学生食堂) are heavily subsidised — usually the cheapest option for meals.',
  ],
  JP: [
    'Student Commuter Pass (学生定期) gives up to 30% off train fares — apply at station.',
    'Don Quijote and supermarket (スーパー) evening markdowns (half-price stickers) after 7pm.',
    'Gyudon chains (Yoshinoya, Sukiya) offer student set meals under ¥500.',
  ],
  GH: [
    'Accra Mall and Marina Mall have student discount days — check their social media.',
    'Local markets like Makola are the cheapest for produce — go early for the best prices.',
    'MTN Mobile Money cashback promotions apply to many grocery and utility payments.',
  ],
};

export function getTipsForCountry(countryCode: string): string[] {
  return COUNTRY_TIPS[countryCode?.toUpperCase()] || COUNTRY_TIPS['GB'];
}
