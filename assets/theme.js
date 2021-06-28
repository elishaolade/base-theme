this.Shopify = this.Shopify || {};
this.Shopify.theme = this.Shopify.theme || {};
this.Shopify.theme.sections = (function (exports) {
  'use strict';

  var SECTION_ID_ATTR = 'data-section-id';

  function Section(container, properties) {
    this.container = validateContainerElement(container);
    this.id = container.getAttribute(SECTION_ID_ATTR);
    this.extensions = [];

    // eslint-disable-next-line es5/no-es6-static-methods
    Object.assign(this, validatePropertiesObject(properties));

    this.onLoad();
  }

  Section.prototype = {
    onLoad: Function.prototype,
    onUnload: Function.prototype,
    onSelect: Function.prototype,
    onDeselect: Function.prototype,
    onBlockSelect: Function.prototype,
    onBlockDeselect: Function.prototype,

    extend: function extend(extension) {
      this.extensions.push(extension); // Save original extension

      // eslint-disable-next-line es5/no-es6-static-methods
      var extensionClone = Object.assign({}, extension);
      delete extensionClone.init; // Remove init function before assigning extension properties

      // eslint-disable-next-line es5/no-es6-static-methods
      Object.assign(this, extensionClone);

      if (typeof extension.init === 'function') {
        extension.init.apply(this);
      }
    }
  };

  function validateContainerElement(container) {
    if (!(container instanceof Element)) {
      throw new TypeError(
        'Theme Sections: Attempted to load section. The section container provided is not a DOM element.'
      );
    }
    if (container.getAttribute(SECTION_ID_ATTR) === null) {
      throw new Error(
        'Theme Sections: The section container provided does not have an id assigned to the ' +
          SECTION_ID_ATTR +
          ' attribute.'
      );
    }

    return container;
  }

  function validatePropertiesObject(value) {
    if (
      (typeof value !== 'undefined' && typeof value !== 'object') ||
      value === null
    ) {
      throw new TypeError(
        'Theme Sections: The properties object provided is not a valid'
      );
    }

    return value;
  }

  // Object.assign() polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
      value: function assign(target) {
        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  /*
   * @shopify/theme-sections
   * -----------------------------------------------------------------------------
   *
   * A framework to provide structure to your Shopify sections and a load and unload
   * lifecycle. The lifecycle is automatically connected to theme editor events so
   * that your sections load and unload as the editor changes the content and
   * settings of your sections.
   */

  var SECTION_TYPE_ATTR = 'data-section-type';
  var SECTION_ID_ATTR$1 = 'data-section-id';

  window.Shopify = window.Shopify || {};
  window.Shopify.theme = window.Shopify.theme || {};
  window.Shopify.theme.sections = window.Shopify.theme.sections || {};

  var registered = (window.Shopify.theme.sections.registered =
    window.Shopify.theme.sections.registered || {});
  var instances = (window.Shopify.theme.sections.instances =
    window.Shopify.theme.sections.instances || []);

  function register(type, properties) {
    if (typeof type !== 'string') {
      throw new TypeError(
        'Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered'
      );
    }

    if (typeof registered[type] !== 'undefined') {
      throw new Error(
        'Theme Sections: A section of type "' +
          type +
          '" has already been registered. You cannot register the same section type twice'
      );
    }

    function TypedSection(container) {
      Section.call(this, container, properties);
    }

    TypedSection.constructor = Section;
    TypedSection.prototype = Object.create(Section.prototype);
    TypedSection.prototype.type = type;

    return (registered[type] = TypedSection);
  }

  function unregister(types) {
    types = normalizeType(types);

    types.forEach(function(type) {
      delete registered[type];
    });
  }

  function load(types, containers) {
    types = normalizeType(types);

    if (typeof containers === 'undefined') {
      containers = document.querySelectorAll('[' + SECTION_TYPE_ATTR + ']');
    }

    containers = normalizeContainers(containers);

    types.forEach(function(type) {
      var TypedSection = registered[type];

      if (typeof TypedSection === 'undefined') {
        return;
      }

      containers = containers.filter(function(container) {
        // Filter from list of containers because container already has an instance loaded
        if (isInstance(container)) {
          return false;
        }

        // Filter from list of containers because container doesn't have data-section-type attribute
        if (container.getAttribute(SECTION_TYPE_ATTR) === null) {
          return false;
        }

        // Keep in list of containers because current type doesn't match
        if (container.getAttribute(SECTION_TYPE_ATTR) !== type) {
          return true;
        }

        instances.push(new TypedSection(container));

        // Filter from list of containers because container now has an instance loaded
        return false;
      });
    });
  }

  function unload(selector) {
    var instancesToUnload = getInstances(selector);

    instancesToUnload.forEach(function(instance) {
      var index = instances
        .map(function(e) {
          return e.id;
        })
        .indexOf(instance.id);
      instances.splice(index, 1);
      instance.onUnload();
    });
  }

  function extend(selector, extension) {
    var instancesToExtend = getInstances(selector);

    instancesToExtend.forEach(function(instance) {
      instance.extend(extension);
    });
  }

  function getInstances(selector) {
    var filteredInstances = [];

    // Fetch first element if its an array
    if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
      var firstElement = selector[0];
    }

    // If selector element is DOM element
    if (selector instanceof Element || firstElement instanceof Element) {
      var containers = normalizeContainers(selector);

      containers.forEach(function(container) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function(instance) {
            return instance.container === container;
          })
        );
      });

      // If select is type string
    } else if (typeof selector === 'string' || typeof firstElement === 'string') {
      var types = normalizeType(selector);

      types.forEach(function(type) {
        filteredInstances = filteredInstances.concat(
          instances.filter(function(instance) {
            return instance.type === type;
          })
        );
      });
    }

    return filteredInstances;
  }

  function getInstanceById(id) {
    var instance;

    for (var i = 0; i < instances.length; i++) {
      if (instances[i].id === id) {
        instance = instances[i];
        break;
      }
    }
    return instance;
  }

  function isInstance(selector) {
    return getInstances(selector).length > 0;
  }

  function normalizeType(types) {
    // If '*' then fetch all registered section types
    if (types === '*') {
      types = Object.keys(registered);

      // If a single section type string is passed, put it in an array
    } else if (typeof types === 'string') {
      types = [types];

      // If single section constructor is passed, transform to array with section
      // type string
    } else if (types.constructor === Section) {
      types = [types.prototype.type];

      // If array of typed section constructors is passed, transform the array to
      // type strings
    } else if (Array.isArray(types) && types[0].constructor === Section) {
      types = types.map(function(TypedSection) {
        return TypedSection.prototype.type;
      });
    }

    types = types.map(function(type) {
      return type.toLowerCase();
    });

    return types;
  }

  function normalizeContainers(containers) {
    // Nodelist with entries
    if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
      containers = Array.prototype.slice.call(containers);

      // Empty Nodelist
    } else if (
      NodeList.prototype.isPrototypeOf(containers) &&
      containers.length === 0
    ) {
      containers = [];

      // Handle null (document.querySelector() returns null with no match)
    } else if (containers === null) {
      containers = [];

      // Single DOM element
    } else if (!Array.isArray(containers) && containers instanceof Element) {
      containers = [containers];
    }

    return containers;
  }

  if (window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function(event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector(
        '[' + SECTION_ID_ATTR$1 + '="' + id + '"]'
      );

      if (container !== null) {
        load(container.getAttribute(SECTION_TYPE_ATTR), container);
      }
    });

    document.addEventListener('shopify:section:unload', function(event) {
      var id = event.detail.sectionId;
      var container = event.target.querySelector(
        '[' + SECTION_ID_ATTR$1 + '="' + id + '"]'
      );
      var instance = getInstances(container)[0];

      if (typeof instance === 'object') {
        unload(container);
      }
    });

    document.addEventListener('shopify:section:select', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onSelect(event);
      }
    });

    document.addEventListener('shopify:section:deselect', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onDeselect(event);
      }
    });

    document.addEventListener('shopify:block:select', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockSelect(event);
      }
    });

    document.addEventListener('shopify:block:deselect', function(event) {
      var instance = getInstanceById(event.detail.sectionId);

      if (typeof instance === 'object') {
        instance.onBlockDeselect(event);
      }
    });
  }

  exports.registered = registered;
  exports.instances = instances;
  exports.register = register;
  exports.unregister = unregister;
  exports.load = load;
  exports.unload = unload;
  exports.extend = extend;
  exports.getInstances = getInstances;
  exports.getInstanceById = getInstanceById;
  exports.isInstance = isInstance;

  return exports;

}({}));

