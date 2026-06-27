require("./db");

const Product = require("./models/product");

async function insertProducts() {
  try {
    await Product.insertMany([
      {
        category: "Face Care",
        name: "Cleanser",
        price: 299,
        tags: ["Gentle", "Hydrating", "Daily Care"],
        details: "A gentle cleanser that removes dirt, oil, and makeup while maintaining the skin’s natural moisture barrier.",
        howToUse: "Massage onto wet face for 30–60 seconds, then rinse with water."
      },
      {
        category: "Face Care",
        name: "Serum",
        price: 499,
        tags: ["Brightening", "Lightweight", "Glow"],
        details: "Concentrated formula that targets dullness, uneven skin tone, and hydration.",
        howToUse: "Apply 2–3 drops after cleansing before moisturizer."
      },
      {
        category: "Face Care",
        name: "Moisturizer",
        price: 399,
        tags: ["Hydrating", "Soft Skin", "Daily"],
        details: "Locks in moisture and keeps skin smooth all day.",
        howToUse: "Apply evenly on clean face morning and night."
      },
      {
        category: "Face Care",
        name: "Sunscreen",
        price: 499,
        tags: ["SPF 50", "UV Protection", "Non-Greasy"],
        details: "Protects skin from harmful UVA and UVB rays.",
        howToUse: "Apply generously 15 minutes before sun exposure."
      },
      {
        category: "Face Care",
        name: "Face Wash",
        price: 249,
        tags: ["Fresh", "Oil Control", "Clean"],
        details: "Removes excess oil and impurities for a refreshed feel.",
        howToUse: "Use twice daily on damp skin."
      },
      {
        category: "Face Care",
        name: "Face Mask",
        price: 349,
        tags: ["Detox", "Glow", "Nourishing"],
        details: "Deep-cleansing mask that refreshes and revitalizes skin.",
        howToUse: "Leave on for 10–15 minutes, then rinse."
      },
      {
        category: "Face Care",
        name: "Face Scrub",
        price: 299,
        tags: ["Exfoliating", "Smooth", "Bright"],
        details: "Removes dead skin cells for softer, brighter skin.",
        howToUse: "Massage gently 1–2 times weekly."
     },
     {  
        category: "Face Care",
        name: "Toner",
        price: 349,
        tags: ["Pore Care", "Refreshing", "Balance"],
        details: "Balances skin and prepares it for skincare.",
        howToUse: "Apply with a cotton pad after cleansing."
     },
     {
        category: "Face Care",
        name: "Essence",
        price: 549,
        tags: ["Hydration", "Radiance", "Lightweight"],
        details: "Boosts hydration and improves skin texture.",
        howToUse: "Pat gently into clean skin."
     },
     {
        category: "Face Care",
        name: "Eye Care",
        price: 399,
        tags: ["Dark Circles", "Hydration", "Firming"],
        details: "Hydrates and refreshes the under-eye area.",
        howToUse: "Dab gently around the eyes."
     },
     {

        category: "Face Care",
        name: "Lip Care",
        price: 199,
        tags: ["Soft Lips", "Repair", "Nourishing"],
        details: "Moisturizes and protects dry lips.",
        howToUse: "Apply whenever needed."
     },
     {
        category: "Hair Care",
        name: "Shampoo",
        price: 349,
        tags: ["Clean", "Nourishing", "Fresh"],
        details: "Cleanses hair while removing dirt and excess oil.",
        howToUse: "Massage into wet hair and rinse."
     },
     {
        category: "Hair Care",
        name: "Conditioner",
        price: 349,
        tags: ["Smooth", "Soft", "Repair"],
        details: "Makes hair softer and easier to manage.",
        howToUse: "Apply after shampoo, leave for 2–3 minutes, rinse."
     },
     {
        category: "Hair Care",
        name: "Hair Serum",
        price: 499,
        tags: ["Shine", "Anti-Frizz", "Smooth"],
        details: "Controls frizz and adds shine.",
        howToUse: "Apply to damp or dry hair."
     },
     {
        category: "Hair Care",
        name: "Hair Oil",
        price: 399,
        tags: ["Nourishing", "Healthy", "Strong"],
        details: "Deeply nourishes hair and scalp.",
        howToUse: "Massage into scalp before washing."
     },
     {
        category: "Hair Care",
        name: "Hair Mask",
        price: 549,
        tags: ["Repair", "Deep Care", "Hydration"],
        details: "Intense conditioning treatment for damaged hair.",
        howToUse: "Use once or twice weekly."
     },
     {
        category: "Hair Care",
        name: "Hair Spray",
        price: 299,
        tags: ["Hold", "Styling", "Flexible"],
        details: "Keeps hairstyles in place.",
        howToUse: "Spray evenly from 20–30 cm away."
     },
     {
        category: "Hair Care",
        name: "Hair Cream",
        price: 349,
        tags: ["Moisture", "Smooth", "Styling"],
        details: "Reduces frizz and improves softness.",
        howToUse: "Apply to damp hair."
     },
     {
        category: "Hair Care",
        name: "Hair Gel",
        price: 249,
        tags: ["Strong Hold", "Shine", "Style"],
        details: "Long-lasting styling gel.",
        howToUse: "Apply evenly to hair."
     },
     {
        category: "Hair Care",
        name: "Hair Growth",
        price: 699,
        tags: ["Healthy Roots", "Strength", "Care"],
        details: "Promotes healthier-looking hair.",
        howToUse: "Massage into scalp daily."
     },
     {
        category: "Hair Care",
        name: "Dry Shampoo",
        price: 399,
        tags: ["Fresh", "Oil Control", "Quick"],
        details: "Refreshes hair between washes.",
        howToUse: "Spray onto roots and brush through."
     },
     {
        category: "Body Care",
        name: "Body Wash",
        price: 299,
        tags: ["Refreshing", "Hydrating", "Gentle"],
        details: "Cleanses while keeping skin moisturized.",
        howToUse: "Use during shower and rinse."
     },
     {
        category: "Body Care",
        name: "Soap",
        price: 149,
        tags: ["Fresh", "Gentle", "Clean"],
        details: "Everyday cleansing bar.",
        howToUse: "Lather and rinse."
     },
     {
        category: "Body Care",
        name: "Body Lotion",
        price: 399,
        tags: ["Moisture", "Soft Skin", "Daily"],
        details: "Hydrates dry skin.",
        howToUse: "Apply after bathing."
     },
     {
        category: "Body Care",
        name: "Body Cream",
        price: 449,
        tags: ["Rich", "Smooth", "Hydration"],
        details: "Deep moisturizing cream.",
        howToUse: "Massage into skin."
     },
     {
        category: "Body Care",
        name: "Body Scrub",
        price: 349,
        tags: ["Exfoliating", "Glow", "Smooth"],
        details: "Removes dead skin cells.",
        howToUse: "Use 1-2 times weekly."
     },
     {
        category: "Body Care",
        name: "Body Oils",
        price: 499,
        tags: ["Nourishing", "Glow", "Silky"],
        details: "Leaves skin soft and radiant.",
        howToUse: "Massage onto damp skin."
     },
     {
        category: "Body Care",
        name: "Hand Care",
        price: 249,
        tags: ["Soft Hands", "Repair", "Moisture"],
        details: "Hydrates and protects hands.",
        howToUse: "Apply as needed."
     },
     {
        category: "Body Care",
        name: "Foot Care",
        price: 299,
        tags: ["Heel Repair", "Comfort", "Smooth"],
        details: "Softens rough feet.",
        howToUse: "Massage before bedtime."
     },
     {
        category: "Body Care",
        name: "Spray",
        price: 299,
        tags: ["Fresh", "Long Lasting", "Body Mist"],
        details: "Light fragrance for daily freshness.",
        howToUse: "Spray onto clean skin."
     },
     {
        category: "Body Care",
        name: "Body Butter",
        price: 549,
        tags: ["Ultra Moisture", "Rich", "Nourishing"],
        details: "Deep hydration for dry skin.",
        howToUse: "Apply after showering."
     }
    ]);

    console.log("All Products Added Successfully");
    process.exit();
  } catch (error) {
    console.log(error);
  }
}

insertProducts();