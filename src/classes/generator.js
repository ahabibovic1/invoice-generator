import moment from "moment";
import pug from "pug";
import fs from "fs";
import path from "path";
import htmlPDF from "html-pdf";
import Common from "./common";
import Shipping from "./shipping";
import Billing from "./billing";
import Payment from "./payment";
import Emitter from "./emitter";
import i18n from "../lib/i18n";

export default class Generator extends Common {
  constructor(config) {
    super();
    this._emitter = config.emitter
      ? new Emitter(config.emitter)
      : new Emitter();
    this._billing = config.billing
      ? new Billing(config.billing)
      : new Billing();
    this._shipping = config.shipping
      ? new Shipping(config.shipping)
      : new Shipping();
    this._payment = config.payment
      ? new Payment(config.payment)
      : new Payment();
    this._article = [];
    this._i18nConfigure(config.language);
    this.hydrate(config.global, this._itemsToHydrate());
  }

  get template() {
    return this._template;
  }

  set template(value) {
    this._template = value;
  }

  get lang() {
    return !this._lang ? this._defaultLocale : this._lang;
  }

  set lang(value) {
    const tmp = value.toLowerCase();
    if (!this._availableLocale.includes(tmp))
      throw new Error(
        `Wrong lang, please set one of ${this._availableLocale.join(", ")}`
      );
    this._lang = tmp;
  }

  get currency() {
    return this._currency;
  }

  set currency(value) {
    const tmp = value.toUpperCase();
    const currency = this.getCurrency(tmp);
    if (!currency) throw new Error("Wrong currency");
    else {
      this._currency = currency;
    }
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = value;
  }

  get invoice_reference_pattern() {
    return !this._invoice_reference_pattern
      ? "$prefix{IN}$date{YYMM}$separator{-}$id{00000}"
      : this._invoice_reference_pattern;
  }

  set invoice_reference_pattern(value) {
    this._invoice_reference_pattern = value;
  }

  get reference() {
    return this._reference;
  }

  set reference(value) {
    this._reference = value;
  }

  get logo() {
    return this._logo;
  }

  set logo(value) {
    this._logo = value;
  }

  get invoice_template() {
    return this._invoice_template;
  }

  set invoice_template(value) {
    this._invoice_template = value;
  }

  get invoice_note() {
    return this._invoice_note;
  }

  set invoice_note(value) {
    this._invoice_note = value;
  }

  get date_format() {
    return !this._date_format ? "YYYY/MM/DD" : this._date_format;
  }

  set date_format(value) {
    this._date_format = value;
  }

  get date() {
    return !this._date ? moment().format(this.date_format) : this._date;
  }

  set date(value) {
    if (!moment(value).isValid()) throw new Error("Date not valid");
    this._date = moment(value).format(this.date_format);
  }

  get article() {
    return this._article;
  }

  /**
   * @description Set
   * @param value
   * @example article({description: 'Licence', tax: 20, price: 100, qt: 1})
   * @example article([
   *  {description: 'Licence', tax: 20, price: 100, qt: 1},
   *  {description: 'Licence', tax: 20, price: 100, qt: 1}
   * ])
   */
  set article(value) {
    const tmp = value;
    if (Array.isArray(tmp)) {
      for (let i = 0; i < tmp.length; i += 1) {
        this._checkArticle(tmp[i]);
        tmp[i].total_product = this.formatOutputNumber(tmp[i].total_product);
        tmp[i].price = this.formatOutputNumber(tmp[i].price);
      }
    } else {
      this._checkArticle(tmp);
      tmp.total_product = this.formatOutputNumber(tmp.total_product);
      tmp.price = this.formatOutputNumber(tmp.price);
    }
    this._article = this._article ? this._article.concat(tmp) : [].concat(tmp);
  }

  /**
   * @description Reinitialize article attribute
   */
  deleteArticles() {
    this._article = [];
  }

  /**
   * @description Check article structure and data
   * @param article
   * @private
   */
  _checkArticle(article) {
    if (!Object.prototype.hasOwnProperty.call(article, "description"))
      throw new Error("Description attribute is missing");
    if (!Object.prototype.hasOwnProperty.call(article, "price"))
      throw new Error("Price attribute is missing");
    if (!this.isNumeric(article.price))
      throw new Error("Price attribute have to be a number");
    if (!Object.prototype.hasOwnProperty.call(article, "qt"))
      throw new Error("Qt attribute is missing");
    if (!this.isNumeric(article.qt))
      throw new Error("Qt attribute have to be an integer");
    if (!Number.isInteger(article.qt))
      throw new Error("Qt attribute have to be an integer, not a float");
    if (!Object.prototype.hasOwnProperty.call(article, "total_product"))
      throw new Error("Total attribute is missing");
  }

