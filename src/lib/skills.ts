import type { GateStage } from "@/lib/notion";

export type SkillFunction = "Marketing" | "Procurement" | "R&D" | "Regulatory" | "Cross-functional";

export type Skill = {
  id: string;
  name: string;
  function: SkillFunction;
  stages: GateStage[];
  built: boolean;
  url?: string;
};

export const FUNCTION_COLORS: Record<SkillFunction, string> = {
  Marketing: "#FF2D7B",
  Procurement: "#EF9F27",
  "R&D": "#5DCAA5",
  Regulatory: "#AFA9EC",
  "Cross-functional": "#64748b",
};

export const SKILLS: Skill[] = [
  {
    id: "npd-brief-generator",
    name: "NPD brief generator",
    function: "Marketing",
    stages: ["Pre-G1"],
    built: true,
    url: process.env.NEXT_PUBLIC_XO_WOW_STUDIO_URL || undefined,
  },
  {
    id: "brief-quality-checker",
    name: "Brief quality checker",
    function: "Marketing",
    stages: ["G1"],
    built: false,
  },
  {
    id: "product-name-generator",
    name: "Product name generator",
    function: "Marketing",
    stages: ["G1"],
    built: false,
  },
  {
    id: "submission-review",
    name: "Submission review",
    function: "Cross-functional",
    stages: ["Post-G1", "Post-G2"],
    built: true,
    url: process.env.NEXT_PUBLIC_SUBMISSION_REVIEW_URL || undefined,
  },
  {
    id: "supplier-rfi-drafter",
    name: "Supplier RFI drafter",
    function: "Procurement",
    stages: ["Post-G1"],
    built: false,
  },
  {
    id: "commercial-strategy",
    name: "Commercial strategy",
    function: "Marketing",
    stages: ["G2"],
    built: false,
  },
  {
    id: "cost-comparison",
    name: "Cost comparison",
    function: "Procurement",
    stages: ["G2"],
    built: false,
  },
  {
    id: "inci-generator",
    name: "INCI generator",
    function: "R&D",
    stages: ["G2"],
    built: false,
  },
  {
    id: "regulatory-compliance",
    name: "Regulatory compliance",
    function: "Regulatory",
    stages: ["G3"],
    built: false,
  },
  {
    id: "production-readiness",
    name: "Production readiness",
    function: "R&D",
    stages: ["G4"],
    built: false,
  },
  {
    id: "launch-comms-generator",
    name: "Launch comms generator",
    function: "Marketing",
    stages: ["G5"],
    built: false,
  },
];

export function skillsForStage(stage: GateStage | null): Skill[] {
  if (!stage) return [];
  return SKILLS.filter((s) => s.stages.includes(stage));
}
