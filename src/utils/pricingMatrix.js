/**
 * TERRA AI — NATIONAL LAND PRICE DATABASE
 * Source: HassConsult Land Price Index Q3/Q4 2025, BuyRentKenya, KenyaPropertyCentre, Realtors.co.ke
 * Last updated: Early 2026
 * All prices in KES per ACRE (residential land, mid-market estimate).
 * Commercial land is typically 2–5× these figures.
 * Use ONLY as a fraud-detection baseline, not as a valuation.
 *
 * Confidence tiers:
 *   HIGH   = HassConsult indexed data, high transaction volume
 *   MEDIUM = Multiple listing aggregator data, moderate volume
 *   LOW    = Sparse listing data, rural/emerging areas — treat as rough guide only
 */

// ─────────────────────────────────────────────────
// NAIROBI CITY SUBURBS (HassConsult Tracked — HIGH Confidence)
// Average: KES 226.8M/acre (Q4 2025)
// ─────────────────────────────────────────────────
export const PRICING_MATRIX_PER_ACRE = {

  // === NAIROBI PRIME SUBURBS ===
  "Upperhill":          545800000,  // KES 545.8M — HassConsult Q2 2025
  "Westlands":          498300000,  // KES 498.3M — HassConsult Q2 2025
  "Kilimani":           400000000,  // KES ~400M — multiple sources
  "Parklands":          380000000,
  "Spring Valley":      360000000,  // 13.3% YoY growth, Q3 2025
  "Muthaiga":           350000000,
  "Lavington":          320000000,  // Led Q1 2026 growth at 4.2%
  "Upper Hill":         300000000,
  "Kileleshwa":         280000000,
  "Riverside":          270000000,
  "Loresho":            260000000,
  "Runda":              280000000,
  "Karen":              250000000,  // Zoning limits slow growth
  "Gigiri":             240000000,
  "Hurlingham":         220000000,
  "Milimani":           200000000,
  "Woodlands":          190000000,
  "Langata":            170000000,
  "South C":            160000000,
  "South B":            150000000,
  "Madaraka":           160000000,  // ¼ acre ~KES 40M per listing
  "Nairobi West":       140000000,
  "Industrial Area":    130000000,
  "Eastleigh":          120000000,
  "Pangani":            110000000,
  "Buru Buru":          100000000,
  "Umoja":               90000000,
  "Donholm":             85000000,
  "Embakasi":            80000000,
  "Imara Daima":         75000000,
  "Utawala":             70000000,
  "Ruai":                60000000,

  // === NAIROBI SATELLITE TOWNS (HassConsult Tracked — HIGH Confidence) ===
  // Average: KES 32.3M/acre (Q3 2025), rising to KES 33M (Q1 2026)
  "Juja":                25100000,  // Top performer, 15.5% annual growth Q2 2025
  "Ruaka":               35000000,  // HassConsult tracked
  "Syokimau":            32000000,  // HassConsult tracked
  "Kikuyu":              30000000,
  "Thika":               28000000,
  "Athi River":          22000000,
  "Ruiru":               26000000,
  "Ngong":               21000000,  // KES 21M/acre — HassConsult Q2 2025
  "Kitengela":           18800000,  // HassConsult Q3 2025
  "Kiserian":            13400000,  // Most affordable satellite, HassConsult Q3 2025
  "Limuru":              22000000,
  "Kiambu Town":         28000000,
  "Tigoni":              25000000,
  "Banana":              24000000,
  "Githurai":            35000000,
  "Kahawa":              38000000,
  "Kasarani":            40000000,
  "Roysambu":            45000000,
  "Zimmermann":          35000000,
  "Kahawa Wendani":      30000000,
  "Membley":             28000000,
  "Joska":               12000000,
  "Malaa":               10000000,
  "Kamulu":              14000000,
  "Matuu":                8000000,
  "Isinya":               8000000,
  "Mlolongo":            20000000,
  "Mavoko":              18000000,
  "Katani":              15000000,

  // === KIAMBU COUNTY (MEDIUM Confidence) ===
  "Kiambu":              28000000,
  "Thika Town":          28000000,
  "Thika Road (off)":    20000000,
  "Thigio":              22000000,
  "Wangige":             25000000,
  "Karuri":              22000000,
  "Ndenderu":            20000000,
  "Ruiru Town":          26000000,
  "Githunguri":          15000000,
  "Gatundu":             12000000,
  "Lari":                 8000000,
  "Kinoo":               30000000,

  // === MACHAKOS COUNTY (MEDIUM Confidence) ===
  "Machakos Town":       12000000,
  "Athi River Town":     22000000,  // Also called Mavoko
  "Mlolongo Area":       18000000,
  "Syokimau Area":       28000000,
  "Mwala":                5000000,
  "Kathiani":             4000000,
  "Kangundo":             5000000,
  "Tala":                 4000000,
  "Masinga":              3000000,
  "Yatta":                4000000,

  // === KAJIADO COUNTY (MEDIUM Confidence) ===
  "Kajiado Town":         6000000,
  "Ngong Area":          21000000,
  "Rongai":              18000000,
  "Kiserian Area":       13000000,
  "Isinya Area":          7000000,
  "Kitengela Area":      18000000,
  "Olkejuado":            5000000,
  "Namanga":              3000000,
  "Loitokitok":           2500000,
  "Duka Moja":            2000000,
  "Bissel":               2000000,

  // === MURANGA COUNTY (MEDIUM Confidence) ===
  "Murang'a Town":        8000000,
  "Thika (Murang'a side)": 10000000,
  "Kandara":              5000000,
  "Kenol":                7000000,
  "Maragua":              5000000,
  "Kigumo":               4000000,
  "Kangema":              3500000,
  "Mathioya":             3000000,

  // === NYERI COUNTY (MEDIUM Confidence) ===
  "Nyeri Town":          10000000,
  "Nyeri Outskirts":      6000000,  // Per listing data ~KES 3M/half acre
  "Karatina":             7000000,
  "Othaya":               5000000,
  "Mukurweini":           3500000,
  "Tetu":                 3000000,
  "Kieni":                2500000,

  // === KIRINYAGA COUNTY (MEDIUM Confidence) ===
  "Kerugoya":             7000000,
  "Kutus":                6000000,
  "Sagana":               7000000,
  "Wanguru":              4000000,
  "Mwea":                 5000000,

  // === EMBU COUNTY (MEDIUM Confidence) ===
  "Embu Town":            8000000,
  "Runyenjes":            4000000,
  "Meru-Embu Corridor":   3500000,
  "Ishiara":              3000000,

  // === MERU COUNTY (MEDIUM Confidence) ===
  "Meru Town":            8000000,
  "Meru Outskirts":       5000000,
  "Nkubu":                4000000,
  "Timau":                3500000,
  "Laare":                2500000,
  "Maua":                 4000000,
  "Miathene":             3000000,

  // === THARAKA-NITHI COUNTY (LOW Confidence) ===
  "Chuka":                4000000,
  "Marimanti":            2000000,

  // === NAKURU COUNTY (MEDIUM-HIGH Confidence) ===
  // Nakuru is Kenya's 3rd largest economy
  "Nakuru Town":          8000000,
  "Nakuru CBD":          15000000,
  "Nakuru Suburbs":       5000000,
  "Naivasha Town":        6000000,  // Also peri-urban Nairobi escape
  "Naivasha Outskirts":   3500000,
  "Gilgil":               4000000,
  "Bahati":               3000000,
  "Rongai (Nakuru)":      2500000,
  "Njoro":                2500000,
  "Molo":                 2000000,
  "Subukia":              2000000,
  "Kuresoi":              1500000,

  // === NYANDARUA COUNTY (MEDIUM Confidence) ===
  "Ol Kalou":             4000000,
  "Engineer":             3500000,
  "Njabini":              2500000,
  "Nyahururu":            4500000,

  // === LAIKIPIA COUNTY (MEDIUM Confidence) ===
  "Nanyuki Town":         5000000,
  "Nanyuki Outskirts":    2500000,  // ~KES 800K–3M small towns
  "Rumuruti":             1500000,
  "Dol Dol":              1000000,
  "Nyahururu (Laikipia)": 3000000,

  // === MOMBASA COUNTY (HIGH Confidence) ===
  // Coastal land: KES 5M–15M/acre average; Diani up to KES 20M
  "Mombasa CBD":         50000000,
  "Nyali":               20000000,
  "Nyali Beach":         30000000,
  "Bamburi":             15000000,
  "Bombolulu":           12000000,
  "Shanzu":              12000000,
  "Kisauni":             10000000,
  "Likoni":               8000000,
  "Changamwe":           10000000,
  "Miritini":             8000000,
  "Jomvu":                7000000,
  "Port Reitz":           9000000,

  // === KWALE COUNTY — SOUTH COAST (MEDIUM Confidence) ===
  "Diani":               20000000,  // Tourist boom, up to KES 20M/acre
  "Ukunda":              15000000,
  "Diani Beach":         25000000,
  "Msambweni":            8000000,
  "Lunga Lunga":          3000000,
  "Kwale Town":           4000000,
  "Shimba Hills area":    3000000,

  // === KILIFI COUNTY — NORTH COAST (MEDIUM Confidence) ===
  "Kilifi Town":          8000000,
  "Watamu":              12000000,  // Tourist area, high demand
  "Malindi":             10000000,
  "Malindi Beach":       15000000,
  "Vipingo":              8000000,
  "Takaungu":             7000000,
  "Kaloleni":             3000000,
  "Ganze":                2000000,

  // === TAITA-TAVETA COUNTY (MEDIUM Confidence) ===
  "Voi":                  4000000,
  "Wundanyi":             3000000,
  "Taveta":               3500000,
  "Mwatate":              2500000,

  // === LAMU COUNTY (MEDIUM Confidence) ===
  "Lamu Town":           10000000,
  "Lamu Island":         12000000,
  "Manda Island":        15000000,
  "Mokowe":               4000000,
  "Hindi":                3000000,

  // === TANA RIVER COUNTY (LOW Confidence) ===
  "Hola":                 1500000,
  "Garsen":               1500000,
  "Bura":                 1000000,

  // === KISUMU COUNTY (MEDIUM-HIGH Confidence) ===
  // Growing market, KES 2M–10M per acre
  "Kisumu CBD":          20000000,
  "Kisumu Town":         12000000,
  "Milimani (Kisumu)":   15000000,
  "Kondele":              8000000,
  "Nyalenda":             6000000,
  "Mamboleo":             5000000,
  "Ahero":                4000000,
  "Maseno":               5000000,
  "Muhoroni":             3000000,
  "Nyando":               3000000,
  "Katito":               3500000,

  // === SIAYA COUNTY (LOW-MEDIUM Confidence) ===
  "Siaya Town":           4000000,
  "Bondo":                3000000,
  "Ugunja":               2500000,
  "Ukwala":               2000000,

  // === HOMA BAY COUNTY (LOW-MEDIUM Confidence) ===
  "Homa Bay Town":        4000000,
  "Oyugis":               3000000,
  "Kendu Bay":            3000000,
  "Mbita":                4000000,  // Lake-adjacent premium

  // === MIGORI COUNTY (LOW-MEDIUM Confidence) ===
  "Migori Town":          4000000,
  "Rongo":                3000000,
  "Awendo":               3000000,
  "Kehancha":             2000000,

  // === KISII COUNTY (MEDIUM Confidence) ===
  // Eldoret/Kisii creeping to KES 3M+
  "Kisii Town":           6000000,
  "Kisii Suburbs":        4000000,
  "Ogembo":               3000000,
  "Keroka":               3000000,
  "Nyamache":             2500000,

  // === NYAMIRA COUNTY (LOW-MEDIUM Confidence) ===
  "Nyamira Town":         4000000,
  "Nyansiongo":           2500000,
  "Manga":                2000000,

  // === UASIN GISHU COUNTY — ELDORET (MEDIUM-HIGH Confidence) ===
  "Eldoret Town":         8000000,
  "Eldoret CBD":         12000000,
  "Elgon View":          10000000,
  "Langas":               6000000,
  "Huruma (Eldoret)":     5000000,
  "Kipkenyo":             6000000,
  "Kapsaret":             4000000,
  "Burnt Forest":         3000000,
  "Moiben":               3000000,
  "Ainabkoi":             3500000,

  // === NANDI COUNTY (LOW-MEDIUM Confidence) ===
  "Kapsabet":             4000000,
  "Nandi Hills":          3000000,
  "Kobujoi":              2500000,

  // === TRANS NZOIA COUNTY (MEDIUM Confidence) ===
  "Kitale Town":          5000000,
  "Kitale Outskirts":     3000000,
  "Saboti":               2500000,
  "Kiminini":             3000000,

  // === WEST POKOT COUNTY (LOW Confidence) ===
  "Kapenguria":           2000000,
  "Makutano (West Pokot)": 1500000,

  // === ELGEYO-MARAKWET COUNTY (LOW Confidence) ===
  "Iten":                 3000000,  // Running mecca, growing demand
  "Eldama Ravine":        2500000,
  "Kamariny":             2000000,

  // === BARINGO COUNTY (LOW Confidence) ===
  "Kabarnet":             2500000,
  "Eldama Ravine (Baringo)": 2000000,
  "Marigat":              1500000,
  "Mogotio":              1500000,

  // === SAMBURU COUNTY (LOW Confidence) ===
  "Maralal":              1500000,
  "Baragoi":               800000,

  // === TURKANA COUNTY (LOW Confidence) ===
  "Lodwar":               2000000,  // Oil discovery premium
  "Lokichoggio":           800000,
  "Kakuma":               1500000,

  // === MARSABIT COUNTY (LOW Confidence) ===
  "Marsabit Town":        1200000,
  "Moyale":               2000000,  // Ethiopia border trade premium

  // === ISIOLO COUNTY (LOW Confidence) ===
  "Isiolo Town":          3000000,  // LAPSSET corridor premium
  "Merti":                 800000,

  // === MANDERA COUNTY (LOW Confidence) ===
  "Mandera Town":         2000000,  // Border town premium
  "Elwak":                 800000,

  // === WAJIR COUNTY (LOW Confidence) ===
  "Wajir Town":           1500000,
  "Habaswein":             700000,

  // === GARISSA COUNTY (LOW Confidence) ===
  "Garissa Town":         3000000,
  "Dadaab":                600000,
  "Hulugho":               500000,

  // === TANA RIVER COUNTY ===
  "Tana River (general)":  1000000,

  // === BUNGOMA COUNTY (MEDIUM Confidence) ===
  "Bungoma Town":         4000000,
  "Webuye":               3000000,
  "Kimilili":             2500000,
  "Chwele":               2000000,

  // === BUSIA COUNTY (MEDIUM Confidence) ===
  "Busia Town":           4000000,  // Border trade premium
  "Malaba":               3500000,
  "Nambale":              2000000,

  // === VIHIGA COUNTY (MEDIUM Confidence) ===
  "Vihiga Town":          3500000,
  "Mbale":                3000000,
  "Luanda":               3000000,

  // === KAKAMEGA COUNTY (MEDIUM Confidence) ===
  "Kakamega Town":        5000000,
  "Kakamega CBD":         7000000,
  "Mumias":               3500000,
  "Butere":               3000000,
  "Shinyalu":             2500000,

  // === BOMET COUNTY (LOW-MEDIUM Confidence) ===
  "Bomet Town":           4000000,
  "Sotik":                3000000,
  "Longisa":              2500000,

  // === KERICHO COUNTY (MEDIUM Confidence) ===
  "Kericho Town":         5000000,
  "Litein":               3500000,
  "Bureti":               3000000,

  // === NAROK COUNTY (MEDIUM Confidence) ===
  "Narok Town":           5000000,
  "Narok Outskirts":      3500000,  // Maasai Mara proximity premium
  "Kilgoris":             2500000,

  // === KAJIADO SOUTH & LOITOKITOK (LOW Confidence) ===
  "Loitokitok Area":      2000000,
  "Magadi":               1500000,

  // === MACHAKOS INTERIOR (LOW Confidence) ===
  "Machakos Interior":    2500000,
  "Mbiuni":               2000000,

  // ─────────────────────────────────────────────────
  // FALLBACK TIERS — used when ward/place_name doesn't match
  // ─────────────────────────────────────────────────

  // Nairobi prime suburb (unmatched)
  "DEFAULT_NAIROBI_PRIME":       200000000,
  // Nairobi satellite town (unmatched)
  "DEFAULT_NAIROBI_SATELLITE":    32000000,
  // Mombasa / Kilifi / Kwale coast (unmatched)
  "DEFAULT_COASTAL":             10000000,
  // Major upcountry town: Eldoret, Kisumu, Nakuru, Meru, Nyeri, Kisii area
  "DEFAULT_MAJOR_UPCOUNTRY":      6000000,
  // Smaller upcountry towns
  "DEFAULT_SMALL_UPCOUNTRY":      3500000,
  // Peri-urban/emerging satellite
  "DEFAULT_PERI_URBAN":           4000000,
  // Agricultural/rural interior
  "DEFAULT_RURAL":                 800000,
  // Arid/semi-arid ASAL counties: Turkana, Marsabit, Mandera, Wajir, Garissa, Tana River
  "DEFAULT_ASAL":                  600000,
};

