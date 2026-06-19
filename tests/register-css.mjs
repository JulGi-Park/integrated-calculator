import { registerHooks } from "node:module";

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".module.css")) {
      return {
        format: "module",
        shortCircuit: true,
        source:
          "export default new Proxy({}, { get: (_, property) => String(property) });",
      };
    }

    return nextLoad(url, context);
  },
});
