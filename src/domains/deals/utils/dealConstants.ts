export const DEAL_SOURCES = [
  "Social Media",
  "Channel Partner",
  "Referral",
  "Property Expo",
  "Below the Line",
  "Walk-in",
  "Builder Leads",
  "Direct"
] as const;

export const DEAL_SUB_SOURCES: Record<string, string[]> = {
  "Social Media": [
    "Facebook",
    "Instagram",
    "Google PPC",
    "Facebook Forms",
    "Google Lead Forms",
    "Website Form",
    "LinkedIn Forms",
    "Google",
    "Website Phone"
  ],
  "Channel Partner": [
    "Housing.com",
    "Common Floor",
    "99Acres",
    "MagicBricks",
    "Others"
  ],
  "Below the Line": [
    "Hoardings"
  ],
  "Walk-in": [
    "Channel Partner",
    "Newspaper",
    "Hoardings",
    "Web",
    "Email",
    "SMS",
    "Exhibition",
    "Event",
    "Referral",
    "Just Walked by",
    "Society",
    "Corporate",
    "Radio"
  ]
};

export type DealSource = typeof DEAL_SOURCES[number];
