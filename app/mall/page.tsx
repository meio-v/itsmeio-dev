import type { Metadata } from "next";

import { currentlyPlayingContent } from "@/content/currently-playing";

import { MallExperience } from "./_components/MallExperience";

export const metadata: Metadata = {
  title: "Mall ride — itsmeio.dev",
  description:
    "Take a small after-hours ride through Meio's corner of the internet.",
};

export default function MallPage() {
  return <MallExperience content={currentlyPlayingContent} />;
}
