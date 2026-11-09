export type Vendor = {
  name: string;
  category: string;
  description: string;
  stall: string;
  image: string;
  tag: string;
  products?: string[];
  hours?: string;
  contact?: string;
};

export const vendors: Vendor[] = [
  {
    name: "Saffron Table",
    category: "Halal Food & Dining",
    description: "A welcoming demo kitchen serving comforting rice meals and freshly prepared favorites.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?auto=format&fit=crop&w=900&q=85",
    tag: "Food & dining",
    products: ["Rice meals", "Grilled selections", "Fresh drinks"],
  },
  {
    name: "The Daily Basket",
    category: "Grocery & General",
    description: "Everyday pantry essentials, dry goods, and household picks in one convenient stop.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
    tag: "Groceries",
    products: ["Pantry staples", "Dry goods", "Daily essentials"],
  },
  {
    name: "Thread & Form",
    category: "Clothing & Apparel",
    description: "A curated demo selection of modest everyday clothing and practical accessories.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
    tag: "Apparel",
    products: ["Everyday wear", "Modest apparel", "Accessories"],
  },
  {
    name: "Harvest Corner",
    category: "Fresh Produce",
    description: "Colorful seasonal fruit and vegetables presented by a sample neighborhood produce seller.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85",
    tag: "Fresh picks",
    products: ["Seasonal fruit", "Vegetables", "Fresh herbs"],
  },
  {
    name: "Butcher's Choice",
    category: "Meat & Poultry",
    description: "A demonstration listing for a fresh-protein retailer. Product and certification details require verification.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=85",
    tag: "Market essentials",
    products: ["Fresh cuts", "Poultry", "Made-to-order portions"],
  },
  {
    name: "Homeground Finds",
    category: "Household & Retail",
    description: "Useful home basics, kitchenware, and small everyday finds for the neighborhood.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
    tag: "Home & living",
    products: ["Kitchenware", "Home basics", "Storage accessories"],
  },
  {
    name: "Corner Cup Coffee",
    category: "Halal Food & Dining",
    description: "A fictional café listing for coffee, chilled drinks, and light bites between market visits.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=85",
    tag: "Coffee & refreshments",
    products: ["Coffee", "Cold beverages", "Light snacks"],
  },
  {
    name: "Everyday Repair Desk",
    category: "Household & Retail",
    description: "A sample service listing showing how practical local services could be discovered in one directory.",
    stall: "Demo listing · Stall reference to be confirmed",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85",
    tag: "Local services",
    products: ["Repair inquiries", "Small-item servicing"],
  },
];

export const categories = [
  "All",
  "Halal Food & Dining",
  "Grocery & General",
  "Clothing & Apparel",
  "Fresh Produce",
  "Meat & Poultry",
  "Household & Retail",
];

export const navigation = [
  ["Home", "home"],
  ["About", "about"],
  ["Marketplace", "marketplace"],
  ["Vendors", "vendors"],
  ["Facilities", "facilities"],
  ["Community", "community"],
  ["Contact", "contact"],
] as const;
