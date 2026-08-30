import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isRideLabEnabled } from "@/lib/ride-lab-feature";
import { CharacterPrototypeExperience } from "./CharacterPrototypeExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Character prototype — rideLab",
  description: "Throwaway rider deformation and contact benchmark.",
};

export default function CharacterPrototypePage() {
  if (!isRideLabEnabled()) notFound();
  return <CharacterPrototypeExperience />;
}