  /**
   * @description Hydrate from configuration
   * @returns {[string,string,string,string]}
   */
  _itemsToHydrate() {
    return [
      "logo",
      "invoice_template",
      "date_format",
      "date",
      "invoice_reference_pattern",
      "invoice_note",
      "lang",
      "currency",
    ];
  }

  /**
   * @description Hydrate shipping object
   * @param obj
   * @returns {*}
   */
  shipping(obj) {
    if (!obj) return this._shipping;
    return this._shipping.hydrate(obj, this._shipping._itemsToHydrate());
  }

  /**
   * @description Hydrate billing object
   * @param obj
   * @returns {*}
   */
  billing(obj) {
    if (!obj) return this._billing;
    return this._billing.hydrate(obj, this._billing._itemsToHydrate());
  }

  /**
   * @description Hydrate emitter object
   * @param obj
   * @returns {*}
   */
  emitter(obj) {
    if (!obj) return this._emitter;
    return this._emitter.hydrate(obj, this._emitter._itemsToHydrate());
  }

  /**
   * @description Hydrate payment object
   * @param obj
   * @returns {*}
   */
  payment(obj) {
    if (!obj) return this._payment;
    return this._payment.hydrate(obj, this._payment._itemsToHydrate());
  }

  /**
   * @description Precompile translation to merging glabal with custom translations
   * @returns {{logo: *, header_date: *, table_description, table_tax, table_quantity,
   * table_total_product, table_product_price, table_note, table_total_exc_vat,
   * table_total_vat, table_total_inc_vat, table_subtotal, table_discount, table_shipping, fromto_phone, fromto_mail, moment: (*|moment.Moment),
   * payment_method_title, billto, shipto, vat_number_title, currency_title, currency}}
   * @private
   */
  _preCompileCommonTranslations() {
    return {
      logo: this.logo,
      header_date: this.date,
      currency: this.currency,
      table_description: i18n.__({
        phrase: "table_description",
        locale: this.lang,
      }),
      table_tax: i18n.__({ phrase: "table_tax", locale: this.lang }),
      table_quantity: i18n.__({ phrase: "table_quantity", locale: this.lang }),
      table_total_product: i18n.__({
        phrase: "table_total_product",
        locale: this.lang,
      }),
      table_product_price: i18n.__({
        phrase: "table_product_price",
        locale: this.lang,
      }),
      table_note: i18n.__({ phrase: "table_note", locale: this.lang }),
      table_total_exc_vat: i18n.__({
        phrase: "table_total_exc_vat",
        locale: this.lang,
      }),
      table_total_vat: i18n.__({
        phrase: "table_total_vat",
        locale: this.lang,
      }),
      table_total_inc_vat: i18n.__({
        phrase: "table_total_inc_vat",
        locale: this.lang,
      }),
      table_shipping: i18n.__({
        phrase: "table_shipping",
        locale: this.lang,
      }),

      table_discount: i18n.__({
        phrase: "table_discount",
        locale: this.lang,
      }),

      table_subtotal: i18n.__({
        phrase: "table_subtotal",
        locale: this.lang,
      }),
      fromto_phone: i18n.__({ phrase: "fromto_phone", locale: this.lang }),
      fromto_mail: i18n.__({ phrase: "fromto_mail", locale: this.lang }),
      emitter_name: this.emitter().name,
      emitter_street_number: this.emitter().street_number,
      emitter_street_name: this.emitter().street_name,
      emitter_zip_code: this.emitter().zip_code,
      emitter_city: this.emitter().city,
      emitter_country: this.emitter().country,
      emitter_phone: this.emitter().phone,
      emitter_mail: this.emitter().mail,
      shipping_company: this.shipping().company_name,
      shipping_first_name: this.shipping().first_name,
      shipping_last_name: this.shipping().last_name,
      shipping_street_number: this.shipping().street_number,
      shipping_street_name: this.shipping().street_name,
      shipping_zip_code: this.shipping().zip_code,
      shipping_city: this.shipping().city,
      shipping_country: this.shipping().country,
      shipping_phone: this.shipping().phone,
      shipping_mail: this.shipping().mail,
      billing_company: this.billing().company_name,
      billing_first_name: this.billing().first_name,
      billing_last_name: this.billing().last_name,
      billing_street_number: this.billing().street_number,
      billing_street_name: this.billing().street_name,
      billing_zip_code: this.billing().zip_code,
      billing_city: this.billing().city,
      billing_country: this.billing().country,
      billing_phone: this.billing().phone,
      billing_mail: this.billing().mail,
      vat: this.payment().vat,
      total_vat: this.formatOutputNumber(this.payment().total_vat),
      vat_number: this.payment().vat_number,
      subtotal: this.formatOutputNumber(this.payment().subtotal),
      discount: this.payment().discount,
      total_discount: this.formatOutputNumber(this.payment().total_discount),
      shipping_price: this.formatOutputNumber(this.payment().shipping_price),
      total_exc_vat: this.formatOutputNumber(this.payment().total_exc_vat),
      total_inc_vat: this.formatOutputNumber(this.payment().total_inc_vat),
      payment_method: this.payment().payment_method,
      invoice_number: this.payment().invoice_number,
      articles: this.article,
      template_configuration: this._templateConfiguration(),
      moment: moment(),

      // custom fields
      payment_method_title: i18n.__({
        phrase: "payment_method_title",
        locale: this.lang,
      }),

      billto: i18n.__({
        phrase: "billto",
        locale: this.lang,
      }),

      shipto: i18n.__({
        phrase: "shipto",
        locale: this.lang,
      }),

      vat_number_title: i18n.__({
        phrase: "vat_number_title",
        locale: this.lang,
      }),

      currency_title: i18n.__({
        phrase: "currency_title",
        locale: this.lang,
      }),
    };
  }

