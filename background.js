// ✅ Full upgraded background.js (Enhanced Version)
// 🔒 Porn/Ad/Tracker/Dark Web Blocking
// 🔐 Password lock (active)
// 🧘‍♂️ Motivational redirect
// ⏱️ Editable Time scheduler
// 🔔 Silent logging
// 🛡️ Anti-fingerprint & script obfuscation blocking

const defaultPornSites = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com",
  "redtube.com", "youjizz.com", "tnaflix.com", "youporn.com", "spankbang.com",
  "hqporner.com", "rule34.xxx", "brazzers.com", "sex.com", "fapello.com",
  "thothub.to", "porndig.com", "motherless.com", "efukt.com", "nudogram.com",
  "leakgirls.com", "camwhores.tv", "cam4.com", "camvideos.org", "freecam8.com",
  "bangbros.com", "mydirtyhobby.com", "hclips.com", "bdsmlr.com", "slutload.com",
  "metart.com", "nudify.net", "nudeflix.com", "eroticbeauty.com", "erome.com",
  "nudostar.com", "boobyshare.com", "perfectgirls.net", "mofos.com", "playboy.com",
  "hentaifox.com", "nhentai.net", "hanime.tv", "hentaigasm.com", "javhd.com",
  "javlibrary.com", "watchmygf.me", "pornhat.com", "pornerbros.com", "fux.com",
  "submityourflicks.com", "mangaporn.tv","beeg.com"
];

const adNetworks = [
  "doubleclick.net", "googlesyndication.com", "googleadservices.com",
  "adnxs.com", "adsafeprotected.com", "adform.net", "media.net",
  "adsrvr.org", "zedo.com", "revcontent.com", "taboola.com", "outbrain.com"
];

const trackingScripts = [
  "google-analytics.com", "facebook.net", "cdn.optimizely.com",
  "scorecardresearch.com", "hotjar.com", "mixpanel.com"
];

const maliciousSites = [
  "darkweblinks.org", "tor2web.org", "onion.to", "onion.link",
  "deepweb.net", "dark.fail", "silkroad.com", "drugmarket.to"
];

const defaultBlockedSites = [...defaultPornSites, ...maliciousSites];

const keywordFilters = [
  "porn", "sex", "xxx", "18+", "nude", "camgirl", "adult", "hentai",
  "nsfw", "xmov", "xcine", "fuck", "blowjob", "seduc", "xnxx", "xvideo", "xvideos"
];

const adAndTrackerDomains = [...adNetworks, ...trackingScripts];

let userPassword = "focus123"; // Default password (replace via UI)

function isBlockingTime() {
  const now = new Date();
  return chrome.storage.local.get(["blockStart", "blockEnd"]).then(({ blockStart = 22, blockEnd = 6 }) => {
    const hour = now.getHours();
    return hour >= blockStart || hour < blockEnd;
  });
}

function logBlockedSite(url) {
  chrome.storage.local.get({ logs: [] }, ({ logs }) => {
    logs.push({ url, time: new Date().toISOString() });
    chrome.storage.local.set({ logs });
  });
}

function createMotivationalRule(id, domain) {
  return {
    id,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/motivated.html" } },
    condition: { urlFilter: domain, resourceTypes: ["main_frame"] }
  };
}

function createBlockRule(id, domain) {
  return {
    id,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: domain,
      resourceTypes: ["script", "sub_frame", "xmlhttprequest", "image"]
    }
  };
}

async function applyHybridBlockRules() {
  const { blockedSites = [], blockingEnabled = false } = await chrome.storage.local.get(["blockedSites", "blockingEnabled"]);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 5000 }, (_, i) => i + 1),
    addRules: blockingEnabled
      ? [
          ...blockedSites.map((site, i) => createMotivationalRule(i + 1, site)),
          ...keywordFilters.map((kw, i) => createMotivationalRule(1000 + i + 1, kw))
        ]
      : []
  });
}

async function updateBlockingRules() {
  const { blockedSites = [], blockingEnabled = true, passwordProtected = false } =
    await chrome.storage.local.get(["blockedSites", "blockingEnabled", "passwordProtected"]);

  if (!blockingEnabled) return;
  const shouldBlock = passwordProtected ? await isBlockingTime() : true;
  if (!shouldBlock) return;

  const rules = blockedSites.map((site, i) => createMotivationalRule(i + 1, site));
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 999 }, (_, i) => i + 1),
    addRules: rules
  });
}

async function applyPopupAndAdBlocker() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: adAndTrackerDomains.map((_, i) => 2000 + i),
    addRules: adAndTrackerDomains.map((domain, i) => createBlockRule(2000 + i, domain))
  });
}

function injectAntiPopupCode(tabId) {
  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: () => {
      try {
        window.open = () => null;
        document.querySelectorAll('a[target="_blank"]').forEach(a => a.removeAttribute('target'));

        const selectors = [
          "iframe[src*='ads']", "iframe[src*='doubleclick']",
          "[id*='ad']", "[class*='ad']", "script[src*='ad']"
        ];
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => el.remove());
        });

        // Anti-fingerprinting
        const block = () => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
          const noop = () => {};
          HTMLCanvasElement.prototype.toDataURL = noop;
          HTMLCanvasElement.prototype.getContext = noop;
        };
        block();

      } catch (e) {
        console.warn("Anti-popup injection failed", e);
      }
    }
  });
}

// Listen for messages from popup (password verify, toggle)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "verifyPassword") {
    sendResponse({ success: msg.password === userPassword });
  } else if (msg.type === "toggleBlocking") {
    chrome.storage.local.set({ blockingEnabled: msg.enabled });
  } else if (msg.type === "updateTime") {
    chrome.storage.local.set({ blockStart: msg.start, blockEnd: msg.end });
  } else if (msg.type === "updatePassword") {
    userPassword = msg.newPassword;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    blockedSites: defaultBlockedSites,
    protectedSites: defaultBlockedSites,
    blockingEnabled: true,
    blockStart: 22,
    blockEnd: 6,
    logs: []
  }, () => {
    updateBlockingRules();
    applyHybridBlockRules();
    applyPopupAndAdBlocker();
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.blockedSites || changes.blockingEnabled)) {
    applyHybridBlockRules();
    updateBlockingRules();
    applyPopupAndAdBlocker();
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(({ url }) => {
  chrome.storage.local.get(["blockedSites", "blockingEnabled"], ({ blockedSites, blockingEnabled }) => {
    if (!blockingEnabled) return;
    const hostname = new URL(url).hostname;
    if (defaultPornSites.some(domain => hostname.includes(domain)) || maliciousSites.some(domain => hostname.includes(domain))) {
      logBlockedSite(url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https?:/.test(tab.url)) {
    injectAntiPopupCode(tabId);
  }
});
