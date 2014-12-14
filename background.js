function genericOnClick(info, tab) {
	
    chrome.tabs.executeScript(null,
                              {"file": "content.js"},
                              function() {
                                  chrome.tabs.sendMessage(tab.id,{"message":"changeLayot","text":info.selectionText});
                              });
}

var showForPages = ["*://vk.com/*"];
chrome.contextMenus.create({title: "Изменить раскладку", 
    			    contexts:["selection"],
			    "documentUrlPatterns":showForPages, 
                            "id":"contextId"});

chrome.contextMenus.onClicked.addListener(genericOnClick);
