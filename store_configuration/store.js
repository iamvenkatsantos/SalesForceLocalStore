import { smartstore, mobilesync, forceUtil } from "react-native-force";
import EventEmitter from "./events";

const registerSoup = forceUtil.promiser(smartstore.registerSoup);
export const getSyncStatus = forceUtil.promiser(mobilesync.getSyncStatus);
const syncDown = forceUtil.promiserNoRejection(mobilesync.syncDown);
const syncUp = forceUtil.promiserNoRejection(mobilesync.syncUp);
const reSync = forceUtil.promiserNoRejection(mobilesync.reSync);

const syncNameRetail = "syncNameRetail";
const syncNameAssessment = "syncNameAssessment";
export let syncInFlight = false;
let lastStoreQuerySent = 0;
let lastStoreResponseReceived = 0;
const eventEmitter = new EventEmitter();

const SMARTSTORE_CHANGED = "CGCloudsmartstore";

const emitSmartStoreChanged = () => {
  eventEmitter.emit(SMARTSTORE_CHANGED, {});
};

//ITS RUN ONLY IN INITIAL TIME, USED TO GET OUR DATA FROM Assessment2 TABLE TO OUR STORAGE
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
    query: `select Id,AssessmentIndDefinitionId,ActualBooleanValue,ActualIntegerValue from RetailVisitKpi`,
  };

  const targetForAssessment = {
    type: "soql",
    query:
      "SELECT Id,Name,OwnerId,Description FROM AssessmentIndicatorDefinition",
  };

  return syncDown(
    false,
    targetForAssessment,
    "assessment",
    {
      mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
    },
    syncNameRetail
  )
    .then(() =>
      syncDown(
        false,
        targetForRetail,
        "retail",
        {
          mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
        },
        syncNameAssessment
      )
    )
    .then(() => {
      console.log("syncDown completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

//ITS USED TO VERIFY TO GET A LATEST UPDATE FROM ALREADY USED OBJECT, DON'T GET THE ALL OFF THE OBJECT FROM SERVER
const reSyncD = () => {
  if (syncInFlight) {
    console.log("Not starting reSync - sync already in fligtht");
    return Promise.resolve();
  }
  console.log("Starting reSync");
  syncInFlight = true;
  console.log(syncNameRetail);
  return reSync(false, syncNameRetail)
    .then(() => reSync(false, syncNameAssessment))
    .then(() => {
      console.log("reSync completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

export const addStoreChangeListener = (listener) => {
  eventEmitter.addListener(SMARTSTORE_CHANGED, listener);
};

export const getDataWithQueryForAssessmentFun = (
  query,
  successCallback,
  errorCallback
) => {
  let querySpec;
  querySpec = smartstore.buildSmartQuerySpec(
    `select * from {assessment} where limit 10`,
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

export const getDataWithQueryFun = (query, successCallback, errorCallback) => {
  let querySpec;
  querySpec = smartstore.buildSmartQuerySpec(
    `select * from {retail} where {retail:Id}="0Z33h000000MAiNCAW"`,
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

//ITS USED TO GET OUR AssessmentS FROM Assessment2 OBJECT IN SERVER
export const getData = (query, successCallback, errorCallback) => {
  let querySpec;
  querySpec = smartstore.buildSmartQuerySpec(
    `select count() from {assessment}`,
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
  const AssessmentField = [
    {
      value: "Id",
      type: "string",
    },
    {
      value: "Name",
      type: "string",
    },
    {
      value: "OwnerId",
      type: "string",
    },
    {
      value: "Description",
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
  var AssessmentSoup = [];
  var retailSoup = [];
  retailFeild.map(({ value, type }) => {
    retailSoup.push({
      path: value,
      type,
    });
  });
  AssessmentField.map(({ value, type }) => {
    AssessmentSoup.push({
      path: value.toString(),
      type,
    });
  });
  return registerSoup(false, "retail", retailSoup)
    .then(() => registerSoup(false, "assessment", AssessmentSoup))
    .then(syncDownFun);
};

//ITS USED TO UPDATE OUR OBJECT INTO SERVER OBJECT
const syncUpData = () => {
  if (syncInFlight) {
    console.log("Not starting syncUp - sync already in fligtht");
    return Promise.resolve();
  }

  console.log("Starting syncUp");
  syncInFlight = true;
  const retailField = [
    // "ActualStringValue",
    // "ActualBooleanValue",
    "ActualIntegerValue",
  ];
  const AssessmentField = ["Name", "Description"];

  return syncUp(false, {}, "retail", {
    mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
    fieldlist: retailField,
  })
    .then(() =>
      syncUp(false, {}, "assessment", {
        mergeMode: mobilesync.MERGE_MODE.OVERWRITE,
        fieldlist: AssessmentField,
      })
    )
    .then(() => {
      console.log("syncUp completed or failed");
      syncInFlight = false;
      emitSmartStoreChanged();
    });
};

export const syncUpToServer = () => {
  return syncUpData().then(() => {
    console.log("Sync Up completed Successfully");
    alert("Sync Up completed Successfully");
  });
};

//resyncin
export const reSyncData = () => {
  return reSyncD().then(() => {
    console.log("reSync completed Successfully");
    alert("reSync Completed Successfully");
  });
};

//save local
export const saveDataLocal = (soupName, contact, callback) => {
  smartstore.upsertSoupEntries(false, soupName, [contact], () => {
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
