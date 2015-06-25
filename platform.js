/* globals console, setTimeout, device, Windows, WinJS */
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

  var parseNetworkStatus, registerListener, status_getCurrent;

  CordovaNetworkStatus.initialise =
    platform_initialise;
  CordovaNetworkStatus.getCurrent =
    status_getCurrent;
  CordovaNetworkStatus.registerStatusChangeListener =
    status_registerChangeListener;

  return CordovaNetworkStatus;

  function platform_initialise() {
    var platformCategory = platform_getCategory();
    if (platformCategory === 'windows') {
      console.log('Initialising platform-specific functions for Windows-flavoured cordova');
      parseNetworkStatus = _windows_parseNetworkStatus;
      registerListener = _windows_registerListener;
      CordovaNetworkStatus.getCurrent = status_getCurrent =_windows_status_getCurrent;
    }
    else {
      console.log('Initialising platform-specific functions for regular cordova');
      parseNetworkStatus = _regular_parseNetworkStatus;
      registerListener = _regular_registerListener;
      CordovaNetworkStatus.getCurrent = status_getCurrent =_regular_status_getCurrent;
    }
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
      setTimeout(function() {
        // Immediately call the change listener,
        // as any listener for changes needs to know the initial state too.
        networkStatusChangeListener(undefined);
      }, 0);
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
    Windows.Networking.Connectivity.NetworkInformation
      [listenMethod]('networkstatuschanged', networkStatusChangeListener);
  }

  // Cached, because sometime the change event fire multiple times but yields the same status
  var previousNetworkStatus;

  function networkStatusChangeListener(evt) {
    parseNetworkStatus(evt, function onGot(status) {
      var err = (typeof status === 'string') ? undefined : 'Unrecognised status';
      if (status !== previousNetworkStatus) {
        // Only fire when there is a delta from the cached value
        networkStatusChangeCallback(err, status);
      }
      previousNetworkStatus = status;
    });
  }

  function _regular_status_getCurrent(onGot) {
    throw '_regular_status_getCurrent not yet implemented.';
  }

  function _windows_status_getCurrent(onGot) {
    var networkProfile = Windows.Networking.Connectivity.NetworkInformation
      .getInternetConnectionProfile();
    if (!networkProfile) {
      onGot('none');
      return;
    }
    var currentLevel = networkProfile
      .getNetworkConnectivityLevel();
    var levelConstants = Windows.Networking.Connectivity.NetworkConnectivityLevel;
    var status;
    switch (currentLevel) {
      case levelConstants.none:
        status = 'none';
        break;
      case levelConstants.localAccess:
        status = 'local';
        break;
      case levelConstants.constrainedInternetAccess:
        status = 'some';
        break;
      case levelConstants.internetAccess:
        status = 'full';
        break;
      default:
        status = undefined;
        break;
    }
    onGot(status);
  }

  function _regular_parseNetworkStatus(evt, onGot) {
    throw '_regular_parseNetworkStatus not yet implemented';
  }

  function _windows_parseNetworkStatus(evt, onGot) {
    _windows_status_getCurrent(onGot);
  }

  var category;

  function platform_getCategory() {
    if (!!category) {
      // Do nothing - re-use cached value
    }
    else if (Windows && WinJS) {
      category = 'windows';
    }
    else {
      category = 'regular';
    }
    return category;
  }

}
