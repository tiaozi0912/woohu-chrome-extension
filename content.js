(function() {
  'use strict';

  var chooser;

  /* Listen for messages */
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    /* If the received message has the expected format... */
    // if (msg.text && (msg.text == "report_back")) {
    //    Call the specified callback, passing 
    //      the web-pages DOM content as argument 
    //   sendResponse(document.all[0].outerHTML);
    // }
    chooser = chooser || new window.Woohu.Chooser(msg.template);

    if (chooser.$el) {
      chooser.view.update();
    } else { 
      chooser.view.render();
    }
    
    //var inspector = new window.Woohu.Inspector();
  });
})();