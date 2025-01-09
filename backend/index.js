const axios = require("axios");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const prisma = new PrismaClient();
require('dotenv').config();

const limiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 2 * 60,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
    message: 'Too many requests, please try again later.',
})
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(limiter);

app.get("/data/:id", async (req, res) => {
    const itemid = req.params.id;
    if (!itemid) {
        return res.status(400).json({ error: "Item ID is required" });
    }
    const data = await prisma.data.findMany({
        where: { 
            itemid: itemid,
         },
    });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: "Item not found" });
    }
    res.json(data);
});

app.get("/getall", async (req, res) => {
    const data = await prisma.data.findMany({
        select: {
            itemid: true,
        },
    });
    res.json(data);
});

async function mainLoop() {
    const res = await axios.get("https://api.hypixel.net/v2/skyblock/bazaar").then((res) => res.data);
    const data = res.products;
    
    for (const [itemId, itemData] of Object.entries(data)) {
        await prisma.data.create({
            data: {
                itemid: itemId,
                data: itemData,
            },
        });
    }
}

async function main() {
    console.log("Starting main loop");
    await mainLoop();
    setInterval(mainLoop, 1000 * 60 * 5);
}

app.listen(PORT, () => {
    console.log("Server is running on port http://localhost:" + PORT);
});

main();