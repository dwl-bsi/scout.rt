/*******************************************************************************
 * Copyright (c) 2014-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
// TODO [5.2] awe, CGU: think about refactoring this code to a Scout.js class and use an
// instance of that new class in scout-module.js for the last line of code:
// }(window.scout = window.scout || {}, jQuery));

scout.sessions = [];
scout.appListeners = [];

/**
 * Adds a listener to the app. If the app is not created yet it remembers the listener and adds it as soon the app is started.
 */
scout.addAppListener = function(type, func) {
  var listener = {
    type: type,
    func: func
  };
  if (scout.app) {
    scout.app.events.addListener(listener);
  } else {
    this.appListeners.push(listener);
  }
  return listener;
};

/**
    session.start();
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Details_of_the_Object_Model
 */
scout.inherits = function(childCtor, parentCtor) {
  childCtor.prototype = Object.create(parentCtor.prototype);
  childCtor.prototype.constructor = childCtor;
  childCtor.parent = parentCtor;
};

/**
 * Returns the first of the given arguments that is not null or undefined. If no such element
 * is present, the last argument is returned. If no arguments are given, undefined is returned.
 */
scout.nvl = function() {
  var result;
  for (var i = 0; i < arguments.length; i++) {
    result = arguments[i];
    if (result !== undefined && result !== null) {
      break;
    }
  }
  return result;
};

/**
 * Use this method in your functions to assert that a mandatory parameter is passed
 * to the function. Throws an Error when value is not set.
 *
 * @param type (optional) if this parameter is set, the given value must be of this type (instanceof check)
 */
scout.assertParameter = function(parameterName, value, type) {
  if (!value) {
    throw new Error('Missing required parameter \'' + parameterName + '\'');
  }
  if (type && !(value instanceof type)) {
    throw new Error('Parameter \'' + parameterName + '\' has wrong type');
  }
};

scout.isOneOf = function() {
  if (arguments.length >= 2) {
    var value = arguments[0];
    var argsToCheck;
    if (arguments.length === 2 && Array.isArray(arguments[1])) {
      argsToCheck = arguments[1];
    } else {
      argsToCheck = Array.prototype.slice.call(arguments, 1);
    }
    return argsToCheck.indexOf(value) !== -1;
  }
  return false;
};

/**
 * Creates a new object instance.<p> Delegates the create call to scout.ObjectFactory#create.
 * @returns {object}
 */
scout.create = function(objectType, model, options) {
  return scout.objectFactory.create(objectType, model, options);
};

/**
 * Prepares the DOM for scout in the given document. This should be called once while initializing scout.
 * If the target document is not specified, the global "document" variable is used instead.
 *
 * This is used by apps (App, LoginApp, LogoutApp)
 *
 * Currently it does the following:
 * - Remove the <noscript> tag (obviously there is no need for it).
 * - Remove <scout-text> tags (they must have been processed before, see scout.texts.readFromDOM())
 * - If the browser is Google Chrome, add a special meta header to prevent automatic translation.
 */
scout.prepareDOM = function(targetDocument) {
  targetDocument = targetDocument || document;
  // Cleanup DOM
  $('noscript', targetDocument).remove();
  $('scout-text', targetDocument).remove();

  // Prevent "Do you want to translate this page?" in Google Chrome
  if (scout.device.browser === scout.Device.Browser.CHROME) {
    var metaNoTranslate = '<meta name="google" content="notranslate" />';
    var $title = $('head > title', targetDocument);
    if ($title.length === 0) {
      // Add to end of head
      $('head', targetDocument).append(metaNoTranslate);
    } else {
      $title.after(metaNoTranslate);
    }
  }
};

scout._checkBrowserCompability = function(options) {
  var device = scout.device;
  $.log.info('Detected browser ' + device.browser + ' version ' + device.browserVersion);
  if (!scout.nvl(options.checkBrowserCompatibility, true) || device.isSupportedBrowser()) {
    // No check requested or browser is supported
    return true;
  }

  $('.scout').each(function() {
    var $entryPoint = $(this),
      $box = $entryPoint.appendDiv(),
      newOptions = scout.objects.valueCopy(options);

    newOptions.checkBrowserCompatibility = false;
    $box.load('unsupported-browser.html', function() {
      $box.find('button').on('click', function() {
        $box.remove();
        scout._init(newOptions);
      });
    });
  });
  return false;
};

/**
 * Note: we do not install an error handler on popup-windows because everything is controlled by the main-window
 * so exceptions will also occur in that window. This also means, the fatal message-box will be displayed in the
 * main-window, even when a popup-window is opened and active.
 *
 * Caution: The error.stack doesn't look the same in different browsers. Chrome for instance puts the error message
 * on the first line of the stack. Firefox does only contain the stack lines, without the message, but in return
 * the stack trace is much longer :)
 */
scout._installGlobalJavascriptErrorHandler = function() {
  window.onerror = function(errorMessage, fileName, lineNumber, columnNumber, error) {
    try {
      var errorCode = getJsErrorCode(error),
        logStr = errorMessage + ' at ' + fileName + ':' + lineNumber;
      if (error && error.stack) {
        logStr += '\n' + error.stack;
      }
      logStr += '\n(' + 'Code ' + errorCode + ')';
      $.log.error(logStr);
      if (window.console) {
        window.console.log(logStr);
      }
      // FIXME bsh: Improve this! Accessing session at index 0 is not a good idea when a window has multiple scout instances (portlet use-case)
      if (scout.sessions.length > 0) {
        var session = scout.sessions[0],
          boxOptions = {
            header: session.optText('ui.UnexpectedProblem', 'Internal UI Error'),
            body: scout.strings.join('\n\n',
              session.optText('ui.InternalUiErrorMsg', errorMessage, ' (' + session.optText('ui.ErrorCodeX', 'Code ' + errorCode, errorCode) + ')'),
              session.optText('ui.UiInconsistentMsg', '')),
            yesButtonText: session.optText('ui.Reload', 'Reload'),
            yesButtonAction: scout.reloadPage,
            noButtonText: session.optText('ui.Ignore', 'Ignore'),
            hiddenText: logStr
          };

        session.showFatalMessage(boxOptions, errorCode);
        session.sendLogRequest(logStr);
      }
    } catch (err) {
      throw new Error('Error in global JavaScript error handler: ' + err.message + ' (original error: ' + errorMessage + ' at ' + fileName + ':' + lineNumber + ')');
    }

    // ----- Helper functions -----

    /**
     * Generate a "cool looking" error code from the JS error object, that
     * does not reveal too much technical information, but at least indicates
     * that a JS runtime error has occurred. (In contrast, fatal errors from
     * the server have numeric error codes.)
     */
    function getJsErrorCode(error) {
      if (error) {
        if (error.name === 'EvalError') {
          return 'E1';
        }
        if (error.name === 'InternalError') {
          return 'I2';
        }
        if (error.name === 'RangeError') {
          return 'A3';
        }
        if (error.name === 'ReferenceError') {
          return 'R4';
        }
        if (error.name === 'SyntaxError') {
          return 'S5';
        }
        if (error.name === 'TypeError') {
          return 'T6';
        }
        if (error.name === 'URIError') {
          return 'U7';
        }
      }
      return 'J0';
    }
  };
};

/**
 * Installs a global 'mousedown' interceptor to invoke 'aboutToBlurByMouseDown' on value field before anything else gets executed.
 */
scout._installGlobalMouseDownInterceptor = function(myDocument) {
  myDocument.addEventListener('mousedown', function(event) {
    scout.ValueField.invokeValueFieldAboutToBlurByMouseDown(event.target || event.srcElement);
  }, true); // true=the event handler is executed in the capturing phase
};

scout._globalAjaxSetup = function() {
  $.ajaxSetup({
    beforeSend: function(request) {
      request.setRequestHeader('X-Scout-Correlation-Id', scout.numbers.correlationId());
    }
  });
};

/**
 * Helper function to get the model adapter for a given adapterId. If there is more than one
 * session, e.g. in case of portlets, the second argument specifies the session to be queried
 * (can be either the zero-based index or the partId). If the session or the adapter could
 * not be found, nothing is returned.
 */
scout.adapter = function(adapterId, sessionIndex) {
  var session = scout.getSession(sessionIndex);
  if (session && session.modelAdapterRegistry) {
    return session.modelAdapterRegistry[adapterId];
  }
};

scout.getSession = function(sessionIndex) {
  if (!scout.sessions) {
    return null;
  }
  var session;
  if (scout.sessions.length === 1) {
    session = scout.sessions[0];
  } else {
    sessionIndex = sessionIndex || 0;
    for (var i = 0; i < scout.sessions.length; i++) {
      if (scout.sessions[i].partId == sessionIndex) { // <-- compare with '==' is intentional! (NOSONAR)
        sessionIndex = i;
        break;
      }
    }
    session = scout.sessions[sessionIndex];
  }
  return session;
};

/**
 * This method exports the adapter with the given ID as JSON, it returns an plain object containing the
 * configuration of the adapter. You can transform that object into JSON by calling <code>JSON.stringify</code>.
 * This method can only be called through the browser JavaScript console.
 * Here's an example of how to call the method:
 *
 * JSON.stringify(scout.exportAdapter(4))
 *
 * @param adapterId
 */
scout.exportAdapter = function(adapterId, sessionIndex) {
  var session = scout.getSession(sessionIndex);
  if (session && session.modelAdapterRegistry) {
    var adapter = session.getModelAdapter(adapterId);
    var adapterData = cloneAdapterData(adapterId);
    resolveAdapterReferences(adapter, adapterData);
    adapterData.type = 'model'; // property 'type' is required for models.js
    return adapterData;
  }

  function cloneAdapterData(adapterId) {
    var adapterData = session.getAdapterData(adapterId);
    adapterData = $.extend(true, {}, adapterData);
    return adapterData;
  }

  function resolveAdapterReferences(adapter, adapterData) {
    var tmpAdapter, tmpAdapterData;
    adapter._adapterProperties.forEach(function(adapterPropertyName) {
      var adapterPropertyValue = adapterData[adapterPropertyName];
      if (!adapterPropertyValue) {
        return; // nothing to do when property is null
      }
      if (Array.isArray(adapterPropertyValue)) {
        // value is an array of adapter IDs
        var adapterDataArray = [];
        adapterPropertyValue.forEach(function(adapterId) {
          tmpAdapter = session.getModelAdapter(adapterId);
          tmpAdapterData = cloneAdapterData(adapterId);
          resolveAdapterReferences(tmpAdapter, tmpAdapterData);
          adapterDataArray.push(tmpAdapterData);
        });
        adapterData[adapterPropertyName] = adapterDataArray;
      } else {
        // value is an adapter ID
        tmpAdapter = session.getModelAdapter(adapterPropertyValue);
        tmpAdapterData = cloneAdapterData(adapterPropertyValue);
        resolveAdapterReferences(tmpAdapter, tmpAdapterData);
        adapterData[adapterPropertyName] = tmpAdapterData;
      }
    });
    adapterData = adapter.exportAdapterData(adapterData);
  }
};

/**
 * Reloads the entire browser window.
 *
 * Options:
 *   [schedule]
 *     If true, the page reload is not executed in the current thread but scheduled using setTimeout().
 *     This is useful if the caller wants to execute some other code before the reload. The default is false.
 *   [clearBody]
 *     If true, the body is cleared first before the reload is performed. This is useful to prevent
 *     showing "old" content in the browser until the new content arrives. The default is true.
 *   [redirectUrl]
 *      The new URL to load. If not specified, the current location is used (window.location).
 */
scout.reloadPage = function(options) {
  options = options || {};
  if (options.schedule) {
    setTimeout(reloadPageImpl);
  } else {
    reloadPageImpl();
  }

  // ----- Helper functions -----

  function reloadPageImpl() {
    // Hide everything (on entire page, not only $entryPoint)
    if (scout.nvl(options.clearBody, true)) {
      $('body').html('');
    }

    // Reload window (using setTimeout, to overcome drawing issues in IE)
    setTimeout(function() {
      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      } else {
        window.location.reload();
      }
    });
  }
};
