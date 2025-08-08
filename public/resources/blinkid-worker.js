var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var _wasmModule, _defaultSessionSettings, _showDemoOverlay, _showProductionOverlay, _proxyUrls, _BlinkIdWorker_instances, loadWasm_fn, configureProxyUrls_fn, validateProxyPermissions_fn, sanitizeProxyUrls_fn, buildServiceUrl_fn;
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
const proxyTransferHandler = {
  canHandle: (val) => isObject(val) && val[proxyMarker],
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port) {
    port.start();
    return wrap(port);
  }
};
const throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
const transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function isAllowedOrigin(allowedOrigins, origin) {
  for (const allowedOrigin of allowedOrigins) {
    if (origin === allowedOrigin || allowedOrigin === "*") {
      return true;
    }
    if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
      return true;
    }
  }
  return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }
    if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
      console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
      return;
    }
    const { id, type, path } = Object.assign({ path: [] }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
      const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
      switch (type) {
        case "GET":
          {
            returnValue = rawValue;
          }
          break;
        case "SET":
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case "APPLY":
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case "CONSTRUCT":
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case "ENDPOINT":
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;
        case "RELEASE":
          {
            returnValue = void 0;
          }
          break;
        default:
          return;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      const [wireValue, transferables] = toWireValue(returnValue2);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      if (type === "RELEASE") {
        ep.removeEventListener("message", callback);
        closeEndPoint(ep);
        if (finalizer in obj && typeof obj[finalizer] === "function") {
          obj[finalizer]();
        }
      }
    }).catch((error) => {
      const [wireValue, transferables] = toWireValue({
        value: new TypeError("Unserializable return value"),
        [throwMarker]: 0
      });
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
    });
  });
  if (ep.start) {
    ep.start();
  }
}
function isMessagePort(endpoint) {
  return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
  if (isMessagePort(endpoint))
    endpoint.close();
}
function wrap(ep, target) {
  const pendingListeners = /* @__PURE__ */ new Map();
  ep.addEventListener("message", function handleMessage(ev) {
    const { data } = ev;
    if (!data || !data.id) {
      return;
    }
    const resolver = pendingListeners.get(data.id);
    if (!resolver) {
      return;
    }
    try {
      resolver(data);
    } finally {
      pendingListeners.delete(data.id);
    }
  });
  return createProxy(ep, pendingListeners, [], target);
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
function releaseEndpoint(ep) {
  return requestResponseMessage(ep, /* @__PURE__ */ new Map(), {
    type: "RELEASE"
  }).then(() => {
    closeEndPoint(ep);
  });
}
const proxyCounter = /* @__PURE__ */ new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep) => {
  const newCount = (proxyCounter.get(ep) || 0) - 1;
  proxyCounter.set(ep, newCount);
  if (newCount === 0) {
    releaseEndpoint(ep);
  }
});
function registerProxy(proxy2, ep) {
  const newCount = (proxyCounter.get(ep) || 0) + 1;
  proxyCounter.set(ep, newCount);
  if (proxyFinalizers) {
    proxyFinalizers.register(proxy2, ep, proxy2);
  }
}
function unregisterProxy(proxy2) {
  if (proxyFinalizers) {
    proxyFinalizers.unregister(proxy2);
  }
}
function createProxy(ep, pendingListeners, path = [], target = function() {
}) {
  let isProxyReleased = false;
  const proxy2 = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return () => {
          unregisterProxy(proxy2);
          releaseEndpoint(ep);
          pendingListeners.clear();
          isProxyReleased = true;
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r = requestResponseMessage(ep, pendingListeners, {
          type: "GET",
          path: path.map((p) => p.toString())
        }).then(fromWireValue);
        return r.then.bind(r);
      }
      return createProxy(ep, pendingListeners, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, pendingListeners, {
        type: "SET",
        path: [...path, prop].map((p) => p.toString()),
        value
      }, transferables).then(fromWireValue);
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === createEndpoint) {
        return requestResponseMessage(ep, pendingListeners, {
          type: "ENDPOINT"
        }).then(fromWireValue);
      }
      if (last === "bind") {
        return createProxy(ep, pendingListeners, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, pendingListeners, {
        type: "APPLY",
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, pendingListeners, {
        type: "CONSTRUCT",
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    }
  });
  registerProxy(proxy2, ep);
  return proxy2;
}
function myFlat(arr) {
  return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
  const processed = argumentList.map(toWireValue);
  return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = /* @__PURE__ */ new WeakMap();
function transfer(obj, transfers) {
  transferCache.set(obj, transfers);
  return obj;
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [
        {
          type: "HANDLER",
          name,
          value: serializedValue
        },
        transferables
      ];
    }
  }
  return [
    {
      type: "RAW",
      value
    },
    transferCache.get(value) || []
  ];
}
function fromWireValue(value) {
  switch (value.type) {
    case "HANDLER":
      return transferHandlers.get(value.name).deserialize(value.value);
    case "RAW":
      return value.value;
  }
}
function requestResponseMessage(ep, pendingListeners, msg, transfers) {
  return new Promise((resolve) => {
    const id = generateUUID();
    pendingListeners.set(id, resolve);
    if (ep.start) {
      ep.start();
    }
    ep.postMessage(Object.assign({ id }, msg), transfers);
  });
}
function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}
const bulkMemory = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 3, 1, 0, 1, 10, 14, 1, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11])), mutableGlobals = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 2, 8, 1, 1, 97, 1, 98, 3, 127, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 5, 1, 1, 97, 3, 1])), referenceTypes = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 7, 1, 5, 0, 208, 112, 26, 11])), saturatedFloatToInt = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 12, 1, 10, 0, 67, 0, 0, 0, 0, 252, 0, 26, 11])), signExtensions = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 8, 1, 6, 0, 65, 0, 192, 26, 11])), simd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])), threads = () => (async (e) => {
  try {
    return "undefined" != typeof MessageChannel && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(e);
  } catch (e2) {
    return false;
  }
})(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));
function isSafari() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes("safari") && !userAgent.includes("chrome");
}
async function checkThreadsSupport() {
  const supportsWasmThreads = await threads();
  if (!supportsWasmThreads) return false;
  if (!("importScripts" in self)) {
    throw Error("Not implemented");
  }
  if (isSafari()) {
    return false;
  }
  return "Worker" in self;
}
async function detectWasmFeatures() {
  const basicSet = [
    mutableGlobals(),
    referenceTypes(),
    bulkMemory(),
    saturatedFloatToInt(),
    signExtensions()
  ];
  const supportsBasic = (await Promise.all(basicSet)).every(Boolean);
  if (!supportsBasic) {
    throw new Error("Browser doesn't meet minimum requirements!");
  }
  const supportsAdvanced = await simd();
  if (!supportsAdvanced) {
    return "basic";
  }
  const supportsAdvancedThreads = await checkThreadsSupport();
  if (!supportsAdvancedThreads) {
    return "advanced";
  }
  return "advanced-threads";
}
const workerType = "application/javascript";
const getCrossOriginWorkerURL = (originalWorkerUrl, _options = {}) => {
  const options = {
    skipSameOrigin: true,
    useBlob: true,
    ..._options
  };
  if (options.skipSameOrigin && new URL(originalWorkerUrl).origin === self.location.origin) {
    return Promise.resolve(originalWorkerUrl);
  }
  return new Promise(
    (resolve, reject) => void fetch(originalWorkerUrl).then((res) => res.text()).then((codeString) => {
      const workerPath = new URL(originalWorkerUrl).href.split("/");
      workerPath.pop();
      let finalURL = "";
      if (options.useBlob) {
        const blob = new Blob([codeString], { type: workerType });
        finalURL = URL.createObjectURL(blob);
      } else {
        finalURL = `data:${workerType},` + encodeURIComponent(codeString);
      }
      resolve(finalURL);
    }).catch(reject)
  );
};
function isIOS() {
  const userAgent = self.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}
function constructLicenseRequest(unlockResult) {
  return {
    licenseId: unlockResult.licenseId,
    licensee: unlockResult.licensee,
    applicationIds: unlockResult.applicationIds,
    packageName: unlockResult.packageName,
    platform: "Browser",
    sdkName: unlockResult.sdkName,
    sdkVersion: unlockResult.sdkVersion
  };
}
async function obtainNewServerPermission(unlockResult, baltazarUrl = "https://baltazar.microblink.com/api/v2/status/check") {
  if (!baltazarUrl || typeof baltazarUrl !== "string") {
    throw new Error("Invalid baltazarUrl: must be a non-empty string");
  }
  try {
    new URL(baltazarUrl);
  } catch (error) {
    throw new Error(`Invalid baltazarUrl format: ${baltazarUrl}`);
  }
  try {
    const response = await fetch(baltazarUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-cache",
      body: JSON.stringify(constructLicenseRequest(unlockResult))
    });
    if (!response.ok) {
      throw new Error(
        `Server returned error: ${response.status} ${response.statusText}`
      );
    }
    const serverPermission = await response.json();
    return serverPermission;
  } catch (error) {
    console.error("Server permission request failed:", error);
    throw error;
  }
}
function mbToWasmPages(mb) {
  return Math.ceil(mb * 1024 * 1024 / 64 / 1024);
}
async function downloadArrayBuffer(url, progressCallback) {
  const response = await fetch(url);
  if (!response.body || !response.headers.has("Content-Length")) {
    return response.arrayBuffer();
  }
  const contentLength = parseInt(response.headers.get("Content-Length"), 10);
  let loaded = 0;
  const reader = response.body.getReader();
  const chunks = [];
  let result = await reader.read();
  while (!result.done) {
    const value = result.value;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      if (progressCallback) {
        const progress = Math.min(
          Math.round(loaded / contentLength * 100),
          100
        );
        progressCallback({
          loaded,
          contentLength,
          progress
        });
      }
    }
    result = await reader.read();
  }
  const allChunks = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }
  return allChunks.buffer;
}
function buildResourcePath(...segments) {
  const path = segments.filter((segment) => segment).join("/").replace(/([^:]\/)\/+/g, "$1");
  try {
    new URL(path, "http://example.com");
  } catch {
    throw new Error(`Invalid URL: ${path}`);
  }
  return path;
}
function getType(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
}
function isPlainObject(payload) {
  if (getType(payload) !== "Object")
    return false;
  const prototype = Object.getPrototypeOf(payload);
  return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
}
function isSymbol(payload) {
  return getType(payload) === "Symbol";
}
function assignProp(carry, key, newVal, originalObject) {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
  if (propType === "enumerable")
    carry[key] = newVal;
  if (propType === "nonenumerable") {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
}
function mergeRecursively(origin, newComer, compareFn) {
  if (!isPlainObject(newComer))
    return newComer;
  let newObject = {};
  if (isPlainObject(origin)) {
    const props2 = Object.getOwnPropertyNames(origin);
    const symbols2 = Object.getOwnPropertySymbols(origin);
    newObject = [...props2, ...symbols2].reduce((carry, key) => {
      const targetVal = origin[key];
      if (!isSymbol(key) && !Object.getOwnPropertyNames(newComer).includes(key) || isSymbol(key) && !Object.getOwnPropertySymbols(newComer).includes(key)) {
        assignProp(carry, key, targetVal, origin);
      }
      return carry;
    }, {});
  }
  const props = Object.getOwnPropertyNames(newComer);
  const symbols = Object.getOwnPropertySymbols(newComer);
  const result = [...props, ...symbols].reduce((carry, key) => {
    let newVal = newComer[key];
    const targetVal = isPlainObject(origin) ? origin[key] : void 0;
    if (targetVal !== void 0 && isPlainObject(newVal)) {
      newVal = mergeRecursively(targetVal, newVal);
    }
    const propToAssign = newVal;
    assignProp(carry, key, propToAssign, newComer);
    return carry;
  }, newObject);
  return result;
}
function merge(object, ...otherObjects) {
  return otherObjects.reduce((result, newComer) => {
    return mergeRecursively(result, newComer);
  }, object);
}
function normalizeDocumentFilter(filter) {
  return {
    country: (filter == null ? void 0 : filter.country) ?? void 0,
    region: (filter == null ? void 0 : filter.region) ?? void 0,
    type: (filter == null ? void 0 : filter.type) ?? void 0
  };
}
const normalizeDocumentRule = (rule) => {
  return {
    documentFilter: normalizeDocumentFilter(rule.documentFilter),
    fields: rule.fields ?? []
  };
};
const normalizeDocumentAnonymizationSettings = (settings) => {
  return {
    documentFilter: normalizeDocumentFilter(settings.documentFilter),
    fields: settings.fields || [],
    documentNumberAnonymizationSettings: settings.documentNumberAnonymizationSettings ? {
      prefixDigitsVisible: settings.documentNumberAnonymizationSettings.prefixDigitsVisible,
      suffixDigitsVisible: settings.documentNumberAnonymizationSettings.suffixDigitsVisible
    } : void 0
  };
};
function buildSessionSettings(options = {}, defaultSessionSettings) {
  var _a, _b, _c, _d;
  if (options) {
    options = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== void 0)
    );
  }
  const customDocumentRules = ((_b = (_a = options == null ? void 0 : options.scanningSettings) == null ? void 0 : _a.customDocumentRules) == null ? void 0 : _b.map(
    normalizeDocumentRule
  )) ?? [];
  const customDocumentAnonymizationSettings = ((_d = (_c = options == null ? void 0 : options.scanningSettings) == null ? void 0 : _c.customDocumentAnonymizationSettings) == null ? void 0 : _d.map(
    normalizeDocumentAnonymizationSettings
  )) ?? [];
  const scanningSettings = {
    ...options == null ? void 0 : options.scanningSettings,
    customDocumentRules,
    customDocumentAnonymizationSettings
  };
  const sessionSettings = merge(defaultSessionSettings, {
    ...options,
    scanningSettings
  });
  return sessionSettings;
}
class ProxyUrlValidationError extends Error {
  constructor(message, url) {
    super(`Proxy URL validation failed for "${url}": ${message}`);
    this.url = url;
    this.name = "ProxyUrlValidationError";
  }
}
class LicenseError extends Error {
  constructor(message, code) {
    super(message);
    __publicField(this, "code");
    this.name = "LicenseError";
    this.code = code;
  }
}
class BlinkIdWorker {
  constructor() {
    __privateAdd(this, _BlinkIdWorker_instances);
    /**
     * The Wasm module.
     */
    __privateAdd(this, _wasmModule);
    /**
     * The default session settings.
     *
     * Must be initialized when calling initBlinkId.
     */
    __privateAdd(this, _defaultSessionSettings);
    /**
     * The progress status callback.
     */
    __publicField(this, "progressStatusCallback");
    /**
     * Whether the demo overlay is shown.
     */
    __privateAdd(this, _showDemoOverlay, true);
    /**
     * Whether the production overlay is shown.
     */
    __privateAdd(this, _showProductionOverlay, true);
    /**
     * Sanitized proxy URLs for Microblink services.
     */
    __privateAdd(this, _proxyUrls);
  }
  /**
   * This method initializes everything.
   */
  async initBlinkId(settings, defaultSessionSettings, progressCallback) {
    var _a;
    const resourcesPath = new URL(
      "resources/",
      settings.resourcesLocation
    ).toString();
    __privateSet(this, _defaultSessionSettings, defaultSessionSettings);
    this.progressStatusCallback = progressCallback;
    await __privateMethod(this, _BlinkIdWorker_instances, loadWasm_fn).call(this, {
      resourceUrl: resourcesPath,
      variant: settings.wasmVariant,
      initialMemory: settings.initialMemory,
      useLightweightBuild: settings.useLightweightBuild
    });
    if (!__privateGet(this, _wasmModule)) {
      throw new Error("Wasm module not loaded");
    }
    const licenceUnlockResult = __privateGet(this, _wasmModule).initializeWithLicenseKey(
      settings.licenseKey,
      settings.userId,
      false
    );
    if (licenceUnlockResult.licenseError) {
      throw new LicenseError(
        "License unlock error: " + licenceUnlockResult.licenseError,
        "LICENSE_ERROR"
      );
    }
    if (settings.microblinkProxyUrl) {
      __privateMethod(this, _BlinkIdWorker_instances, configureProxyUrls_fn).call(this, settings.microblinkProxyUrl, licenceUnlockResult);
    }
    if (licenceUnlockResult.unlockResult === "requires-server-permission") {
      const baltazarUrl = (_a = __privateGet(this, _proxyUrls)) == null ? void 0 : _a.baltazar;
      const serverPermissionResponse = baltazarUrl && licenceUnlockResult.allowBaltazarProxy ? await obtainNewServerPermission(licenceUnlockResult, baltazarUrl) : await obtainNewServerPermission(licenceUnlockResult);
      const serverPermissionResult = __privateGet(this, _wasmModule).submitServerPermission(
        JSON.stringify(serverPermissionResponse)
      );
      if (serverPermissionResult.error) {
        throw new Error("Server unlock error: " + serverPermissionResult.error);
      }
    }
    __privateSet(this, _showDemoOverlay, licenceUnlockResult.showDemoOverlay);
    __privateSet(this, _showProductionOverlay, licenceUnlockResult.showProductionOverlay);
  }
  /**
   * This method creates a BlinkID scanning session.
   *
   * @param options - The options for the session.
   * @returns The session.
   */
  createBlinkIdScanningSession(options) {
    if (!__privateGet(this, _wasmModule)) {
      throw new Error("Wasm module not loaded");
    }
    const sessionSettings = buildSessionSettings(
      options,
      __privateGet(this, _defaultSessionSettings)
    );
    const session = __privateGet(this, _wasmModule).createBlinkIdScanningSession(sessionSettings);
    const proxySession = this.createProxySession(session, sessionSettings);
    return proxySession;
  }
  /**
   * This method creates a proxy session.
   *
   * @param session - The session.
   * @param sessionSettings - The session settings.
   * @returns The proxy session.
   */
  createProxySession(session, sessionSettings) {
    const customSession = {
      getResult: () => session.getResult(),
      process: (image) => {
        const processResult = session.process(image);
        if ("error" in processResult) {
          throw new Error(`Error processing frame: ${processResult.error}`);
        }
        const transferPackage = transfer(
          {
            ...processResult,
            arrayBuffer: image.data.buffer
          },
          [image.data.buffer]
        );
        return transferPackage;
      },
      getSettings: () => sessionSettings,
      reset: () => session.reset(),
      delete: () => session.delete(),
      deleteLater: () => session.deleteLater(),
      isDeleted: () => session.isDeleted(),
      isAliasOf: (other) => session.isAliasOf(other),
      showDemoOverlay: () => __privateGet(this, _showDemoOverlay),
      showProductionOverlay: () => __privateGet(this, _showProductionOverlay)
    };
    return proxy(customSession);
  }
  /**
   * This method is called when the worker is terminated.
   */
  [finalizer]() {
  }
  /**
   * Terminates the workers and the Wasm runtime.
   */
  terminate() {
    self.close();
  }
  /**
   * If the ping is enabled, this method will return 1.
   *
   * @returns 1 if the ping is enabled, 0 otherwise.
   */
  ping() {
    return 1;
  }
}
_wasmModule = new WeakMap();
_defaultSessionSettings = new WeakMap();
_showDemoOverlay = new WeakMap();
_showProductionOverlay = new WeakMap();
_proxyUrls = new WeakMap();
_BlinkIdWorker_instances = new WeakSet();
loadWasm_fn = async function({
  resourceUrl,
  variant,
  useLightweightBuild,
  initialMemory
}) {
  if (__privateGet(this, _wasmModule)) {
    console.log("Wasm already loaded");
    return;
  }
  const wasmVariant = variant ?? await detectWasmFeatures();
  const featureVariant = useLightweightBuild ? "lightweight" : "full";
  const MODULE_NAME = "BlinkIdModule";
  const variantUrl = buildResourcePath(
    resourceUrl,
    featureVariant,
    wasmVariant
  );
  const workerUrl = buildResourcePath(variantUrl, `${MODULE_NAME}.js`);
  const wasmUrl = buildResourcePath(variantUrl, `${MODULE_NAME}.wasm`);
  const dataUrl = buildResourcePath(variantUrl, `${MODULE_NAME}.data`);
  const crossOriginWorkerUrl = await getCrossOriginWorkerURL(workerUrl);
  const imported = await import(
    /* @vite-ignore */
    crossOriginWorkerUrl
  );
  const createModule = imported.default;
  if (!initialMemory) {
    initialMemory = isIOS() ? 700 : 200;
  }
  const wasmMemory = new WebAssembly.Memory({
    initial: mbToWasmPages(initialMemory),
    maximum: mbToWasmPages(2048),
    shared: wasmVariant === "advanced-threads"
  });
  let wasmProgress;
  let dataProgress;
  let lastProgressUpdate = 0;
  const progressUpdateInterval = 32;
  const throttledCombinedProgress = () => {
    if (!this.progressStatusCallback) {
      return;
    }
    if (!wasmProgress || !dataProgress) {
      return;
    }
    const totalLoaded = wasmProgress.loaded + dataProgress.loaded;
    const totalLength = wasmProgress.contentLength + dataProgress.contentLength;
    const combinedPercent = Math.min(
      Math.round(totalLoaded / totalLength * 100),
      100
    );
    const combinedProgress = {
      loaded: totalLoaded,
      contentLength: totalLength,
      progress: combinedPercent
    };
    const currentTime = performance.now();
    if (currentTime - lastProgressUpdate < progressUpdateInterval) {
      return;
    }
    lastProgressUpdate = currentTime;
    this.progressStatusCallback(combinedProgress);
  };
  const wasmProgressCallback = (progress) => {
    wasmProgress = progress;
    void throttledCombinedProgress();
  };
  const dataProgressCallback = (progress) => {
    dataProgress = progress;
    void throttledCombinedProgress();
  };
  const [preloadedWasm, preloadedData] = await Promise.all([
    downloadArrayBuffer(wasmUrl, wasmProgressCallback),
    downloadArrayBuffer(dataUrl, dataProgressCallback)
  ]);
  if (this.progressStatusCallback && wasmProgress && dataProgress) {
    const totalLength = wasmProgress.contentLength + dataProgress.contentLength;
    this.progressStatusCallback({
      loaded: totalLength,
      contentLength: totalLength,
      progress: 100
    });
  }
  __privateSet(this, _wasmModule, await createModule({
    locateFile: (path) => {
      return `${variantUrl}/${wasmVariant}/${path}`;
    },
    // pthreads build breaks without this:
    // "Failed to execute 'createObjectURL' on 'URL': Overload resolution failed."
    mainScriptUrlOrBlob: crossOriginWorkerUrl,
    wasmBinary: preloadedWasm,
    getPreloadedPackage() {
      return preloadedData;
    },
    wasmMemory,
    noExitRuntime: true
  }));
  if (!__privateGet(this, _wasmModule)) {
    throw new Error("Failed to load Wasm module");
  }
};
/**
 * Configures proxy URLs based on the provided settings and license permissions.
 */
