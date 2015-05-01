(function (chrome) {
    chrome.contextMenus.create({
        title: "Изменить раскладку",
        contexts: ["selection"],
        "documentUrlPatterns": ["*://vk.com/*"],
        "id": "contextId"
    });

    chrome.contextMenus.onClicked.addListener(function (info, tab) {
        chrome.tabs.sendMessage(tab.id, {message: "change_layout"});
    });
})(chrome);

