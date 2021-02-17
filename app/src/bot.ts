import { createServer } from 'http';
import axios from 'axios';

let ethBalance = 10;
let usdBalance = 2000;

async function requestOrderBook() {
  const res = await axios.get('https://api.deversifi.com/bfx/v2/book/tETHUSD/R0');
  return res.data;
}

function findBestPrices(orderbook): { askPrice: number, bidPrice: number } {
  // The orderbook is ordered by price from highest to lowest for asks and lowest to highest for bids
  // Therefore the best ask price will be the first of ask orders and the best bid will be the first of bid orders
  let askPrice = orderbook[0][1];
  let bidPrice;

  const order = orderbook.find(o => o[2] < 0);
  bidPrice = order[1];

  return { askPrice, bidPrice };
}

function placeRandomOrders(askPrice: number, bidPrice: number): void {
  const maxAsk = askPrice + (askPrice * 0.05);
  const minAsk = askPrice - (askPrice * 0.05);
  const maxBid = bidPrice + (bidPrice * 0.05);
  const minBid = bidPrice - (bidPrice * 0.05);
  const rand = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const randAmount = () => {
    return rand(0, 10) + Number(Math.random().toFixed(8));
  }

  for (let i = 0; i < 5; i++) {
    const randomAsk = rand(minAsk, maxAsk);
    const randomBid = rand(minBid, maxBid);
    const randomAskAmount = randAmount();
    const randomBidAmount = randAmount();
    placeAskOrder(randomAsk, randomAskAmount, askPrice);
    placeBidOrder(randomBid, randomBidAmount, bidPrice);
  }
}

function placeAskOrder(price: number, amount: number, bestAskPrice: number): void {
  console.log(`PLACE ASK @ ${price} (${amount})`);
  if (price < bestAskPrice) {
    fillAskOrder(price, amount);
  }
}

function placeBidOrder(price: number, amount: number, bestBidPrice): void {
  console.log(`PLACE BID @ ${price} (${amount})`);
  if (price > bestBidPrice) {
    fillBidOrder(price, -amount);
  }
}

function fillAskOrder(price: number, amount: number): void {
  if (usdBalance > price) {
    usdBalance -= price;
    ethBalance += amount;
  }
  console.log(`FILLED ASK @ ${price} (${amount})`);
}

function fillBidOrder(price: number, amount: number): void {
  if (ethBalance > amount) {
    usdBalance += price;
    ethBalance -= amount;
  }
  console.log(`FILLED BID @ ${price} (-${amount})`);
}

const server = createServer(async (req, res) => {
  if (req.url !== '/') {
    res.writeHead(404);
    res.end();
    return;
  }
  const orderbook = await requestOrderBook();
  const { askPrice, bidPrice } = findBestPrices(orderbook);
  placeRandomOrders(askPrice, bidPrice);

  res.writeHead(200);
  res.end();
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Service listening on localhost:3000');
});