/* ================ MODULES ================ */
window.theme = window.theme || {};

theme.MobileMenu = (function() {
    var selectors = {
        backdropClass: '.backdrop',
        hamburgerClass: '.hamburger',
        menuDrawer: '.menu-drawer',
        closeBtn: '.backdrop__close'
    }

    var config = {
        backdropActive: 'backdrop--active',
        drawerExpanded: 'menu-drawer--active'
    }

    var cache = {};

    function cacheElements() {
        cache = {
            backdrop: document.querySelector(selectors.backdropClass),
            mobileDrawer: document.querySelector(selectors.menuDrawer),
            closeBtn: document.querySelector(selectors.closeBtn),
            mobileMenuBtn: document.querySelector(selectors.hamburgerClass)
        }
    }

    function toggleMobileMenu() {
        console.log('toggle')
        cache.backdrop.classList.toggle(config.backdropActive);
        cache.mobileDrawer.classList.toggle(config.drawerExpanded);
    }

    function init() {
        cacheElements();
        cache.closeBtn.addEventListener('click', toggleMobileMenu);
        cache.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    return {
        init: init
    }
})();

theme.HeaderSection = (function() {
    function Header(){
        theme.MobileMenu.init();
    }
    return Header;
})();

theme.Filters = (function(){
  function Filters() {
    var selectors = { 
      sortSelection: '#SortBy'
    };
    this.sortSelect = document.querySelector(selectors.sortSelection);
    this._initParams();

    if(this.sortSelect) {
      this.defaultSort = this._getDefaultSortValue();
    }
    if(this.sortSelect) {
      this.sortSelect.addEventListener('change', this._onSortChange.bind(this));
    }
  }
  Filters.prototype = Object.assign({},Filters.prototype, {
    _initParams: function() {
      this.queryParams = {};
      if (location.search.length) {
        var aKeyValue;
        var aCouples = location.search.substr(1).split('&');
        for (var i = 0; i < aCouples.length; i++) {
          aKeyValue = aCouples[i].split('=');
          if (aKeyValue.length > 1) {
            this.queryParams[
              decodeURIComponent(aKeyValue[0])
            ] = decodeURIComponent(aKeyValue[1]);
          }
        }
      }
    },
    _onSortChange: function() {
      this.queryParams.sort_by = this._getSortValue();

      if (this.queryParams.page) {
        delete this.queryParams.page;
      }

      window.location.search = decodeURIComponent(
        new URLSearchParams(Object.entries(this.queryParams)).toString()
      );
    },
    _getSortValue: function() {
      return this.sortSelect.value || this.defaultSort;
    },
    _getDefaultSortValue: function() {
      return this.sortSelect.dataset.defaultSortby;
    }
  })
  return new Filters;
})();

theme.Cart = (function() {
  var selectors = {
    cartItem: '[data-cart-item]',
    lineItem: '.line-item',
    lineItemRemove: '.line-item__remove',
    lineItemQty: '.line-item__qty-input',
    lineItemPriceMobile: '.line-item__sm-price',
    cartSubtotal: '.subtotal__price'
  };
  var classes = {
    hide: 'hide'
  }
  var attributes = {
    cartLineItems: 'data-cart-line-items',
    cartItem: 'data-cart-item',
    cartItemIndex: 'data-cart-item-index',
    cartItemKey: 'data-cart-item-key',
    cartItemQuantity: 'data-cart-item-quantity',
    cartItemTitle: 'data-cart-item-title',
    cartItemUrl: 'data-cart-item-url',
    quantityItem: 'data-quantity-item'
  };

  function Cart() {
    // this._onRemoveItem = this._onRemoveItem.bind(this);
    // this._updateLineItem = this._updateLineItem.bind(this);
    // this._onRemoveItem = this._onRemoveItem.bind(this);
    this._createItem = this._createItem.bind(this);
    this.cartItems = document.querySelectorAll(selectors.lineItem);
    this.cartItems.forEach(item => this._createItem(item));
  }
  

  Cart.prototype = Object.assign({}, Cart.prototype, {
    _createItem: function(lineItem) {
      console.log(lineItem.dataset)
      var itemObj = {
        key: lineItem.dataset.lineItemKey,
        quantity: lineItem.dataset.cartItemQuantity
      }
      console.log(itemObj);
    },
    _createCart: function(state) {
      var cartTable = this.document.querySelector(selectors.cartLineItems);
      cartTable.innerHTML = '';
      this._createLineItemList(state).forEach(function(lineItem) {
        cartTable.appendChild(lineItem);
      });
      // this.setQuantityFormControllers();

      this.document.querySelector(
        selectors.cartSubtotal
      ).innerHTML = theme.Currency.formatMoney(
        state.total_price,
        theme.moneyFormatWithCurrency
      );
    },
    _updateLineItem: function(evt) {
      console.log(evt.target);
    },
    _handleInputQty: function(evt) {
      if(!evt.target.hasAttribute('data-quantity-input')) return;
      var input = evt.target;
      var itemElement = input.closest(selectors.cartItem);
      var itemIndex = Number(input.getAttribute('data-quantity-item'));
      var itemQtyInputs = this.container.querySelectorAll(`[data-quantity-item=${itemIndex}]`);
      var value = parseInt(input.value);
      var isValidValue = !(value < 0 || isNaN(value));
      itemQtyInputs.forEach(element => element.value = value);
    },
    _hideCartError: function() {
      document
        .querySelector(selectors.cartErrorMessageWrapper)
        .classList.add(classes.hide);
      document.querySelector(selectors.cartErrorMessage).textContent = '';
    },
    _showCartError: function(elementToFocus) {
      document.querySelector(selectors.cartErrorMessage).textContent = 
        'Error';
      document
        .querySelector(selectors.cartErrorMessageWrapper)
        .classList.remove(classes.hide);
      if (!elementToFocus) return;
        elementToFocus.focus();
    },
    _onRemoveItem: function(evt) {
      if (!evt.target.hasAttribute('data-cart-remove')) return;

      evt.preventDefault();
      var lineItem = evt.target.closest(selectors.cartItem);
      var index = Number(lineItem.getAttribute(attributes.cartItemIndex));

      this._hideCartError();

      var request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;'
        },
        body: JSON.stringify({
          line: index,
          quantity: 0
        })
      };

      fetch(this.cartRoutes.cartChangeUrl + '.js', request)
        .then(function(response) {
          return response.json();
        })
        .then(
          function(state) {
            if (state.item_count === 0) {
              // this._emptyCart();
            } else {
              // this._createCart(state);
              // this._showRemoveMessage(lineItem.cloneNode(true));
            }

            // this._setCartCountBubble(state.item_count);
          }.bind(this)
        )
        .catch(
          function() {
            this._showCartError(null);
          }.bind(this)
        );
    },
  })

  return new Cart;
})();

theme.Products = (function(){

})();


theme.ProductRecommendations = (function() {
  function ProductRecommendations(container) {
    var $container = (this.$container = $(container));
    var baseUrl = container.dataset.baseUrl;
    var productId = container.dataset.productId;
    var productRecommendationsUrlAndContainerClass = baseUrl + '?section_id=product-recommendations&limit=' + limit +
    '&product_id=' +productId +
    ' .product-recommendations';

    $container.parent().load(productRecommendationsUrlAndContainerClass);

    window.performance.mark(
      'debut:product:fetch_product_recommendations.start'
    );

    fetch(recommendationsSectionUrl)
      .then(function(response) {
        return response.text();
      })
      .then(function(productHtml) {
        if (productHtml.trim() === '') return;

        container.innerHTML = productHtml;
        container.innerHTML = container.firstElementChild.innerHTML;

        window.performance.mark(
          'debut:product:fetch_product_recommendations.end'
        );

        performance.measure(
          'debut:product:fetch_product_recommendations',
          'debut:product:fetch_product_recommendations.start',
          'debut:product:fetch_product_recommendations.end'
        );
      });
  }

  return ProductRecommendations;
})();

document.addEventListener('DOMContentLoaded', function(){
    var sections = Shopify.theme.sections;
    sections.register('header', theme.MobileMenu.init());
    sections.register('collection-template', theme.Filters);
    sections.register('product-recommendations', theme.ProductRecommendations);
    sections.register('cart-template', theme.Cart);
    // console.log(theme.Filters)
    // console.log(theme.Filters);
    // console.log(theme.Filters());
    // console.log(theme.Filters);
})

