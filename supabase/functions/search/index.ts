import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, lat, lng, city, countryCode, bankName, customCity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cur = getCurrency(countryCode || "GB");

    let locCtx: string;
    if (customCity) {
      locCtx = `User wants results from "${customCity}". Use the local currency of that city for all prices. Research what currency is used there.`;
    } else if (lat) {
      locCtx = `User is at ${lat}, ${lng} (${city || "unknown"}, country: ${countryCode || "GB"}). Use currency symbol "${cur}" for all prices.`;
    } else {
      locCtx = `No location available. Use realistic UK results with £.`;
    }

    // Bank fee lookup
    let bankInfo = null;
    if (bankName) {
      const bankResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a banking fee reference assistant. Bank name: "${bankName}".
Return ONLY this JSON (no markdown, no extra text):
{"bankName":"Full official bank name","overseasFeePercent":2.99,"feeDescription":"One sentence describing the overseas/foreign transaction fee."}`
          }],
          tools: [{
            type: "function",
            function: {
              name: "bank_fee_info",
              description: "Return bank fee information",
              parameters: {
                type: "object",
                properties: {
                  bankName: { type: "string" },
                  overseasFeePercent: { type: "number" },
                  feeDescription: { type: "string" },
                },
                required: ["bankName", "overseasFeePercent", "feeDescription"],
                additionalProperties: false,
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "bank_fee_info" } },
        }),
      });
      if (bankResp.ok) {
        const bankData = await bankResp.json();
        const toolCall = bankData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          try { bankInfo = JSON.parse(toolCall.function.arguments); } catch {}
        }
      }
    }

    // Main search
    const searchPrompt = `You are a local price comparison engine with sale detection. User searches: "${query}". ${locCtx}

TWO tasks:
1. Find the top 5 cheapest REAL, EXISTING places/stores/businesses near the user for "${query}", cheapest first. Use real business names that actually exist (e.g. "Tesco", "Carrefour", "Walmart", not made-up names). For each place, provide the REAL official website URL (e.g. https://www.tesco.com). For searchQuery, use the exact store name + specific location/address so Google Maps can find the exact branch.
2. Find up to 3 current sales, promotions or discounts for "${query}" near the user. Same rules: real stores, real URLs, specific location in searchQuery.

Use correct local currency. Amounts under 1 unit: use decimals e.g. "${cur}0.89".`;

    const searchResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful price comparison assistant. Return structured data about local prices." },
          { role: "user", content: searchPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "search_results",
            description: "Return price comparison results",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string" },
                averagePrice: { type: "string" },
                averageValue: { type: "number" },
                currency: { type: "string" },
                unit: { type: "string" },
                insight: { type: "string" },
                places: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rank: { type: "number" },
                      name: { type: "string" },
                      type: { type: "string" },
                      price: { type: "string" },
                      priceValue: { type: "number" },
                      distance: { type: "string" },
                      tip: { type: "string" },
                      searchQuery: { type: "string", description: "Exact store name + specific address/location for Google Maps lookup" },
                      websiteUrl: { type: "string", description: "Real official website URL of this store/business" },
                    },
                    required: ["rank", "name", "type", "price", "priceValue", "distance", "tip", "searchQuery", "websiteUrl"],
                    additionalProperties: false,
                  }
                },
                sales: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      salePrice: { type: "string" },
                      salePriceValue: { type: "number" },
                      originalPrice: { type: "string" },
                      originalPriceValue: { type: "number" },
                      distance: { type: "string" },
                      saleLabel: { type: "string" },
                      tip: { type: "string" },
                      searchQuery: { type: "string", description: "Exact store name + specific address/location for Google Maps lookup" },
                      expires: { type: "string" },
                      websiteUrl: { type: "string", description: "Real official website URL of this store/business" },
                    },
                    required: ["name", "type", "salePrice", "salePriceValue", "originalPrice", "originalPriceValue", "distance", "saleLabel", "tip", "searchQuery", "websiteUrl"],
                    additionalProperties: false,
                  }
                },
              },
              required: ["category", "averagePrice", "averageValue", "currency", "unit", "insight", "places", "sales"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "search_results" } },
      }),
    });

    if (!searchResp.ok) {
      if (searchResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (searchResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${searchResp.status}`);
    }

    const searchData = await searchResp.json();
    const toolCall = searchData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No results from AI");

    let result;
    try { result = JSON.parse(toolCall.function.arguments); } catch {
      throw new Error("Could not parse AI response");
    }

    return new Response(JSON.stringify({ result, bankInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getCurrency(code: string): string {
  const map: Record<string, string> = {
    GB:'£',US:'$',CA:'C$',AU:'A$',NZ:'NZ$',
    DE:'€',FR:'€',IT:'€',ES:'€',NL:'€',BE:'€',AT:'€',PT:'€',IE:'€',FI:'€',GR:'€',
    PL:'zł',CZ:'Kč',HU:'Ft',RO:'lei',SE:'kr',NO:'kr',DK:'kr',CH:'CHF',
    JP:'¥',CN:'¥',KR:'₩',IN:'₹',BR:'R$',MX:'$',ZA:'R',SG:'S$',HK:'HK$',
    TH:'฿',MY:'RM',ID:'Rp',PH:'₱',TW:'NT$',AE:'AED',SA:'SAR',TR:'₺',
    NG:'₦',KE:'KSh',GH:'₵',AR:'$',CL:'$',CO:'$',PK:'₨',BD:'৳'
  };
  return map[code] || '$';
}
