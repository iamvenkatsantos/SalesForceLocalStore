import { smartstore, mobilesync, forceUtil } from "react-native-force";
import EventEmitter from "./events";

const registerSoup = forceUtil.promiser(smartstore.registerSoup);
export const getSyncStatus = forceUtil.promiser(mobilesync.getSyncStatus);
const syncDown = forceUtil.promiserNoRejection(mobilesync.syncDown);
const syncUp = forceUtil.promiserNoRejection(mobilesync.syncUp);
const reSync = forceUtil.promiserNoRejection(mobilesync.reSync);

const syncNameRetail = "syncNameRetail";
const syncNameProduct = "syncNameProduct";
export let syncInFlight = false;
let lastStoreQuerySent = 0;
let lastStoreResponseReceived = 0;
const eventEmitter = new EventEmitter();

const SMARTSTORE_CHANGED = "CGCloudsmartstore";

const emitSmartStoreChanged = () => {
  eventEmitter.emit(SMARTSTORE_CHANGED, {});
};

//ITS RUN ONLY IN INITIAL TIME, USED TO GET OUR DATA FROM PRODUCT2 TABLE TO OUR STORAGE
const syncDownFun = () => {
  if (syncInFlight) {
    console.log("Not starting syncDown - sync already in fligtht");
    return Promise.resolve();
  }
  console.log("Starting syncDown");
  syncInFlight = true;

  //AssessmentInd\icatorDefinition
  const targetForRetail = {
    type: "soql",
    query: `select Id,ActualStringValue,ActualBooleanValue,ActualIntegerValue from RetailVisitKpi`,
  };

  const targetForProduct = {
    type: "soql",
    query: "SELECT Id,Name,IsActive,Description,ExternalId FROM Product2",
  };

  return syncDown(
    false,
    targetForRetail,
    "retail",
    {
      mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
    },
    syncNameRetail
  )
    .then(() =>
      syncDown(
        false,
        targetForProduct,
        "product",
        {
          mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
        },
        syncNameProduct
      )
    )
    .then(() => {
      console.log("syncDown completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

//ITS USED TO VERIFY TO GET A LATEST UPDATE FROM ALREADY USED OBJECT, DON'T GET THE ALL OFF THE OBJECT FROM SERVER
const reSyncContacts = () => {
  if (syncInFlight) {
    console.log("Not starting reSync - sync already in fligtht");
    return Promise.resolve();
  }
  console.log("Starting reSync");
  syncInFlight = true;
  console.log(syncNameRetail);
  return reSync(false, syncNameRetail)
    .then(() => reSync(false, syncNameProduct))
    .then(() => {
      console.log("reSync completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

export const addStoreChangeListener = (listener) => {
  eventEmitter.addListener(SMARTSTORE_CHANGED, listener);
};

export const getDataWithQueryFun = (query, successCallback, errorCallback) => {
  let querySpec;

  //select {retail:Id} || ' '|| {product:Name} from {product}, {retail} where {product.Id}={retail.ProductId} limit 20 {retail:Id},{product:Name},{product:Description},{retail:ActualStringValue},{retail:ActualIntegerValue}     where {retail:Id}="0Z33h000000MAGVCA4"
  querySpec = smartstore.buildSmartQuerySpec(
    `select * from {retail} where {retail:Id}="0Z33h000000MAGVCA4"`,
    1
  );

  lastStoreQuerySent++;
  const currentStoreQuery = lastStoreQuerySent;
  const querySuccessCB = (contacts) => {
    successCallback(contacts, currentStoreQuery);
  };

  const queryErrorCB = (error) => {
    console.log(`Error->${JSON.stringify(error)}`);
    errorCallback(error);
  };

  smartstore.runSmartQuery(
    false,
    querySpec,
    (cursor) => {
      if (currentStoreQuery > lastStoreResponseReceived) {
        lastStoreResponseReceived = currentStoreQuery;
        traverseCursor([], cursor, 0, querySuccessCB, queryErrorCB);
      } else {
      }
    },
    queryErrorCB
  );
};

//ITS USED TO GET OUR PRODUCTS FROM PRODUCT2 OBJECT IN SERVER
export const getData = (query, successCallback, errorCallback) => {
  let querySpec;
  //select {retail:Id} || ' '|| {product:Name} from {product}, {retail} where {product.Id}={retail.ProductId} limit 20 {retail:Id},{product:Name},{product:Description},{retail:ActualStringValue},{retail:ActualIntegerValue}     where {retail:Id}="0Z33h000000MAGVCA4"
  querySpec = smartstore.buildSmartQuerySpec(`select count() from {retail}`, 1);
  lastStoreQuerySent++;
  const currentStoreQuery = lastStoreQuerySent;
  const querySuccessCB = (contacts) => {
    successCallback(contacts, currentStoreQuery);
  };
  const queryErrorCB = (error) => {
    console.log(`Error->${JSON.stringify(error)}`);
    errorCallback(error);
  };
  smartstore.runSmartQuery(
    false,
    querySpec,
    (cursor) => {
      if (currentStoreQuery > lastStoreResponseReceived) {
        lastStoreResponseReceived = currentStoreQuery;
        traverseCursor([], cursor, 0, querySuccessCB, queryErrorCB);
      } else {
      }
    },
    queryErrorCB
  );
};

//ITS USED FOR HANDLE THE CURSOR
const traverseCursor = (
  accumulatedResults,
  cursor,
  pageIndex,
  successCallback,
  errorCallback
) => {
  accumulatedResults = accumulatedResults.concat(
    cursor.currentPageOrderedEntries
  );
  if (pageIndex < cursor.totalPages - 1) {
    smartstore.moveCursorToPageIndex(
      false,
      cursor,
      pageIndex + 1,
      (cursor) => {
        traverseCursor(
          accumulatedResults,
          cursor,
          pageIndex + 1,
          successCallback,
          errorCallback
        );
      },
      errorCallback
    );
  } else {
    successCallback(accumulatedResults);
  }
};

//FIRST TIME WE HAVE TO CREATE
const firstTimeSyncData = () => {
  const productField = [
    {
      value: "Id",
      type: "string",
    },
    {
      value: "Name",
      type: "string",
    },
    {
      value: "IsActive",
      type: "string",
    },
    {
      value: "Description",
      type: "string",
    },
    {
      value: "ExternalId",
      type: "string",
    },
    { value: "__local__", type: "string" },
  ];
  const retailFeild = [
    {
      value: "Id",
      type: "string",
    },
    {
      value: "ActualStringValue",
      type: "string",
    },
    {
      value: "ActualBooleanValue",
      type: "string",
    },
    {
      value: "ActualIntegerValue",
      type: "string",
    },
    { value: "__local__", type: "string" },
  ];
  var productSoup = [];
  var retailSoup = [];
  retailFeild.map(({ value, type }) => {
    retailSoup.push({
      path: value,
      type,
    });
  });
  productField.map(({ value, type }) => {
    productSoup.push({
      path: value.toString(),
      type,
    });
  });
  return registerSoup(false, "retail", retailSoup)
    .then(() => registerSoup(false, "product", productSoup))
    .then(syncDownFun);
};

//ITS USED TO UPDATE OUR OBJECT INTO SERVER OBJECT
const syncUpProducts = () => {
  if (syncInFlight) {
    console.log("Not starting syncUp - sync already in fligtht");
    return Promise.resolve();
  }

  console.log("Starting syncUp");
  syncInFlight = true;
  const retailField = [
    "ActualStringValue",
    "ActualBooleanValue",
    "ActualIntegerValue",
  ];
  const productField = ["Name", "IsActive", "Description", "ExternalId]"];

  return syncUp(false, {}, "retail", {
    mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
    fieldlist: retailField,
  })
    .then(() =>
      syncUp(false, {}, "product", {
        mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
        fieldlist: productField,
      })
    )
    .then(() => {
      console.log("syncUp completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

//resyncin
export const reSyncData = () => {
  return syncUpProducts()
    .then(reSyncContacts)
    .then(() => alert("Sync Completed Successfully"));
};

//save local
export const saveDataLocal = (contact, callback) => {
  smartstore.upsertSoupEntries(false, "retail", [contact], () => {
    callback();
    emitSmartStoreChanged();
  });
};

//syncing a data

export const syncData = () => {
  console.log("INTIAL SETUP");
  return getSyncStatus(false, syncNameRetail).then((sync) => {
    console.log("SYNC ADSALDSLDHLSHDSADSA++++++++++++++++++++", sync);
    if (sync == null) {
      return firstTimeSyncData();
    } else {
      return reSyncData();
    }
  });
};
