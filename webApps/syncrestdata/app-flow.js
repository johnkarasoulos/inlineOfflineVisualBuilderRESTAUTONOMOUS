define([
    'vbsw/helpers/serviceWorkerHelpers',
    /**
     * Add the following entries to include the toolkit classes that you'll use. More information about these
     * classes can be found in the toolkit's API doc. See the link to the API doc in the paragraph before 
     * this sample file.
     * 
     */
    'persist/persistenceManager',
    'persist/defaultResponseProxy',
    'persist/persistenceUtils',
    'persist/fetchStrategies',
    /**
     * Add the following entry to enable console logging while you develop your app with the toolkit.
     */
    'persist/impl/logger'
  ],
  function(ServiceWorkerHelpers, PersistenceManager, DefaultResponseProxy,
    PersistenceUtils, FetchStrategies, Logger) {
    'use strict';

    function AppModule() {}

    function OfflineHandler() {
      /**
       * Enable console logging of the toolkit for development testing
       */
      Logger.option('level', Logger.LEVEL_LOG);
      Logger.option('writer', console);

      var options = {
        /**
         * The following code snippets implements the toolkit's CacheFirstStrategy. This strategy 
         * checks the application's cache for the requested data before it makes a request to cache 
         * data. The code snippet also disables the background fetch of data.
         */
        requestHandlerOverride: {
          handlePost: handlePost
        },
        fetchStrategy: FetchStrategies.getCacheIfOfflineStrategy({
          backgroundFetch: 'disabled'
        })
      };
      this._responseProxy = DefaultResponseProxy.getResponseProxy(options);
    }

    OfflineHandler.prototype.handleRequest = function(request, scope) {
      /**
       * (Optional). Write output from the OfflineHandler to your browser's console. Useful to help 
       * you understand  the code that follows.
       */
      console.log('OfflineHandler.handleRequest() url = ' + request.url +
        ' cache = ' + request.cache +
        ' mode = ' + request.mode);

      /**
       * Cache requests where the URL matches the scope for which you want data cached.
       */
      if (request.url.match(
          'https://g9051959400a6d8-sandbox.adb.eu-frankfurt-1.oraclecloudapps.com/ords/admin/emp/'
        )) {

        return this._responseProxy.processRequest(request);
      }
      return PersistenceManager.browserFetch(request);
    };

    OfflineHandler.prototype.beforeSyncRequestListener = function(event) {
      return Promise.resolve();
    };
    OfflineHandler.prototype.afterSyncRequestListener = function(event) {
      return Promise.resolve();
    };
    AppModule.prototype.createOfflineHandler = function() {
      /** Create the OfflineHandler that makes the toolkit cache data URLs */
      return Promise.resolve(new OfflineHandler());
    };
    AppModule.prototype.isOnline = function() {
      return ServiceWorkerHelpers.isOnline();
    };
    AppModule.prototype.forceOffline = function(flag) {
      return ServiceWorkerHelpers.forceOffline(flag).then(function() {
        /** if online, perform a data sync */
        if (!flag) {
          return ServiceWorkerHelpers.syncOfflineData();
        }
        return Promise.resolve();

      }).catch(function(error) {
        console.error(error);
      });
    };
      AppModule.prototype.dataSynch = function() {
        return ServiceWorkerHelpers.syncOfflineData();
      };

    // custom implementation to handle the POST request
    var handlePost = function(request) {
      
      if (PersistenceManager.isOnline()) {return PersistenceManager.browserFetch(request);}

      return PersistenceUtils.requestToJSON(request).then(function(
        requestData) {
        console.log('Inside PersistenceUtils');
        console.log(requestData);
        requestData.status = 202;
        requestData.statusText = 'OK';
        requestData.headers['content-type'] = 'application/json';
        requestData.headers['x-oracle-jscpt-cache-expiration-date'] =
          '';

        // if the request contains an ETag then we have to generate a new one
        var ifMatch = requestData.headers['if-match'];
        var ifNoneMatch = requestData.headers['if-none-match'];

        if (ifMatch || ifNoneMatch) {
          var randomInt = Math.floor(Math.random() * 1000000);
          requestData.headers['etag'] = (Date.now() + randomInt).toString();
          requestData.headers['x-oracle-jscpt-etag-generated'] =
            requestData.headers['etag'];
          delete requestData.headers['if-match'];
          delete requestData.headers['if-none-match'];
        }
        return PersistenceUtils.responseFromJSON(requestData);
      });
    };


    return AppModule;
  });