import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, FileJson2 } from "lucide-react";

import { CitationCopyButton } from "@/components/gpu-pricing/citation-copy-button";
import { Footer } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import {
  cheapestEntry,
  GPU_PRICING_INDEX,
  PRICING_INDEX_AS_OF,
} from "@/lib/gpu-pricing-index";

export const dynamic = "force-static";

const display = Newsreader({ subsets: ["latin"], variable: "--font-index-display" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-index-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://computehub.pardpro.ca";
const pageUrl = `${siteUrl}/gpu-pricing`;
const citation = `ComputeHub. “2026 GPU Cloud Pricing Index.” Snapshot ${PRICING_INDEX_AS_OF}. ${pageUrl}`;

export const metadata: Metadata = {
  title: "2026 GPU Cloud Pricing Index | ComputeHub",
  description: "A citation-ready snapshot of public on-demand GPU cloud prices, with source dates, GPU variants, methodology, CSV, and JSON downloads.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "2026 GPU Cloud Pricing Index",
    description: "Public GPU-hour prices normalized into one citation-ready dataset.",
    type: "article",
    url: pageUrl,
  },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(price);

const notes = [
  ["Scope", "Public on-demand compute prices, normalized to USD per GPU-hour. Each GPU and memory configuration remains a separate record."],
  ["Not included", "Taxes, storage, egress, reserved contracts, spot interruption risk, regional premiums, and live capacity."],
  ["Marketplace pricing", "Vast.ai is not ranked in this edition because its prices change continuously and no auditable repository snapshot was available."],
  ["Version policy", "This edition is fixed. New observations publish as a new dated edition instead of silently changing previously cited values."],
];

export default function GPUCloudPricingIndex() {
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "2026 GPU Cloud Pricing Index",
    description: "Public on-demand GPU cloud prices normalized to USD per GPU-hour.",
    url: pageUrl,
    dateModified: PRICING_INDEX_AS_OF,
    creator: { "@type": "Organization", name: "ComputeHub" },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${siteUrl}/data/gpu-cloud-pricing-index-2026.csv` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${siteUrl}/data/gpu-cloud-pricing-index-2026.json` },
    ],
  };

  return (
    <div className={`${display.variable} ${sans.variable} min-h-screen bg-[#f5f2e9] text-[#202522]`}>
      <LandingHeader />
      <main className="pt-16">
        <header className="border-b border-[#202522] px-5 pb-8 pt-10 md:px-10 md:pb-10 md:pt-14">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bbb5a8] pb-3 font-[family-name:var(--font-index-sans)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5c625e]">
              <span>ComputeHub Research</span>
              <span>Index 01 / 2026</span>
            </div>

            <div className="grid gap-8 pb-9 pt-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.65fr)] lg:items-end">
              <div>
                <p className="mb-3 font-[family-name:var(--font-index-sans)] text-sm font-medium text-[#5c625e]">Public cloud infrastructure reference</p>
                <h1 className="max-w-4xl font-[family-name:var(--font-index-display)] text-[clamp(3.1rem,6.6vw,6.4rem)] font-medium leading-[0.92] tracking-[-0.045em]">
                  2026 GPU Cloud Pricing Index
                </h1>
              </div>
              <p className="max-w-md border-t border-[#202522] pt-4 font-[family-name:var(--font-index-sans)] text-[15px] leading-6 text-[#454b47] lg:justify-self-end">
                A fixed snapshot of public on-demand prices, prepared for citation and comparison. Missing evidence remains unranked.
              </p>
            </div>

            <div className="grid border-y border-[#202522] font-[family-name:var(--font-index-sans)] sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
              {[["Snapshot", "19 Oct 2026"], ["Unit", "USD / GPU-hour"], ["Providers", "2 verified"], ["Records", String(GPU_PRICING_INDEX.length)]].map(([label, value]) => (
                <div key={label} className="border-b border-[#bbb5a8] px-3 py-3 sm:px-4 lg:border-b-0 lg:border-r">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#70766f]">{label}</div>
                  <div className="mt-1 text-sm font-semibold">{value}</div>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-3 sm:col-span-2 sm:px-4 lg:col-span-1">
                <a href="/data/gpu-cloud-pricing-index-2026.csv" download className="inline-flex min-h-10 items-center gap-2 border border-[#202522] bg-[#202522] px-3 text-xs font-semibold text-[#f5f2e9] transition-colors hover:bg-[#4b514d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  <ArrowDownToLine className="h-3.5 w-3.5" /> CSV
                </a>
                <a href="/data/gpu-cloud-pricing-index-2026.json" download className="inline-flex min-h-10 items-center gap-2 border border-[#202522] px-3 text-xs font-semibold transition-colors hover:bg-[#e5e0d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  <FileJson2 className="h-3.5 w-3.5" /> JSON
                </a>
              </div>
            </div>
          </div>
        </header>

        <section className="px-5 py-10 md:px-10 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex flex-col gap-2 font-[family-name:var(--font-index-sans)] sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.015em]">Ranked public prices</h2>
                <p className="mt-1 text-sm text-[#626861]">Lowest listed record: {cheapestEntry.provider} {cheapestEntry.gpu} at {formatPrice(cheapestEntry.priceUsdPerGpuHour)}.</p>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.11em] text-[#70766f] md:hidden">Swipe for full record →</p>
            </div>

            <div className="overflow-x-auto border-y-2 border-[#202522]">
              <table className="w-full min-w-[880px] border-collapse font-[family-name:var(--font-index-sans)] text-left">
                <caption className="sr-only">Public on-demand GPU prices in US dollars per GPU-hour</caption>
                <thead>
                  <tr className="border-b border-[#202522] text-[11px] uppercase tracking-[0.11em]">
                    <th className="px-3 py-3 font-semibold">Rank</th>
                    <th className="px-3 py-3 text-right font-semibold">USD / GPU-hr</th>
                    <th className="px-3 py-3 font-semibold">GPU / memory</th>
                    <th className="px-3 py-3 font-semibold">Provider</th>
                    <th className="px-3 py-3 font-semibold">Product</th>
                    <th className="px-3 py-3 font-semibold">Official source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...GPU_PRICING_INDEX].sort((a, b) => a.priceUsdPerGpuHour - b.priceUsdPerGpuHour).map((entry, index) => (
                    <tr key={`${entry.provider}-${entry.gpu}-${entry.vramGb}`} className="border-b border-[#bbb5a8] last:border-0 hover:bg-[#ebe6da]">
                      <td className="px-3 py-4 text-xs tabular-nums text-[#70766f]">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-4 text-right text-lg font-semibold tabular-nums">{formatPrice(entry.priceUsdPerGpuHour)}</td>
                      <td className="px-3 py-4"><span className="font-semibold">{entry.gpu}</span><span className="ml-2 text-xs text-[#70766f]">{entry.vramGb} GB</span></td>
                      <td className="px-3 py-4 text-sm font-medium">{entry.provider}</td>
                      <td className="px-3 py-4 text-sm text-[#4f5650]">{entry.product}</td>
                      <td className="px-3 py-4 text-sm">
                        <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[#5b2a68] underline decoration-[#5b2a68]/30 underline-offset-4 hover:decoration-[#5b2a68]">Source <ArrowUpRight className="h-3.5 w-3.5" /></a>
                        <div className="mt-1 text-[11px] text-[#70766f]">Checked {entry.sourceUpdated}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-[family-name:var(--font-index-sans)] text-xs leading-5 text-[#626861]">
              Rankings compare published records, not equivalent system configurations. A100 40 GB and 80 GB entries are intentionally separate.
            </p>
          </div>
        </section>

        <section className="border-y border-[#bbb5a8] bg-[#ece7dc] px-5 py-12 md:px-10 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[17rem_1fr]">
            <div>
              <p className="font-[family-name:var(--font-index-sans)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a706a]">Methodology notes</p>
              <h2 className="mt-3 font-[family-name:var(--font-index-display)] text-4xl leading-none tracking-[-0.03em]">How to read this index</h2>
            </div>
            <ol className="border-t border-[#202522] font-[family-name:var(--font-index-sans)]">
              {notes.map(([title, copy], index) => (
                <li key={title} className="grid gap-2 border-b border-[#bbb5a8] py-4 sm:grid-cols-[2rem_10rem_1fr] sm:gap-4">
                  <span className="text-xs tabular-nums text-[#70766f]">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-sm leading-6 text-[#4f5650]">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-12 md:px-10 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-8 font-[family-name:var(--font-index-sans)] lg:grid-cols-[17rem_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6a706a]">Recommended citation</p>
              <CitationCopyButton citation={citation} />
            </div>
            <div className="border-l-2 border-[#202522] pl-5 sm:pl-7">
              <blockquote className="max-w-3xl text-lg leading-8 text-[#333a35]">{citation}</blockquote>
              <p className="mt-5 text-sm leading-6 text-[#626861]">
                For current availability rather than a fixed citation, use the operational <Link href="/gpu-prices" className="font-semibold text-[#5b2a68] underline underline-offset-4">GPU Prices dashboard</Link>.
              </p>
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      </main>
      <Footer />
    </div>
  );
}
