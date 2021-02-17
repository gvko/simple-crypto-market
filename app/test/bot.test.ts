import * as bot from '../src/bot';
import { expect } from 'chai';

describe('market bot tests', function () {
  let orderbook = [
    [58910327161, 1840.2, 4.47517146],
    [58910538839, 1840.2, 0.32713445],
    [58909997570, 1840.1, 2],
    [58909900575, 1840, 0.69],
    [58910515180, 1840, 5],
    [58910520219, 1839.9, 1.35186275],
    [58910524813, 1839.9, 0.95626604],
    [58910543704, 1839.9, 0.53607939],
    [58910536916, 1840.5, -3.24489485],
    [58910536918, 1840.6, -10.86937],
    [58910541354, 1840.623906, -2.1738727],
    [58910541350, 1840.72724086, -4.07602],
    [58910536920, 1840.8, -10.86994],
    [58910541421, 1840.968796632, -4.07556],
    [58910545820, 1841, -0.28293984],
    [58910541356, 1841.0016636, -2.7172471]
  ];

  it('should return the best ask and bid prices of the orderbook', function () {
    const { askPrice, bidPrice } = bot.findBestPrices(orderbook);
    expect(askPrice).to.equal(1840.2);
    expect(bidPrice).to.equal(1840.5);
  });

  it('should fill an ask order within market balance and not fill a second one, then fill a bid order', async function () {
    const askPrice = 1834;
    const askAmount = 8.44994458;
    const bidPrice = 1776;
    const bidAmount = 3.15617545;

    expect(bot.ethBalance).to.equal(10);
    expect(bot.usdBalance).to.equal(2000);

    await bot.fillAskOrder(askPrice, askAmount);

    expect(bot.ethBalance).to.equal(10 + askAmount);
    expect(bot.usdBalance).to.equal(2000 - askPrice);

    await bot.fillAskOrder(askPrice, askAmount);
    // balances are still the same, because the 2nd order was not filled
    expect(bot.ethBalance).to.equal(10 + askAmount);
    expect(bot.usdBalance).to.equal(2000 - askPrice);

    await bot.fillBidOrder(bidPrice, bidAmount);
    // balances are updated accordingly to the filled bid
    expect(bot.ethBalance).to.equal(10 + askAmount - bidAmount);
    expect(bot.usdBalance).to.equal(2000 - askPrice + bidPrice);
  });

});
