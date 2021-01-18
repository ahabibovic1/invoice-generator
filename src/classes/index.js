import jsonOverride from "json-override";
import Generator from "./generator";

let configuration;

export default {
  /**
   * @description Configure invoiceIt with object config
   * @param config
   */
  configure: (config) => (configuration = jsonOverride(configuration, config)),

  /**
   * @description Generate invoiceIt with configuration
   * @param emitter
   * @param billing
   * @param shipping
   * @param payment
   * @returns {Generator}
   */
  create: (emitter, billing, shipping, payment) => {
    const generator = new Generator(configuration);
    generator.emitter(emitter);
    generator.billing(billing);
    generator.shipping(shipping);
    generator.payment(payment);
    return generator;
  },
};