configureProxyUrls_fn = function(proxyUrl, licenceUnlockResult) {
  if (!proxyUrl) {
    console.debug(
      "No proxy URL configured, using default Microblink servers"
    );
    return;
  }
  __privateMethod(this, _BlinkIdWorker_instances, validateProxyPermissions_fn).call(this, licenceUnlockResult, proxyUrl);
  try {
    __privateSet(this, _proxyUrls, __privateMethod(this, _BlinkIdWorker_instances, sanitizeProxyUrls_fn).call(this, proxyUrl));
    if (licenceUnlockResult.allowPingProxy) {
      __privateGet(this, _wasmModule).setPingProxyUrl(__privateGet(this, _proxyUrls).ping);
    }
    console.debug("Proxy URLs configured successfully:", {
      ping: __privateGet(this, _proxyUrls).ping,
      baltazar: __privateGet(this, _proxyUrls).baltazar
    });
  } catch (error) {
    const enhancedError = error instanceof ProxyUrlValidationError ? new Error(
      `${error.message}

Troubleshooting:
- Ensure the URL is accessible
- Check HTTPS requirements
- Verify proxy server implementation`
    ) : error;
    throw enhancedError;
  }
};
/**
 * Validates that the license allows proxy usage.
 */
validateProxyPermissions_fn = function(licenceUnlockResult, proxyUrl) {
  if (!licenceUnlockResult.allowPingProxy && !licenceUnlockResult.allowBaltazarProxy) {
    throw new Error(
      `Proxy URL "${proxyUrl}" was provided, but your license does not permit proxy usage.
License permissions: pingProxy=${licenceUnlockResult.allowPingProxy}, baltazarProxy=${licenceUnlockResult.allowBaltazarProxy}
Check your license.`
    );
  } else if (!licenceUnlockResult.hasPing && licenceUnlockResult.unlockResult !== "requires-server-permission") {
    throw new Error(
      `Microblink proxy URL is set but cannot be used because ping and online license check are disabled in your license.
Check your license.`
    );
  }
};
/**
 * Validates and sanitizes proxy URLs for different Microblink services.
 */
sanitizeProxyUrls_fn = function(baseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrl);
  } catch (error) {
    throw new ProxyUrlValidationError(
      `Failed to create URL instance for provided Microblink proxy URL "${baseUrl}". Expected format: https://your-proxy.com or https://your-proxy.com/`,
      baseUrl
    );
  }
  if (parsedUrl.protocol !== "https:") {
    throw new ProxyUrlValidationError(
      `Proxy URL validation failed for "${baseUrl}": HTTPS protocol must be used. Expected format: https://your-proxy.com or https://your-proxy.com/`,
      baseUrl
    );
  }
  const baseUrlStr = parsedUrl.origin;
  const baltazarUrl = __privateMethod(this, _BlinkIdWorker_instances, buildServiceUrl_fn).call(this, baseUrlStr, "/api/v2/status/check");
  return {
    ping: baseUrlStr,
    baltazar: baltazarUrl
  };
};
/**
 * Builds a service URL by combining base URL with service path.
 */