  /**
   * @description Compile pug template to HTML
   * @param keys
   * @returns {*}
   * @private
   */
  _compile(keys) {
    const template = this.invoice_template;
    const compiled = pug.compileFile(path.resolve(template));
    return compiled(keys);
  }

  /**
   * @description Prepare phrases from translations
   * @param type
   */
  getPhrases(type) {
    return {
      header_title: i18n.__({
        phrase: `${type}_header_title`,
        locale: this.lang,
      }),
      header_reference: i18n.__({
        phrase: `${type}_header_reference`,
        locale: this.lang,
      }),
      header_date: i18n.__({
        phrase: `${type}_header_date`,
        locale: this.lang,
      }),
    };
  }

  /**
   * @description Return invoice translation keys object
   * @param params
   * @returns {*}
   */
  getInvoice(params = []) {
    const keys = {
      invoice_header_title: this.getPhrases("invoice").header_title,
      invoice_header_reference: this.getPhrases("invoice").header_reference,
      invoice_header_reference_value: this.getReferenceFromPattern("invoice"),
      invoice_header_date: this.getPhrases("invoice").header_date,
      table_note_content: this.invoice_note,
      note: (note) => (note ? (this.invoice_note = note) : this.invoice_note),
      filename: "invoice",
    };
    params.forEach((phrase) => {
      if (typeof phrase === "string") {
        keys[phrase] = i18n.__({ phrase, locale: this.lang });
      } else if (typeof phrase === "object" && phrase.key && phrase.value) {
        keys[phrase.key] = phrase.value;
      }
    });

    return Object.assign(
      keys,
      {
        toHTML: () => this._toHTML(keys, params),
        toPDF: () => this._toPDF(keys, params),
      },
      this._preCompileCommonTranslations()
    );
  }

  /**
   * @description Return reference from pattern
   * @param type
   * @return {*}
   */
  getReferenceFromPattern(type) {
    if (!["invoice"].includes(type))
      throw new Error('Type have to be "invoice"');
    if (this.reference) return this.reference;
    return this.setReferenceFromPattern(this.invoice_reference_pattern);
  }

