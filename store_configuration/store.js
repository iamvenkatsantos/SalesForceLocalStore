import { smartstore, mobilesync, forceUtil } from "react-native-force";
import EventEmitter from "./events";

const registerSoup = forceUtil.promiser(smartstore.registerSoup);
const getSyncStatus = forceUtil.promiser(mobilesync.getSyncStatus);
const syncDown = forceUtil.promiserNoRejection(mobilesync.syncDown);
const syncUp = forceUtil.promiserNoRejection(mobilesync.syncUp);
const reSync = forceUtil.promiserNoRejection(mobilesync.reSync);

const syncName = "mobileSyncExplorerSyncDown";
let syncInFlight = false;
let lastStoreQuerySent = 0;
let lastStoreResponseReceived = 0;
const eventEmitter = new EventEmitter();

const SMARTSTORE_CHANGED = "smartstoreChanged";

const emitSmartStoreChanged = () => {
  eventEmitter.emit(SMARTSTORE_CHANGED, {});
};

//ITS RUN ONLY IN INITIAL TIME, USED TO GET OUR DATA FROM PRODUCT2 TABLE TO OUR STORAGE
const syncDownProducts = () => {
  if (syncInFlight) {
    console.log("Not starting syncDown - sync already in fligtht");
    return Promise.resolve();
  }
  console.log("Starting syncDown");
  syncInFlight = true;
  const fieldlist = [
    "Id",
    "Name",
    "Description",
    "ExternalId",
    "LastModifiedDate",
  ];
  const target = {
    type: "soql",
    query: `SELECT ${fieldlist.join(",")} FROM Product2 LIMIT 10000 `,
  };
  return syncDown(
    false,
    target,
    "Product2",
    { mergeMode: mobilesync.MERGE_MODE.OVERWRITE },
    syncName
  ).then(() => {
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
  console.log(syncName);
  return reSync(false, syncName).then(() => {
    console.log("reSync completed or failed");
    syncInFlight = false;
    emitSmartStoreChanged();
  });
};

export const addStoreChangeListener = (listener) => {
  eventEmitter.addListener(SMARTSTORE_CHANGED, listener);
};

//ITS USED TO GET OUR PRODUCTS FROM PRODUCT2 OBJECT IN SERVER
export const getProducts = (query, successCallback, errorCallback) => {
  let querySpec;
  querySpec = smartstore.buildAllQuerySpec("Name", "ascending", 2);

  // query = "Venkat";
  // querySpec = smartstore.buildMatchQuerySpec(
  //   null,
  //   `{Product2:Name}:${query}*`,
  //   "ascending",
  //   100,
  //   "Name"
  // );

  //ITS USED FOR SEARCHING PURPOSE
  //   if (query === "") {
  //   } else {
  //     const queryParts = query.split(/ /);
  //     const queryFirst = queryParts.length == 2 ? queryParts[0] : query;
  //     const queryLast = queryParts.length == 2 ? queryParts[1] : query;
  //     const queryOp = queryParts.length == 2 ? "AND" : "OR";
  //     const match = `{contacts:FirstName}:${queryFirst}* ${queryOp} {contacts:LastName}:${queryLast}*`;
  //     querySpec = smartstore.buildMatchQuerySpec(
  //       null,
  //       match,
  //       "ascending",
  //       100,
  //       "LastName"
  //     );
  //   }
  //   const that = this;
  lastStoreQuerySent++;
  const currentStoreQuery = lastStoreQuerySent;

  const querySuccessCB = (contacts) => {
    successCallback(contacts, currentStoreQuery);
  };

  const queryErrorCB = (error) => {
    console.log(`Error->${JSON.stringify(error)}`);
    errorCallback(error);
  };

  smartstore.querySoup(
    false,
    "Product2",
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
  return registerSoup(false, "Product2", [
    { path: "Id", type: "string" },
    { path: "Name", type: "full_text" },
    { path: "Description", type: "full_text" },
    { path: "ExternalId", type: "full_text" },
    { path: "LastModifiedDate", type: "string" },
    { path: "__local__", type: "string" },
  ]).then(syncDownProducts);
};
//ITS USED TO UPDATE OUR OBJECT INTO SERVER OBJECT
const syncUpProducts = () => {
  if (syncInFlight) {
    console.log("Not starting syncUp - sync already in fligtht");
    return Promise.resolve();
  }

  console.log("Starting syncUp");
  syncInFlight = true;
  const fieldlist = ["Name", "Description", "ExternalId"];
  return syncUp(false, {}, "Product2", {
    mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
    fieldlist,
  }).then(() => {
    console.log("syncUp completed or failed");
    syncInFlight = false;
    emitSmartStoreChanged();
  });
};

//resyncin
export const reSyncData = () => {
  return syncUpProducts().then(reSyncContacts);
};

export const addContact = (successCallback, errorCallback) => {
  const contact = {
    Id: `local_${new Date().getTime()}`,
    Name: null,
    Description: null,
    ExternalId: null,
    LastModifiedDate: `${new Date().toISOString()}`,
    attributes: { type: "Product2" },
    __locally_created__: true,
    __locally_updated__: false,
    __locally_deleted__: false,
    __local__: true,
  };
  smartstore.upsertSoupEntries(
    false,
    "Product2",
    [contact],
    (contacts) => successCallback(contacts[0]),
    errorCallback
  );
};

//save local
export const saveContact = (contact, callback) => {
  smartstore.upsertSoupEntries(false, "Product2", [contact], () => {
    callback();
    emitSmartStoreChanged();
  });
};

//syncing a data

export const syncData = () => {
  console.log("INTIAL SETUP");
  return getSyncStatus(false, syncName).then((sync) => {
    console.log("SYNC ADSALDSLDHLSHDSADSA++++++++++++++++++++", sync);
    if (sync == null) {
      return firstTimeSyncData();
    } else {
      return reSyncData();
    }
  });
};
