# Web Application connecting to ATP through REST Services that can operate in OffLine mode. 
This is a sample web application that demonstrates how to develop and leverage Oracle Offline persistence toolikt in order to implement a Web/Mobile Application that can work in an offline mode, and when it will be connected back to a network, sychronize the data with the back office REST endpoint. 

# Oracle Offline Persistence Toolkit
The Oracle Offline Persistence Toolkit is a client-side JavaScript library that helps to provide offline support for your application.
It enables caching for offline support at the HTTP request layer. This support is transparent to the user and is done through the Fetch API and an XHR adapter. HTTP requests made while the client or client device is offline are captured for replay when connection to the server is restored. Additional capabilities include a persistent storage layer, synchronization manager, binary data support, and various configuration APIs for customizing the default behavior. This toolkit can be used in both ServiceWorker and non-ServiceWorker contexts within web apps.

<img width="450" alt="Screenshot 2024-03-28 at 10 34 28" src="https://github.com/johnkarasoulos/inlineOfflineVisualBuilderRESTAUTONOMOUS/assets/25766024/e01188da-9739-4709-a52d-3d1e46161fcb">

Using the toolkit, you can configure your application to:
Download content for offline reading where connectivity isn’t available. For example, an application could include product inventory data that a salesperson could download and read at customer sites where connectivity isn’t available.
Cache content for improved performance.
Perform transactions on the downloaded content where connectivity isn’t available and upload the transactions when connectivity returns. For example, the salesperson could visit a site with no Internet access and enter an order for some number of product items. When connectivity returns, the application can automatically send the transaction to the server.
Provide conflict resolution when the offline data can’t merge with the server. If the salesperson’s request exceeds the amount of available inventory, the application can configure a message asking the salesperson to cancel the order or place the item on back order.

Oracle maintains the persistence toolkit as an open-source project
Github:  https://github.com/oracle/offline-persistence-toolkit 

API documentation : https://oracle.github.io/offline-persistence-toolkit/index.html 


## Application preparation
### Create database table EMP  
```
CREATE TABLE ADMIN.EMP 
    ( 
     EMPNO    NUMBER (4) , 
     ENAME    VARCHAR2 (10) , 
     JOB      VARCHAR2 (9) , 
     MGR      NUMBER (4) , 
     HIREDATE DATE , 
     SAL      NUMBER (7,2) , 
     COMM     NUMBER (7,2) , 
     DEPTNO   NUMBER (2) 
    ) 
    TABLESPACE DATA 
    LOGGING 
;


CREATE UNIQUE INDEX ADMIN.PK_EMP ON ADMIN.EMP 
    ( 
     EMPNO ASC 
    ) 
    TABLESPACE DATA 
    LOGGING 
;

ALTER TABLE ADMIN.EMP 
    ADD CONSTRAINT PK_EMP PRIMARY KEY ( EMPNO ) 
    USING INDEX ADMIN.PK_EMP ;

ALTER TABLE ADMIN.EMP 
    ADD CONSTRAINT FK_DEPTNO FOREIGN KEY 
    ( 
     DEPTNO
    ) 
    REFERENCES ADMIN.DEPT ( DEPTNO ) 
    NOT DEFERRABLE 
;
```

Once the table is created then you can enable the REST services for the table tables (with no authentication for this example). 

## From github repository to Oracle VisualBuilder application. 
If you wish to deploy the sample source code into your own Visual Builder Platform, you can apply the following steps.
1. Connect to your Oracle Visual Builder Studio Instance
2. Into an existing Project OR Create a new project --> create a new git repository by importing the existing public GitHub repository.
   ![Screenshot 2024-03-25 at 12 33 33](https://github.com/johnkarasoulos/aircraftBlockchain/assets/25766024/235cf9ae-c01f-449a-8764-96fdda1e543b)

3. Create a new Workspace using the button "Clone From Git" where you are selecting the Repository Name, the Branch , the Development Environment and you are providing the name of the Workspace Name.

   <img width="450" alt="Screenshot 2024-03-28 at 10 24 24" src="https://github.com/johnkarasoulos/inlineOfflineVisualBuilderRESTAUTONOMOUS/assets/25766024/21ab8344-5a39-4c07-8b46-60e94ad97a9f">

5. You are redirected to the new VisualBuilder instance assigned to this workspace and you can start working.  


## Configure REST Endpoints
Once the table is created, REST service enable for the table and the application is cloned into your own workspace, update the backend server with the ORDS URL as depicted in the following picture: 

<img width="450" alt="Screenshot 2024-03-28 at 10 27 13" src="https://github.com/johnkarasoulos/inlineOfflineVisualBuilderRESTAUTONOMOUS/assets/25766024/ffaa4a27-01ea-4f85-9417-d1f8a877926b">


## Build Web/Mobile Application accessing the previous created database through ORDS. 
This sample source code, will enable to build a Web/mobile application that list the data from the REST Service, and also and a "Create" functionality that allows to insert a new record into the database table. 

<img width="450" alt="Screenshot 2024-03-28 at 10 49 35" src="https://github.com/johnkarasoulos/inlineOfflineVisualBuilderRESTAUTONOMOUS/assets/25766024/23cd1a43-3a4c-4772-bf54-1e95cd8c73d6">

## Web Application Caching strategy configuration
The chaching strategy needs to be defined in a root level of the application.
In the index.html page import the Offline persistence toolkit libaries, and then create a javascript function that will manage and define the caching strategy of the application. 
### Import libraries / toolkit classes 
Add the following entries to include the toolkit classes that you'll use. More information about these classes can be found in the toolkit's API doc (https://oracle.github.io/offline-persistence-toolkit/index.html). 
```
    'persist/persistenceManager',
    'persist/defaultResponseProxy',
    'persist/persistenceUtils',
    'persist/fetchStrategies',
```
### The OffLine handler function may have the following flow: 
```
  function(ServiceWorkerHelpers, PersistenceManager, DefaultResponseProxy, PersistenceUtils, FetchStrategies, Logger) {
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
         * fetchStrategies: Contains out of the box Fetch Strategies which includes Cache First and Cache If Offline fetch strategies.
         * The Cache First strategy always fetches from the local cache first regardless of offline status and returns the cached response.
         * In addition, when online, a fetch is also made out to the server and the serverResponseCallback (if supplied) is called with the server response.
         * The Cache If Offline strategy will fetch from the server when online and will fetch from the cache if offline.
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
       *  Write output from the OfflineHandler to your browser's console. Useful to help 
       * you understand  the code that follows.
       */
      console.log('OfflineHandler.handleRequest() url = ' + request.url +
        ' cache = ' + request.cache +
        ' mode = ' + request.mode);

      /**
       * Cache requests where the URL matches the scope for which you want data cached.
       */
      if (request.url.match(
          'https://xxxxxxxxxx.adb.xxxxxxxx.oraclecloudapps.com/ords/admin/emp/'
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
  })
```
