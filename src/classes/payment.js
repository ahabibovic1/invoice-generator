import Common from "./common";

export default class Payment extends Common {
  constructor(payment) {
    super();
    this.hydrate(payment, this._itemsToHydrate());
  }

  get invoice_number() {
    return this._invoice_number;
  }

  set invoice_number(value) {
    this._invoice_number = value;
  }

  get vat() {
    return this._vat;
  }

  set vat(value) {
    this._vat = value;
  }

  get total_vat() {
    return this._total_vat;
  }

  set total_vat(value) {
    this._total_vat = value;
  }

  get vat_number() {
    return this._vat_number;
  }

  set vat_number(value) {
    this._vat_number = value;
  }

  get subtotal() {
    return this._subtotal;
  }

  set subtotal(value) {
    this._subtotal = value;
  }

  get shipping_price() {
    return this._shipping_price;
  }

  set shipping_price(value) {
    this._shipping_price = value;
  }

  get discount() {
    return this._discount;
  }

  set discount(value) {
    this._discount = value;
  }

  get total_discount() {
    return this._total_discount;
  }

  set total_discount(value) {
    this._total_discount = value;
  }

  get total_exc_vat() {
    return this._total_exc_vat;
  }

  set total_exc_vat(value) {
    this._total_exc_vat = value;
  }

  get total_inc_vat() {
    return this._total_inc_vat;
  }

  set total_inc_vat(value) {
    this._total_inc_vat = value;
  }

  get payment_method() {
    return this._payment_method;
  }

  set payment_method(value) {
    this._payment_method = value;
  }

  _itemsToHydrate() {
    return [
      "invoice_number",
      "vat",
      "total_vat",
      "vat_number",
      "subtotal",
      "shipping_price",
      "discount",
      "total_discount",
      "total_exc_vat",
      "total_inc_vat",
      "payment_method",
    ];
  }
}
