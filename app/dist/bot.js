"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const axios_1 = require("axios");
let ethBalance = 10;
let usdBalance = 2000;
let mutex = Promise.resolve(); // global mutex instance
async function requestOrderBook() {
    const res = await axios_1.default.get('https://api.deversifi.com/bfx/v2/book/tETHUSD/R0');
    return res.data;
}
function findBestPrices(orderbook) {
    // The orderbook is ordered by price from highest to lowest for asks and lowest to highest for bids
    // Therefore the best ask price will be the first of ask orders and the best bid will be the first of bid orders
    let askPrice = orderbook[0][1];
    let bidPrice;
    const order = orderbook.find(o => o[2] < 0);
    bidPrice = order[1];
    return { askPrice, bidPrice };
}
async function placeRandomOrders(askPrice, bidPrice) {
    const maxAsk = askPrice + (askPrice * 0.05);
    const minAsk = askPrice - (askPrice * 0.05);
    const maxBid = bidPrice + (bidPrice * 0.05);
    const minBid = bidPrice - (bidPrice * 0.05);
    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    const randAmount = () => {
        return Number((rand(0, 10) + Math.random()).toFixed(8));
    };
    const orders = [];
    for (let i = 0; i < 5; i++) {
        const randomAsk = rand(minAsk, maxAsk);
        const randomBid = rand(minBid, maxBid);
        const randomAskAmount = randAmount();
        const randomBidAmount = randAmount();
        orders.push(placeAskOrder(randomAsk, randomAskAmount, askPrice), placeBidOrder(randomBid, randomBidAmount, bidPrice));
    }
    await Promise.all(orders);
}
async function placeAskOrder(price, amount, bestAskPrice) {
    console.log(`PLACE ASK @ ${price} (${amount})`);
    if (price < bestAskPrice) {
        await fillAskOrder(price, amount);
    }
}
async function placeBidOrder(price, amount, bestBidPrice) {
    console.log(`PLACE BID @ ${price} (${amount})`);
    if (price > bestBidPrice) {
        await fillBidOrder(price, -amount);
    }
}
async function fillAskOrder(price, amount) {
    mutex = mutex.then(() => {
        if (usdBalance > price) {
            usdBalance -= price;
            ethBalance += amount;
            console.log(`FILLED ASK @ ${price} (${amount})`);
        }
    });
    return mutex;
}
async function fillBidOrder(price, amount) {
    mutex = mutex.then(() => {
        if (ethBalance > amount) {
            usdBalance += price;
            ethBalance -= amount;
            console.log(`FILLED BID @ ${price} (${amount})`);
        }
    });
    return mutex;
}
async function getBalances() {
    mutex = mutex.then(() => {
        console.log('Overall market assets balance:', { ETH: ethBalance, USD: usdBalance });
    });
    return mutex;
}
const server = http_1.createServer(async (req, res) => {
    if (req.url !== '/') {
        res.writeHead(404);
        res.end();
        return;
    }
    const orderbook = await requestOrderBook();
    const { askPrice, bidPrice } = findBestPrices(orderbook);
    await placeRandomOrders(askPrice, bidPrice);
    await getBalances();
    res.writeHead(200);
    res.end();
});
server.listen(3000, '0.0.0.0', () => {
    console.log('Service listening on localhost:3000');
});
//# sourceMappingURL=bot.js.map