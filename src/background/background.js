chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.get(['pattern'], ({ pattern }) => {
        if (!pattern) {
            chrome.storage.sync.set({ pattern: '{TYPE}/{ID}-{TASK-NAME}' });
        }
    });
});
