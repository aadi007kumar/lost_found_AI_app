// Demo data: lost↔found pairs across India (many with photos), near-misses, and unmatched reports.
// Photos are CC0 / public-domain images (see scripts/demo-photos.json for sources), already
// uploaded to Vercel Blob and captioned by Groq, so re-seeding needs no AI vision calls.
// Re-runnable: removes earlier demo rows (phones starting 900000) before inserting.
// Usage: node --env-file=.env.local scripts/seed.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const photos = Object.fromEntries(
  JSON.parse(readFileSync(new URL("./demo-photos.json", import.meta.url), "utf8")).map((p) => [p.key, p]),
);

// [type, title, category, description, state, city, place, daysAgo, name, photoKey?, email?]
const R = [
  // ── Pune: phone pair + a weaker phone match
  ["lost", "Black Samsung Galaxy S21", "Phone", "Black Samsung Galaxy S21 with a blue silicone cover. Screen has a crack on the top-left corner. Lock screen photo of a beach.", "Maharashtra", "Pune", "FC Road bus stop", 3, "Riya Deshmukh"],
  ["found", "Samsung mobile with blue cover", "Phone", "Found a dark Samsung phone in a blue back cover, screen cracked near one corner. It was lying on a bench.", "Maharashtra", "Pune", "Deccan Gymkhana", 2, "Aman Joshi"],
  ["found", "Black Android phone", "Phone", "Black Android phone with a home button, no cover. Battery was dead when I found it.", "Maharashtra", "Pune", "Kothrud depot", 5, "Sneha Kulkarni", "android-phone-16"],
  ["lost", "MacBook and notebook left at cafe", "Electronics", "Silver MacBook Air with a brown leather notebook and a pen. Left on a corner table.", "Maharashtra", "Pune", "Koregaon Park cafe", 8, "Nikhil Bhosale", "laptop-105", "nikhil.b@example.com"],
  ["found", "Keys with red key fob", "Keys", "One brass key on a ring with a red and green plastic fob. Found near the gate.", "Maharashtra", "Pune", "Shivajinagar station", 4, "Omkar Pawar", "keys-keychain-49"],

  // ── Mumbai: wallet pair, plus a different black wallet
  ["lost", "Tan wallet with MOROCCO painted on it", "Wallet/Purse", "Old tan leather wallet with a green star and 'MOROCCO' painted on the front. Has my driving licence and two cards.", "Maharashtra", "Mumbai", "Andheri station, platform 2", 6, "Kunal Mehta", "leather-wallet-26"],
  ["found", "Brown wallet with a star drawn on it", "Wallet/Purse", "Found a worn brown leather wallet with a green star and some red writing on it, on the local train. Licence and cards inside.", "Maharashtra", "Mumbai", "Andheri West local train", 6, "Fatima Shaikh"],
  ["found", "Black Timberland wallet", "Wallet/Purse", "Black leather bi-fold wallet with white stitching and a tree logo. Some cash, no ID.", "Maharashtra", "Mumbai", "Dadar TT circle", 3, "Sanjay Patil", "leather-wallet-24"],
  ["lost", "Black phone, ship photo wallpaper", "Phone", "Black smartphone with no cover. Wallpaper is a photo of a white and red ship.", "Maharashtra", "Mumbai", "Marine Drive", 1, "Zoya Qureshi", "black-smartphone-0"],
  ["found", "Black umbrella", "Other", "Large black folding umbrella with a wooden handle, left at the bus stop.", "Maharashtra", "Mumbai", "Dadar TT circle", 1, "Rahul Kadam"],
  ["found", "Old box camera", "Electronics", "Very old black box camera, looks like an antique. Found in a taxi.", "Maharashtra", "Mumbai", "Colaba", 9, "Irfan Sayyed", "camera-115"],

  // ── Bengaluru
  ["lost", "Light blue floral backpack", "Bag", "My daughter's light blue backpack with a pink and yellow flower print on the straps. Has her school books.", "Karnataka", "Bengaluru", "Majestic bus stand", 4, "Arjun Rao", "backpack-30"],
  ["found", "Kids' backpack with flowers", "Bag", "Small blue school backpack with a colourful flower print, books inside. Left behind on a BMTC bus.", "Karnataka", "Bengaluru", "Kempegowda bus station", 4, "Lakshmi Narayan"],
  ["lost", "Orange Prada wallet", "Wallet/Purse", "Orange long wallet, Prada, with a gold triangle logo. Had cards and some cash.", "Karnataka", "Bengaluru", "UB City mall", 7, "Meera Iyer", "leather-wallet-21", "meera.iyer@example.com"],
  ["lost", "Keys with a silver USB drive", "Keys", "Bunch of brass keys on a silver ring, with a 32GB silver ADATA pen drive attached. Pen drive has my thesis!", "Karnataka", "Bengaluru", "Indiranagar metro", 2, "Rohan Shetty", "keys-keychain-55"],
  ["found", "White netbook laptop", "Electronics", "Small white laptop, older model, found on a bench in the park.", "Karnataka", "Bengaluru", "Cubbon Park", 6, "Kavya Gowda", "laptop-101"],
  ["found", "Blue steel water bottle", "Other", "Blue and silver steel water bottle with a rubber grip, left near the bandstand.", "Karnataka", "Bengaluru", "Cubbon Park bandstand", 1, "Suresh Babu", "water-bottle-130"],

  // ── Delhi
  ["lost", "Car key, 3-button fob", "Keys", "Black car key with a flip-out metal blade and three buttons. Hyundai i20.", "Delhi", "Delhi", "Connaught Place, Inner Circle", 1, "Rohit Sharma", "car-key-60"],
  ["found", "Car key with two brass keys", "Keys", "Black car remote key with lock/unlock buttons, two brass house keys on the same ring. Found near the metro gate.", "Delhi", "Delhi", "Rajiv Chowk metro, gate 5", 1, "Priya Verma", "car-key-61"],
  ["found", "Black card holder wallet", "Wallet/Purse", "Slim black card holder with a zip, has a foreign banknote and a card inside.", "Delhi", "Delhi", "IGI Airport T3 arrivals", 5, "Ankit Malhotra", "leather-wallet-25"],
  ["lost", "Round black spectacles", "Other", "Round black frame glasses, thin frame. Left in an auto.", "Delhi", "Delhi", "Hauz Khas village", 3, "Tanya Kapoor", "eyeglasses-118"],
  ["found", "Old black iPhone", "Phone", "Old black iPhone with a silver edge, lots of apps on the screen. Found on a DTC bus seat.", "Delhi", "Delhi", "Lajpat Nagar", 10, "Deepak Chauhan", "iphone-14"],
  ["lost", "Navy blue suitcase", "Bag", "Navy blue trolley suitcase with a sticker on the front. Got left on the platform.", "Delhi", "Delhi", "New Delhi railway station, platform 16", 2, "Harpreet Gill", "suitcase-148"],

  // ── Jaipur & Udaipur
  ["lost", "Gold jhumka earrings", "Jewellery/Watch", "Pair of gold dangling earrings with teardrop pendants and beaded work. Lost one during a wedding function.", "Rajasthan", "Jaipur", "Rambagh wedding lawn", 9, "Ananya Singh", "gold-earrings-67"],
  ["found", "Single gold drop earring", "Jewellery/Watch", "Found one gold drop earring with a hoop top and a dangling pendant on the lawn after an event.", "Rajasthan", "Jaipur", "Rambagh area", 8, "Vikram Rathore", "gold-earrings-69"],
  ["lost", "Gold signet ring", "Jewellery/Watch", "Gold signet ring with an engraved oval face (family crest). Slightly darkened in the grooves.", "Rajasthan", "Jaipur", "Johari Bazaar", 12, "Aditya Khandelwal", "gold-ring-82"],
  ["found", "Green beaded round bag", "Bag", "Round green and tan beaded handbag with a brown leather strap.", "Rajasthan", "Udaipur", "Lake Pichola ghat", 3, "Mohit Purohit", "handbag-39"],

  // ── Chennai & Coimbatore
  ["lost", "US passport", "Documents/ID", "Dark blue United States passport. I'm a tourist, lost it near the departure gate. Please help!", "Tamil Nadu", "Chennai", "Chennai airport, Terminal 1", 2, "Emily Carter", "passport-83", "emily.c@example.com"],
  ["found", "Blue American passport", "Documents/ID", "Found a blue US passport near the security check area. Handed nothing over yet.", "Tamil Nadu", "Chennai", "Meenambakkam airport", 2, "Divya Raman"],
  ["found", "Car key with brown leather tag", "Keys", "Black car key fob on a ring with a plain brown leather tag.", "Tamil Nadu", "Chennai", "T. Nagar, Ranganathan Street", 4, "Prakash Murugan", "car-key-64"],
  ["lost", "Festina watch, white dial", "Jewellery/Watch", "Silver Festina watch with a white dial and black leather strap. Gift from my father.", "Tamil Nadu", "Coimbatore", "Gandhipuram bus stand", 6, "Vignesh Kumar", "wristwatch-73"],
  ["found", "Watch with black leather strap", "Jewellery/Watch", "Silver watch with white dial and small sub-dials, black leather strap. Found on a bus seat.", "Tamil Nadu", "Coimbatore", "Ukkadam", 5, "Revathi S"],

  // ── Hyderabad
  ["lost", "Black wireless earbuds", "Electronics", "Black wireless earbuds in a black charging case. Both buds inside.", "Telangana", "Hyderabad", "Hitech City food court", 7, "Sameer Khan", "earbuds-92"],
  ["found", "Earbuds case, black", "Electronics", "Black earphones charging case with earbuds inside. Found at a cafe table.", "Telangana", "Hyderabad", "Gachibowli", 5, "Pooja Reddy"],
  ["found", "Black wallet, torn corner", "Wallet/Purse", "Black leather bifold wallet, worn out, one corner torn. No cards, little cash.", "Telangana", "Hyderabad", "Charminar", 2, "Abdul Rahman", "leather-wallet-27"],
  ["found", "Power bank with cables", "Electronics", "Black power bank with a couple of charging cables, left at a co-working space.", "Telangana", "Hyderabad", "Madhapur", 3, "Sravani Rao", "power-bank-145"],

  // ── Kolkata & Howrah
  ["lost", "Casio G-Shock watch", "Jewellery/Watch", "Silver Casio G-Shock with a black dial, red details and metal strap.", "West Bengal", "Kolkata", "Park Street", 12, "Sourav Banerjee", "wristwatch-71"],
  ["found", "Casio watch, metal strap", "Jewellery/Watch", "Silver Casio sports watch with black dial and metal strap. Found near the ticket counter.", "West Bengal", "Howrah", "Howrah station, platform 9", 10, "Moumita Das"],
  ["lost", "Green velvet vintage purse", "Wallet/Purse", "My grandmother's olive green velvet purse with a gold metal clasp and a green stone. Very precious.", "West Bengal", "Kolkata", "New Market", 5, "Rituparna Sen", "handbag-43"],

  // ── Ahmedabad
  ["lost", "Black laptop bag", "Bag", "Black Kroser laptop bag with many front zip pockets and a shoulder strap. Had my office laptop.", "Gujarat", "Ahmedabad", "SG Highway, Iscon cross road", 3, "Harsh Patel", "laptop-bag-45"],
  ["found", "Black office laptop bag", "Bag", "Black laptop bag with several zipped pockets on the front, found in an auto rickshaw.", "Gujarat", "Ahmedabad", "Prahlad Nagar", 3, "Jignesh Shah"],

  // ── Goa
  ["lost", "Vintage silver film camera", "Electronics", "Old silver and black film camera (rangefinder) with a leather strap. My father's.", "Goa", "Calangute", "Baga beach shack", 4, "Rhea Fernandes", "camera-111"],
  ["found", "Old film camera on beach", "Electronics", "Found an old silver film camera near the sunbeds on the beach.", "Goa", "Calangute", "Baga beach", 3, "Joseph D'Souza"],
  ["lost", "Round straw bag", "Bag", "Round woven straw bag with a tan leather strap. Had sunglasses and a lip balm inside.", "Goa", "Panaji", "Miramar beach", 2, "Natasha Pinto", "handbag-38"],

  // ── Varanasi (your report should match this)
  ["found", "Black iPhone in green case", "Phone", "Found a black iPhone in a green cover near the steps. Lock screen has a purple wallpaper.", "Uttar Pradesh", "Varanasi", "Assi Ghat", 0, "Shivam Mishra"],

  // ── Lucknow
  ["found", "Pink school bag", "Bag", "Small pink school bag with cartoon print, has Class 3 notebooks with a name written on them.", "Uttar Pradesh", "Lucknow", "Hazratganj", 2, "Mohd. Imran"],
  ["lost", "Daughter's pink school bag", "Bag", "Pink school bag with cartoons on it, Class 3 books inside. Left in a rickshaw.", "Uttar Pradesh", "Lucknow", "Hazratganj market", 2, "Shalini Awasthi"],
  ["found", "Gold hoop earrings with heart", "Jewellery/Watch", "Pair of gold hoop earrings with a small heart charm hanging from each.", "Uttar Pradesh", "Lucknow", "Aminabad", 6, "Faizan Ali", "gold-earrings-66"],

  // ── Kochi
  ["lost", "Black frame spectacles", "Other", "Black rectangular frame glasses, high power lenses. In a brown case.", "Kerala", "Kochi", "Marine Drive walkway", 4, "Anil Menon", "eyeglasses-117"],
  ["found", "Black rectangular glasses", "Other", "Black rectangular spectacles found on a bench, no case.", "Kerala", "Kochi", "Marine Drive", 3, "Fathima Beevi", "eyeglasses-121"],

  // ── Chandigarh
  ["found", "Kindle e-reader", "Electronics", "Black Kindle Paperwhite in a green fabric cover, found on a park bench.", "Chandigarh", "Chandigarh", "Sector 17 plaza", 3, "Gurpreet Kaur"],
  ["lost", "Kindle with green cover", "Electronics", "Kindle Paperwhite in a green cloth cover. Lots of books downloaded.", "Chandigarh", "Chandigarh", "Sector 17", 3, "Aman Bedi"],
  ["lost", "Rose gold iPhone", "Phone", "Rose gold iPhone with a white front, some scratches on the bottom edge. No cover.", "Chandigarh", "Chandigarh", "Elante mall", 5, "Simran Arora", "eyeglasses-120"],

  // ── Bhopal & Indore
  ["lost", "College ID and marksheets folder", "Documents/ID", "Transparent plastic folder with college ID card and original 12th marksheet.", "Madhya Pradesh", "Bhopal", "MP Nagar zone 1", 6, "Neha Tiwari"],
  ["found", "Folder with marksheet and ID", "Documents/ID", "Plastic file folder with a college ID card and some marksheets, found at the bus stop.", "Madhya Pradesh", "Bhopal", "MP Nagar", 5, "Ravi Yadav"],
  ["lost", "Keys with T-shirt keychain", "Keys", "Bunch of keys with a white T-shirt shaped keychain that says 'I love ...' with a red heart.", "Madhya Pradesh", "Indore", "Sarafa Bazaar", 2, "Pallavi Jain", "keys-keychain-52"],
  ["found", "Key bunch, white keychain", "Keys", "Several keys on a ring with a small white T-shirt shaped keychain with a heart on it.", "Madhya Pradesh", "Indore", "Rajwada", 1, "Arpit Soni"],

  // ── Guwahati & Patna & Bhubaneswar
  ["lost", "Brown leather briefcase", "Bag", "Two-tone brown leather briefcase, tan top and maroon body, brass buckles. Office files inside.", "Assam", "Guwahati", "Paltan Bazaar", 7, "Bikash Baruah", "laptop-bag-44"],
  ["found", "Leather office bag, brown", "Bag", "Brown leather office bag with buckles and two handles, left at the ticket counter.", "Assam", "Guwahati", "Guwahati railway station", 6, "Ranjit Deka"],
  ["lost", "Red women's wallet", "Wallet/Purse", "Red crocodile-pattern zip wallet with gold logo. Had my college ID and some cash.", "Bihar", "Patna", "Boring Road", 4, "Priyanka Kumari", "leather-wallet-22"],
  ["found", "Red ladies purse", "Wallet/Purse", "Found a red zip-around ladies wallet with a gold logo, near the auto stand.", "Bihar", "Patna", "Boring Road crossing", 3, "Manish Ranjan"],
  ["lost", "White Samsung earphones", "Electronics", "White wired Samsung earphones, cable tied with a small velcro strap.", "Odisha", "Bhubaneswar", "Kalinga stadium", 5, "Subhashree Mohanty", "earbuds-87"],
  ["found", "White wired earphones", "Electronics", "White wired earphones with a velcro cable tie, found on the stadium stands.", "Odisha", "Bhubaneswar", "Kalinga stadium stands", 4, "Debasis Panda"],

  // ── Amritsar
  ["lost", "Plain gold ring", "Jewellery/Watch", "Plain polished gold band ring, no stones. My wedding ring.", "Punjab", "Amritsar", "Golden Temple, parikrama", 3, "Jaspreet Singh"],
  ["found", "Gold band ring", "Jewellery/Watch", "Found a plain gold ring near the sarovar steps. Plain band, no design.", "Punjab", "Amritsar", "Golden Temple complex", 2, "Harleen Kaur", "gold-ring-77"],

  // ── Mysuru
  ["lost", "Child's brown teddy bear", "Other", "Small brown teddy bear with a white muzzle. My son can't sleep without it.", "Karnataka", "Mysuru", "Mysore Palace gate", 2, "Divya Hegde", "teddy-bear-140"],
  ["found", "Small brown teddy", "Other", "Found a small brown soft toy teddy bear near the palace entrance.", "Karnataka", "Mysuru", "Mysore Palace", 1, "Kiran Kumar"],

  // ── Uttarakhand & Himachal
  ["lost", "Black power bank", "Electronics", "Black rectangular power bank, 10000 mAh, small scratch on the side.", "Uttarakhand", "Dehradun", "ISBT Dehradun", 5, "Ayush Negi", "power-bank-144"],
  ["found", "Two blue hiking backpacks", "Bag", "Two blue frame backpacks left at the trek starting point. Look well used.", "Uttarakhand", "Rishikesh", "Laxman Jhula", 4, "Kunal Rawat", "backpack-31"],
  ["lost", "Black over-ear headphones", "Electronics", "Black over-ear headphones with soft cushions, left on a bench on Mall Road.", "Himachal Pradesh", "Shimla", "Mall Road", 3, "Ishita Thakur", "headphones-99"],
  ["found", "Headphones on Mall Road", "Electronics", "Found a pair of headphones on a bench on Mall Road.", "Himachal Pradesh", "Shimla", "The Ridge", 2, "Vivek Chauhan", "headphones-93"],
];

