let thirdPartyRequests = {};
let cookiesDetails = {};
let unsafetyScore = 0;

function getDomainName(domain) {
    const sub = domain.split(".").reverse();
    return sub.length <= 2 ? domain : `${sub[1]}.${sub[0]}`;
}

function handleWebRequest(details) {
    const { url, tabId } = details;

    if (tabId < 0) return;

    const fpHostname = new URL(url).hostname;

    chrome.tabs.get(tabId, tab => {
        if (!chrome.runtime.lastError) {
            const tabHostname = new URL(tab.url).hostname;

            if (getDomainName(fpHostname) !== getDomainName(tabHostname)) {
                thirdPartyRequests[tabId] = thirdPartyRequests[tabId] || new Set();
                thirdPartyRequests[tabId].add(fpHostname);
            }
        }
    });
}

function countCookies(tabId, domain) {
    return new Promise(resolve => {
        chrome.cookies.getAll({}, cookies => {
            const details = {
                total: cookies.length,
                firstParty: 0,
                thirdParty: 0,
                session: 0,
                persistent: 0
            };

            cookies.forEach(cookie => {
                cookie.domain === domain ? details.firstParty++ : details.thirdParty++;
                "session" in cookie && cookie.session ? details.session++ : details.persistent++;
            });

            cookiesDetails[tabId] = details;
            resolve(details);
        });
    });
}

function countStorageItemsInTab(tabId, sendResponse) {
    chrome.tabs.executeScript(tabId, {
        code: `({
            localStorageCount: Object.keys(localStorage).length,
            sessionStorageCount: Object.keys(sessionStorage).length
        })`
    }, results => {
        chrome.runtime.lastError ? sendResponse({ error: chrome.runtime.lastError.message }) : sendResponse({ data: results[0] });
    });
}

chrome.tabs.onRemoved.addListener(tabId => {
    delete thirdPartyRequests[tabId];
    unsafetyScore = 0;
});

chrome.webRequest.onBeforeRequest.addListener(
    handleWebRequest,
    { urls: ["<all_urls>"] },
    []
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
        case "thirdPartyRequests":
            sendResponse(Array.from(thirdPartyRequests[msg.tabId] || []));
            break;

        case "verifyLocalStorage":
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                tabs.length > 0 ? countStorageItemsInTab(tabs[0].id, sendResponse) : sendResponse({ error: "No active tab found" });
            });
            return true;

        case "countCookies":
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs.length > 0) {
                    const domain = new URL(tabs[0].url).hostname;
                    countCookies(tabs[0].id, domain).then(details => {
                        sendResponse(details);
                    });
                }
            });
            return true;

        case "evalSafetyScore":
            sendResponse({ score: 10 - unsafetyScore });
            break;

        default:
            sendResponse({ error: "Unknown action" });
            break;
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabs) => {
    changeInfo.status === "complete" && chrome.runtime.sendMessage({ action: "evalSafetyScore" });
});