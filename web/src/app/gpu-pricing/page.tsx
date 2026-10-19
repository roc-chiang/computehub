import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, Database, FileJson2 } from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import {
  cheapestEntry,
  GPU_PRICING_INDEX,
  PRICING_INDEX_AS_OF,
} from "@/lib/gpu-pricing-index";

export const dynamic = "force-static";

const display = Newsreader({ subsets: ["latin"], variable: "--font-index-display" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-index-sans" });

export const metadata: Metadata = {
  title: "2026 GPU Cloud Pricing Index | ComputeHub",
  description:
    "A citation-ready snapshot of public on-demand GPU cloud prices, with source dates, GPU variants, methodology, CSV, and JSON downloads.",
  alternates: { canonical: "/gpu-pricing" },
  openGraph: {
    title: "2026 GPU Cloud Pricing Index",
    description: "Public GPU-hour prices normalized into one citation-ready dataset.",
    type: "article",
    url: "/gpu-pricing",
  },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(price);

export default function GPUCloudPricingIndex() {
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "2026 GPU Cloud Pricing Index",
    description: "Public on-demand GPU cloud prices normalized to USD per GPU-hour.",
    dateModified: PRICING_INDEX_AS_OF,
    creator: { "@type": "Organization", name: "ComputeHub" },
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: "/data/gpu-cloud-pricing-index-2026.csv" },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "/data/gpu-cloud-pricing-index-2026.json" },
    ],
  };

  return (
    <div className={`${display.variable} ${sans.variable} min-h-screen bg-[#f4f0e6] text-[#17241f]`}>
      <LandingHeader />
      <main className="overflow-hidden pt-16">
        <section className="border-b border-[#17241f]/25 px-5 pb-14 pt-16 md:px-10 md:pb-20 md:pt-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_23rem] lg:items-end">
            <div>
              <div className="mb-8 flex items-center gap-3 font-[family-name:var(--font-index-sans)] text-xs font-semibold uppercase tracking-[0.18em] text-[#a63a2b]">
                <span className="h-2 w-2 rounded-full bg-[#a63a2b]" />
                ComputeHub Public Data · Edition 01
              </div>
              <h1 className="max-w-5xl font-[family-name:var(--font-index-display)] text-[clamp(3.5rem,9vw,8.5rem)] font-medium leading-[0.82] tracking-[-0.055em]">
                2026 GPU Cloud
                <span className="block pl-[9vw] italic text-[#294cdb]">Pricing Index</span>
              </h1>
            </div>

            <aside className="border-l-2 border-[#17241f] pl-6 font-[family-name:var(--font-index-sans)]">
              <p className="text-sm leading-6 text-[#40504a]">
                A static, citation-ready snapshot of public on-demand prices. GPU variants stay separate;
                missing evidence stays missing.
              </p>
              <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-[#17241f]/25 pt-5 text-sm">
                <div><dt className="text-[#6d7772]">As of</dt><dd className="mt-1 font-semibold">Oct 19, 2026</dd></div>
                <div><dt className="text-[#6d7772]">Currency</dt><dd className="mt-1 font-semibold">USD / GPU-hour</dd></div>
                <div><dt className="text-[#6d7772]">Providers</dt><dd className="mt-1 font-semibold">2 verified</dd></div>
                <div><dt className="text-[#6d7772]">Records</dt><dd className="mt-1 font-semibold">{GPU_PRICING_INDEX.length}</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="px-5 py-10 md:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 font-[family-name:var(--font-index-sans)] md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-[#40504a]">
              Use this URL as the human-readable citation. Use the files below for analysis, documentation,
              or community-maintained comparisons.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/data/gpu-cloud-pricing-index-2026.csv" download className="inline-flex min-h-11 items-center gap-2 border border-[#17241f] bg-[#17241f] px-4 text-sm font-semibold text-[#f4f0e6] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                <ArrowDownToLine className="h-4 w-4" /> CSV
              </a>
              <a href="/data/gpu-cloud-pricing-index-2026.json" download className="inline-flex min-h-11 items-center gap-2 border border-[#17241f] px-4 text-sm font-semibold transition-colors hover:bg-[#ded8c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                <FileJson2 className="h-4 w-4" /> JSON
              </a>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 md:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-right font-[family-name:var(--font-index-sans)] text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7772] md:hidden">
              Swipe for full record →
            </p>
            <div className="overflow-x-auto border-y-2 border-[#17241f]">
              <table className="w-full min-w-[880px] border-collapse font-[family-name:var(--font-index-sans)] text-left">
                <caption className="sr-only">Public on-demand GPU prices in US dollars per GPU-hour</caption>
                <thead>
                  <tr className="border-b border-[#17241f] text-xs uppercase tracking-[0.12em]">
                    <th className="px-4 py-4 font-semibold">Rank</th><th className="px-4 py-4 font-semibold">GPU / memory</th><th className="px-4 py-4 text-right font-semibold">USD / GPU-hr</th><th className="px-4 py-4 font-semibold">Provider</th><th className="px-4 py-4 font-semibold">Product</th><th className="px-4 py-4 font-semibold">Official source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...GPU_PRICING_INDEX].sort((a, b) => a.priceUsdPerGpuHour - b.priceUsdPerGpuHour).map((entry, index) => (
                    <tr key={`${entry.provider}-${entry.gpu}-${entry.vramGb}`} className="border-b border-[#17241f]/20 transition-colors last:border-0 hover:bg-[#e7e0d1]">
                      <td className="px-4 py-5 text-sm text-[#6d7772]">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-5"><span className="font-semibold">{entry.gpu}</span><span className="ml-2 text-sm text-[#6d7772]">{entry.vramGb} GB</span></td>
                      <td className="px-4 py-5 text-right font-[family-name:var(--font-index-display)] text-3xl font-semibold tabular-nums">{formatPrice(entry.priceUsdPerGpuHour)}</td>
                      <td className="px-4 py-5 font-semibold">{entry.provider}</td>
                      <td className="px-4 py-5 text-sm text-[#40504a]">{entry.product}</td>
                      <td className="px-4 py-5"><a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#294cdb] underline decoration-[#294cdb]/35 underline-offset-4 hover:decoration-[#294cdb]">View <ArrowUpRight className="h-3.5 w-3.5" /></a><div className="mt-1 text-xs text-[#6d7772]">Source dated {entry.sourceUpdated}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-[family-name:var(--font-index-sans)] text-xs leading-5 text-[#6d7772]">
              Ranking compares listed records, not equivalent system configurations. A100 40 GB and 80 GB entries are intentionally not merged.
            </p>
          </div>
        </section>

        <section className="bg-[#17241f] px-5 py-20 text-[#f4f0e6] md:px-10">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-[family-name:var(--font-index-sans)] text-xs font-semibold uppercase tracking-[0.18em] text-[#ef755f]">Read the number correctly</p>
              <h2 className="mt-5 font-[family-name:var(--font-index-display)] text-5xl leading-[0.95] tracking-[-0.035em] md:text-7xl">Price is a quote,<br /><em>not availability.</em></h2>
              <div className="mt-10 inline-flex items-end gap-3 border-t border-[#f4f0e6]/30 pt-5">
                <span className="font-[family-name:var(--font-index-display)] text-5xl">{formatPrice(cheapestEntry.priceUsdPerGpuHour)}</span>
                <span className="pb-1 font-[family-name:var(--font-index-sans)] text-sm text-[#b9c2bd]">lowest listed record<br />{cheapestEntry.provider} · {cheapestEntry.gpu}</span>
              </div>
            </div>
            <div className="grid gap-px bg-[#f4f0e6]/20 sm:grid-cols-2">
              {[
                ["Included", "Public on-demand compute price, GPU variant, VRAM, billing unit, official source, and source date."],
                ["Excluded", "Taxes, storage, egress, reserved contracts, spot interruption risk, regional premiums, and live capacity."],
                ["Vast.ai", "Not ranked in this static edition. Its marketplace prices are dynamic and the repository contains no auditable snapshot."],
                ["Citation", `ComputeHub, “2026 GPU Cloud Pricing Index,” snapshot ${PRICING_INDEX_AS_OF}. Accessed with the page URL.`],
              ].map(([title, copy]) => (
                <article key={title} className="bg-[#17241f] p-6 sm:p-8">
                  <h3 className="font-[family-name:var(--font-index-sans)] text-sm font-semibold uppercase tracking-[0.12em] text-[#ef755f]">{title}</h3>
                  <p className="mt-4 font-[family-name:var(--font-index-sans)] text-sm leading-6 text-[#cbd1ce]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_2fr]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#17241f]"><Database className="h-6 w-6" /></div>
            <div>
              <h2 className="font-[family-name:var(--font-index-display)] text-4xl tracking-[-0.025em] md:text-6xl">A stable page for a moving market.</h2>
              <div className="mt-8 grid gap-8 font-[family-name:var(--font-index-sans)] text-sm leading-6 text-[#40504a] sm:grid-cols-2">
                <p>This edition is immutable by design. New observations should publish as a new dated edition rather than silently rewriting a cited number.</p>
                <p>Need live availability instead? Use the operational <Link href="/gpu-prices" className="font-semibold text-[#294cdb] underline underline-offset-4">GPU Prices dashboard</Link>, where unavailable provider responses remain N/A.</p>
              </div>
            </div>
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      </main>
      <Footer />
    </div>
  );
}
