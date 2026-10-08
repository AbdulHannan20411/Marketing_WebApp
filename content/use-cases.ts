import {
  BuildingIcon,
  GraduationCapIcon,
  HandshakeIcon,
  PackageIcon,
  StethoscopeIcon,
  StoreIcon,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "./modules";

/** Industries on /use-cases. Strings live in messages under `useCases.industries.<id>`. */
type UseCase = {
  id: string;
  icon: LucideIcon;
  challenges: readonly string[];
  solutions: readonly string[];
  modules: readonly ModuleKey[];
};

export const useCases = [
  {
    id: "retail",
    icon: StoreIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["whatsapp", "sales", "leads", "automations"],
  },
  {
    id: "realEstate",
    icon: BuildingIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["crm", "leads", "automations", "employees"],
  },
  {
    id: "education",
    icon: GraduationCapIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["whatsapp", "crm", "ai", "automations"],
  },
  {
    id: "clinics",
    icon: StethoscopeIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["whatsapp", "crm", "ai", "employees"],
  },
  {
    id: "ecommerce",
    icon: PackageIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["sales", "leads", "ai", "reporting"],
  },
  {
    id: "agencies",
    icon: HandshakeIcon,
    challenges: ["c1", "c2", "c3"],
    solutions: ["s1", "s2", "s3"],
    modules: ["whatsapp", "employees", "reporting", "automations"],
  },
] as const satisfies readonly UseCase[];

export type UseCaseId = (typeof useCases)[number]["id"];

/** URL anchors (#real-estate) for each industry. */
export function anchorForUseCase(id: UseCaseId): string {
  return id.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
