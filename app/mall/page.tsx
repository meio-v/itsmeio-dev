import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource/anton/400.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/dotgothic16/400.css";
import "@fontsource/redaction-20/400-italic.css";

import { currentlyPlayingContent } from "@/content/currently-playing";
import { isMallEnabled } from "@/lib/mall-feature";

import { MallExperience } from "./_components/MallExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mall ride — itsmeio.dev",
  description:
    "Take a small after-hours ride through Meio's corner of the internet.",
};

export default function MallPage() {
  if (!isMallEnabled()) notFound();

  return <MallExperience content={currentlyPlayingContent} />;
}
