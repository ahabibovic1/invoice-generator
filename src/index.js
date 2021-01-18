import generator from "./classes";

generator.configure({
  emitter: {
    name: "",
    street_number: "",
    street_name: "",
    zip_code: "",
    city: "",
    phone: "",
    mail: "",
    website: "",
  },
  global: {
    logo: "",
    invoice_reference_pattern: "$prefix{IN}$date{YYMM}$separator{-}$id{00000}",
    invoice_template: `${__dirname}/../static/invoice.pug`,
    invoice_note: "",
    date: new Date(),
    date_format: "DD/MM/YYYY",
    lang: "en",
    currency: "",
  },
});

export default generator;