const istDaysAgo = (n) => new Date(Date.now() + 5.5 * 3600_000 - n * 86_400_000).toISOString().slice(0, 10);
// Same format as embeddingText() in src/lib/ai/embed.ts
const textFor = (r) => {
  const [, title, category, description, , city, place, , , photoKey] = r;
  const caption = photoKey ? photos[photoKey]?.caption : null;
  return [`${category}: ${title}.`, description, caption ? `Photo: ${caption}` : "", `Place: ${place}, ${city}`]
    .filter(Boolean).join(" ");
};

for (const r of R) if (r[9] && !photos[r[9]]) throw new Error(`Missing photo ${r[9]}`);

async function embedBatch(texts) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/qwen/qwen3-embedding-0.6b`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: texts }),
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error("Embedding failed: " + JSON.stringify(json.errors));
  return json.result.data;
}

const vectors = [];
for (let i = 0; i < R.length; i += 20) vectors.push(...(await embedBatch(R.slice(i, i + 20).map(textFor))));

await sql`delete from items where contact_phone like '900000%'`;
for (let i = 0; i < R.length; i++) {
  const [type, title, category, description, state, city, place, daysAgo, name, photoKey, email] = R[i];
  const photo = photoKey ? photos[photoKey] : null;
  const phone = `900000${String(i + 1).padStart(4, "0")}`;
  await sql`insert into items (type, title, category, description, image_url, image_caption, state, city,
      place, event_date, contact_name, contact_phone, contact_email, embedding)
    values (${type}, ${title}, ${category}, ${description}, ${photo?.url ?? null}, ${photo?.caption ?? null},
      ${state}, ${city}, ${place}, ${istDaysAgo(daysAgo)}, ${name}, ${phone}, ${email ?? null},
      ${`[${vectors[i].join(",")}]`}::vector)`;
}
console.log(`Seeded ${R.length} reports (${R.filter((r) => r[9]).length} with photos).`);
