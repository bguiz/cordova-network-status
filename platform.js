/* globals console, angular */
'use strict';

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('cordova-network-status', [
    ], factory);
  }
  else if (typeof exports === 'object') {
    module.exports = factory(
    );
  }
  else {
    root.CordovaNetworkStatus = factory(
    );
  }
})(this, setUpCordovaNetworkStatus);

function setUpCordovaNetworkStatus() {
  var CordovaNetworkStatus = {};

  CordovaNetworkStatus.initialise =
      platform_initialise;
  CordovaNetworkStatus.registerStatusChangeListener =
      status_registerChangeListener;
  CordovaNetworkStatus.getStatus =
      get_status();

  return CordovaNetworkStatus;

  var parseNetworkStatus, registerListener;

  function platform_initialise() {
    var platformCategory = platform_getCategory();
    if (platformCategory === 'windows') {
      console.log('Initialising platform-specific functions for Windows-flavoured cordova');
      parseNetworkStatus = _windows_parseNetworkStatus;
      registerListener = _windows_registerListener;
    }
    else {
      console.log('Initialising platform-specific functions for regular cordova');
      parseNetworkStatus = _regular_parseNetworkStatus;
      registerListener = _regular_registerListener;
    }

  }

  function get_status() {
    return _windows_parseNetworkStatus();
  }

  var networkStatusChangeCallback;

  function status_registerChangeListener(callback, shouldListen) {
    shouldListen = (!!shouldListen || typeof shouldListen === 'undefined');
    if (shouldListen) {
      // Start listening
      if (!!networkStatusChangeCallback) {
        throw 'Only allowed to register one change listener globally';
      }
      networkStatusChangeCallback = callback;
      registerListener(shouldListen);
    }
    else {
      // Stop listening
      if (!networkStatusChangeCallback) {
        throw 'No listener currently registered';
      }
      registerListener(shouldListen);
      networkStatusChangeCallback = undefined;
    }
  }

  function _regular_registerListener(shouldListen) {
    throw '_regular_registerListener not yet implemented.';
  }

  function _windows_registerListener(shouldListen) {
    var listenMethod = (!!shouldListen ? 'addEventListener' : 'removeEventListener');
    global.Windows.Networking.Connectivity.NetworkInformation
        [listenMethod]('networkstatuschanged', networkStatusChangeListener);
  }

  // Cached, because sometime the change event fire multiple times but yields the same status
  var previousNetworkStatus;

  function networkStatusChangeListener(evt) {
    var status = parseNetworkStatus(evt);
    var err = (typeof status === 'string') ? undefined : 'Unrecognised status';
    if (status !== previousNetworkStatus) {
      // Only fire when there is a delta from the cached value
      networkStatusChangeCallback(err, status);
    }
    previousNetworkStatus = status;
  }

  function _regular_parseNetworkStatus(evt) {
    throw '_regular_parseNetworkStatus not yet implemented';
  }

  function _windows_parseNetworkStatus(evt) {
    var networkProfile = global.Windows.Networking.Connectivity.NetworkInformation
        .getInternetConnectionProfile();
    if (!networkProfile) {
      return 'none';
    }
    var currentLevel = networkProfile
        .getNetworkConnectivityLevel();
    var levelConstants = global.Windows.Networking.Connectivity.NetworkConnectivityLevel;
    switch (currentLevel) {
      case levelConstants.none:
        return 'none';
      case levelConstants.localAccess:
        return 'local';
      case levelConstants.constrainedInternetAccess:
        return 'some';
      case levelConstants.internetAccess:
        return 'full';
      default:
        return undefined;
    }
  }

  var category;

  function platform_getCategory() {
    if (!!category) {
      // Do nothing, just re-use cached value
    }
    else if ((!!global.device &&
        typeof global.device.platform === 'string' &&
        global.device.platform.toLowerCase() === 'windows') ||
        (global.Windows && global.WinJS)) {
      category = 'windows';
    }
    else {
      category = 'regular';
    }
    return category;
  }

}
