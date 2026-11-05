require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const connectDatabase = require("../config/database");
const productModel = require("../models/product-model");

const products = [
    {
        name: "The Fold Tote",
        category: "Bags",
        price: 248,
        stock: 24,
        image: "https://images.unsplash.com/photo-1691480150204-66dd1eb77391?auto=format&fit=crop&w=900&q=85",
        badge: "New",
        color: "Sand",
    },
    {
        name: "Serein Serum",
        category: "Beauty",
        price: 68,
        stock: 8,
        image: "https://images.unsplash.com/photo-1772191530787-b9546da02fbc?auto=format&fit=crop&w=900&q=85",
        color: "Ivory",
    },
    {
        name: "Arc Vessel",
        category: "Objects",
        price: 120,
        stock: 42,
        image: "https://images.unsplash.com/photo-1660721671073-e139688fa3cf?auto=format&fit=crop&w=900&q=85",
        badge: "Sale",
        color: "Ivory",
    },
    { name: "Isla Scarf", category: "Textiles", price: 96, stock: 0, status: "Draft", color: "Blush" },
    { name: "Noma Belt", category: "Belts", price: 96, stock: 5, color: "Sand" },
    { name: "Vale Sunglasses", category: "Eyewear", price: 138, stock: 16, color: "Olive" },
    { name: "Koa Candle", category: "Home", price: 48, stock: 22, color: "Ivory" },
    { name: "Dune Wallet", category: "Small leather goods", price: 82, stock: 3, color: "Terracotta" },
    { name: "Form Hair Claw", category: "Hair accessories", price: 32, stock: 14, color: "Olive" },
];

async function seed() {
    await connectDatabase();
    for (const product of products) {
        await productModel.updateOne(
            { name: product.name },
            { $setOnInsert: product },
            { upsert: true }
        );
    }
    console.log(`Catalog ready (${products.length} starter products).`);
}

seed()
    .then(() => require("mongoose").disconnect())
    .catch(async (error) => {
        console.error("Unable to seed the catalog:", error.message);
        await require("mongoose").disconnect();
        process.exitCode = 1;
    });