buildServiceUrl_fn = function(baseUrl, servicePath) {
  try {
    const url = new URL(servicePath, baseUrl);
    return url.toString();
  } catch (error) {
    throw new ProxyUrlValidationError(
      `Failed to build service URL for path "${servicePath}"`,
      baseUrl
    );
  }
};
const blinkIdWorker = new BlinkIdWorker();
expose(blinkIdWorker);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxpbmtpZC13b3JrZXIuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9jb21saW5rQDQuNC4yL25vZGVfbW9kdWxlcy9jb21saW5rL2Rpc3QvZXNtL2NvbWxpbmsubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3dhc20tZmVhdHVyZS1kZXRlY3RAMS44LjAvbm9kZV9tb2R1bGVzL3dhc20tZmVhdHVyZS1kZXRlY3QvZGlzdC9lc20vaW5kZXguanMiLCIuLi9zcmMvd2FzbS1mZWF0dXJlLWRldGVjdC50cyIsIi4uL3NyYy9nZXRDcm9zc09yaWdpbldvcmtlclVSTC50cyIsIi4uL3NyYy9pc1NhZmFyaS50cyIsIi4uL3NyYy9saWNlbmNpbmcudHMiLCIuLi9zcmMvbWJUb1dhc21QYWdlcy50cyIsIi4uL3NyYy9kb3dubG9hZEFycmF5QnVmZmVyLnRzIiwiLi4vc3JjL2J1aWxkUmVzb3VyY2VQYXRoLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2lzLXdoYXRANS4wLjIvbm9kZV9tb2R1bGVzL2lzLXdoYXQvZGlzdC9nZXRUeXBlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2lzLXdoYXRANS4wLjIvbm9kZV9tb2R1bGVzL2lzLXdoYXQvZGlzdC9pc1BsYWluT2JqZWN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2lzLXdoYXRANS4wLjIvbm9kZV9tb2R1bGVzL2lzLXdoYXQvZGlzdC9pc1N5bWJvbC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9tZXJnZS1hbnl0aGluZ0A2LjAuMy9ub2RlX21vZHVsZXMvbWVyZ2UtYW55dGhpbmcvZGlzdC9tZXJnZS5qcyIsIi4uL3NyYy9idWlsZFNlc3Npb25TZXR0aW5ncy50cyIsIi4uL3NyYy9CbGlua0lkV29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG4gKi9cbmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay5wcm94eVwiKTtcbmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKFwiQ29tbGluay5lbmRwb2ludFwiKTtcbmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbChcIkNvbWxpbmsucmVsZWFzZVByb3h5XCIpO1xuY29uc3QgZmluYWxpemVyID0gU3ltYm9sKFwiQ29tbGluay5maW5hbGl6ZXJcIik7XG5jb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbChcIkNvbWxpbmsudGhyb3duXCIpO1xuY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiAodHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIiAmJiB2YWwgIT09IG51bGwpIHx8IHR5cGVvZiB2YWwgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuICogSW50ZXJuYWwgdHJhbnNmZXIgaGFuZGxlIHRvIGhhbmRsZSBvYmplY3RzIG1hcmtlZCB0byBwcm94eS5cbiAqL1xuY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7XG4gICAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sXG4gICAgc2VyaWFsaXplKG9iaikge1xuICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIGV4cG9zZShvYmosIHBvcnQxKTtcbiAgICAgICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07XG4gICAgfSxcbiAgICBkZXNlcmlhbGl6ZShwb3J0KSB7XG4gICAgICAgIHBvcnQuc3RhcnQoKTtcbiAgICAgICAgcmV0dXJuIHdyYXAocG9ydCk7XG4gICAgfSxcbn07XG4vKipcbiAqIEludGVybmFsIHRyYW5zZmVyIGhhbmRsZXIgdG8gaGFuZGxlIHRocm93biBleGNlcHRpb25zLlxuICovXG5jb25zdCB0aHJvd1RyYW5zZmVySGFuZGxlciA9IHtcbiAgICBjYW5IYW5kbGU6ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpICYmIHRocm93TWFya2VyIGluIHZhbHVlLFxuICAgIHNlcmlhbGl6ZSh7IHZhbHVlIH0pIHtcbiAgICAgICAgbGV0IHNlcmlhbGl6ZWQ7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkID0ge1xuICAgICAgICAgICAgICAgIGlzRXJyb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdmFsdWUubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdmFsdWUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtzZXJpYWxpemVkLCBbXV07XG4gICAgfSxcbiAgICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkKSB7XG4gICAgICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IE9iamVjdC5hc3NpZ24obmV3IEVycm9yKHNlcmlhbGl6ZWQudmFsdWUubWVzc2FnZSksIHNlcmlhbGl6ZWQudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IHNlcmlhbGl6ZWQudmFsdWU7XG4gICAgfSxcbn07XG4vKipcbiAqIEFsbG93cyBjdXN0b21pemluZyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcy5cbiAqL1xuY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IG5ldyBNYXAoW1xuICAgIFtcInByb3h5XCIsIHByb3h5VHJhbnNmZXJIYW5kbGVyXSxcbiAgICBbXCJ0aHJvd1wiLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0sXG5dKTtcbmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7XG4gICAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7XG4gICAgICAgIGlmIChvcmlnaW4gPT09IGFsbG93ZWRPcmlnaW4gfHwgYWxsb3dlZE9yaWdpbiA9PT0gXCIqXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBleHBvc2Uob2JqLCBlcCA9IGdsb2JhbFRoaXMsIGFsbG93ZWRPcmlnaW5zID0gW1wiKlwiXSkge1xuICAgIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7XG4gICAgICAgIGlmICghZXYgfHwgIWV2LmRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgZXYub3JpZ2luKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIG9yaWdpbiAnJHtldi5vcmlnaW59JyBmb3IgY29tbGluayBwcm94eWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgaWQsIHR5cGUsIHBhdGggfSA9IE9iamVjdC5hc3NpZ24oeyBwYXRoOiBbXSB9LCBldi5kYXRhKTtcbiAgICAgICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7XG4gICAgICAgIGxldCByZXR1cm5WYWx1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGguc2xpY2UoMCwgLTEpLnJlZHVjZSgob2JqLCBwcm9wKSA9PiBvYmpbcHJvcF0sIG9iaik7XG4gICAgICAgICAgICBjb25zdCByYXdWYWx1ZSA9IHBhdGgucmVkdWNlKChvYmosIHByb3ApID0+IG9ialtwcm9wXSwgb2JqKTtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJHRVRcIiAvKiBNZXNzYWdlVHlwZS5HRVQgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNFVFwiIC8qIE1lc3NhZ2VUeXBlLlNFVCAqLzpcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50W3BhdGguc2xpY2UoLTEpWzBdXSA9IGZyb21XaXJlVmFsdWUoZXYuZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFQUExZXCIgLyogTWVzc2FnZVR5cGUuQVBQTFkgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWUuYXBwbHkocGFyZW50LCBhcmd1bWVudExpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDT05TVFJVQ1RcIiAvKiBNZXNzYWdlVHlwZS5DT05TVFJVQ1QgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHByb3h5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRU5EUE9JTlRcIiAvKiBNZXNzYWdlVHlwZS5FTkRQT0lOVCAqLzpcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3NlKG9iaiwgcG9ydDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlJFTEVBU0VcIiAvKiBNZXNzYWdlVHlwZS5SRUxFQVNFICovOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTtcbiAgICAgICAgfVxuICAgICAgICBQcm9taXNlLnJlc29sdmUocmV0dXJuVmFsdWUpXG4gICAgICAgICAgICAuY2F0Y2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZSwgW3Rocm93TWFya2VyXTogMCB9O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHJldHVyblZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbd2lyZVZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJSRUxFQVNFXCIgLyogTWVzc2FnZVR5cGUuUkVMRUFTRSAqLykge1xuICAgICAgICAgICAgICAgIC8vIGRldGFjaCBhbmQgZGVhY3RpdmUgYWZ0ZXIgc2VuZGluZyByZWxlYXNlIHJlc3BvbnNlIGFib3ZlLlxuICAgICAgICAgICAgICAgIGVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTtcbiAgICAgICAgICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBvYmpbZmluYWxpemVyXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIC8vIFNlbmQgU2VyaWFsaXphdGlvbiBFcnJvciBUbyBDYWxsZXJcbiAgICAgICAgICAgIGNvbnN0IFt3aXJlVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUoe1xuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgVHlwZUVycm9yKFwiVW5zZXJpYWxpemFibGUgcmV0dXJuIHZhbHVlXCIpLFxuICAgICAgICAgICAgICAgIFt0aHJvd01hcmtlcl06IDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmIChlcC5zdGFydCkge1xuICAgICAgICBlcC5zdGFydCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHtcbiAgICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gXCJNZXNzYWdlUG9ydFwiO1xufVxuZnVuY3Rpb24gY2xvc2VFbmRQb2ludChlbmRwb2ludCkge1xuICAgIGlmIChpc01lc3NhZ2VQb3J0KGVuZHBvaW50KSlcbiAgICAgICAgZW5kcG9pbnQuY2xvc2UoKTtcbn1cbmZ1bmN0aW9uIHdyYXAoZXAsIHRhcmdldCkge1xuICAgIGNvbnN0IHBlbmRpbmdMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgZXAuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikge1xuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IGV2O1xuICAgICAgICBpZiAoIWRhdGEgfHwgIWRhdGEuaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpO1xuICAgICAgICBpZiAoIXJlc29sdmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmVyKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgcGVuZGluZ0xpc3RlbmVycy5kZWxldGUoZGF0YS5pZCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIFtdLCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkge1xuICAgIGlmIChpc1JlbGVhc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZVwiKTtcbiAgICB9XG59XG5mdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHtcbiAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgbmV3IE1hcCgpLCB7XG4gICAgICAgIHR5cGU6IFwiUkVMRUFTRVwiIC8qIE1lc3NhZ2VUeXBlLlJFTEVBU0UgKi8sXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNsb3NlRW5kUG9pbnQoZXApO1xuICAgIH0pO1xufVxuY29uc3QgcHJveHlDb3VudGVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHByb3h5RmluYWxpemVycyA9IFwiRmluYWxpemF0aW9uUmVnaXN0cnlcIiBpbiBnbG9iYWxUaGlzICYmXG4gICAgbmV3IEZpbmFsaXphdGlvblJlZ2lzdHJ5KChlcCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7XG4gICAgICAgIHByb3h5Q291bnRlci5zZXQoZXAsIG5ld0NvdW50KTtcbiAgICAgICAgaWYgKG5ld0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZWxlYXNlRW5kcG9pbnQoZXApO1xuICAgICAgICB9XG4gICAgfSk7XG5mdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5LCBlcCkge1xuICAgIGNvbnN0IG5ld0NvdW50ID0gKHByb3h5Q291bnRlci5nZXQoZXApIHx8IDApICsgMTtcbiAgICBwcm94eUNvdW50ZXIuc2V0KGVwLCBuZXdDb3VudCk7XG4gICAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgICAgICBwcm94eUZpbmFsaXplcnMucmVnaXN0ZXIocHJveHksIGVwLCBwcm94eSk7XG4gICAgfVxufVxuZnVuY3Rpb24gdW5yZWdpc3RlclByb3h5KHByb3h5KSB7XG4gICAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgICAgICBwcm94eUZpbmFsaXplcnMudW5yZWdpc3Rlcihwcm94eSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24gKCkgeyB9KSB7XG4gICAgbGV0IGlzUHJveHlSZWxlYXNlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHByb3h5ID0gbmV3IFByb3h5KHRhcmdldCwge1xuICAgICAgICBnZXQoX3RhcmdldCwgcHJvcCkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIGlmIChwcm9wID09PSByZWxlYXNlUHJveHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkpO1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlRW5kcG9pbnQoZXApO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJveHlSZWxlYXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wID09PSBcInRoZW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aGVuOiAoKSA9PiBwcm94eSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByID0gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiIC8qIE1lc3NhZ2VUeXBlLkdFVCAqLyxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF0aC5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksXG4gICAgICAgICAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIFsuLi5wYXRoLCBwcm9wXSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBFUzYgUHJveHkgSGFuZGxlciBgc2V0YCBtZXRob2RzIGFyZSBzdXBwb3NlZCB0byByZXR1cm4gYVxuICAgICAgICAgICAgLy8gYm9vbGVhbi4gVG8gc2hvdyBnb29kIHdpbGwsIHdlIHJldHVybiB0cnVlIGFzeW5jaHJvbm91c2x5IMKvXFxfKOODhClfL8KvXG4gICAgICAgICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlNFVFwiIC8qIE1lc3NhZ2VUeXBlLlNFVCAqLyxcbiAgICAgICAgICAgICAgICBwYXRoOiBbLi4ucGF0aCwgcHJvcF0ubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHkoX3RhcmdldCwgX3RoaXNBcmcsIHJhd0FyZ3VtZW50TGlzdCkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAobGFzdCA9PT0gY3JlYXRlRW5kcG9pbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkVORFBPSU5UXCIgLyogTWVzc2FnZVR5cGUuRU5EUE9JTlQgKi8sXG4gICAgICAgICAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFdlIGp1c3QgcHJldGVuZCB0aGF0IGBiaW5kKClgIGRpZG7igJl0IGhhcHBlbi5cbiAgICAgICAgICAgIGlmIChsYXN0ID09PSBcImJpbmRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgcGF0aC5zbGljZSgwLCAtMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiQVBQTFlcIiAvKiBNZXNzYWdlVHlwZS5BUFBMWSAqLyxcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7XG4gICAgICAgICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xuICAgICAgICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiQ09OU1RSVUNUXCIgLyogTWVzc2FnZVR5cGUuQ09OU1RSVUNUICovLFxuICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50TGlzdCxcbiAgICAgICAgICAgIH0sIHRyYW5zZmVyYWJsZXMpLnRoZW4oZnJvbVdpcmVWYWx1ZSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcmVnaXN0ZXJQcm94eShwcm94eSwgZXApO1xuICAgIHJldHVybiBwcm94eTtcbn1cbmZ1bmN0aW9uIG15RmxhdChhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgYXJyKTtcbn1cbmZ1bmN0aW9uIHByb2Nlc3NBcmd1bWVudHMoYXJndW1lbnRMaXN0KSB7XG4gICAgY29uc3QgcHJvY2Vzc2VkID0gYXJndW1lbnRMaXN0Lm1hcCh0b1dpcmVWYWx1ZSk7XG4gICAgcmV0dXJuIFtwcm9jZXNzZWQubWFwKCh2KSA9PiB2WzBdKSwgbXlGbGF0KHByb2Nlc3NlZC5tYXAoKHYpID0+IHZbMV0pKV07XG59XG5jb25zdCB0cmFuc2ZlckNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7XG4gICAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpO1xuICAgIHJldHVybiBvYmo7XG59XG5mdW5jdGlvbiBwcm94eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihvYmosIHsgW3Byb3h5TWFya2VyXTogdHJ1ZSB9KTtcbn1cbmZ1bmN0aW9uIHdpbmRvd0VuZHBvaW50KHcsIGNvbnRleHQgPSBnbG9iYWxUaGlzLCB0YXJnZXRPcmlnaW4gPSBcIipcIikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvc3RNZXNzYWdlOiAobXNnLCB0cmFuc2ZlcmFibGVzKSA9PiB3LnBvc3RNZXNzYWdlKG1zZywgdGFyZ2V0T3JpZ2luLCB0cmFuc2ZlcmFibGVzKSxcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcjogY29udGV4dC5hZGRFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGNvbnRleHQucmVtb3ZlRXZlbnRMaXN0ZW5lci5iaW5kKGNvbnRleHQpLFxuICAgIH07XG59XG5mdW5jdGlvbiB0b1dpcmVWYWx1ZSh2YWx1ZSkge1xuICAgIGZvciAoY29uc3QgW25hbWUsIGhhbmRsZXJdIG9mIHRyYW5zZmVySGFuZGxlcnMpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIuY2FuSGFuZGxlKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgW3NlcmlhbGl6ZWRWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSBoYW5kbGVyLnNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJIQU5ETEVSXCIgLyogV2lyZVZhbHVlVHlwZS5IQU5ETEVSICovLFxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNmZXJhYmxlcyxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJSQVdcIiAvKiBXaXJlVmFsdWVUeXBlLlJBVyAqLyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICB9LFxuICAgICAgICB0cmFuc2ZlckNhY2hlLmdldCh2YWx1ZSkgfHwgW10sXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGZyb21XaXJlVmFsdWUodmFsdWUpIHtcbiAgICBzd2l0Y2ggKHZhbHVlLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIkhBTkRMRVJcIiAvKiBXaXJlVmFsdWVUeXBlLkhBTkRMRVIgKi86XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNmZXJIYW5kbGVycy5nZXQodmFsdWUubmFtZSkuZGVzZXJpYWxpemUodmFsdWUudmFsdWUpO1xuICAgICAgICBjYXNlIFwiUkFXXCIgLyogV2lyZVZhbHVlVHlwZS5SQVcgKi86XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgbXNnLCB0cmFuc2ZlcnMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICAgICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpO1xuICAgICAgICBpZiAoZXAuc3RhcnQpIHtcbiAgICAgICAgICAgIGVwLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZXAucG9zdE1lc3NhZ2UoT2JqZWN0LmFzc2lnbih7IGlkIH0sIG1zZyksIHRyYW5zZmVycyk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheSg0KVxuICAgICAgICAuZmlsbCgwKVxuICAgICAgICAubWFwKCgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKFwiLVwiKTtcbn1cblxuZXhwb3J0IHsgY3JlYXRlRW5kcG9pbnQsIGV4cG9zZSwgZmluYWxpemVyLCBwcm94eSwgcHJveHlNYXJrZXIsIHJlbGVhc2VQcm94eSwgdHJhbnNmZXIsIHRyYW5zZmVySGFuZGxlcnMsIHdpbmRvd0VuZHBvaW50LCB3cmFwIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb21saW5rLm1qcy5tYXBcbiIsImV4cG9ydCBjb25zdCBiaWdJbnQ9KCk9Pihhc3luYyBlPT57dHJ5e3JldHVybihhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShlKSkuaW5zdGFuY2UuZXhwb3J0cy5iKEJpZ0ludCgwKSk9PT1CaWdJbnQoMCl9Y2F0Y2goZSl7cmV0dXJuITF9fSkobmV3IFVpbnQ4QXJyYXkoWzAsOTcsMTE1LDEwOSwxLDAsMCwwLDEsNiwxLDk2LDEsMTI2LDEsMTI2LDMsMiwxLDAsNyw1LDEsMSw5OCwwLDAsMTAsNiwxLDQsMCwzMiwwLDExXSkpLGJ1bGtNZW1vcnk9YXN5bmMoKT0+V2ViQXNzZW1ibHkudmFsaWRhdGUobmV3IFVpbnQ4QXJyYXkoWzAsOTcsMTE1LDEwOSwxLDAsMCwwLDEsNCwxLDk2LDAsMCwzLDIsMSwwLDUsMywxLDAsMSwxMCwxNCwxLDEyLDAsNjUsMCw2NSwwLDY1LDAsMjUyLDEwLDAsMCwxMV0pKSxleGNlcHRpb25zPWFzeW5jKCk9PldlYkFzc2VtYmx5LnZhbGlkYXRlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCwxLDQsMSw5NiwwLDAsMywyLDEsMCwxMCw4LDEsNiwwLDYsNjQsMjUsMTEsMTFdKSksZXhjZXB0aW9uc0ZpbmFsPSgpPT4oYXN5bmMoKT0+e3RyeXtyZXR1cm4gbmV3IFdlYkFzc2VtYmx5Lk1vZHVsZShVaW50OEFycmF5LmZyb20oYXRvYihcIkFHRnpiUUVBQUFBQkJBRmdBQUFEQWdFQUNoQUJEZ0FDYVI5QUFRTUFBQXNBQ3hvTFwiKSwoZT0+ZS5jb2RlUG9pbnRBdCgwKSkpKSwhMH1jYXRjaChlKXtyZXR1cm4hMX19KSgpLGV4dGVuZGVkQ29uc3Q9YXN5bmMoKT0+V2ViQXNzZW1ibHkudmFsaWRhdGUobmV3IFVpbnQ4QXJyYXkoWzAsOTcsMTE1LDEwOSwxLDAsMCwwLDUsMywxLDAsMSwxMSw5LDEsMCw2NSwxLDY1LDIsMTA2LDExLDBdKSksZ2M9KCk9Pihhc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw1LDEsOTUsMSwxMjAsMF0pKSkoKSxqc1N0cmluZ0J1aWx0aW5zPSgpPT4oYXN5bmMoKT0+e3RyeXtyZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoVWludDhBcnJheS5mcm9tKGF0b2IoXCJBR0Z6YlFFQUFBQUJCZ0ZnQVc4QmZ3SVhBUTUzWVhOdE9tcHpMWE4wY21sdVp3UjBaWE4wQUFBPVwiKSwoZT0+ZS5jb2RlUG9pbnRBdCgwKSkpLHt9LHtidWlsdGluczpbXCJqcy1zdHJpbmdcIl19KSwhMH1jYXRjaChlKXtyZXR1cm4hMX19KSgpLGpzcGk9KCk9Pihhc3luYygpPT5cIlN1c3BlbmRpbmdcImluIFdlYkFzc2VtYmx5KSgpLG1lbW9yeTY0PWFzeW5jKCk9PldlYkFzc2VtYmx5LnZhbGlkYXRlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCw1LDMsMSw0LDFdKSksbXVsdGlNZW1vcnk9KCk9Pihhc3luYygpPT57dHJ5e3JldHVybiBuZXcgV2ViQXNzZW1ibHkuTW9kdWxlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCw1LDUsMiwwLDAsMCwwXSkpLCEwfWNhdGNoKGUpe3JldHVybiExfX0pKCksbXVsdGlWYWx1ZT1hc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw2LDEsOTYsMCwyLDEyNywxMjcsMywyLDEsMCwxMCw4LDEsNiwwLDY1LDAsNjUsMCwxMV0pKSxtdXRhYmxlR2xvYmFscz1hc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMiw4LDEsMSw5NywxLDk4LDMsMTI3LDEsNiw2LDEsMTI3LDEsNjUsMCwxMSw3LDUsMSwxLDk3LDMsMV0pKSxyZWZlcmVuY2VUeXBlcz1hc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw0LDEsOTYsMCwwLDMsMiwxLDAsMTAsNywxLDUsMCwyMDgsMTEyLDI2LDExXSkpLHJlbGF4ZWRTaW1kPWFzeW5jKCk9PldlYkFzc2VtYmx5LnZhbGlkYXRlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCwxLDUsMSw5NiwwLDEsMTIzLDMsMiwxLDAsMTAsMTUsMSwxMywwLDY1LDEsMjUzLDE1LDY1LDIsMjUzLDE1LDI1MywxMjgsMiwxMV0pKSxzYXR1cmF0ZWRGbG9hdFRvSW50PWFzeW5jKCk9PldlYkFzc2VtYmx5LnZhbGlkYXRlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCwxLDQsMSw5NiwwLDAsMywyLDEsMCwxMCwxMiwxLDEwLDAsNjcsMCwwLDAsMCwyNTIsMCwyNiwxMV0pKSxzaWduRXh0ZW5zaW9ucz1hc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw0LDEsOTYsMCwwLDMsMiwxLDAsMTAsOCwxLDYsMCw2NSwwLDE5MiwyNiwxMV0pKSxzaW1kPWFzeW5jKCk9PldlYkFzc2VtYmx5LnZhbGlkYXRlKG5ldyBVaW50OEFycmF5KFswLDk3LDExNSwxMDksMSwwLDAsMCwxLDUsMSw5NiwwLDEsMTIzLDMsMiwxLDAsMTAsMTAsMSw4LDAsNjUsMCwyNTMsMTUsMjUzLDk4LDExXSkpLHN0cmVhbWluZ0NvbXBpbGF0aW9uPSgpPT4oYXN5bmMoKT0+XCJjb21waWxlU3RyZWFtaW5nXCJpbiBXZWJBc3NlbWJseSkoKSx0YWlsQ2FsbD1hc3luYygpPT5XZWJBc3NlbWJseS52YWxpZGF0ZShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw0LDEsOTYsMCwwLDMsMiwxLDAsMTAsNiwxLDQsMCwxOCwwLDExXSkpLHRocmVhZHM9KCk9Pihhc3luYyBlPT57dHJ5e3JldHVyblwidW5kZWZpbmVkXCIhPXR5cGVvZiBNZXNzYWdlQ2hhbm5lbCYmKG5ldyBNZXNzYWdlQ2hhbm5lbCkucG9ydDEucG9zdE1lc3NhZ2UobmV3IFNoYXJlZEFycmF5QnVmZmVyKDEpKSxXZWJBc3NlbWJseS52YWxpZGF0ZShlKX1jYXRjaChlKXtyZXR1cm4hMX19KShuZXcgVWludDhBcnJheShbMCw5NywxMTUsMTA5LDEsMCwwLDAsMSw0LDEsOTYsMCwwLDMsMiwxLDAsNSw0LDEsMywxLDEsMTAsMTEsMSw5LDAsNjUsMCwyNTQsMTYsMiwwLDI2LDExXSkpLHR5cGVSZWZsZWN0aW9uPSgpPT4oYXN5bmMoKT0+XCJGdW5jdGlvblwiaW4gV2ViQXNzZW1ibHkpKCksdHlwZWRGdW5jdGlvblJlZmVyZW5jZXM9KCk9Pihhc3luYygpPT57dHJ5e3JldHVybiBuZXcgV2ViQXNzZW1ibHkuTW9kdWxlKFVpbnQ4QXJyYXkuZnJvbShhdG9iKFwiQUdGemJRRUFBQUFCRUFOZ0FYOEJmMkFCWkFBQmYyQUFBWDhEQkFNQkFBSUpCUUVEQUFFQkNod0RDd0JCQ2tFcUlBQVVBR29MQndBZ0FFRUJhZ3NHQU5JQkVBQUxcIiksKGU9PmUuY29kZVBvaW50QXQoMCkpKSksITB9Y2F0Y2goZSl7cmV0dXJuITF9fSkoKTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDI1IE1pY3JvYmxpbmsgTHRkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbmltcG9ydCB7XG4gIGJ1bGtNZW1vcnksXG4gIG11dGFibGVHbG9iYWxzLFxuICByZWZlcmVuY2VUeXBlcyxcbiAgc2F0dXJhdGVkRmxvYXRUb0ludCxcbiAgc2lnbkV4dGVuc2lvbnMsXG4gIHNpbWQsXG4gIHRocmVhZHMsXG59IGZyb20gXCJ3YXNtLWZlYXR1cmUtZGV0ZWN0XCI7XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBicm93c2VyIGlzIFNhZmFyaS5cbiAqXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBicm93c2VyIGlzIFNhZmFyaSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTYWZhcmkoKSB7XG4gIGNvbnN0IHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHVzZXJBZ2VudC5pbmNsdWRlcyhcInNhZmFyaVwiKSAmJiAhdXNlckFnZW50LmluY2x1ZGVzKFwiY2hyb21lXCIpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBXQVNNIHRocmVhZHMuXG4gKlxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBXQVNNIHRocmVhZHMsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBTYWZhcmkgMTYgc2hpcHBlZCB3aXRoIFdBU00gdGhyZWFkcyBzdXBwb3J0LCBidXQgaXQgZGlkbid0IHNoaXAgd2l0aCBuZXN0ZWRcbiAqIHdvcmtlcnMgc3VwcG9ydCwgc28gYW4gZXh0cmEgY2hlY2sgaXMgbmVlZGVkLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL0dvb2dsZUNocm9tZUxhYnMvc3F1b29zaC9wdWxsLzEzMjUvZmlsZXMjZGlmZi05MDQ5MDBkYjY0Y2QzZjQ4YjBlNzY1ZGJiZGM2YTIxOGE3ZWE3NGExOTk2NzFiZGU4MmE4OTQ0YTkwNGRiODZmXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrVGhyZWFkc1N1cHBvcnQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IHN1cHBvcnRzV2FzbVRocmVhZHMgPSBhd2FpdCB0aHJlYWRzKCk7XG4gIGlmICghc3VwcG9ydHNXYXNtVGhyZWFkcykgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICghKFwiaW1wb3J0U2NyaXB0c1wiIGluIHNlbGYpKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICAvLyBTYWZhcmkgaGFzIGlzc3VlcyB3aXRoIHNoYXJlZCBtZW1vcnlcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Vtc2NyaXB0ZW4tY29yZS9lbXNjcmlwdGVuL2lzc3Vlcy8xOTM3NFxuICBpZiAoaXNTYWZhcmkoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBcIldvcmtlclwiIGluIHNlbGY7XG59XG5cbi8qKlxuICogVGhlIFdBU00gdmFyaWFudC5cbiAqL1xuZXhwb3J0IHR5cGUgV2FzbVZhcmlhbnQgPSBcImJhc2ljXCIgfCBcImFkdmFuY2VkXCIgfCBcImFkdmFuY2VkLXRocmVhZHNcIjtcblxuLyoqXG4gKiBEZXRlY3RzIHRoZSBXQVNNIGZlYXR1cmVzLlxuICpcbiAqIEByZXR1cm5zIFRoZSBXQVNNIHZhcmlhbnQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXRlY3RXYXNtRmVhdHVyZXMoKTogUHJvbWlzZTxXYXNtVmFyaWFudD4ge1xuICBjb25zdCBiYXNpY1NldCA9IFtcbiAgICBtdXRhYmxlR2xvYmFscygpLFxuICAgIHJlZmVyZW5jZVR5cGVzKCksXG4gICAgYnVsa01lbW9yeSgpLFxuICAgIHNhdHVyYXRlZEZsb2F0VG9JbnQoKSxcbiAgICBzaWduRXh0ZW5zaW9ucygpLFxuICBdO1xuXG4gIGNvbnN0IHN1cHBvcnRzQmFzaWMgPSAoYXdhaXQgUHJvbWlzZS5hbGwoYmFzaWNTZXQpKS5ldmVyeShCb29sZWFuKTtcblxuICBpZiAoIXN1cHBvcnRzQmFzaWMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCcm93c2VyIGRvZXNuJ3QgbWVldCBtaW5pbXVtIHJlcXVpcmVtZW50cyFcIik7XG4gIH1cblxuICBjb25zdCBzdXBwb3J0c0FkdmFuY2VkID0gYXdhaXQgc2ltZCgpO1xuXG4gIGlmICghc3VwcG9ydHNBZHZhbmNlZCkge1xuICAgIHJldHVybiBcImJhc2ljXCI7XG4gIH1cblxuICBjb25zdCBzdXBwb3J0c0FkdmFuY2VkVGhyZWFkcyA9IGF3YWl0IGNoZWNrVGhyZWFkc1N1cHBvcnQoKTtcblxuICBpZiAoIXN1cHBvcnRzQWR2YW5jZWRUaHJlYWRzKSB7XG4gICAgcmV0dXJuIFwiYWR2YW5jZWRcIjtcbiAgfVxuXG4gIHJldHVybiBcImFkdmFuY2VkLXRocmVhZHNcIjtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDI1IE1pY3JvYmxpbmsgTHRkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbi8qKlxuICogT3JpZ2luYWw6IGh0dHBzOi8vZ2l0aHViLmNvbS9DZXphcnlEYW5pZWxOb3dhay9Dcm9zc09yaWdpbldvcmtlclxuICovXG5cbi8qKlxuICogVGhlIHR5cGUgb2YgdGhlIHdvcmtlci5cbiAqL1xuY29uc3Qgd29ya2VyVHlwZSA9IFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiO1xuXG4vKipcbiAqIFRoZSBvcHRpb25zLlxuICovXG50eXBlIE9wdGlvbnMgPSB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHNraXAgc2FtZSBvcmlnaW4uXG4gICAqL1xuICBza2lwU2FtZU9yaWdpbj86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHVzZSBibG9iLlxuICAgKi9cbiAgdXNlQmxvYj86IGJvb2xlYW47XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIGNyb3NzLW9yaWdpbiB3b3JrZXIgVVJMLlxuICogSWYgc2FtZSBvcmlnaW4sIHRoZSBvcmlnaW5hbCB3b3JrZXIgVVJMIGlzIHJldHVybmVkLlxuICogT3RoZXJ3aXNlLCB0aGUgd29ya2VyIGlzIGZldGNoZWQgYW5kIGNvbnZlcnRlZCB0byBhIGJsb2Igb3IgZGF0YSBVUkwuXG4gKlxuICogQHBhcmFtIG9yaWdpbmFsV29ya2VyVXJsIC0gVGhlIG9yaWdpbmFsIHdvcmtlciBVUkwuXG4gKiBAcGFyYW0gX29wdGlvbnMgLSBUaGUgb3B0aW9ucy5cbiAqIEByZXR1cm5zIFRoZSBjcm9zcy1vcmlnaW4gd29ya2VyIFVSTC5cbiAqL1xuZXhwb3J0IGNvbnN0IGdldENyb3NzT3JpZ2luV29ya2VyVVJMID0gKFxuICBvcmlnaW5hbFdvcmtlclVybDogc3RyaW5nLFxuICBfb3B0aW9uczogT3B0aW9ucyA9IHt9LFxuKSA9PiB7XG4gIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgc2tpcFNhbWVPcmlnaW46IHRydWUsXG4gICAgdXNlQmxvYjogdHJ1ZSxcblxuICAgIC4uLl9vcHRpb25zLFxuICB9O1xuXG4gIGlmIChcbiAgICBvcHRpb25zLnNraXBTYW1lT3JpZ2luICYmXG4gICAgbmV3IFVSTChvcmlnaW5hbFdvcmtlclVybCkub3JpZ2luID09PSBzZWxmLmxvY2F0aW9uLm9yaWdpblxuICApIHtcbiAgICAvLyBUaGUgc2FtZSBvcmlnaW4gLSBXb3JrZXIgd2lsbCBydW4gZmluZVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob3JpZ2luYWxXb3JrZXJVcmwpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oXG4gICAgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIHZvaWQgZmV0Y2gob3JpZ2luYWxXb3JrZXJVcmwpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcy50ZXh0KCkpXG4gICAgICAgIC50aGVuKChjb2RlU3RyaW5nKSA9PiB7XG4gICAgICAgICAgY29uc3Qgd29ya2VyUGF0aCA9IG5ldyBVUkwob3JpZ2luYWxXb3JrZXJVcmwpLmhyZWYuc3BsaXQoXCIvXCIpO1xuICAgICAgICAgIHdvcmtlclBhdGgucG9wKCk7XG5cbiAgICAgICAgICBsZXQgZmluYWxVUkwgPSBcIlwiO1xuXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXNlQmxvYikge1xuICAgICAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtjb2RlU3RyaW5nXSwgeyB0eXBlOiB3b3JrZXJUeXBlIH0pO1xuICAgICAgICAgICAgZmluYWxVUkwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbFVSTCA9IGBkYXRhOiR7d29ya2VyVHlwZX0sYCArIGVuY29kZVVSSUNvbXBvbmVudChjb2RlU3RyaW5nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKGZpbmFsVVJMKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKHJlamVjdCksXG4gICk7XG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjUgTWljcm9ibGluayBMdGQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKi9cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgaXMgaU9TLlxuICpcbiAqIEByZXR1cm5zIFRydWUgaWYgcnVubmluZyBvbiBpT1MgZGV2aWNlLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0lPUygpOiBib29sZWFuIHtcbiAgY29uc3QgdXNlckFnZW50ID0gc2VsZi5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiAvaXBob25lfGlwYWR8aXBvZC8udGVzdCh1c2VyQWdlbnQpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBTYWZhcmkgYnJvd3Nlci5cbiAqXG4gKiBAcmV0dXJucyBUcnVlIGlmIHJ1bm5pbmcgb24gU2FmYXJpLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NhZmFyaSgpOiBib29sZWFuIHtcbiAgY29uc3QgdXNlckFnZW50ID0gc2VsZi5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGlzU2FmYXJpQnJvd3NlciA9XG4gICAgdXNlckFnZW50LmluY2x1ZGVzKFwic2FmYXJpXCIpICYmICF1c2VyQWdlbnQuaW5jbHVkZXMoXCJjaHJvbWVcIik7XG4gIHJldHVybiBpc1NhZmFyaUJyb3dzZXIgfHwgaXNJT1MoKTtcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDI1IE1pY3JvYmxpbmsgTHRkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbmltcG9ydCB7XG4gIExpY2Vuc2VVbmxvY2tSZXN1bHQsXG4gIExpY2Vuc2VSZXF1ZXN0LFxuICBMaWNlbnNlU3RhdHVzUmVzcG9uc2UsXG59IGZyb20gXCJAbWljcm9ibGluay9ibGlua2lkLXdhc21cIjtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIHRoZSBsaWNlbnNlIHJlcXVlc3QuXG4gKlxuICogQHBhcmFtIHVubG9ja1Jlc3VsdCAtIFRoZSBsaWNlbnNlIHVubG9jayByZXN1bHQuXG4gKiBAcmV0dXJucyBUaGUgbGljZW5zZSByZXF1ZXN0LlxuICovXG5mdW5jdGlvbiBjb25zdHJ1Y3RMaWNlbnNlUmVxdWVzdChcbiAgdW5sb2NrUmVzdWx0OiBMaWNlbnNlVW5sb2NrUmVzdWx0LFxuKTogTGljZW5zZVJlcXVlc3Qge1xuICByZXR1cm4ge1xuICAgIGxpY2Vuc2VJZDogdW5sb2NrUmVzdWx0LmxpY2Vuc2VJZCxcbiAgICBsaWNlbnNlZTogdW5sb2NrUmVzdWx0LmxpY2Vuc2VlLFxuICAgIGFwcGxpY2F0aW9uSWRzOiB1bmxvY2tSZXN1bHQuYXBwbGljYXRpb25JZHMsXG4gICAgcGFja2FnZU5hbWU6IHVubG9ja1Jlc3VsdC5wYWNrYWdlTmFtZSxcbiAgICBwbGF0Zm9ybTogXCJCcm93c2VyXCIsXG4gICAgc2RrTmFtZTogdW5sb2NrUmVzdWx0LnNka05hbWUsXG4gICAgc2RrVmVyc2lvbjogdW5sb2NrUmVzdWx0LnNka1ZlcnNpb24sXG4gIH07XG59XG5cbi8qKlxuICogT2J0YWlucyBhIG5ldyBzZXJ2ZXIgcGVybWlzc2lvbiBmcm9tIE1pY3JvYmxpbmsncyBCYWx0YXphciBzZXJ2aWNlLlxuICpcbiAqIEBwYXJhbSB1bmxvY2tSZXN1bHQgLSBUaGUgbGljZW5zZSB1bmxvY2sgcmVzdWx0IGNvbnRhaW5pbmcgbGljZW5zZSBpbmZvcm1hdGlvbi5cbiAqIEBwYXJhbSBiYWx0YXphclVybCAtIFRoZSBCYWx0YXphciBzZXJ2ZXIgVVJMLiBDYW4gYmUgYSBwcm94eSBVUkwgaWYgY29uZmlndXJlZC5cbiAqICAgICAgICAgICAgICAgICAgICAgIERlZmF1bHRzIHRvIHRoZSBvZmZpY2lhbCBNaWNyb2JsaW5rIEJhbHRhemFyIHNlcnZlci5cbiAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBzZXJ2ZXIgcGVybWlzc2lvbiByZXNwb25zZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gVXNpbmcgZGVmYXVsdCBNaWNyb2JsaW5rIHNlcnZlclxuICogY29uc3QgcGVybWlzc2lvbiA9IGF3YWl0IG9idGFpbk5ld1NlcnZlclBlcm1pc3Npb24odW5sb2NrUmVzdWx0KTtcbiAqXG4gKiAvLyBVc2luZyBjdXN0b20gcHJveHkgc2VydmVyXG4gKiBjb25zdCBwZXJtaXNzaW9uID0gYXdhaXQgb2J0YWluTmV3U2VydmVyUGVybWlzc2lvbihcbiAqICAgdW5sb2NrUmVzdWx0LFxuICogICBcImh0dHBzOi8veW91ci1wcm94eS5leGFtcGxlLmNvbS9hcGkvdjIvc3RhdHVzL2NoZWNrXCJcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9idGFpbk5ld1NlcnZlclBlcm1pc3Npb24oXG4gIHVubG9ja1Jlc3VsdDogTGljZW5zZVVubG9ja1Jlc3VsdCxcbiAgYmFsdGF6YXJVcmwgPSBcImh0dHBzOi8vYmFsdGF6YXIubWljcm9ibGluay5jb20vYXBpL3YyL3N0YXR1cy9jaGVja1wiLFxuKSB7XG4gIC8vIEJhc2ljIFVSTCB2YWxpZGF0aW9uXG4gIGlmICghYmFsdGF6YXJVcmwgfHwgdHlwZW9mIGJhbHRhemFyVXJsICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYWx0YXphclVybDogbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmdcIik7XG4gIH1cblxuICAvLyBWYWxpZGF0ZXMgVVJMIGZvcm1hdFxuICB0cnkge1xuICAgIG5ldyBVUkwoYmFsdGF6YXJVcmwpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBiYWx0YXphclVybCBmb3JtYXQ6ICR7YmFsdGF6YXJVcmx9YCk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYmFsdGF6YXJVcmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgfSxcbiAgICAgIGNhY2hlOiBcIm5vLWNhY2hlXCIsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjb25zdHJ1Y3RMaWNlbnNlUmVxdWVzdCh1bmxvY2tSZXN1bHQpKSxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFNlcnZlciByZXR1cm5lZCBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJ2ZXJQZXJtaXNzaW9uID0gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkgYXMgTGljZW5zZVN0YXR1c1Jlc3BvbnNlO1xuICAgIHJldHVybiBzZXJ2ZXJQZXJtaXNzaW9uO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJTZXJ2ZXIgcGVybWlzc2lvbiByZXF1ZXN0IGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAyNSBNaWNyb2JsaW5rIEx0ZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqL1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY29udmVydHMgbWVnYWJ5dGVzIHRvIFdlYkFzc2VtYmx5IHBhZ2VzLlxuICpcbiAqIEBwYXJhbSBtYiAtIFRoZSBudW1iZXIgb2YgbWVnYWJ5dGVzLlxuICogQHJldHVybnMgVGhlIG51bWJlciBvZiBXZWJBc3NlbWJseSBwYWdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1iVG9XYXNtUGFnZXMobWI6IG51bWJlcikge1xuICByZXR1cm4gTWF0aC5jZWlsKChtYiAqIDEwMjQgKiAxMDI0KSAvIDY0IC8gMTAyNCk7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAyNSBNaWNyb2JsaW5rIEx0ZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqL1xuXG4vKipcbiAqIERvd25sb2FkcyB0aGUgcmVzb3VyY2UgYXQgdGhlIGdpdmVuIFVSTCBhbmQgcmV0dXJucyBpdHMgQXJyYXlCdWZmZXIuXG4gKiBAcGFyYW0gdXJsIC0gVGhlIFVSTCBvZiB0aGUgcmVzb3VyY2UgdG8gZG93bmxvYWQuXG4gKiBAcGFyYW0gcHJvZ3Jlc3NDYWxsYmFjayAtIEFuIG9wdGlvbmFsIGNhbGxiYWNrIHRoYXQgaXMgY2FsbGVkIHdpdGggZG93bmxvYWQgcHJvZ3Jlc3MuXG4gKiBAcmV0dXJucyBUaGUgZG93bmxvYWRlZCBBcnJheUJ1ZmZlci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQXJyYXlCdWZmZXIoXG4gIHVybDogc3RyaW5nLFxuICBwcm9ncmVzc0NhbGxiYWNrPzogKHByb2dyZXNzOiBEb3dubG9hZFByb2dyZXNzKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxBcnJheUJ1ZmZlcj4ge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG5cbiAgLy8gRmFsbGJhY2s6IGlmIHJlc3BvbnNlIGJvZHkgb3IgY29udGVudCBsZW5ndGggbm90IGF2YWlsYWJsZSwgcmV0dXJuIHRoZSBmdWxsIEFycmF5QnVmZmVyIGRpcmVjdGx5LlxuICBpZiAoIXJlc3BvbnNlLmJvZHkgfHwgIXJlc3BvbnNlLmhlYWRlcnMuaGFzKFwiQ29udGVudC1MZW5ndGhcIikpIHtcbiAgICByZXR1cm4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBwYXJzZUludChyZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpISwgMTApO1xuICBsZXQgbG9hZGVkID0gMDtcbiAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcblxuICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgd2hpbGUgKCFyZXN1bHQuZG9uZSkge1xuICAgIGNvbnN0IHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY2h1bmtzLnB1c2godmFsdWUpO1xuICAgICAgbG9hZGVkICs9IHZhbHVlLmxlbmd0aDtcbiAgICAgIGlmIChwcm9ncmVzc0NhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHByb2dyZXNzID0gTWF0aC5taW4oXG4gICAgICAgICAgTWF0aC5yb3VuZCgobG9hZGVkIC8gY29udGVudExlbmd0aCkgKiAxMDApLFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgKTtcbiAgICAgICAgcHJvZ3Jlc3NDYWxsYmFjayh7XG4gICAgICAgICAgbG9hZGVkLFxuICAgICAgICAgIGNvbnRlbnRMZW5ndGgsXG4gICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICB9XG5cbiAgY29uc3QgYWxsQ2h1bmtzID0gbmV3IFVpbnQ4QXJyYXkobG9hZGVkKTtcbiAgbGV0IHBvc2l0aW9uID0gMDtcbiAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICBhbGxDaHVua3Muc2V0KGNodW5rLCBwb3NpdGlvbik7XG4gICAgcG9zaXRpb24gKz0gY2h1bmsubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIGFsbENodW5rcy5idWZmZXI7XG59XG5cbi8qKlxuICogVGhlIGRvd25sb2FkIHByb2dyZXNzLlxuICovXG5leHBvcnQgdHlwZSBEb3dubG9hZFByb2dyZXNzID0ge1xuICBsb2FkZWQ6IG51bWJlcjtcbiAgY29udGVudExlbmd0aDogbnVtYmVyO1xuICBwcm9ncmVzczogbnVtYmVyO1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDI1IE1pY3JvYmxpbmsgTHRkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbi8qKlxuICogQnVpbGRzLCBub3JtYWxpemVzLCBhbmQgdmFsaWRhdGVzIGEgcmVzb3VyY2UgVVJMIGJ5IGpvaW5pbmcgcGF0aCBzZWdtZW50cy5cbiAqXG4gKiBAcGFyYW0gc2VnbWVudHMgLSBBcnJheSBvZiBwYXRoIHNlZ21lbnRzIHRvIGpvaW4uXG4gKiBAcmV0dXJucyBOb3JtYWxpemVkIFVSTCBwYXRoLlxuICogQHRocm93cyBFcnJvciBpZiB0aGUgcmVzdWx0aW5nIFVSTCBpcyBpbnZhbGlkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXNvdXJjZVBhdGgoLi4uc2VnbWVudHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgLy8gRmlsdGVyIG91dCBudWxsLCB1bmRlZmluZWQsIG9yIGVtcHR5IHNlZ21lbnRzIHVzaW5nIEJvb2xlYW4uXG4gIGNvbnN0IHBhdGggPSBzZWdtZW50c1xuICAgIC5maWx0ZXIoKHNlZ21lbnQpID0+IHNlZ21lbnQpIC8vIFVzaW5nIEJvb2xlYW4gZmlsdGVyaW5nIGlzIHNhZmUgc2luY2Ugbm9uLWVtcHR5IHN0cmluZ3MgYXJlIHRydXRoeS5cbiAgICAuam9pbihcIi9cIilcbiAgICAucmVwbGFjZSgvKFteOl1cXC8pXFwvKy9nLCBcIiQxXCIpO1xuXG4gIC8vIFZhbGlkYXRlIHRoZSBVUkwgdXNpbmcgYSBkdW1teSBiYXNlICh3b3JrcyBmb3IgYm90aCBhYnNvbHV0ZSBhbmQgcmVsYXRpdmUgVVJMcykuXG4gIHRyeSB7XG4gICAgbmV3IFVSTChwYXRoLCBcImh0dHA6Ly9leGFtcGxlLmNvbVwiKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFVSTDogJHtwYXRofWApO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG4iLCIvKiogUmV0dXJucyB0aGUgb2JqZWN0IHR5cGUgb2YgdGhlIGdpdmVuIHBheWxvYWQgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUeXBlKHBheWxvYWQpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHBheWxvYWQpLnNsaWNlKDgsIC0xKTtcbn1cbiIsImltcG9ydCB7IGdldFR5cGUgfSBmcm9tICcuL2dldFR5cGUuanMnO1xuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHBheWxvYWQgaXMgYSBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdCAoZXhjbHVkaW5nIHNwZWNpYWwgY2xhc3NlcyBvciBvYmplY3RzXG4gKiB3aXRoIG90aGVyIHByb3RvdHlwZXMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KHBheWxvYWQpIHtcbiAgICBpZiAoZ2V0VHlwZShwYXlsb2FkKSAhPT0gJ09iamVjdCcpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBwcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGF5bG9hZCk7XG4gICAgcmV0dXJuICEhcHJvdG90eXBlICYmIHByb3RvdHlwZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0ICYmIHByb3RvdHlwZSA9PT0gT2JqZWN0LnByb3RvdHlwZTtcbn1cbiIsImltcG9ydCB7IGdldFR5cGUgfSBmcm9tICcuL2dldFR5cGUuanMnO1xuLyoqIFJldHVybnMgd2hldGhlciB0aGUgcGF5bG9hZCBpcyBhIFN5bWJvbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3ltYm9sKHBheWxvYWQpIHtcbiAgICByZXR1cm4gZ2V0VHlwZShwYXlsb2FkKSA9PT0gJ1N5bWJvbCc7XG59XG4iLCJpbXBvcnQgeyBpc1BsYWluT2JqZWN0LCBpc1N5bWJvbCB9IGZyb20gJ2lzLXdoYXQnO1xuaW1wb3J0IHsgY29uY2F0QXJyYXlzIH0gZnJvbSAnLi9leHRlbnNpb25zLmpzJztcbmZ1bmN0aW9uIGFzc2lnblByb3AoY2FycnksIGtleSwgbmV3VmFsLCBvcmlnaW5hbE9iamVjdCkge1xuICAgIGNvbnN0IHByb3BUeXBlID0ge30ucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvcmlnaW5hbE9iamVjdCwga2V5KVxuICAgICAgICA/ICdlbnVtZXJhYmxlJ1xuICAgICAgICA6ICdub25lbnVtZXJhYmxlJztcbiAgICBpZiAocHJvcFR5cGUgPT09ICdlbnVtZXJhYmxlJylcbiAgICAgICAgY2Fycnlba2V5XSA9IG5ld1ZhbDtcbiAgICBpZiAocHJvcFR5cGUgPT09ICdub25lbnVtZXJhYmxlJykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FycnksIGtleSwge1xuICAgICAgICAgICAgdmFsdWU6IG5ld1ZhbCxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1lcmdlUmVjdXJzaXZlbHkob3JpZ2luLCBuZXdDb21lciwgY29tcGFyZUZuKSB7XG4gICAgLy8gYWx3YXlzIHJldHVybiBuZXdDb21lciBpZiBpdHMgbm90IGFuIG9iamVjdFxuICAgIGlmICghaXNQbGFpbk9iamVjdChuZXdDb21lcikpXG4gICAgICAgIHJldHVybiBuZXdDb21lcjtcbiAgICAvLyBkZWZpbmUgbmV3T2JqZWN0IHRvIG1lcmdlIGFsbCB2YWx1ZXMgdXBvblxuICAgIGxldCBuZXdPYmplY3QgPSB7fTtcbiAgICBpZiAoaXNQbGFpbk9iamVjdChvcmlnaW4pKSB7XG4gICAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob3JpZ2luKTtcbiAgICAgICAgY29uc3Qgc3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob3JpZ2luKTtcbiAgICAgICAgbmV3T2JqZWN0ID0gWy4uLnByb3BzLCAuLi5zeW1ib2xzXS5yZWR1Y2UoKGNhcnJ5LCBrZXkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFZhbCA9IG9yaWdpbltrZXldO1xuICAgICAgICAgICAgaWYgKCghaXNTeW1ib2woa2V5KSAmJiAhT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobmV3Q29tZXIpLmluY2x1ZGVzKGtleSkpIHx8XG4gICAgICAgICAgICAgICAgKGlzU3ltYm9sKGtleSkgJiYgIU9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobmV3Q29tZXIpLmluY2x1ZGVzKGtleSkpKSB7XG4gICAgICAgICAgICAgICAgYXNzaWduUHJvcChjYXJyeSwga2V5LCB0YXJnZXRWYWwsIG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2Fycnk7XG4gICAgICAgIH0sIHt9KTtcbiAgICB9XG4gICAgLy8gbmV3T2JqZWN0IGhhcyBhbGwgcHJvcGVydGllcyB0aGF0IG5ld0NvbWVyIGhhc24ndFxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobmV3Q29tZXIpO1xuICAgIGNvbnN0IHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld0NvbWVyKTtcbiAgICBjb25zdCByZXN1bHQgPSBbLi4ucHJvcHMsIC4uLnN5bWJvbHNdLnJlZHVjZSgoY2FycnksIGtleSkgPT4ge1xuICAgICAgICAvLyByZS1kZWZpbmUgdGhlIG9yaWdpbiBhbmQgbmV3Q29tZXIgYXMgdGFyZ2V0VmFsIGFuZCBuZXdWYWxcbiAgICAgICAgbGV0IG5ld1ZhbCA9IG5ld0NvbWVyW2tleV07XG4gICAgICAgIGNvbnN0IHRhcmdldFZhbCA9IGlzUGxhaW5PYmplY3Qob3JpZ2luKSA/IG9yaWdpbltrZXldIDogdW5kZWZpbmVkO1xuICAgICAgICAvLyBXaGVuIG5ld1ZhbCBpcyBhbiBvYmplY3QgZG8gdGhlIG1lcmdlIHJlY3Vyc2l2ZWx5XG4gICAgICAgIGlmICh0YXJnZXRWYWwgIT09IHVuZGVmaW5lZCAmJiBpc1BsYWluT2JqZWN0KG5ld1ZhbCkpIHtcbiAgICAgICAgICAgIG5ld1ZhbCA9IG1lcmdlUmVjdXJzaXZlbHkodGFyZ2V0VmFsLCBuZXdWYWwsIGNvbXBhcmVGbik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvcFRvQXNzaWduID0gY29tcGFyZUZuID8gY29tcGFyZUZuKHRhcmdldFZhbCwgbmV3VmFsLCBrZXkpIDogbmV3VmFsO1xuICAgICAgICBhc3NpZ25Qcm9wKGNhcnJ5LCBrZXksIHByb3BUb0Fzc2lnbiwgbmV3Q29tZXIpO1xuICAgICAgICByZXR1cm4gY2Fycnk7XG4gICAgfSwgbmV3T2JqZWN0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLyoqXG4gKiBNZXJnZSBhbnl0aGluZyByZWN1cnNpdmVseS5cbiAqIE9iamVjdHMgZ2V0IG1lcmdlZCwgc3BlY2lhbCBvYmplY3RzIChjbGFzc2VzIGV0Yy4pIGFyZSByZS1hc3NpZ25lZCBcImFzIGlzXCIuXG4gKiBCYXNpYyB0eXBlcyBvdmVyd3JpdGUgb2JqZWN0cyBvciBvdGhlciBiYXNpYyB0eXBlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdCwgLi4ub3RoZXJPYmplY3RzKSB7XG4gICAgcmV0dXJuIG90aGVyT2JqZWN0cy5yZWR1Y2UoKHJlc3VsdCwgbmV3Q29tZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIG1lcmdlUmVjdXJzaXZlbHkocmVzdWx0LCBuZXdDb21lcik7XG4gICAgfSwgb2JqZWN0KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUFuZENvbXBhcmUoY29tcGFyZUZuLCBvYmplY3QsIC4uLm90aGVyT2JqZWN0cykge1xuICAgIHJldHVybiBvdGhlck9iamVjdHMucmVkdWNlKChyZXN1bHQsIG5ld0NvbWVyKSA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZVJlY3Vyc2l2ZWx5KHJlc3VsdCwgbmV3Q29tZXIsIGNvbXBhcmVGbik7XG4gICAgfSwgb2JqZWN0KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUFuZENvbmNhdChvYmplY3QsIC4uLm90aGVyT2JqZWN0cykge1xuICAgIHJldHVybiBvdGhlck9iamVjdHMucmVkdWNlKChyZXN1bHQsIG5ld0NvbWVyKSA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZVJlY3Vyc2l2ZWx5KHJlc3VsdCwgbmV3Q29tZXIsIGNvbmNhdEFycmF5cyk7XG4gICAgfSwgb2JqZWN0KTtcbn1cbi8vIGltcG9ydCB7IFRpbWVzdGFtcCB9IGZyb20gJy4uL3Rlc3QvVGltZXN0YW1wJ1xuLy8gdHlwZSBUMSA9IHsgZGF0ZTogVGltZXN0YW1wIH1cbi8vIHR5cGUgVDIgPSBbeyBiOiBzdHJpbmdbXSB9LCB7IGI6IG51bWJlcltdIH0sIHsgZGF0ZTogVGltZXN0YW1wIH1dXG4vLyB0eXBlIFRlc3RUID0gTWVyZ2U8VDEsIFQyPlxuLy8gdHlwZSBBMSA9IHsgYXJyOiBzdHJpbmdbXSB9XG4vLyB0eXBlIEEyID0geyBhcnI6IG51bWJlcltdIH1cbi8vIHR5cGUgQTMgPSB7IGFycjogYm9vbGVhbltdIH1cbi8vIHR5cGUgVGVzdEEgPSBNZXJnZTxBMSwgW0EyLCBBM10+XG4vLyBpbnRlcmZhY2UgSTEge1xuLy8gICBkYXRlOiBUaW1lc3RhbXBcbi8vIH1cbi8vIGludGVyZmFjZSBJMiB7XG4vLyAgIGRhdGU6IFRpbWVzdGFtcFxuLy8gfVxuLy8gY29uc3QgX2E6IEkyID0geyBkYXRlOiAnJyB9IGFzIHVua25vd24gYXMgSTJcbi8vIHR5cGUgVGVzdEkgPSBNZXJnZTxJMSwgW0kyXT5cbi8vIC8vIFJldHVyblR5cGU8KHR5cGVvZiBtZXJnZSk8STEsIEkyPj5cbi8vIGNvbnN0IGEgPSBtZXJnZShfYSwgW19hXSlcbi8vIGludGVyZmFjZSBBcmd1bWVudHMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nIHwgbnVtYmVyIHwgc3ltYm9sLCB1bmtub3duPiB7XG4vLyAgICAga2V5OiBzdHJpbmc7XG4vLyB9XG4vLyBjb25zdCBhYTE6IEFyZ3VtZW50cyA9IHsga2V5OiBcInZhbHVlMVwiIH1cbi8vIGNvbnN0IGFhMjogQXJndW1lbnRzID0geyBrZXk6IFwidmFsdWUyXCIgfVxuLy8gY29uc3QgYWEgPSBtZXJnZShhMSwgYTIpO1xuLy8gaW50ZXJmYWNlIEJhcmd1bWVudHMge1xuLy8gICBrZXk6IHN0cmluZ1xuLy8gfVxuLy8gY29uc3QgYmExOiBCYXJndW1lbnRzID0geyBrZXk6ICd2YWx1ZTEnIH1cbi8vIGNvbnN0IGJhMjogQmFyZ3VtZW50cyA9IHsga2V5OiAndmFsdWUyJyB9XG4vLyBjb25zdCBiYSA9IG1lcmdlKGJhMSwgYmEyKVxuLy8gaW50ZXJmYWNlIENhcmd1bWVudHMge1xuLy8gICBrZXk6IHN0cmluZ1xuLy8gfVxuLy8gY29uc3QgY2EgPSBtZXJnZTxDYXJndW1lbnRzLCBDYXJndW1lbnRzW10+KHsga2V5OiAndmFsdWUxJyB9LCB7IGtleTogJ3ZhbHVlMicgfSlcbi8vIHR5cGUgUCA9IFBvcDxDYXJndW1lbnRzW10+XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAyNSBNaWNyb2JsaW5rIEx0ZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqL1xuXG5pbXBvcnQge1xuICBCbGlua0lkU2Vzc2lvblNldHRpbmdzLFxuICBDcm9wcGVkSW1hZ2VTZXR0aW5ncyxcbiAgRG9jdW1lbnRBbm9ueW1pemF0aW9uU2V0dGluZ3MsXG4gIERvY3VtZW50RmlsdGVyLFxuICBEb2N1bWVudFJ1bGVzLFxuICBSZWNvZ25pdGlvbk1vZGVGaWx0ZXIsXG4gIFNjYW5uaW5nU2V0dGluZ3MsXG59IGZyb20gXCJAbWljcm9ibGluay9ibGlua2lkLXdhc21cIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIm1lcmdlLWFueXRoaW5nXCI7XG5pbXBvcnQgeyBPdmVycmlkZVByb3BlcnRpZXMgfSBmcm9tIFwidHlwZS1mZXN0XCI7XG5cbi8qKlxuICogVGhlIHBhcnRpYWwgc2Nhbm5pbmcgc2V0dGluZ3MuXG4gKi9cbmV4cG9ydCB0eXBlIFBhcnRpYWxTY2FubmluZ1NldHRpbmdzID0gUGFydGlhbDxcbiAgT3ZlcnJpZGVQcm9wZXJ0aWVzPFxuICAgIFNjYW5uaW5nU2V0dGluZ3MsXG4gICAge1xuICAgICAgY3JvcHBlZEltYWdlU2V0dGluZ3M6IFBhcnRpYWw8Q3JvcHBlZEltYWdlU2V0dGluZ3M+O1xuICAgICAgcmVjb2duaXRpb25Nb2RlRmlsdGVyOiBQYXJ0aWFsPFJlY29nbml0aW9uTW9kZUZpbHRlcj47XG4gICAgICBjdXN0b21Eb2N1bWVudFJ1bGVzOiBQYXJ0aWFsPERvY3VtZW50UnVsZXM+W107XG4gICAgfVxuICA+XG4+O1xuXG4vKipcbiAqIFRoZSBwYXJ0aWFsIEJsaW5rSUQgc2Vzc2lvbiBzZXR0aW5ncy5cbiAqL1xuZXhwb3J0IHR5cGUgUGFydGlhbEJsaW5rSWRTZXNzaW9uU2V0dGluZ3MgPSBPdmVycmlkZVByb3BlcnRpZXM8XG4gIFBhcnRpYWw8QmxpbmtJZFNlc3Npb25TZXR0aW5ncz4sXG4gIHtcbiAgICBzY2FubmluZ1NldHRpbmdzPzogUGFydGlhbFNjYW5uaW5nU2V0dGluZ3M7XG4gIH1cbj47XG5cbi8qKlxuICogTm9ybWFsaXplcyB0aGUgZG9jdW1lbnQgZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBmaWx0ZXIgLSBUaGUgZG9jdW1lbnQgZmlsdGVyLlxuICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgZG9jdW1lbnQgZmlsdGVyLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVEb2N1bWVudEZpbHRlcihcbiAgZmlsdGVyOiBEb2N1bWVudEZpbHRlciB8IHVuZGVmaW5lZCxcbik6IERvY3VtZW50RmlsdGVyIHtcbiAgcmV0dXJuIHtcbiAgICBjb3VudHJ5OiBmaWx0ZXI/LmNvdW50cnkgPz8gdW5kZWZpbmVkLFxuICAgIHJlZ2lvbjogZmlsdGVyPy5yZWdpb24gPz8gdW5kZWZpbmVkLFxuICAgIHR5cGU6IGZpbHRlcj8udHlwZSA/PyB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyB0aGUgZG9jdW1lbnQgcnVsZS5cbiAqXG4gKiBAcGFyYW0gcnVsZSAtIFRoZSBkb2N1bWVudCBydWxlLlxuICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgZG9jdW1lbnQgcnVsZS5cbiAqL1xuZXhwb3J0IGNvbnN0IG5vcm1hbGl6ZURvY3VtZW50UnVsZSA9IChcbiAgcnVsZTogUGFydGlhbDxEb2N1bWVudFJ1bGVzPixcbik6IERvY3VtZW50UnVsZXMgPT4ge1xuICByZXR1cm4ge1xuICAgIGRvY3VtZW50RmlsdGVyOiBub3JtYWxpemVEb2N1bWVudEZpbHRlcihydWxlLmRvY3VtZW50RmlsdGVyKSxcbiAgICBmaWVsZHM6IHJ1bGUuZmllbGRzID8/IFtdLFxuICB9O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemVzIHRoZSBkb2N1bWVudCBhbm9ueW1pemF0aW9uIHNldHRpbmdzLlxuICpcbiAqIEBwYXJhbSBzZXR0aW5ncyAtIFRoZSBkb2N1bWVudCBhbm9ueW1pemF0aW9uIHNldHRpbmdzLlxuICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgZG9jdW1lbnQgYW5vbnltaXphdGlvbiBzZXR0aW5ncy5cbiAqL1xuZXhwb3J0IGNvbnN0IG5vcm1hbGl6ZURvY3VtZW50QW5vbnltaXphdGlvblNldHRpbmdzID0gKFxuICBzZXR0aW5nczogRG9jdW1lbnRBbm9ueW1pemF0aW9uU2V0dGluZ3MsXG4pOiBEb2N1bWVudEFub255bWl6YXRpb25TZXR0aW5ncyA9PiB7XG4gIHJldHVybiB7XG4gICAgZG9jdW1lbnRGaWx0ZXI6IG5vcm1hbGl6ZURvY3VtZW50RmlsdGVyKHNldHRpbmdzLmRvY3VtZW50RmlsdGVyKSxcbiAgICBmaWVsZHM6IHNldHRpbmdzLmZpZWxkcyB8fCBbXSxcbiAgICBkb2N1bWVudE51bWJlckFub255bWl6YXRpb25TZXR0aW5nczpcbiAgICAgIHNldHRpbmdzLmRvY3VtZW50TnVtYmVyQW5vbnltaXphdGlvblNldHRpbmdzXG4gICAgICAgID8ge1xuICAgICAgICAgICAgcHJlZml4RGlnaXRzVmlzaWJsZTpcbiAgICAgICAgICAgICAgc2V0dGluZ3MuZG9jdW1lbnROdW1iZXJBbm9ueW1pemF0aW9uU2V0dGluZ3MucHJlZml4RGlnaXRzVmlzaWJsZSxcbiAgICAgICAgICAgIHN1ZmZpeERpZ2l0c1Zpc2libGU6XG4gICAgICAgICAgICAgIHNldHRpbmdzLmRvY3VtZW50TnVtYmVyQW5vbnltaXphdGlvblNldHRpbmdzLnN1ZmZpeERpZ2l0c1Zpc2libGUsXG4gICAgICAgICAgfVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgfTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBtZXJnZWQgQmxpbmtJZCBzZXNzaW9uIHNldHRpbmdzIGZyb20gZGVmYXVsdCBzZXR0aW5ncyBhbmQgdXNlciBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSBvcHRpb25zIC0gVXNlci1wcm92aWRlZCBzZXNzaW9uIHNldHRpbmdzLlxuICogQHBhcmFtIGRlZmF1bHRTZXNzaW9uU2V0dGluZ3MgLSBUaGUgYmFzZSBzZXNzaW9uIHNldHRpbmdzIHRvIHVzZS4gVGhlc2VcbiAqIHNldHRpbmdzIHdpbGwgYmUgbWVyZ2VkIHdpdGggdGhlIHByb3ZpZGVkIGBvcHRpb25zYCwgd2hlcmUgYG9wdGlvbnNgIGNhblxuICogb3ZlcnJpZGUgc3BlY2lmaWMgdmFsdWVzLlxuICpcbiAqIEByZXR1cm5zIENvbXBsZXRlIG1lcmdlZCBzZXR0aW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU2Vzc2lvblNldHRpbmdzKFxuICBvcHRpb25zOiBQYXJ0aWFsQmxpbmtJZFNlc3Npb25TZXR0aW5ncyA9IHt9LFxuICBkZWZhdWx0U2Vzc2lvblNldHRpbmdzOiBCbGlua0lkU2Vzc2lvblNldHRpbmdzLFxuKTogQmxpbmtJZFNlc3Npb25TZXR0aW5ncyB7XG4gIC8vIFRPRE86IGZpbmQgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSB0aGlzXG4gIC8vIFJlbW92ZSBrZXlzIHdpdGggdW5kZWZpbmVkIHZhbHVlcyBmcm9tIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXMob3B0aW9ucykuZmlsdGVyKChbXywgdmFsdWVdKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgY3VzdG9tRG9jdW1lbnRSdWxlczogRG9jdW1lbnRSdWxlc1tdID1cbiAgICBvcHRpb25zPy5zY2FubmluZ1NldHRpbmdzPy5jdXN0b21Eb2N1bWVudFJ1bGVzPy5tYXAoXG4gICAgICBub3JtYWxpemVEb2N1bWVudFJ1bGUsXG4gICAgKSA/PyBbXTtcblxuICBjb25zdCBjdXN0b21Eb2N1bWVudEFub255bWl6YXRpb25TZXR0aW5nczogRG9jdW1lbnRBbm9ueW1pemF0aW9uU2V0dGluZ3NbXSA9XG4gICAgb3B0aW9ucz8uc2Nhbm5pbmdTZXR0aW5ncz8uY3VzdG9tRG9jdW1lbnRBbm9ueW1pemF0aW9uU2V0dGluZ3M/Lm1hcChcbiAgICAgIG5vcm1hbGl6ZURvY3VtZW50QW5vbnltaXphdGlvblNldHRpbmdzLFxuICAgICkgPz8gW107XG5cbiAgY29uc3Qgc2Nhbm5pbmdTZXR0aW5ncyA9IHtcbiAgICAuLi5vcHRpb25zPy5zY2FubmluZ1NldHRpbmdzLFxuICAgIGN1c3RvbURvY3VtZW50UnVsZXMsXG4gICAgY3VzdG9tRG9jdW1lbnRBbm9ueW1pemF0aW9uU2V0dGluZ3MsXG4gIH07XG5cbiAgY29uc3Qgc2Vzc2lvblNldHRpbmdzID0gbWVyZ2UoZGVmYXVsdFNlc3Npb25TZXR0aW5ncywge1xuICAgIC4uLm9wdGlvbnMsXG4gICAgc2Nhbm5pbmdTZXR0aW5ncyxcbiAgfSk7XG5cbiAgcmV0dXJuIHNlc3Npb25TZXR0aW5ncztcbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDI1IE1pY3JvYmxpbmsgTHRkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbmltcG9ydCB7IGV4cG9zZSwgZmluYWxpemVyLCBwcm94eSwgUHJveHlNYXJrZWQsIHRyYW5zZmVyIH0gZnJvbSBcImNvbWxpbmtcIjtcbmltcG9ydCB7IGRldGVjdFdhc21GZWF0dXJlcywgV2FzbVZhcmlhbnQgfSBmcm9tIFwiLi93YXNtLWZlYXR1cmUtZGV0ZWN0XCI7XG5cbmltcG9ydCB7XG4gIEJsaW5rSWRQcm9jZXNzUmVzdWx0LFxuICBCbGlua0lkU2Nhbm5pbmdTZXNzaW9uLFxuICBCbGlua0lkU2Vzc2lvblNldHRpbmdzLFxuICBCbGlua0lkV2FzbU1vZHVsZSxcbiAgRW1zY3JpcHRlbk1vZHVsZUZhY3RvcnksXG59IGZyb20gXCJAbWljcm9ibGluay9ibGlua2lkLXdhc21cIjtcbmltcG9ydCB7IE92ZXJyaWRlUHJvcGVydGllcyB9IGZyb20gXCJ0eXBlLWZlc3RcIjtcbmltcG9ydCB7IGdldENyb3NzT3JpZ2luV29ya2VyVVJMIH0gZnJvbSBcIi4vZ2V0Q3Jvc3NPcmlnaW5Xb3JrZXJVUkxcIjtcbmltcG9ydCB7IGlzSU9TIH0gZnJvbSBcIi4vaXNTYWZhcmlcIjtcbmltcG9ydCB7IG9idGFpbk5ld1NlcnZlclBlcm1pc3Npb24gfSBmcm9tIFwiLi9saWNlbmNpbmdcIjtcbmltcG9ydCB7IG1iVG9XYXNtUGFnZXMgfSBmcm9tIFwiLi9tYlRvV2FzbVBhZ2VzXCI7XG5cbmltcG9ydCB7IGRvd25sb2FkQXJyYXlCdWZmZXIsIERvd25sb2FkUHJvZ3Jlc3MgfSBmcm9tIFwiLi9kb3dubG9hZEFycmF5QnVmZmVyXCI7XG5pbXBvcnQgeyBidWlsZFJlc291cmNlUGF0aCB9IGZyb20gXCIuL2J1aWxkUmVzb3VyY2VQYXRoXCI7XG5pbXBvcnQge1xuICBidWlsZFNlc3Npb25TZXR0aW5ncyxcbiAgUGFydGlhbEJsaW5rSWRTZXNzaW9uU2V0dGluZ3MsXG59IGZyb20gXCIuL2J1aWxkU2Vzc2lvblNldHRpbmdzXCI7XG4vLyBtaWdodCBiZSBuZWVkZWQgZm9yIHR5cGVzIHRvIHdvcmtcblxuaW1wb3J0IHR5cGUge1xuICBCbGlua0lkU2Nhbm5pbmdSZXN1bHQsXG4gIEJsaW5rSWRTZXNzaW9uRXJyb3IsXG4gIExpY2Vuc2VUb2tlblN0YXRlLFxufSBmcm9tIFwiQG1pY3JvYmxpbmsvYmxpbmtpZC13YXNtXCI7XG5cbi8qKlxuICogVGhpcyBpcyBhIHdvcmthcm91bmQgZm9yIHRoZSBmYWN0IHRoYXQgdGhlIHR5cGVzIGFyZSBub3QgZXhwb3J0ZWQuXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktaW50ZXJmYWNlXG5pbnRlcmZhY2UgX0JsaW5rSWRTY2FubmluZ1Jlc3VsdCBleHRlbmRzIEJsaW5rSWRTY2FubmluZ1Jlc3VsdCB7fVxuXG4vKipcbiAqIFRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciB0aGUgZmFjdCB0aGF0IHRoZSB0eXBlcyBhcmUgbm90IGV4cG9ydGVkLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWludGVyZmFjZVxuaW50ZXJmYWNlIF9CbGlua0lkU2Vzc2lvbkVycm9yIGV4dGVuZHMgQmxpbmtJZFNlc3Npb25FcnJvciB7fVxuXG4vKipcbiAqIFRoZSBwcm9jZXNzIHJlc3VsdCB3aXRoIGJ1ZmZlci5cbiAqL1xuZXhwb3J0IHR5cGUgUHJvY2Vzc1Jlc3VsdFdpdGhCdWZmZXIgPSBCbGlua0lkUHJvY2Vzc1Jlc3VsdCAmIHtcbiAgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyO1xufTtcblxuLyoqXG4gKiBUaGUgd29ya2VyIHNjYW5uaW5nIHNlc3Npb24uXG4gKi9cbmV4cG9ydCB0eXBlIFdvcmtlclNjYW5uaW5nU2Vzc2lvbiA9IE92ZXJyaWRlUHJvcGVydGllczxcbiAgQmxpbmtJZFNjYW5uaW5nU2Vzc2lvbixcbiAge1xuICAgIHByb2Nlc3M6IChpbWFnZTogSW1hZ2VEYXRhKSA9PiBQcm9jZXNzUmVzdWx0V2l0aEJ1ZmZlcjtcbiAgfVxuPiAmIHtcbiAgLyoqXG4gICAqIEdldHMgdGhlIHNldHRpbmdzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2V0dGluZ3MuXG4gICAqL1xuICBnZXRTZXR0aW5nczogKCkgPT4gQmxpbmtJZFNlc3Npb25TZXR0aW5ncztcbiAgLyoqXG4gICAqIFNob3dzIHRoZSBkZW1vIG92ZXJsYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGRlbW8gb3ZlcmxheSBpcyBzaG93bi5cbiAgICovXG4gIHNob3dEZW1vT3ZlcmxheTogKCkgPT4gYm9vbGVhbjtcbiAgLyoqXG4gICAqIFNob3dzIHRoZSBwcm9kdWN0aW9uIG92ZXJsYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHByb2R1Y3Rpb24gb3ZlcmxheSBpcyBzaG93bi5cbiAgICovXG4gIHNob3dQcm9kdWN0aW9uT3ZlcmxheTogKCkgPT4gYm9vbGVhbjtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6YXRpb24gc2V0dGluZ3MgZm9yIHRoZSBCbGlua0lEIHdvcmtlci5cbiAqXG4gKiBUaGVzZSBzZXR0aW5ncyBjb250cm9sIGhvdyB0aGUgQmxpbmtJRCB3b3JrZXIgaXMgaW5pdGlhbGl6ZWQgYW5kIGNvbmZpZ3VyZWQsXG4gKiBpbmNsdWRpbmcgcmVzb3VyY2UgbG9jYXRpb25zLCBtZW1vcnkgYWxsb2NhdGlvbiwgYW5kIGJ1aWxkIHZhcmlhbnRzLlxuICovXG5leHBvcnQgdHlwZSBCbGlua0lkV29ya2VySW5pdFNldHRpbmdzID0ge1xuICAvKipcbiAgICogVGhlIGxpY2Vuc2Uga2V5IHJlcXVpcmVkIHRvIHVubG9jayBhbmQgdXNlIHRoZSBCbGlua0lEIFNESy5cbiAgICogVGhpcyBtdXN0IGJlIGEgdmFsaWQgbGljZW5zZSBrZXkgb2J0YWluZWQgZnJvbSBNaWNyb2JsaW5rLlxuICAgKi9cbiAgbGljZW5zZUtleTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgVVJMIG9mIHRoZSBNaWNyb2JsaW5rIHByb3h5IHNlcnZlci4gVGhpcyBwcm94eSBoYW5kbGVzIHJlcXVlc3RzIHRvIE1pY3JvYmxpbmsncyBCYWx0YXphciBhbmQgUGluZyBzZXJ2ZXJzLlxuICAgKlxuICAgKiAqKlJlcXVpcmVtZW50czoqKlxuICAgKiAtIE11c3QgYmUgYSB2YWxpZCBIVFRQUyBVUkxcbiAgICogLSBUaGUgcHJveHkgc2VydmVyIG11c3QgaW1wbGVtZW50IHRoZSBleHBlY3RlZCBNaWNyb2JsaW5rIEFQSSBlbmRwb2ludHNcbiAgICogLSBUaGlzIGZlYXR1cmUgaXMgb25seSBhdmFpbGFibGUgaWYgZXhwbGljaXRseSBwZXJtaXR0ZWQgYnkgeW91ciBsaWNlbnNlXG4gICAqXG4gICAqICoqRW5kcG9pbnRzOioqXG4gICAqIC0gUGluZzogYHtwcm94eVVybH0vcGluZ2BcbiAgICogLSBCYWx0YXphcjogYHtwcm94eVVybH0vYXBpL3YyL3N0YXR1cy9jaGVja2BcbiAgICpcbiAgICogQGV4YW1wbGUgXCJodHRwczovL3lvdXItcHJveHkuZXhhbXBsZS5jb21cIlxuICAgKi9cbiAgbWljcm9ibGlua1Byb3h5VXJsPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IGRpcmVjdG9yeSB3aGVyZSB0aGUgYC9yZXNvdXJjZXNgIGRpcmVjdG9yeSBpcyBob3N0ZWQuXG4gICAqIERlZmF1bHRzIHRvIGB3aW5kb3cubG9jYXRpb24uaHJlZmAsIGF0IHRoZSByb290IG9mIHRoZSBjdXJyZW50IHBhZ2UuXG4gICAqL1xuICByZXNvdXJjZXNMb2NhdGlvbj86IHN0cmluZztcblxuICAvKipcbiAgICogQSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHVzZXIvc2Vzc2lvbi5cbiAgICogVXNlZCBmb3IgYW5hbHl0aWNzIGFuZCB0cmFja2luZyBwdXJwb3Nlcy5cbiAgICovXG4gIHVzZXJJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgV2ViQXNzZW1ibHkgbW9kdWxlIHZhcmlhbnQgdG8gdXNlLlxuICAgKiBEaWZmZXJlbnQgdmFyaWFudHMgbWF5IG9mZmVyIGRpZmZlcmVudCBwZXJmb3JtYW5jZS9zaXplIHRyYWRlb2Zmcy5cbiAgICovXG4gIHdhc21WYXJpYW50PzogV2FzbVZhcmlhbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBpbml0aWFsIG1lbW9yeSBhbGxvY2F0aW9uIGZvciB0aGUgV2FzbSBtb2R1bGUsIGluIG1lZ2FieXRlcy5cbiAgICogTGFyZ2VyIHZhbHVlcyBtYXkgaW1wcm92ZSBwZXJmb3JtYW5jZSBidXQgaW5jcmVhc2UgbWVtb3J5IHVzYWdlLlxuICAgKi9cbiAgaW5pdGlhbE1lbW9yeT86IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciB0byB1c2UgdGhlIGxpZ2h0d2VpZ2h0IGJ1aWxkIG9mIHRoZSBTREsuXG4gICAqIExpZ2h0d2VpZ2h0IGJ1aWxkcyBoYXZlIHJlZHVjZWQgc2l6ZSBidXQgbWF5IGhhdmUgbGltaXRlZCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgdXNlTGlnaHR3ZWlnaHRCdWlsZDogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogVGhlIGxvYWQgV2FzbSBwYXJhbXMuXG4gKi9cbmV4cG9ydCB0eXBlIExvYWRXYXNtUGFyYW1zID0ge1xuICByZXNvdXJjZVVybDogc3RyaW5nO1xuICB2YXJpYW50PzogV2FzbVZhcmlhbnQ7XG4gIHVzZUxpZ2h0d2VpZ2h0QnVpbGQ6IGJvb2xlYW47XG4gIGluaXRpYWxNZW1vcnk/OiBudW1iZXI7XG59O1xuXG4vKipcbiAqIFRoZSBwcm9ncmVzcyBzdGF0dXMgY2FsbGJhY2suXG4gKi9cbmV4cG9ydCB0eXBlIFByb2dyZXNzU3RhdHVzQ2FsbGJhY2sgPSAocHJvZ3Jlc3M6IERvd25sb2FkUHJvZ3Jlc3MpID0+IHZvaWQ7XG5cbi8qKlxuICogU2FuaXRpemVkIHByb3h5IFVSTHMgZm9yIGRpZmZlcmVudCBNaWNyb2JsaW5rIHNlcnZpY2VzLlxuICovXG50eXBlIFNhbml0aXplZFByb3h5VXJscyA9IHtcbiAgLyoqXG4gICAqIFVSTCBmb3IgcGluZyBzZXJ2aWNlLlxuICAgKi9cbiAgcGluZzogc3RyaW5nO1xuICAvKipcbiAgICogVVJMIGZvciBCYWx0YXphciBzZXJ2aWNlLlxuICAgKi9cbiAgYmFsdGF6YXI6IHN0cmluZztcbn07XG5cbi8qKlxuICogRXJyb3IgdGhyb3duIHdoZW4gcHJveHkgVVJMIHZhbGlkYXRpb24gZmFpbHNcbiAqL1xuZXhwb3J0IGNsYXNzIFByb3h5VXJsVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgcHVibGljIHJlYWRvbmx5IHVybDogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihgUHJveHkgVVJMIHZhbGlkYXRpb24gZmFpbGVkIGZvciBcIiR7dXJsfVwiOiAke21lc3NhZ2V9YCk7XG4gICAgdGhpcy5uYW1lID0gXCJQcm94eVVybFZhbGlkYXRpb25FcnJvclwiO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIExpY2Vuc2VFcnJvckNvZGUgPSBcIkxJQ0VOU0VfRVJST1JcIjtcblxuLyoqXG4gKiBFcnJvciB0aHJvd24gd2hlbiBsaWNlbnNlIHVubG9jayBmYWlsc1xuICovXG5leHBvcnQgY2xhc3MgTGljZW5zZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb2RlOiBMaWNlbnNlRXJyb3JDb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29kZTogTGljZW5zZUVycm9yQ29kZSkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IFwiTGljZW5zZUVycm9yXCI7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBCbGlua0lEIHdvcmtlci5cbiAqL1xuY2xhc3MgQmxpbmtJZFdvcmtlciB7XG4gIC8qKlxuICAgKiBUaGUgV2FzbSBtb2R1bGUuXG4gICAqL1xuICAjd2FzbU1vZHVsZT86IEJsaW5rSWRXYXNtTW9kdWxlO1xuICAvKipcbiAgICogVGhlIGRlZmF1bHQgc2Vzc2lvbiBzZXR0aW5ncy5cbiAgICpcbiAgICogTXVzdCBiZSBpbml0aWFsaXplZCB3aGVuIGNhbGxpbmcgaW5pdEJsaW5rSWQuXG4gICAqL1xuICAjZGVmYXVsdFNlc3Npb25TZXR0aW5ncyE6IEJsaW5rSWRTZXNzaW9uU2V0dGluZ3M7XG4gIC8qKlxuICAgKiBUaGUgcHJvZ3Jlc3Mgc3RhdHVzIGNhbGxiYWNrLlxuICAgKi9cbiAgcHJvZ3Jlc3NTdGF0dXNDYWxsYmFjaz86IFByb2dyZXNzU3RhdHVzQ2FsbGJhY2s7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkZW1vIG92ZXJsYXkgaXMgc2hvd24uXG4gICAqL1xuICAjc2hvd0RlbW9PdmVybGF5ID0gdHJ1ZTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHByb2R1Y3Rpb24gb3ZlcmxheSBpcyBzaG93bi5cbiAgICovXG4gICNzaG93UHJvZHVjdGlvbk92ZXJsYXkgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBTYW5pdGl6ZWQgcHJveHkgVVJMcyBmb3IgTWljcm9ibGluayBzZXJ2aWNlcy5cbiAgICovXG4gICNwcm94eVVybHM/OiBTYW5pdGl6ZWRQcm94eVVybHM7XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGxvYWRzIHRoZSBXYXNtIG1vZHVsZS5cbiAgICovXG4gIGFzeW5jICNsb2FkV2FzbSh7XG4gICAgcmVzb3VyY2VVcmwsXG4gICAgdmFyaWFudCxcbiAgICB1c2VMaWdodHdlaWdodEJ1aWxkLFxuICAgIGluaXRpYWxNZW1vcnksXG4gIH06IExvYWRXYXNtUGFyYW1zKSB7XG4gICAgaWYgKHRoaXMuI3dhc21Nb2R1bGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiV2FzbSBhbHJlYWR5IGxvYWRlZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB3YXNtVmFyaWFudCA9IHZhcmlhbnQgPz8gKGF3YWl0IGRldGVjdFdhc21GZWF0dXJlcygpKTtcblxuICAgIGNvbnN0IGZlYXR1cmVWYXJpYW50ID0gdXNlTGlnaHR3ZWlnaHRCdWlsZCA/IFwibGlnaHR3ZWlnaHRcIiA6IFwiZnVsbFwiO1xuXG4gICAgY29uc3QgTU9EVUxFX05BTUUgPSBcIkJsaW5rSWRNb2R1bGVcIjtcblxuICAgIGNvbnN0IHZhcmlhbnRVcmwgPSBidWlsZFJlc291cmNlUGF0aChcbiAgICAgIHJlc291cmNlVXJsLFxuICAgICAgZmVhdHVyZVZhcmlhbnQsXG4gICAgICB3YXNtVmFyaWFudCxcbiAgICApO1xuXG4gICAgY29uc3Qgd29ya2VyVXJsID0gYnVpbGRSZXNvdXJjZVBhdGgodmFyaWFudFVybCwgYCR7TU9EVUxFX05BTUV9LmpzYCk7XG4gICAgY29uc3Qgd2FzbVVybCA9IGJ1aWxkUmVzb3VyY2VQYXRoKHZhcmlhbnRVcmwsIGAke01PRFVMRV9OQU1FfS53YXNtYCk7XG4gICAgY29uc3QgZGF0YVVybCA9IGJ1aWxkUmVzb3VyY2VQYXRoKHZhcmlhbnRVcmwsIGAke01PRFVMRV9OQU1FfS5kYXRhYCk7XG5cbiAgICBjb25zdCBjcm9zc09yaWdpbldvcmtlclVybCA9IGF3YWl0IGdldENyb3NzT3JpZ2luV29ya2VyVVJMKHdvcmtlclVybCk7XG5cbiAgICBjb25zdCBpbXBvcnRlZCA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAvKiBAdml0ZS1pZ25vcmUgKi8gY3Jvc3NPcmlnaW5Xb3JrZXJVcmxcbiAgICApKSBhcyB7XG4gICAgICBkZWZhdWx0OiBFbXNjcmlwdGVuTW9kdWxlRmFjdG9yeTxCbGlua0lkV2FzbU1vZHVsZT47XG4gICAgfTtcblxuICAgIGNvbnN0IGNyZWF0ZU1vZHVsZSA9IGltcG9ydGVkLmRlZmF1bHQ7XG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtZW1vcnkgc2V0dGluZ3MgaWYgbm90IHByb3ZpZGVkXG4gICAgaWYgKCFpbml0aWFsTWVtb3J5KSB7XG4gICAgICAvLyBzYWZhcmkgcmVxdWlyZXMgYSBsYXJnZXIgaW5pdGlhbCBtZW1vcnkgYWxsb2NhdGlvbiBhcyBpdCBvZnRlbiBibG9jayBtZW1vcnkgZ3Jvd3RoXG4gICAgICBpbml0aWFsTWVtb3J5ID0gaXNJT1MoKSA/IDcwMCA6IDIwMDtcbiAgICB9XG5cbiAgICBjb25zdCB3YXNtTWVtb3J5ID0gbmV3IFdlYkFzc2VtYmx5Lk1lbW9yeSh7XG4gICAgICBpbml0aWFsOiBtYlRvV2FzbVBhZ2VzKGluaXRpYWxNZW1vcnkpLFxuICAgICAgbWF4aW11bTogbWJUb1dhc21QYWdlcygyMDQ4KSxcbiAgICAgIHNoYXJlZDogd2FzbVZhcmlhbnQgPT09IFwiYWR2YW5jZWQtdGhyZWFkc1wiLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHByb2dyZXNzIHRyYWNrZXJzIGZvciBlYWNoIGRvd25sb2FkXG4gICAgbGV0IHdhc21Qcm9ncmVzczogRG93bmxvYWRQcm9ncmVzcyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZGF0YVByb2dyZXNzOiBEb3dubG9hZFByb2dyZXNzIHwgdW5kZWZpbmVkO1xuXG4gICAgbGV0IGxhc3RQcm9ncmVzc1VwZGF0ZSA9IDA7XG4gICAgY29uc3QgcHJvZ3Jlc3NVcGRhdGVJbnRlcnZhbCA9IDMyOyAvLyAzMm1zIGludGVydmFsIH4gMzBmcHNcblxuICAgIC8vIFVwZGF0ZSB0aGUgb3ZlcmFsbCBjb21iaW5lZCBwcm9ncmVzcyBiYXNlZCBvbiBib3RoIGRvd25sb2Fkc1xuICAgIC8vIFRocm90dGxlIHRvIGF2b2lkIHVwZGF0aW5nIHRvbyBmcmVxdWVudGx5XG4gICAgY29uc3QgdGhyb3R0bGVkQ29tYmluZWRQcm9ncmVzcyA9ICgpID0+IHtcbiAgICAgIC8vIERvbid0IHVwZGF0ZSBwcm9ncmVzcyBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IHNldFxuICAgICAgaWYgKCF0aGlzLnByb2dyZXNzU3RhdHVzQ2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyB3YWl0IHVudGlsIGJvdGggaGF2ZSBzdGFydGVkIHNvIHRoYXQgd2Uga25vdyB0aGUgdG90YWwgbGVuZ3RoXG4gICAgICBpZiAoIXdhc21Qcm9ncmVzcyB8fCAhZGF0YVByb2dyZXNzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdG90YWxMb2FkZWQgPSB3YXNtUHJvZ3Jlc3MubG9hZGVkICsgZGF0YVByb2dyZXNzLmxvYWRlZDtcbiAgICAgIGNvbnN0IHRvdGFsTGVuZ3RoID1cbiAgICAgICAgd2FzbVByb2dyZXNzLmNvbnRlbnRMZW5ndGggKyBkYXRhUHJvZ3Jlc3MuY29udGVudExlbmd0aDtcbiAgICAgIGNvbnN0IGNvbWJpbmVkUGVyY2VudCA9IE1hdGgubWluKFxuICAgICAgICBNYXRoLnJvdW5kKCh0b3RhbExvYWRlZCAvIHRvdGFsTGVuZ3RoKSAqIDEwMCksXG4gICAgICAgIDEwMCxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGNvbWJpbmVkUHJvZ3Jlc3M6IERvd25sb2FkUHJvZ3Jlc3MgPSB7XG4gICAgICAgIGxvYWRlZDogdG90YWxMb2FkZWQsXG4gICAgICAgIGNvbnRlbnRMZW5ndGg6IHRvdGFsTGVuZ3RoLFxuICAgICAgICBwcm9ncmVzczogY29tYmluZWRQZXJjZW50LFxuICAgICAgfTtcblxuICAgICAgLy8gQ2hlY2sgaWYgZW5vdWdoIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdXBkYXRlXG4gICAgICBjb25zdCBjdXJyZW50VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgaWYgKGN1cnJlbnRUaW1lIC0gbGFzdFByb2dyZXNzVXBkYXRlIDwgcHJvZ3Jlc3NVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgdGltZXN0YW1wXG4gICAgICBsYXN0UHJvZ3Jlc3NVcGRhdGUgPSBjdXJyZW50VGltZTtcblxuICAgICAgdGhpcy5wcm9ncmVzc1N0YXR1c0NhbGxiYWNrKGNvbWJpbmVkUHJvZ3Jlc3MpO1xuICAgIH07XG5cbiAgICAvLyBXcmFwIGVhY2ggZG93bmxvYWQncyBwcm9ncmVzcyBjYWxsYmFjayB0byB1cGRhdGUgdGhlIGNvbWJpbmVkIHByb2dyZXNzLlxuICAgIGNvbnN0IHdhc21Qcm9ncmVzc0NhbGxiYWNrID0gKHByb2dyZXNzOiBEb3dubG9hZFByb2dyZXNzKSA9PiB7XG4gICAgICB3YXNtUHJvZ3Jlc3MgPSBwcm9ncmVzcztcbiAgICAgIHZvaWQgdGhyb3R0bGVkQ29tYmluZWRQcm9ncmVzcygpO1xuICAgIH07XG5cbiAgICBjb25zdCBkYXRhUHJvZ3Jlc3NDYWxsYmFjayA9IChwcm9ncmVzczogRG93bmxvYWRQcm9ncmVzcykgPT4ge1xuICAgICAgZGF0YVByb2dyZXNzID0gcHJvZ3Jlc3M7XG4gICAgICB2b2lkIHRocm90dGxlZENvbWJpbmVkUHJvZ3Jlc3MoKTtcbiAgICB9O1xuXG4gICAgLy8gUmVwbGFjZSBzaW1wbGUgZmV0Y2ggd2l0aCBwcm9ncmVzcyB0cmFja2luZyBmb3IgYm90aCB3YXNtIGFuZCBkYXRhIGRvd25sb2Fkc1xuICAgIGNvbnN0IFtwcmVsb2FkZWRXYXNtLCBwcmVsb2FkZWREYXRhXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIGRvd25sb2FkQXJyYXlCdWZmZXIod2FzbVVybCwgd2FzbVByb2dyZXNzQ2FsbGJhY2spLFxuICAgICAgZG93bmxvYWRBcnJheUJ1ZmZlcihkYXRhVXJsLCBkYXRhUHJvZ3Jlc3NDYWxsYmFjayksXG4gICAgXSk7XG5cbiAgICAvLyBFbnN1cmUgZmluYWwgMTAwJSBwcm9ncmVzcyB1cGRhdGUgaXMgc2VudFxuICAgIGlmICh0aGlzLnByb2dyZXNzU3RhdHVzQ2FsbGJhY2sgJiYgd2FzbVByb2dyZXNzICYmIGRhdGFQcm9ncmVzcykge1xuICAgICAgY29uc3QgdG90YWxMZW5ndGggPVxuICAgICAgICB3YXNtUHJvZ3Jlc3MuY29udGVudExlbmd0aCArIGRhdGFQcm9ncmVzcy5jb250ZW50TGVuZ3RoO1xuICAgICAgdGhpcy5wcm9ncmVzc1N0YXR1c0NhbGxiYWNrKHtcbiAgICAgICAgbG9hZGVkOiB0b3RhbExlbmd0aCxcbiAgICAgICAgY29udGVudExlbmd0aDogdG90YWxMZW5ndGgsXG4gICAgICAgIHByb2dyZXNzOiAxMDAsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBodHRwczovL2Vtc2NyaXB0ZW4ub3JnL2RvY3MvYXBpX3JlZmVyZW5jZS9tb2R1bGUuaHRtbCNtb2R1bGUtb2JqZWN0XG4gICAgICovXG4gICAgdGhpcy4jd2FzbU1vZHVsZSA9IGF3YWl0IGNyZWF0ZU1vZHVsZSh7XG4gICAgICBsb2NhdGVGaWxlOiAocGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dmFyaWFudFVybH0vJHt3YXNtVmFyaWFudH0vJHtwYXRofWA7XG4gICAgICB9LFxuICAgICAgLy8gcHRocmVhZHMgYnVpbGQgYnJlYWtzIHdpdGhvdXQgdGhpczpcbiAgICAgIC8vIFwiRmFpbGVkIHRvIGV4ZWN1dGUgJ2NyZWF0ZU9iamVjdFVSTCcgb24gJ1VSTCc6IE92ZXJsb2FkIHJlc29sdXRpb24gZmFpbGVkLlwiXG4gICAgICBtYWluU2NyaXB0VXJsT3JCbG9iOiBjcm9zc09yaWdpbldvcmtlclVybCxcbiAgICAgIHdhc21CaW5hcnk6IHByZWxvYWRlZFdhc20sXG4gICAgICBnZXRQcmVsb2FkZWRQYWNrYWdlKCkge1xuICAgICAgICByZXR1cm4gcHJlbG9hZGVkRGF0YTtcbiAgICAgIH0sXG4gICAgICB3YXNtTWVtb3J5LFxuICAgICAgbm9FeGl0UnVudGltZTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy4jd2FzbU1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgV2FzbSBtb2R1bGVcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGluaXRpYWxpemVzIGV2ZXJ5dGhpbmcuXG4gICAqL1xuICBhc3luYyBpbml0QmxpbmtJZChcbiAgICBzZXR0aW5nczogQmxpbmtJZFdvcmtlckluaXRTZXR0aW5ncyxcbiAgICBkZWZhdWx0U2Vzc2lvblNldHRpbmdzOiBCbGlua0lkU2Vzc2lvblNldHRpbmdzLFxuICAgIHByb2dyZXNzQ2FsbGJhY2s/OiBQcm9ncmVzc1N0YXR1c0NhbGxiYWNrLFxuICApIHtcbiAgICBjb25zdCByZXNvdXJjZXNQYXRoID0gbmV3IFVSTChcbiAgICAgIFwicmVzb3VyY2VzL1wiLFxuICAgICAgc2V0dGluZ3MucmVzb3VyY2VzTG9jYXRpb24sXG4gICAgKS50b1N0cmluZygpO1xuXG4gICAgdGhpcy4jZGVmYXVsdFNlc3Npb25TZXR0aW5ncyA9IGRlZmF1bHRTZXNzaW9uU2V0dGluZ3M7XG4gICAgdGhpcy5wcm9ncmVzc1N0YXR1c0NhbGxiYWNrID0gcHJvZ3Jlc3NDYWxsYmFjaztcblxuICAgIGF3YWl0IHRoaXMuI2xvYWRXYXNtKHtcbiAgICAgIHJlc291cmNlVXJsOiByZXNvdXJjZXNQYXRoLFxuICAgICAgdmFyaWFudDogc2V0dGluZ3Mud2FzbVZhcmlhbnQsXG4gICAgICBpbml0aWFsTWVtb3J5OiBzZXR0aW5ncy5pbml0aWFsTWVtb3J5LFxuICAgICAgdXNlTGlnaHR3ZWlnaHRCdWlsZDogc2V0dGluZ3MudXNlTGlnaHR3ZWlnaHRCdWlsZCxcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy4jd2FzbU1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiV2FzbSBtb2R1bGUgbm90IGxvYWRlZFwiKTtcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHdpdGggbGljZW5zZSBrZXlcbiAgICBjb25zdCBsaWNlbmNlVW5sb2NrUmVzdWx0ID0gdGhpcy4jd2FzbU1vZHVsZS5pbml0aWFsaXplV2l0aExpY2Vuc2VLZXkoXG4gICAgICBzZXR0aW5ncy5saWNlbnNlS2V5LFxuICAgICAgc2V0dGluZ3MudXNlcklkLFxuICAgICAgZmFsc2UsXG4gICAgKTtcblxuICAgIGlmIChsaWNlbmNlVW5sb2NrUmVzdWx0LmxpY2Vuc2VFcnJvcikge1xuICAgICAgdGhyb3cgbmV3IExpY2Vuc2VFcnJvcihcbiAgICAgICAgXCJMaWNlbnNlIHVubG9jayBlcnJvcjogXCIgKyBsaWNlbmNlVW5sb2NrUmVzdWx0LmxpY2Vuc2VFcnJvcixcbiAgICAgICAgXCJMSUNFTlNFX0VSUk9SXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwcm94eSBVUkwgY29uZmlndXJhdGlvblxuICAgIGlmIChzZXR0aW5ncy5taWNyb2JsaW5rUHJveHlVcmwpIHtcbiAgICAgIHRoaXMuI2NvbmZpZ3VyZVByb3h5VXJscyhcbiAgICAgICAgc2V0dGluZ3MubWljcm9ibGlua1Byb3h5VXJsLFxuICAgICAgICBsaWNlbmNlVW5sb2NrUmVzdWx0LFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIG9idGFpbiBhIHNlcnZlciBwZXJtaXNzaW9uXG4gICAgaWYgKGxpY2VuY2VVbmxvY2tSZXN1bHQudW5sb2NrUmVzdWx0ID09PSBcInJlcXVpcmVzLXNlcnZlci1wZXJtaXNzaW9uXCIpIHtcbiAgICAgIC8vIFVzZSBwcm94eSBVUkwgaWYgY29uZmlndXJlZCwgb3RoZXJ3aXNlIHVzZSBkZWZhdWx0XG4gICAgICBjb25zdCBiYWx0YXphclVybCA9IHRoaXMuI3Byb3h5VXJscz8uYmFsdGF6YXI7XG5cbiAgICAgIGNvbnN0IHNlcnZlclBlcm1pc3Npb25SZXNwb25zZSA9XG4gICAgICAgIGJhbHRhemFyVXJsICYmIGxpY2VuY2VVbmxvY2tSZXN1bHQuYWxsb3dCYWx0YXphclByb3h5XG4gICAgICAgICAgPyBhd2FpdCBvYnRhaW5OZXdTZXJ2ZXJQZXJtaXNzaW9uKGxpY2VuY2VVbmxvY2tSZXN1bHQsIGJhbHRhemFyVXJsKVxuICAgICAgICAgIDogYXdhaXQgb2J0YWluTmV3U2VydmVyUGVybWlzc2lvbihsaWNlbmNlVW5sb2NrUmVzdWx0KTtcblxuICAgICAgY29uc3Qgc2VydmVyUGVybWlzc2lvblJlc3VsdCA9IHRoaXMuI3dhc21Nb2R1bGUuc3VibWl0U2VydmVyUGVybWlzc2lvbihcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoc2VydmVyUGVybWlzc2lvblJlc3BvbnNlKSxcbiAgICAgICk7XG5cbiAgICAgIGlmIChzZXJ2ZXJQZXJtaXNzaW9uUmVzdWx0LmVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlcnZlciB1bmxvY2sgZXJyb3I6IFwiICsgc2VydmVyUGVybWlzc2lvblJlc3VsdC5lcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4jc2hvd0RlbW9PdmVybGF5ID0gbGljZW5jZVVubG9ja1Jlc3VsdC5zaG93RGVtb092ZXJsYXk7XG4gICAgdGhpcy4jc2hvd1Byb2R1Y3Rpb25PdmVybGF5ID0gbGljZW5jZVVubG9ja1Jlc3VsdC5zaG93UHJvZHVjdGlvbk92ZXJsYXk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyBhIEJsaW5rSUQgc2Nhbm5pbmcgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBUaGUgb3B0aW9ucyBmb3IgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uLlxuICAgKi9cbiAgY3JlYXRlQmxpbmtJZFNjYW5uaW5nU2Vzc2lvbihvcHRpb25zPzogUGFydGlhbEJsaW5rSWRTZXNzaW9uU2V0dGluZ3MpIHtcbiAgICBpZiAoIXRoaXMuI3dhc21Nb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIldhc20gbW9kdWxlIG5vdCBsb2FkZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgc2Vzc2lvblNldHRpbmdzID0gYnVpbGRTZXNzaW9uU2V0dGluZ3MoXG4gICAgICBvcHRpb25zLFxuICAgICAgdGhpcy4jZGVmYXVsdFNlc3Npb25TZXR0aW5ncyxcbiAgICApO1xuXG4gICAgY29uc3Qgc2Vzc2lvbiA9XG4gICAgICB0aGlzLiN3YXNtTW9kdWxlLmNyZWF0ZUJsaW5rSWRTY2FubmluZ1Nlc3Npb24oc2Vzc2lvblNldHRpbmdzKTtcblxuICAgIGNvbnN0IHByb3h5U2Vzc2lvbiA9IHRoaXMuY3JlYXRlUHJveHlTZXNzaW9uKHNlc3Npb24sIHNlc3Npb25TZXR0aW5ncyk7XG4gICAgcmV0dXJuIHByb3h5U2Vzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGEgcHJveHkgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb24gLSBUaGUgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHNlc3Npb25TZXR0aW5ncyAtIFRoZSBzZXNzaW9uIHNldHRpbmdzLlxuICAgKiBAcmV0dXJucyBUaGUgcHJveHkgc2Vzc2lvbi5cbiAgICovXG4gIGNyZWF0ZVByb3h5U2Vzc2lvbihcbiAgICBzZXNzaW9uOiBCbGlua0lkU2Nhbm5pbmdTZXNzaW9uLFxuICAgIHNlc3Npb25TZXR0aW5nczogQmxpbmtJZFNlc3Npb25TZXR0aW5ncyxcbiAgKTogV29ya2VyU2Nhbm5pbmdTZXNzaW9uICYgUHJveHlNYXJrZWQge1xuICAgIC8qKlxuICAgICAqIHRoaXMgaXMgYSBjdXN0b20gc2Vzc2lvbiB0aGF0IHdpbGwgYmUgcHJveGllZFxuICAgICAqIGl0IGhhbmRsZXMgdGhlIHRyYW5zZmVyIG9mIHRoZSBpbWFnZSBkYXRhIGJ1ZmZlclxuICAgICAqL1xuICAgIGNvbnN0IGN1c3RvbVNlc3Npb246IFdvcmtlclNjYW5uaW5nU2Vzc2lvbiA9IHtcbiAgICAgIGdldFJlc3VsdDogKCkgPT4gc2Vzc2lvbi5nZXRSZXN1bHQoKSxcbiAgICAgIHByb2Nlc3M6IChpbWFnZSkgPT4ge1xuICAgICAgICBjb25zdCBwcm9jZXNzUmVzdWx0ID0gc2Vzc2lvbi5wcm9jZXNzKGltYWdlKTtcblxuICAgICAgICBpZiAoXCJlcnJvclwiIGluIHByb2Nlc3NSZXN1bHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgZnJhbWU6ICR7cHJvY2Vzc1Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRyYW5zZmVyUGFja2FnZTogUHJvY2Vzc1Jlc3VsdFdpdGhCdWZmZXIgPSB0cmFuc2ZlcihcbiAgICAgICAgICB7XG4gICAgICAgICAgICAuLi5wcm9jZXNzUmVzdWx0LFxuICAgICAgICAgICAgYXJyYXlCdWZmZXI6IGltYWdlLmRhdGEuYnVmZmVyLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgW2ltYWdlLmRhdGEuYnVmZmVyXSxcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdHJhbnNmZXJQYWNrYWdlO1xuICAgICAgfSxcbiAgICAgIGdldFNldHRpbmdzOiAoKSA9PiBzZXNzaW9uU2V0dGluZ3MsXG4gICAgICByZXNldDogKCkgPT4gc2Vzc2lvbi5yZXNldCgpLFxuICAgICAgZGVsZXRlOiAoKSA9PiBzZXNzaW9uLmRlbGV0ZSgpLFxuICAgICAgZGVsZXRlTGF0ZXI6ICgpID0+IHNlc3Npb24uZGVsZXRlTGF0ZXIoKSxcbiAgICAgIGlzRGVsZXRlZDogKCkgPT4gc2Vzc2lvbi5pc0RlbGV0ZWQoKSxcbiAgICAgIGlzQWxpYXNPZjogKG90aGVyKSA9PiBzZXNzaW9uLmlzQWxpYXNPZihvdGhlciksXG4gICAgICBzaG93RGVtb092ZXJsYXk6ICgpID0+IHRoaXMuI3Nob3dEZW1vT3ZlcmxheSxcbiAgICAgIHNob3dQcm9kdWN0aW9uT3ZlcmxheTogKCkgPT4gdGhpcy4jc2hvd1Byb2R1Y3Rpb25PdmVybGF5LFxuICAgIH07XG5cbiAgICByZXR1cm4gcHJveHkoY3VzdG9tU2Vzc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIHdvcmtlciBpcyB0ZXJtaW5hdGVkLlxuICAgKi9cbiAgW2ZpbmFsaXplcl0oKSB7XG4gICAgLy8gY29uc29sZS5sb2coXCJDb21saW5rLmZpbmFsaXplciBjYWxsZWQgb24gcHJveHlXb3JrZXJcIik7XG4gICAgLy8gQ2FuJ3QgdXNlIHRoaXMgYXMgdGhlIGBwcm94eVdvcmtlcmAgZ2V0cyByYW5kb21seSBHQydkLCBldmVuIGlmIGluIHVzZVxuICAgIC8vIHNlbGYuY2xvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZXJtaW5hdGVzIHRoZSB3b3JrZXJzIGFuZCB0aGUgV2FzbSBydW50aW1lLlxuICAgKi9cbiAgdGVybWluYXRlKCkge1xuICAgIHNlbGYuY2xvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgcGluZyBpcyBlbmFibGVkLCB0aGlzIG1ldGhvZCB3aWxsIHJldHVybiAxLlxuICAgKlxuICAgKiBAcmV0dXJucyAxIGlmIHRoZSBwaW5nIGlzIGVuYWJsZWQsIDAgb3RoZXJ3aXNlLlxuICAgKi9cbiAgcGluZygpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHByb3h5IFVSTHMgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHNldHRpbmdzIGFuZCBsaWNlbnNlIHBlcm1pc3Npb25zLlxuICAgKi9cbiAgI2NvbmZpZ3VyZVByb3h5VXJscyhcbiAgICBwcm94eVVybDogc3RyaW5nLFxuICAgIGxpY2VuY2VVbmxvY2tSZXN1bHQ6IHtcbiAgICAgIGFsbG93UGluZ1Byb3h5OiBib29sZWFuO1xuICAgICAgYWxsb3dCYWx0YXphclByb3h5OiBib29sZWFuO1xuICAgICAgaGFzUGluZzogYm9vbGVhbjtcbiAgICAgIHVubG9ja1Jlc3VsdDogTGljZW5zZVRva2VuU3RhdGU7XG4gICAgfSxcbiAgKTogdm9pZCB7XG4gICAgaWYgKCFwcm94eVVybCkge1xuICAgICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgXCJObyBwcm94eSBVUkwgY29uZmlndXJlZCwgdXNpbmcgZGVmYXVsdCBNaWNyb2JsaW5rIHNlcnZlcnNcIixcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgbGljZW5zZSBwZXJtaXNzaW9uc1xuICAgIHRoaXMuI3ZhbGlkYXRlUHJveHlQZXJtaXNzaW9ucyhsaWNlbmNlVW5sb2NrUmVzdWx0LCBwcm94eVVybCk7XG5cbiAgICAvLyBWYWxpZGF0ZSBhbmQgc2FuaXRpemUgdGhlIHByb3h5IFVSTFxuICAgIHRyeSB7XG4gICAgICB0aGlzLiNwcm94eVVybHMgPSB0aGlzLiNzYW5pdGl6ZVByb3h5VXJscyhwcm94eVVybCk7XG5cbiAgICAgIGlmIChsaWNlbmNlVW5sb2NrUmVzdWx0LmFsbG93UGluZ1Byb3h5KSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSB0aGUgV0FTTSBtb2R1bGUgd2l0aCB0aGUgc2FuaXRpemVkIFVSTHNcbiAgICAgICAgdGhpcy4jd2FzbU1vZHVsZSEuc2V0UGluZ1Byb3h5VXJsKHRoaXMuI3Byb3h5VXJscy5waW5nKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5kZWJ1ZyhcIlByb3h5IFVSTHMgY29uZmlndXJlZCBzdWNjZXNzZnVsbHk6XCIsIHtcbiAgICAgICAgcGluZzogdGhpcy4jcHJveHlVcmxzLnBpbmcsXG4gICAgICAgIGJhbHRhemFyOiB0aGlzLiNwcm94eVVybHMuYmFsdGF6YXIsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gRW5oYW5jZSBlcnJvciBtZXNzYWdlIHdpdGggYWN0aW9uYWJsZSBhZHZpY2VcbiAgICAgIGNvbnN0IGVuaGFuY2VkRXJyb3IgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIFByb3h5VXJsVmFsaWRhdGlvbkVycm9yXG4gICAgICAgICAgPyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGAke2Vycm9yLm1lc3NhZ2V9XFxuXFxuVHJvdWJsZXNob290aW5nOlxcbi0gRW5zdXJlIHRoZSBVUkwgaXMgYWNjZXNzaWJsZVxcbi0gQ2hlY2sgSFRUUFMgcmVxdWlyZW1lbnRzXFxuLSBWZXJpZnkgcHJveHkgc2VydmVyIGltcGxlbWVudGF0aW9uYCxcbiAgICAgICAgICAgIClcbiAgICAgICAgICA6IGVycm9yO1xuXG4gICAgICB0aHJvdyBlbmhhbmNlZEVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgdGhhdCB0aGUgbGljZW5zZSBhbGxvd3MgcHJveHkgdXNhZ2UuXG4gICAqL1xuICAjdmFsaWRhdGVQcm94eVBlcm1pc3Npb25zKFxuICAgIGxpY2VuY2VVbmxvY2tSZXN1bHQ6IHtcbiAgICAgIGFsbG93UGluZ1Byb3h5OiBib29sZWFuO1xuICAgICAgYWxsb3dCYWx0YXphclByb3h5OiBib29sZWFuO1xuICAgICAgaGFzUGluZzogYm9vbGVhbjtcbiAgICAgIHVubG9ja1Jlc3VsdDogTGljZW5zZVRva2VuU3RhdGU7XG4gICAgfSxcbiAgICBwcm94eVVybDogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICAhbGljZW5jZVVubG9ja1Jlc3VsdC5hbGxvd1BpbmdQcm94eSAmJlxuICAgICAgIWxpY2VuY2VVbmxvY2tSZXN1bHQuYWxsb3dCYWx0YXphclByb3h5XG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBQcm94eSBVUkwgXCIke3Byb3h5VXJsfVwiIHdhcyBwcm92aWRlZCwgYnV0IHlvdXIgbGljZW5zZSBkb2VzIG5vdCBwZXJtaXQgcHJveHkgdXNhZ2UuXFxuYCArXG4gICAgICAgICAgYExpY2Vuc2UgcGVybWlzc2lvbnM6IHBpbmdQcm94eT0ke2xpY2VuY2VVbmxvY2tSZXN1bHQuYWxsb3dQaW5nUHJveHl9LCBgICtcbiAgICAgICAgICBgYmFsdGF6YXJQcm94eT0ke2xpY2VuY2VVbmxvY2tSZXN1bHQuYWxsb3dCYWx0YXphclByb3h5fVxcbmAgK1xuICAgICAgICAgIGBDaGVjayB5b3VyIGxpY2Vuc2UuYCxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFsaWNlbmNlVW5sb2NrUmVzdWx0Lmhhc1BpbmcgJiZcbiAgICAgIGxpY2VuY2VVbmxvY2tSZXN1bHQudW5sb2NrUmVzdWx0ICE9PSBcInJlcXVpcmVzLXNlcnZlci1wZXJtaXNzaW9uXCJcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE1pY3JvYmxpbmsgcHJveHkgVVJMIGlzIHNldCBidXQgY2Fubm90IGJlIHVzZWQgYmVjYXVzZSBwaW5nIGFuZCBvbmxpbmUgbGljZW5zZSBjaGVjayBhcmUgZGlzYWJsZWQgaW4geW91ciBsaWNlbnNlLlxcbmAgK1xuICAgICAgICAgIGBDaGVjayB5b3VyIGxpY2Vuc2UuYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBhbmQgc2FuaXRpemVzIHByb3h5IFVSTHMgZm9yIGRpZmZlcmVudCBNaWNyb2JsaW5rIHNlcnZpY2VzLlxuICAgKi9cbiAgI3Nhbml0aXplUHJveHlVcmxzKGJhc2VVcmw6IHN0cmluZyk6IFNhbml0aXplZFByb3h5VXJscyB7XG4gICAgLy8gVmFsaWRhdGUgYmFzZSBVUkwgZm9ybWF0XG4gICAgbGV0IHBhcnNlZFVybDogVVJMO1xuICAgIHRyeSB7XG4gICAgICBwYXJzZWRVcmwgPSBuZXcgVVJMKGJhc2VVcmwpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgUHJveHlVcmxWYWxpZGF0aW9uRXJyb3IoXG4gICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIFVSTCBpbnN0YW5jZSBmb3IgcHJvdmlkZWQgTWljcm9ibGluayBwcm94eSBVUkwgXCIke2Jhc2VVcmx9XCIuIEV4cGVjdGVkIGZvcm1hdDogaHR0cHM6Ly95b3VyLXByb3h5LmNvbSBvciBodHRwczovL3lvdXItcHJveHkuY29tL2AsXG4gICAgICAgIGJhc2VVcmwsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFNlY3VyaXR5IHZhbGlkYXRpb246IEVuc3VyZSBIVFRQUyBpbiBwcm9kdWN0aW9uXG4gICAgaWYgKHBhcnNlZFVybC5wcm90b2NvbCAhPT0gXCJodHRwczpcIikge1xuICAgICAgdGhyb3cgbmV3IFByb3h5VXJsVmFsaWRhdGlvbkVycm9yKFxuICAgICAgICBgUHJveHkgVVJMIHZhbGlkYXRpb24gZmFpbGVkIGZvciBcIiR7YmFzZVVybH1cIjogSFRUUFMgcHJvdG9jb2wgbXVzdCBiZSB1c2VkLiBFeHBlY3RlZCBmb3JtYXQ6IGh0dHBzOi8veW91ci1wcm94eS5jb20gb3IgaHR0cHM6Ly95b3VyLXByb3h5LmNvbS9gLFxuICAgICAgICBiYXNlVXJsLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgc2FuaXRpemVkIFVSTHMgZm9yIGVhY2ggc2VydmljZVxuICAgIGNvbnN0IGJhc2VVcmxTdHIgPSBwYXJzZWRVcmwub3JpZ2luO1xuXG4gICAgY29uc3QgYmFsdGF6YXJVcmwgPSB0aGlzLiNidWlsZFNlcnZpY2VVcmwoXG4gICAgICBiYXNlVXJsU3RyLFxuICAgICAgXCIvYXBpL3YyL3N0YXR1cy9jaGVja1wiLFxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGluZzogYmFzZVVybFN0cixcbiAgICAgIGJhbHRhemFyOiBiYWx0YXphclVybCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHNlcnZpY2UgVVJMIGJ5IGNvbWJpbmluZyBiYXNlIFVSTCB3aXRoIHNlcnZpY2UgcGF0aC5cbiAgICovXG4gICNidWlsZFNlcnZpY2VVcmwoYmFzZVVybDogc3RyaW5nLCBzZXJ2aWNlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChzZXJ2aWNlUGF0aCwgYmFzZVVybCk7XG4gICAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBQcm94eVVybFZhbGlkYXRpb25FcnJvcihcbiAgICAgICAgYEZhaWxlZCB0byBidWlsZCBzZXJ2aWNlIFVSTCBmb3IgcGF0aCBcIiR7c2VydmljZVBhdGh9XCJgLFxuICAgICAgICBiYXNlVXJsLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgQmxpbmtJRCB3b3JrZXIuXG4gKi9cbmNvbnN0IGJsaW5rSWRXb3JrZXIgPSBuZXcgQmxpbmtJZFdvcmtlcigpO1xuXG4vKipcbiAqIFRoZSBCbGlua0lEIHdvcmtlciBwcm94eS5cbiAqL1xuZXhwb3NlKGJsaW5rSWRXb3JrZXIpO1xuXG4vKipcbiAqIFRoZSBCbGlua0lEIHdvcmtlciBwcm94eS5cbiAqL1xuZXhwb3J0IHR5cGUgQmxpbmtJZFdvcmtlclByb3h5ID0gT21pdDxCbGlua0lkV29ya2VyLCB0eXBlb2YgZmluYWxpemVyPjtcbiJdLCJuYW1lcyI6WyJvYmoiLCJyZXR1cm5WYWx1ZSIsInByb3h5IiwiZSIsInByb3BzIiwic3ltYm9scyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLQSxNQUFNLGNBQWMsT0FBTyxlQUFlO0FBQzFDLE1BQU0saUJBQWlCLE9BQU8sa0JBQWtCO0FBQ2hELE1BQU0sZUFBZSxPQUFPLHNCQUFzQjtBQUNsRCxNQUFNLFlBQVksT0FBTyxtQkFBbUI7QUFDNUMsTUFBTSxjQUFjLE9BQU8sZ0JBQWdCO0FBQzNDLE1BQU0sV0FBVyxDQUFDLFFBQVMsT0FBTyxRQUFRLFlBQVksUUFBUSxRQUFTLE9BQU8sUUFBUTtBQUl0RixNQUFNLHVCQUF1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RSxJQUFHLEdBQUUsS0FBSSxJQUFHLEdBQUUsR0FBRSxFQUFFLENBQUMsQ0FBQyxHQUE4cEMsaUJBQWUsWUFBUyxZQUFZLFNBQVMsSUFBSSxXQUFXLENBQUMsR0FBRSxJQUFHLEtBQUksS0FBSSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsSUFBRyxHQUFFLElBQUcsR0FBRSxLQUFJLEdBQUUsR0FBRSxHQUFFLEdBQUUsS0FBSSxHQUFFLElBQUcsR0FBRSxJQUFHLEdBQUUsR0FBRSxHQUFFLEdBQUUsSUFBRyxHQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUUsaUJBQWUsWUFBUyxZQUFZLFNBQVMsSUFBSSxXQUFXLENBQUMsR0FBRSxJQUFHLEtBQUksS0FBSSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUcsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsSUFBRyxHQUFFLEdBQUUsR0FBRSxHQUFFLEtBQUksS0FBSSxJQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQStKLHNCQUFvQixZQUFTLFlBQVksU0FBUyxJQUFJLFdBQVcsQ0FBQyxHQUFFLElBQUcsS0FBSSxLQUFJLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsSUFBRyxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxJQUFHLElBQUcsR0FBRSxJQUFHLEdBQUUsSUFBRyxHQUFFLEdBQUUsR0FBRSxHQUFFLEtBQUksR0FBRSxJQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUUsaUJBQWUsWUFBUyxZQUFZLFNBQVMsSUFBSSxXQUFXLENBQUMsR0FBRSxJQUFHLEtBQUksS0FBSSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUcsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUUsSUFBRyxHQUFFLEdBQUUsR0FBRSxHQUFFLElBQUcsR0FBRSxLQUFJLElBQUcsRUFBRSxDQUFDLENBQUMsR0FBRSxPQUFLLFlBQVMsWUFBWSxTQUFTLElBQUksV0FBVyxDQUFDLEdBQUUs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d0JBQUEsdURBQUEsV0FBMEIscUJBQXFCO0FBR2hELE1BQUE7QUFDRyx1QkFBQSxZQUFhLHNCQUFLLGdEQUFMLFdBQXdCO0FBRTFDLFFBQUksb0JBQW9CLGdCQUFnQjtBQUV0Qyx5QkFBSyxhQUFhLGdCQUFnQixtQkFBSyxZQUFXLElBQUk7QUFBQSxJQUFBO0FBR3hELFlBQVEsTUFBTSx1Q0FBdUM7QUFBQSxNQUNuRCxNQUFNLG1CQUFLLFlBQVc7QUFBQSxNQUN0QixVQUFVLG1CQUFLLFlBQVc7QUFBQSxJQUFBLENBQzNCO0FBQUEsV0FDTSxPQUFPO0FBRVIsVUFBQSxnQkFDSixpQkFBaUIsMEJBQ2IsSUFBSTtBQUFBLE1BQ0YsR0FBRyxNQUFNLE9BQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQSxJQUVsQjtBQUVBLFVBQUE7QUFBQSxFQUFBO0FBQ1I7QUFBQTtBQUFBO0FBQUE7QUFNRiw4QkFBQSxTQUNFLHFCQU1BLFVBQ007QUFDTixNQUNFLENBQUMsb0JBQW9CLGtCQUNyQixDQUFDLG9CQUFvQixvQkFDckI7QUFDQSxVQUFNLElBQUk7QUFBQSxNQUNSLGNBQWMsUUFBUTtBQUFBLGlDQUNjLG9CQUFvQixjQUFjLG1CQUNuRCxvQkFBb0Isa0JBQWtCO0FBQUE7QUFBQSxJQUUzRDtBQUFBLEVBQUEsV0FFQSxDQUFDLG9CQUFvQixXQUNyQixvQkFBb0IsaUJBQWlCLDhCQUNyQztBQUNBLFVBQU0sSUFBSTtBQUFBLE1BQ1I7QUFBQTtBQUFBLElBRUY7QUFBQSxFQUFBO0FBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFNRixnQ0FBbUIsU0FBcUM7QUFFbEQsTUFBQTtBQUNBLE1BQUE7QUFDVSxnQkFBQSxJQUFJLElBQUksT0FBTztBQUFBLFdBQ3BCLE9BQU87QUFDZCxVQUFNLElBQUk7QUFBQSxNQUNSLG9FQUFvRSxPQUFPO0FBQUEsTUFDM0U7QUFBQSxJQUNGO0FBQUEsRUFBQTtBQUlFLE1BQUEsVUFBVSxhQUFhLFVBQVU7QUFDbkMsVUFBTSxJQUFJO0FBQUEsTUFDUixvQ0FBb0MsT0FBTztBQUFBLE1BQzNDO0FBQUEsSUFDRjtBQUFBLEVBQUE7QUFJRixRQUFNLGFBQWEsVUFBVTtBQUU3QixRQUFNLGNBQWMsc0JBQUssOENBQUwsV0FDbEIsWUFDQTtBQUdLLFNBQUE7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNRixxQkFBQSxTQUFpQixTQUFpQixhQUE2QjtBQUN6RCxNQUFBO0FBQ0YsVUFBTSxNQUFNLElBQUksSUFBSSxhQUFhLE9BQU87QUFDeEMsV0FBTyxJQUFJLFNBQVM7QUFBQSxXQUNiLE9BQU87QUFDZCxVQUFNLElBQUk7QUFBQSxNQUNSLHlDQUF5QyxXQUFXO0FBQUEsTUFDcEQ7QUFBQSxJQUNGO0FBQUEsRUFBQTtBQUNGO0FBT0osTUFBTSxnQkFBZ0IsSUFBSSxjQUFjO0FBS3hDLE9BQU8sYUFBYTsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDksMTAsMTEsMTJdfQ==
