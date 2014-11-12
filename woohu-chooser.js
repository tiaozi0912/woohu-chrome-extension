/**
 * Define custom woohu:mousemovestop event
 */
(function() {
  var timeout = null,
      wait = 400;

  $(window).on('mousemove', function (event) {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(function () {
      // trigger the new event on event.target, so that it can bubble appropriately
      $(document).trigger('woohu:mousemovestop', event);
      //console.log('woohu:mousemovestop event triggered');
    }, wait);
  });
})();

(function() {
  'use strict';

  window.Woohu = window.Woohu || {};

  function _delegateEvents(events, flag) {
    _.each(events, function(handler, key) {
      var parsedKey = key.split(' '),
          action = parsedKey[0],
          selector = parsedKey[1];

      if (flag) {
        $('body').on(action, selector, handler);
      } else {
        $('body').off(action, selector, handler);
      }
    });
  };

  /**
   * Inspect element by mouse position.
   * Perform actions on the inspected element - highlight, unhighlight, select, unselect
   */
  var Inspector = function() {
    /**
     * Define inspector model
     */
    this.model = {
      selectedElement: null,
      highlightedElement: null
    };

    var _this = this,
        model = this.model;
    
    /**
     * Define inspector view. Call view.render() to render(update) the view
     */
    this.view = {
      template: '<div class="woohu-inspector" style="top:<%= top %>px;left:<%= left %>px;">' + 
                  '<div class="woohu-highlight" style="width:<%= rect.width %>px;height:<%= rect.height %>px;"></div>' +
                  '<% if (selectedElement) { %>' +
                    '<div class="woohu-toolbar">' +
                      '<span class="woohu-label">selected</span>' + 
                      '<button class="woohu-btn woohu-btn-reselect">re-select</button>' +
                    '</div>' +
                  '<% } %>' +
                '</div>',
      render: function() {
        var view = this,
            offset = $(model.highlightedElement).offset(),
            template = _.template(view.template)({
              top: offset.top,
              left: offset.left,
              rect: model.highlightedElement.getBoundingClientRect(),
              selectedElement: model.selectedElement
            });

        $('body').append(template);

        return $(template);
      },
      // Only update the binding data
      // @todo: better way to handle data binding
      update: function() {
        //_this.element.remove();
        $('.woohu-inspector').remove();
        return this.render();
      },
      events: {
        // Dismiss the selection and re-select
        'click .woohu-btn-reselect': function(e) {
          model.selectedElement = null;
          view.update();
        },
        // Select an element
        'click .woohu-highlight': function(e) {
          model.selectedElement = model.highlightedElement;
          view.update();
          console.log('selected element:');
          console.log(model.selectedElement);
        }
      }
    };
    
    var view = this.view;

    this.element = null;

    _delegateEvents(view.events, true);

    $(document).on('woohu:mousemovestop', function(e, mouseEvent) {
      if (!model.selectedElement) {
        _this.inspectElement.bind(_this)(mouseEvent);
      }
    });
  };

  Inspector.prototype.inspectElement = function(e) {
    var element = document.elementFromPoint(e.clientX, e.clientY);

    if (!element) {
      console.log('element not found;');
      return false;
    }
    
    // set / update highlightedElement
    this.model.highlightedElement = element;

    if (this.element) {
      this.element = this.view.update();
    } else {
      this.element = this.view.render();
    }

    return this.element;
  };

  Inspector.prototype.destroy = function() {
    $('.woohu-inspector').remove();
    _delegateEvents(this.view.events, false);
  };

  var Chooser = function(template) {
    template = template.replace(/&lt;/g, '<');
    template = template.replace(/&gt;/g, '>');
    this.settings = {
      steps: [
        {
          index: 1,
          text: 'Select an item you wanna watch.'
        },
        {
          index: 2,
          text: 'Select the item name'
        },
        {
          index: 3,
          text: 'Select the price'
        },
        {
          index: 4,
          text: 'Congratulations! The item is being watched.'
        }
      ]
    };

    this.model = {
      step: this.settings.steps[0]
    };

    var _this = this,
        model = this.model;

    this.view = {
      template: '<div id="woohu-chooser"></div>',
      render: function() {
        var view = this,
            $el, compiledTemplate;
         
        compiledTemplate = _.template(template)({step: model.step});

        $el = $(view.template).html(compiledTemplate);
        $('body').append($el);

        return $el;
      },
      update: function() {

      },
      events: {
        'click .woohu-icon-back': function(e) {
          console.log('clicked');
        }
      }
    };

    _delegateEvents(this.view.events, true);
  };
  
  window.Woohu.Inspector = Inspector;
  window.Woohu.Chooser = Chooser;

})();