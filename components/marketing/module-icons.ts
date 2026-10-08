import {
  BarChart3Icon,
  BotIcon,
  ContactRoundIcon,
  GaugeIcon,
  KanbanSquareIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  UsersRoundIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "@/content/modules";

export const moduleIcons: Record<ModuleKey, LucideIcon> = {
  whatsapp: MegaphoneIcon,
  crm: ContactRoundIcon,
  sales: ShoppingBagIcon,
  leads: KanbanSquareIcon,
  automations: WorkflowIcon,
  reporting: BarChart3Icon,
  ai: BotIcon,
  lead_scoring: GaugeIcon,
  employees: UsersRoundIcon,
};
