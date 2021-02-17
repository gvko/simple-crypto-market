// import { createServer } from 'http';
import axios from 'axios';

let ethBalance = 10;
let usdBalance = 2000;
let mutex = Promise.resolve(); // global mutex instance

/**
 * Get the orderbook from the DeversiFi API
 */
async function requestOrderBook() {
  const res = await axios.get('https://api.deversifi.com/bfx/v2/book/tETHUSD/R0');
  return res.data;
}

/**
 * Find the best bid and best ask prices from the orderbook.
 * The orderbook is ordered by price from highest to lowest for asks and lowest to highest for bids.
 * Therefore, the best ask price will be the first of ask orders and the best bid will be the first of bid orders.
 *
 * @param orderbook
 */
function findBestPrices(orderbook): { askPrice: number, bidPrice: number } {
  let askPrice = orderbook[0][1];
  let bidPrice;

  const order = orderbook.find(o => o[2] < 0);
  bidPrice = order[1];

  return { askPrice, bidPrice };
}

/**
 * Find the margin (+/- 5%) of the best bid and ask orders.
 * According to that, place 5 random bid and 5 random ask orders.
 *
 * @param askPrice
 * @param bidPrice
 */
async function placeRandomOrders(askPrice: number, bidPrice: number): Promise<void> {
  const maxAsk = askPrice + (askPrice * 0.05);
  const minAsk = askPrice - (askPrice * 0.05);
  const maxBid = bidPrice + (bidPrice * 0.05);
  const minBid = bidPrice - (bidPrice * 0.05);
  const rand = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const randAmount = () => {
    return Number((rand(0, 10) + Math.random()).toFixed(8));
  }

  const orders = [];
  for (let i = 0; i < 5; i++) {
    const randomAsk = rand(minAsk, maxAsk);
    const randomBid = rand(minBid, maxBid);
    const randomAskAmount = randAmount();
    const randomBidAmount = randAmount();
    orders.push(
      placeAskOrder(randomAsk, randomAskAmount, askPrice),
      placeBidOrder(randomBid, randomBidAmount, bidPrice)
    );
  }
  await Promise.all(orders);
}

/**
 * Simply place an ask order: log the event and if the price is smaller than the best ask price - fill the order.
 *
 * @param price
 * @param amount
 * @param bestAskPrice
 */
async function placeAskOrder(price: number, amount: number, bestAskPrice: number): Promise<void> {
  console.log(`PLACE ASK @ ${price} (${amount})`);
  if (price < bestAskPrice) {
    await fillAskOrder(price, amount);
  }
}

/**
 * Simply place a bid order: log the event and if the price is higher than the best bid price - fill the order.
 *
 * @param price
 * @param amount
 * @param bestBidPrice
 */
async function placeBidOrder(price: number, amount: number, bestBidPrice): Promise<void> {
  console.log(`PLACE BID @ ${price} (${amount})`);
  if (price > bestBidPrice) {
    await fillBidOrder(price, -amount);
  }
}

/**
 * Fill the ask order. Use a global mutex instance to control the access to the global balances values.
 *
 * @param price
 * @param amount
 */
async function fillAskOrder(price: number, amount: number): Promise<void> {
  mutex = mutex.then(() => {
    if (usdBalance > price) {
      usdBalance -= price;
      ethBalance += amount;
      console.log(`FILLED ASK @ ${price} (${amount})`);
    }
  });
  return mutex;
}

/**
 * Fill the bid order. Use a global mutex instance to control the access to the global balances values.
 *
 * @param price
 * @param amount
 */
async function fillBidOrder(price: number, amount: number): Promise<void> {
  mutex = mutex.then(() => {
    if (ethBalance > amount) {
      usdBalance += price;
      ethBalance -= amount;
      console.log(`FILLED BID @ ${price} (${amount})`);
    }
  });
  return mutex;
}

/**
 * Log to console the global balances.
 * Use a global mutex instance to control the access to the global balances values.
 */
async function getBalances(): Promise<any> {
  mutex = mutex.then(() => {
    console.log('Overall market assets balance:', { ETH: ethBalance, USD: usdBalance });
  });
  return mutex;
}


console.log('Starting bot...');
setInterval(async () => {
  const orderbook = await requestOrderBook();
  const { askPrice, bidPrice } = findBestPrices(orderbook);
  await placeRandomOrders(askPrice, bidPrice);
  console.log('---');
}, 5000);

setInterval(async () => {
  await getBalances();
  console.log('---');
}, 30000);

export {
  ethBalance,
  usdBalance,
  requestOrderBook,
  findBestPrices,
  placeRandomOrders,
  placeAskOrder,
  placeBidOrder,
  fillAskOrder,
  fillBidOrder
}
