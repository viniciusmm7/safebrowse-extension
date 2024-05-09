document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.runtime.sendMessage({ action: "thirdPartyRequests", tabId: tabs[0].id }, (response) => {
            const thirdPartyConnectionsList = document.getElementById("third-party-connections");
            response.forEach(hostname => {
                const listItem = document.createElement("li");
                listItem.textContent = hostname;
                thirdPartyConnectionsList.appendChild(listItem);
            });
        });

        chrome.runtime.sendMessage({ action: "countCookies", domain: new URL(tabs[0].url).hostname }, (response) => {
            const content = `Total: ${response.total}, First-party: ${response.firstParty}, Third-party: ${response.thirdParty}, Session: ${response.session}, Persistent: ${response.persistent}`;
            document.getElementById("cookie-count").textContent = content;
        });
    });

    chrome.runtime.sendMessage({ action: "verifyLocalStorage" }, (response) => {
        const localStorageDetectedSpan = document.getElementById("local-storage");
        if (response.error) {
            localStorageDetectedSpan.textContent = response.error;
        } else {
            const storageCount = response.data.localStorageCount;
            localStorageDetectedSpan.textContent = storageCount > 0 ? `Detected (${storageCount} items)` : "None";
        }
    });


    chrome.runtime.sendMessage({ action: "evalSafetyScore" }, (response) => {
        document.getElementById("privacy-score").textContent = response.score;
    });
});
