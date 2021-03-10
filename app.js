import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import { createStackNavigator } from "@react-navigation/stack";

import { NavigationContainer } from "@react-navigation/native";
import { oauth, net } from "react-native-force";
import {
  syncData,
  reSyncData,
  addStoreChangeListener,
  getData,
  getSyncStatus,
  saveDataLocal,
  getDataWithQueryFun,
} from "./store_configuration/store";

import {
  faAddressCard,
  faDownload,
  faFileExport,
  faPlus,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import AddProduct from "./AddProduct";
class ContactListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      queryNumber: 0,
      isLoading: false,
      syncStatus: null,
      progress: 0,
      visitKpi: null,
    };
  }

  timerId = "";
  componentDidMount() {
    var that = this;
    oauth.getAuthCredentials(
      () => console.log("Welcome"), // already logged in
      () => {
        oauth.authenticate(
          () => that.fetchData(),
          (error) => console.log("Failed to authenticate:" + error)
        );
      }
    );
  }

  fetchData = () => {
    console.log(this.state);
    if (this.state.data?.length === 0) {
      syncData();
      addStoreChangeListener(this.refresh);
      this.getStatus;
      this.timerId = setInterval(this.getStatus, 2500);
      this.setState({
        ...this.state,
        isLoading: true,
      });
    }
  };

  refresh = () => {
    getData(
      "",
      (data, currentStoreQuery) => {
        data.map((value) => {
          console.log("DATA COUNT", data[0]);
          clearInterval(this.timerId);
          this.setState({
            ...this.state,
            isLoading: false,
          });
        });
      },
      (error) => {
        console.log(error);
      }
    );
  };

  getDataWithQuery = () => {
    this.setState({ ...this.state, isLoading: true });
    getDataWithQueryFun(
      "",
      (data, currentStoreQuery) => {
        console.log("ACTUAL DATA ", data[0]);
        var array = [];
        data.map((value) => {
          array.push({
            index: value[0],
            retailVisitKpi: value[1],
          });
        });
        this.setState({
          data: array,
          queryNumber: currentStoreQuery,
          isLoading: false,
        });
      },
      (error) => {
        console.log(error);
      }
    );
  };

  displayDate(date) {
    if (date !== null && date !== undefined) {
      let formatDate = date.toString().split("T");
      let ISTdate = new Date(`${formatDate[0]}`);
      return `Modified by ${ISTdate.toString().slice(4, 16)}`;
    } else {
      return "Invalid Date";
    }
  }

  getStatus = () => {
    getSyncStatus(false, "syncNameRetail").then((sync) => {
      this.setState({ ...this.state, progress: sync.progress });
    });
  };

  saveVisitKpi = () => {
    const updatedObject = {
      Id: "0Z33h000000MAGVCA4",
      ActualStringValue: "Venkat",
      ActualBooleanValue: true,
      ActualIntegerValue: 619,
      LastModifiedDate: `${new Date().toISOString()}`,
      attributes: { type: "RetailVisitKpi" },
      __locally_created__: false,
      __locally_updated__: true,
      __locally_deleted__: false,
      __local__: true,
      _soupEntryId: this.state?.data[0]?.index,
    };
    this.setState({ ...this.state, visitKpi: updatedObject }, () => {
      console.log("UPDATED VALUE", updatedObject);
      saveDataLocal(updatedObject, () =>
        alert("Element Added in RetailVisitKpi")
      );
    });
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.containerLoad}>
          <ActivityIndicator color="blue" size="large" />
          <Text>{this.state.progress}%</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <View style={styles.container2}>
            <Text style={styles.textHead}>Local Store</Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={styles.syncButton}
                onPress={this.fetchData}
                activeOpacity={0.8}
              >
                <Text style={{ ...styles.text, color: "white" }}>
                  <FontAwesomeIcon
                    icon={faDownload}
                    color="white"
                    size={width * 0.05}
                  />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={this.getDataWithQuery}
                activeOpacity={0.8}
                style={styles.syncButton}
              >
                <Text style={{ ...styles.text, color: "white" }}>
                  <FontAwesomeIcon
                    icon={faFileExport}
                    color="white"
                    size={width * 0.05}
                  />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={this.saveVisitKpi}
                activeOpacity={0.8}
                style={styles.syncButton}
              >
                <Text style={{ ...styles.text, color: "white" }}>
                  <FontAwesomeIcon
                    icon={faPlus}
                    color="white"
                    size={width * 0.05}
                  />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.syncButton}
                onPress={reSyncData}
                activeOpacity={0.8}
              >
                <Text style={{ ...styles.text, color: "white" }}>
                  <FontAwesomeIcon
                    icon={faSync}
                    color="white"
                    size={width * 0.05}
                  />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.flatView} />
        </View>
      );
    }
  }
}

const { height, width } = Dimensions.get("screen");

const styles = StyleSheet.create({
  textHead: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05,
  },
  text: {
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  text1: {
    fontSize: width * 0.04,
    marginLeft: width * 0.03,
  },
  text3: {
    fontSize: width * 0.04,
    marginLeft: width * 0.08,
  },
  text2: {
    fontSize: width * 0.03,
    alignSelf: "flex-end",
    marginRight: width * 0.02,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
  },
  containerLoad: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  container2: {
    width: width,
    paddingLeft: width * 0.033,
    paddingRight: width * 0.033,
    height: width * 0.15,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "black",
  },
  syncButton: {
    width: width * 0.1,
    height: width * 0.1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginRight: width * 0.02,
  },
  flatView: {
    width: width * 0.95,
    height: width * 1.83,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: width * 0.05,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  faltViewCard: {
    paddingTop: width * 0.03,
    paddingLeft: width * 0.04,
    width: width * 0.95,
    height: width * 0.3,
    marginBottom: width * 0.02,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "black",
  },
  container1: {
    width: width * 0.9,
    height: width * 0.1,
    flexDirection: "row",
  },
});

export const Localapp = ContactListScreen;

const Stack = createStackNavigator();

export default function SafecommsStackNav() {
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none" initialRouteName="intro">
        <Stack.Screen name="intro" component={ContactListScreen} />
        <Stack.Screen name="add_product" component={AddProduct} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