  /**
   * @description Set reference
   * @param pattern
   * @return {*}
   * @private
   * @todo optimize it
   */
  setReferenceFromPattern(pattern) {
    const tmp = pattern.split("$").slice(1);
    let output = "";
    // eslint-disable-next-line no-restricted-syntax
    for (const item of tmp) {
      if (!item.endsWith("}")) throw new Error("Wrong pattern type");
      if (item.startsWith("prefix{"))
        output += item.replace("prefix{", "").slice(0, -1);
      else if (item.startsWith("separator{"))
        output += item.replace("separator{", "").slice(0, -1);
      else if (item.startsWith("date{"))
        output += moment().format(item.replace("date{", "").slice(0, -1));
      else if (item.startsWith("id{")) {
        const id = item.replace("id{", "").slice(0, -1);
        if (!/^\d+$/.test(id)) throw new Error(`Id must be an integer (${id})`);
        output += this._id
          ? this.pad(this._id, id.length)
          : this.pad(0, id.length);
      } else throw new Error(`${item} pattern reference unknown`);
    }
    return output;
  }

  /**
   * @description Export object with html content and exportation functions
   * @param keys
   * @param params
   * @returns {{html: *, toFile: (function(*): *)}}
   * @private
   */
  _toHTML(keys, params = []) {
    const html = this._compile(this.getInvoice(params));
    return {
      html,
      toFile: (filepath) =>
        this._toFileFromHTML(html, filepath || `${keys.filename}.html`),
    };
  }

  /**
   * @description Save content to pdf file
   * @param keys
   * @param params
   * @returns {*}
   * @private
   */
  _toPDF(keys, params = []) {
    const pdf = htmlPDF.create(this._toHTML(keys, params).html, {
      timeout: "90000",
    });
    return {
      pdf,
      toFile: (filepath) =>
        this._toFileFromPDF(pdf, filepath || `${keys.filename}.pdf`),
      toBuffer: () => this._toBufferFromPDF(pdf),
      toStream: (filepath) =>
        this._toStreamFromPDF(pdf, filepath || `${keys.filename}.pdf`),
    };
  }

  /**
   * @description Save content into file from toHTML() method
   * @param content
   * @param filepath
   * @returns {Promise}
   * @private
   */
  _toFileFromHTML(content, filepath) {
    return new Promise((resolve, reject) =>
      fs.writeFile(filepath, content, (err) => {
        if (err) reject(err);
        return resolve();
      })
    );
  }

  /**
   * @description Save content into file from toPDF() method
   * @param content
   * @param filepath
   * @returns {Promise}
   * @private
   */
  _toFileFromPDF(content, filepath) {
    return new Promise((resolve, reject) =>
      content.toFile(filepath, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      })
    );
  }

  /**
   * @description Export PDF to buffer
   * @param content
   * @returns {*}
   * @private
   */
  _toBufferFromPDF(content) {
    return new Promise((resolve, reject) =>
      content.toBuffer((err, buffer) => {
        if (err) return reject(err);
        return resolve(buffer);
      })
    );
  }

  /**
   * @description Export PDF to file using stream
   * @param content
   * @param filepath
   * @returns {*}
   * @private
   */
  _toStreamFromPDF(content, filepath) {
    return content.toStream((err, stream) =>
      stream.pipe(fs.createWriteStream(filepath))
    );
  }

  /**
   * @description Calculates number of pages and items per page
   * @return {{rows_in_first_page: number, rows_in_others_pages: number, loop_table: number}}
   * @private
   */

  // split at 19 articles
  _templateConfiguration() {
    const template_rows_per_page = 10; // first page if more than 14 articles
    const templateConfig = {
      rows_in_first_page: this.article.length > 5 ? template_rows_per_page : 5,
      rows_per_pages: 20,
      rows_in_last_page: 15,
    };

    let nbArticles = this.article.length;
    let loop = 1;
    while (true) {
      if (loop === 1) {
        nbArticles -= templateConfig.rows_in_first_page;
        if (nbArticles <= 0) {
          templateConfig.loop_table =
            templateConfig.rows_in_first_page !== template_rows_per_page
              ? 1
              : 2;
          return templateConfig;
        }
      }

      if (loop >= 2) {
        if (nbArticles <= templateConfig.rows_in_last_page) {
          templateConfig.loop_table = loop;
          return templateConfig;
        }
        nbArticles -= templateConfig.rows_per_pages;
        if (nbArticles <= 0) {
          templateConfig.loop_table = loop;
          return templateConfig;
        }
      }
      loop += 1;
    }
  }

  /**
   * @description Overrides i18n configuration
   * @param config
   * @private
   */
  _i18nConfigure(config) {
    this._defaultLocale =
      config && config.defaultLocale ? config.defaultLocale : "en";
    this._availableLocale = config && config.locales ? config.locales : ["en"];
    if (config) i18n.configure(config);
  }
}
