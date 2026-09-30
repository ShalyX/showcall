declare module "lucide-react" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  export type LucideIcon = ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> &
      RefAttributes<SVGSVGElement> & {
        size?: number | string;
        strokeWidth?: number;
        absoluteStrokeWidth?: boolean;
      }
  >;

  export const ArrowDownRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const CircleHelp: LucideIcon;
  export const Clock3: LucideIcon;
  export const Copy: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const FileCheck2: LucideIcon;
  export const FileText: LucideIcon;
  export const Fingerprint: LucideIcon;
  export const Globe2: LucideIcon;
  export const LoaderCircle: LucideIcon;
  export const LockKeyhole: LucideIcon;
  export const Plus: LucideIcon;
  export const Radio: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Ticket: LucideIcon;
  export const X: LucideIcon;
}
