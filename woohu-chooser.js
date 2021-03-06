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

  function _delegateEvents(events, flag, context) {
    _.each(events, function(handler, key) {
      var parsedKey = key.split(' '),
          action = parsedKey[0],
          selector = parsedKey[1];

      if (flag) {
        $('body').on(action, selector, handler.bind(context));
      } else {
        $('body').off(action, selector);
      }
    });
  };

  /**
   * Inspect element by mouse position.
   * Perform actions on the inspected element - highlight, unhighlight, select, unselect
   * 
   * @param {Dict} options 
   * -- skip: the {Element} node that the inspector skips
   * -- onSelectElement: call back on the element selected
   */
  var Inspector = function(options) {
    /**
     * Define inspector model
     */
    this.model = {
      selectedElement: null,
      highlightedElement: null
    };

    var _this = this,
        model = this.model;

    this.options = options;
    this.element = null;
    
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
        if (model.highlightedElement) {
          return this.render();
        }
      },
      events: {
        // Dismiss the selection and re-select
        'click .woohu-btn-reselect': function(e) {
          _this.unselectElement();
        },
        // Select an element
        'click .woohu-highlight': function(e) {
          _this.selectElement(model.highlightedElement);
          if (options.onSelectElement) {
            options.onSelectElement(model.selectedElement);
          }
        }
      }
    };
    
    var view = this.view;

    _delegateEvents(view.events, true, this);

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

    if (this.options.skip) {
      var node = this.options.skip;
      if (this._in(node, element)) {
        return false;
      }
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

  Inspector.prototype.selectElement = function(element) {
    var model = this.model;
    model.selectedElement = model.highlightedElement = element;
    if (this.options.selectedCls) {
      $(element).addClass(this.options.selectedCls);
    }
    this.view.update();
  };

  Inspector.prototype.unselectElement = function() {
    var model = this.model;
    $(model.selectedElement).removeClass(this.options.selectedCls);

    model.selectedElement = model.highlightedElement = null;
    this.view.update();
  };

  Inspector.prototype.setSelectedElement = function(element) {
    this.selectElement(element);
  };

  Inspector.prototype.destroy = function() {
    $('.woohu-inspector').remove();
    $(document).off('woohu:mousemovestop');
    _delegateEvents(this.view.events, false);
  };
  
  /**
   * Check if node is one of the children or sub-children node of parentNode
   */
  Inspector.prototype._in = function(parentNode, node) {
    if (parentNode === node.parentNode) {
      return true;
    } else if (node === $('body')[0]) {
      return false;
    } else {
      return this._in(parentNode, node.parentNode);
    }
  };
  
  /**
   * Define Chooser
   */
  var Chooser = function(template) {
    template = template.replace(/&lt;/g, '<');
    template = template.replace(/&gt;/g, '>');

    this.settings = {
      selectedCls: 'woohu-selected'
    };

    this.steps = [
      {
        index: 1,
        text: 'Select an item you wanna watch.',
        selectedElement: null
      },
      {
        index: 2,
        text: 'Select the item name',
        selectedElement: null
      },
      {
        index: 3,
        text: 'Select the price',
        selectedElement: null
      },
      {
        index: 4,
        text: 'Congratulations! The item is being watched.'
      }
    ];

    this.model = {
      step: this.steps[0]
    };

    this.struct = {
      selector: '',
      itemSchema: {
        price: {selector: ''},
        name: {selector: ''}
      }
    };

    var _this = this,
        model = this.model,
        inspector;

    this.view = {
      template: '<div id="woohu-chooser"></div>',
      render: function() {
        var view = this,
            $el, compiledTemplate;
         
        compiledTemplate = _.template(template)({
          step: model.step,
          progress: (model.step.index / _this.steps.length) * 100,
        });

        $el = $(view.template).html(compiledTemplate);
        $('body').append($el);

        _this.$el = $el;

        if (model.step.index < 4) {
          _this.inspector = new Inspector({
            onSelectElement: _this.selectElement.bind(_this),
            skip: $el[0],
            selectedCls: _this.settings.selectedCls
          });
        }

        return $el;
      },
      update: function() {
        _this.$el.remove();
        if (_this.inspector) {
          _this.inspector.destroy();
        }
        console.log(_this.struct);
        _this.$el = this.render();
      },
      events: {
        'click .woohu-icon-back': function(e) {
          var currStep = _this.model.step.index;

          _this.model.step = _this.steps[currStep - 2];
          _this.view.update();

          _this.inspector.setSelectedElement(_this.model.step.selectedElement);          
        },
        'click .woohu-icon-next': function(e) {
          var currStep = _this.model.step.index;

          _this.model.step = _this.steps[currStep];
          _this.view.update();

          if (_this.model.step.selectedElement) {
            _this.inspector.setSelectedElement(_this.model.step.selectedElement);       
          }         
        }
      }
    };

    _delegateEvents(this.view.events, true, this);
  };

  Chooser.prototype._clean = function(selector) {
    selector = selector.replace(/woohu-selected/g, '');
    return selector.trim();
  };

  Chooser.prototype.selectElement = function(selectedElement) {
    var model = this.model,
        struct = this.struct,
        currStep = model.step.index,
        selector = $(selectedElement).attr('class');

    model.step.selectedElement = selectedElement;

    if (currStep === 1) {
      struct.selector = this._clean(selector);
    } else if (currStep === 2) {
      struct.itemSchema.name.selector = this._clean(selector);
    } else if (currStep === 3) {
      struct.itemSchema.price.selector = this._clean(selector);
    }

    model.step = this.steps[currStep];
    this.view.update();
  };

  window.Woohu.Inspector = Inspector;
  window.Woohu.Chooser = Chooser;

})();