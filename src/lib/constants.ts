export const CATEGORIES = [
  "Phone",
  "Wallet/Purse",
  "Bag",
  "Documents/ID",
  "Keys",
  "Jewellery/Watch",
  "Electronics",
  "Other",
] as const;

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Suggestions for the city box (users can still type any city). */
export const CITY_SUGGESTIONS = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal", "Thane", "Patna",
  "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot",
  "Varanasi", "Srinagar", "Amritsar", "Prayagraj", "Ranchi", "Coimbatore", "Visakhapatnam",
  "Kochi", "Thiruvananthapuram", "Guwahati", "Chandigarh", "Mysuru", "Bhubaneswar", "Dehradun",
  "Noida", "Gurugram", "Navi Mumbai", "Raipur", "Jodhpur", "Madurai", "Goa", "Shimla",
  "Puducherry", "Mangaluru", "Udaipur",
];

const CITY_ALIASES: Record<string, string> = {
  bombay: "mumbai",
  calcutta: "kolkata",
  madras: "chennai",
  bangalore: "bengaluru",
  poona: "pune",
  gurgaon: "gurugram",
  trivandrum: "thiruvananthapuram",
  mysore: "mysuru",
  baroda: "vadodara",
  benares: "varanasi",
  banaras: "varanasi",
  cochin: "kochi",
  calicut: "kozhikode",
  "new delhi": "delhi",
  vizag: "visakhapatnam",
  allahabad: "prayagraj",
  pondicherry: "puducherry",
  mangalore: "mangaluru",
  belgaum: "belagavi",
  simla: "shimla",
  "new bombay": "navi mumbai",
};

/** "  bombay " → "Mumbai", "new DELHI" → "Delhi". Keeps same-city matching reliable. */
export function normalizeCity(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const name = CITY_ALIASES[key] ?? key;
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}