/**
 * Fuzzy-match helper: finds the closest pricing key for a given location string.
 *
 * Strategy (in order):
 *   1. Exact match (case-insensitive) — globally
 *   2. County-aware partial match — only scan keys that are plausibly in the same county/region
 *   3. Global partial match — with minimum token length guard (>= 4 chars) to prevent
 *      spurious cross-county hits (e.g. "Jomvu" matching "Runda" because of a substring)
 *   4. County fallback tiers (DEFAULT_*)
 *
 * @param {string} locationInput - ward name, place name, or county from payload
 * @param {string} [county] - county name for county-aware matching
 * @returns {{ pricePerAcre: number, matchedKey: string, confidence: string }}
 */

// County-to-key-prefix mapping for county-aware partial match
const _COUNTY_KEY_GROUPS = {
  nairobi:   ["Upperhill","Westlands","Kilimani","Parklands","Spring Valley","Muthaiga","Lavington",
               "Upper Hill","Kileleshwa","Riverside","Loresho","Runda","Karen","Gigiri","Hurlingham",
               "Milimani","Woodlands","Langata","South C","South B","Madaraka","Nairobi West",
               "Industrial Area","Eastleigh","Pangani","Buru Buru","Umoja","Donholm","Embakasi",
               "Imara Daima","Utawala","Ruai",
               "Juja","Ruaka","Syokimau","Kikuyu","Thika","Athi River","Ruiru","Ngong",
               "Kitengela","Kiserian","Limuru","Kiambu Town","Tigoni","Banana","Githurai",
               "Kahawa","Kasarani","Roysambu","Zimmermann","Kahawa Wendani","Membley",
               "Joska","Malaa","Kamulu","Matuu","Isinya","Mlolongo","Mavoko","Katani"],
  mombasa:   ["Mombasa CBD","Nyali","Nyali Beach","Bamburi","Bombolulu","Shanzu","Kisauni",
               "Likoni","Changamwe","Miritini","Jomvu","Port Reitz"],
  kwale:     ["Diani","Ukunda","Diani Beach","Msambweni","Lunga Lunga","Kwale Town","Shimba Hills area"],
  kilifi:    ["Kilifi Town","Watamu","Malindi","Malindi Beach","Vipingo","Takaungu","Kaloleni","Ganze"],
  kisumu:    ["Kisumu CBD","Kisumu Town","Milimani (Kisumu)","Kondele","Nyalenda","Mamboleo",
               "Ahero","Maseno","Muhoroni","Nyando","Katito"],
  nakuru:    ["Nakuru Town","Nakuru CBD","Nakuru Suburbs","Naivasha Town","Naivasha Outskirts",
               "Gilgil","Bahati","Rongai (Nakuru)","Njoro","Molo","Subukia","Kuresoi"],
  "uasin gishu": ["Eldoret Town","Eldoret CBD","Elgon View","Langas","Huruma (Eldoret)",
                  "Kipkenyo","Kapsaret","Burnt Forest","Moiben","Ainabkoi"],
  kiambu:    ["Kiambu","Thika Town","Thika Road (off)","Thigio","Wangige","Karuri","Ndenderu",
               "Ruiru Town","Githunguri","Gatundu","Lari","Kinoo"],
};

