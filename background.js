(function() {       
  /* When the browser-action button is clicked... */
  chrome.browserAction.onClicked.addListener(function(tab) {
    var template = document.querySelector('#woohu-chooser');
    chrome.tabs.sendMessage(tab.id, { template: template.innerHTML });
  });
})();
