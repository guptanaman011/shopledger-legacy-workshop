'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

function makeOrder(items, coupon) {
  var billed = pricing.computeTotals(items, coupon);
  return {
    id: 1001,
    items: items,
    coupon: coupon,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
}

test('invoice matches the GST slab and total recorded when the order was billed', function () {
  var order = makeOrder([{
    id: 1,
    name: 'Rice',
    sku: 'RICE-1',
    hsn: '1006',
    price: 640,
    qty: 1
  }], '');
  var invoiced = invoice.computeInvoiceFigures(order);

  assert.equal(invoiced.rows[0].gstPercent, 5);
  assert.equal(invoiced.rows[0].lineTax, 32);
  assert.equal(invoiced.tax, order.tax);
  assert.equal(invoiced.cgst, 16);
  assert.equal(invoiced.sgst, 16);
  assert.equal(invoiced.total, order.total);
  assert.equal(invoiced.total, 672);
});

test('invoice applies percent coupon on the same taxable subtotal as order pricing', function () {
  var order = makeOrder([{
    id: 2,
    name: 'Tea',
    sku: 'TEA-1',
    hsn: '0902',
    price: 1000,
    qty: 1
  }], 'SAVE10');
  var invoiced = invoice.computeInvoiceFigures(order);

  assert.equal(invoiced.rows[0].gstPercent, 18);
  assert.equal(invoiced.discount, order.discount);
  assert.equal(invoiced.tax, order.tax);
  assert.equal(invoiced.total, order.total);
  assert.equal(invoiced.discount, 100);
  assert.equal(invoiced.tax, 162);
  assert.equal(invoiced.total, 1062);
});

test('invoice reduces taxable value before GST for a flat coupon', function () {
  var order = makeOrder([{
    id: 3,
    name: 'Rice',
    sku: 'RICE-2',
    hsn: '1006',
    price: 1000,
    qty: 1
  }], 'FLAT50');
  var invoiced = invoice.computeInvoiceFigures(order);

  assert.equal(invoiced.discount, order.discount);
  assert.equal(invoiced.tax, order.tax);
  assert.equal(invoiced.cgst + invoiced.sgst, invoiced.tax);
  assert.equal(invoiced.total, order.total);
  assert.equal(invoiced.discount, 50);
  assert.equal(invoiced.tax, 47.5);
  assert.equal(invoiced.total, 997.5);
});