export function getPriceEstimate(locationInput, county = "") {
  const input = locationInput?.trim().toLowerCase() || "";
  const countyLower = county?.trim().toLowerCase() || "";
  const allKeys = Object.keys(PRICING_MATRIX_PER_ACRE).filter(k => !k.startsWith("DEFAULT_"));

  // 1. Exact match (case-insensitive) — globally
  const exactKey = allKeys.find((k) => k.toLowerCase() === input);
  if (exactKey) {
    return { pricePerAcre: PRICING_MATRIX_PER_ACRE[exactKey], matchedKey: exactKey, confidence: "HIGH" };
  }

  // 2. County-aware partial match — only within keys for the identified county.
  // This prevents "Jomvu" (Mombasa) from accidentally matching a Nairobi key.
  const countyGroup = Object.entries(_COUNTY_KEY_GROUPS).find(([cKey]) => countyLower.includes(cKey));
  if (countyGroup && input.length >= 3) {
    const groupKeys = countyGroup[1];
    const countyExact = groupKeys.find((k) => k.toLowerCase() === input);
    if (countyExact) {
      return { pricePerAcre: PRICING_MATRIX_PER_ACRE[countyExact], matchedKey: countyExact, confidence: "HIGH" };
    }
    const countyPartial = groupKeys.find(
      (k) => k.toLowerCase().includes(input) || (input.length >= 4 && input.includes(k.toLowerCase()))
    );
    if (countyPartial) {
      return { pricePerAcre: PRICING_MATRIX_PER_ACRE[countyPartial], matchedKey: countyPartial, confidence: "MEDIUM" };
    }
  }

  // 3. Global partial match — with minimum 4-character guard to avoid short-token false positives
  if (input.length >= 4) {
    const partialKey = allKeys.find(
      (k) => k.toLowerCase().includes(input) || input.includes(k.toLowerCase())
    );
    if (partialKey) {
      return { pricePerAcre: PRICING_MATRIX_PER_ACRE[partialKey], matchedKey: partialKey, confidence: "MEDIUM" };
    }
  }

  // 4. County-based tier fallback
  if (countyLower.includes("nairobi")) {
    return { pricePerAcre: PRICING_MATRIX_PER_ACRE["DEFAULT_NAIROBI_SATELLITE"], matchedKey: "Nairobi (general)", confidence: "LOW" };
  }
  if (countyLower.includes("mombasa") || countyLower.includes("kilifi") || countyLower.includes("kwale") || countyLower.includes("lamu")) {
    return { pricePerAcre: PRICING_MATRIX_PER_ACRE["DEFAULT_COASTAL"], matchedKey: "Coastal Kenya (general)", confidence: "LOW" };
  }
  if (["kisumu","nakuru","eldoret","uasin gishu","meru","nyeri","kisii","kakamega","kiambu","machakos"].some(c => countyLower.includes(c))) {
    return { pricePerAcre: PRICING_MATRIX_PER_ACRE["DEFAULT_MAJOR_UPCOUNTRY"], matchedKey: `${county} (general)`, confidence: "LOW" };
  }
  if (["turkana","marsabit","mandera","wajir","garissa","tana river","isiolo","samburu"].some(c => countyLower.includes(c))) {
    return { pricePerAcre: PRICING_MATRIX_PER_ACRE["DEFAULT_ASAL"], matchedKey: `${county} (ASAL)`, confidence: "LOW" };
  }

  // 5. Generic rural fallback
  return { pricePerAcre: PRICING_MATRIX_PER_ACRE["DEFAULT_RURAL"], matchedKey: "Unknown (rural estimate)", confidence: "LOW" };
}

/**
 * Plot size conversion to acres.
 * Standard Kenyan plot size names → decimal acres.
 */
export const PLOT_SIZE_TO_ACRES = {
  "50x100 ft (0.115 acres)":  0.115,
  "100x100 ft (0.23 acres)":  0.23,
  "40x80 ft (0.073 acres)":   0.073,
  "Quarter Acre (0.25)":      0.25,
  "Half Acre (0.5)":          0.5,
  "1 Acre (1.0)":             1.0,
  "2 Acres (2.0)":            2.0,
  "5 Acres (5.0)":            5.0,
};

/**
 * Fraud detection threshold.
 * If a broker's asking price is more than this % above the matrix price,
 * show a red overcharge warning.
 */
export const OVERCHARGE_THRESHOLD_PERCENT = 20;
