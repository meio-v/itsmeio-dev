import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource/redaction-20/400-italic.css";

import { isRideLabEnabled } from "@/lib/ride-lab-feature";
import { RideLabExperience } from "./_components/RideLabExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "rideLab — itsmeio.dev",
  description: "A development-only Jolt motorcycle handling laboratory.",
};

export default function RideLabPage() {
  if (!isRideLabEnabled()) notFound();
  return <RideLabExperience />;
}
