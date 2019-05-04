chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['pattern'], ({ pattern }) => {
    if (!pattern) {
      chrome.storage.sync.set({pattern: '{TYPE}/{ID}-{TASK-NAME}'});
    }
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'redmine.noveogroup.com'},
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});
