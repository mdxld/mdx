chrome.runtime.onInstalled.addListener(() => {
  console.log('@mdxui/chrome extension installed');
});

chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.id && tab.url?.startsWith('file://')) {
    chrome.tabs.reload(tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('file://')) {
    console.log('File URL detected:', tab.url);
  }
});
