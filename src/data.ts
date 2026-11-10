export type MarketplaceListing = {
  name: string;
  category: string;
  section: string;
  description: string;
};

export const marketplaceDemoNotice =
  "Fictional demonstration content only. No real vendors, market operators, or organizations are represented.";

export const marketplaceSections = [
  "Fresh Produce",
  "Food Court",
  "Clothing",
  "Dry Goods",
  "General Merchandise",
  "Entrance & Exit",
  "Parking Area",
] as const;
