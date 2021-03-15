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
  syncUpToServer,
  getDataWithQueryForProductFun,
} from "./store_configuration/store";

import {
  faAddressCard,
  faDownload,
  faFileExport,
  faPlus,
  faSync,
  faUpload,
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
      productData: [],
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
          console.log("PRODUCT DATA COUNT", data[0]);
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
        console.log("QUERY DATA FOR RETAIL ", data[0]);
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

  getDataWithQueryForProduct = () => {
    this.setState({ ...this.state, isLoading: true });
    getDataWithQueryForProductFun(
      "",
      (data, currentStoreQuery) => {
        console.log("QUERY DATA FOR PRODUCT", data[0]);
        var array = [];
        data.map((value) => {
          array.push({
            index: value[0],
            product: value[1],
          });
        });
        this.setState({
          productData: array,
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
      Id: "0Z33h000000MAiNCAW",
      ActualStringValue: "TRYING",
      //  ActualBooleanValue: true,
      ActualIntegerValue: 0,
      LastModifiedDate: `${new Date().toISOString()}`,
      attributes: { type: "RetailVisitKpi" },
      __locally_created__: this.state?.data[0]?.retailVisitKpi
        .__locally_created__,
      __locally_updated__: !this.state?.data[0]?.retailVisitKpi
        .__locally_updated__,
      __locally_deleted__: this.state?.data[0]?.retailVisitKpi
        .__locally_deleted__,
      __local__: this.state?.data[0]?.retailVisitKpi.__local__,
      _soupEntryId: this.state?.data[0]?.index,
    };
    this.setState({ ...this.state, visitKpi: updatedObject }, () => {
      console.log("UPDATED VALUE FOR RETAIL", updatedObject);
      saveDataLocal("retail", updatedObject, () =>
        alert("Element Added in RetailVisitKpi")
      );
    });
  };

  saveProductObject = () => {
    const updatedObject = {
      Id: "01t3h000002jtuNAAQ",
      Name: "New Name",
      Description: "Try to split a step by step process",
      LastModifiedDate: `${new Date().toISOString()}`,
      attributes: { type: "Product2" },
      __locally_created__: this.state?.productData[0]?.product
        .__locally_created__,
      __locally_updated__: !this.state?.productData[0]?.product
        .__locally_updated__,
      __locally_deleted__: this.state?.productData[0]?.product
        .__locally_deleted__,
      __local__: this.state?.productData[0]?.product.__local__,
      _soupEntryId: this.state?.productData[0]?.index,
    };
    this.setState({ ...this.state, visitKpi: updatedObject }, () => {
      console.log("UPDATED VALUE FOR PRODUCT", updatedObject);
      saveDataLocal("product", updatedObject, () =>
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
          </View>
          <View style={styles.flatView}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={this.fetchData}
              activeOpacity={0.8}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faDownload}
                  color="black"
                  size={width * 0.05}
                />
                {` Download`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.getDataWithQuery}
              activeOpacity={0.8}
              style={styles.syncButton}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faFileExport}
                  color="black"
                  size={width * 0.05}
                />
                {` Query Retail`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.saveVisitKpi}
              activeOpacity={0.8}
              style={styles.syncButton}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faPlus}
                  color="black"
                  size={width * 0.05}
                />
                {` Update Retail`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.getDataWithQueryForProduct}
              activeOpacity={0.8}
              style={styles.syncButton}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faFileExport}
                  color="black"
                  size={width * 0.05}
                />
                {` Query Product`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.saveProductObject}
              activeOpacity={0.8}
              style={styles.syncButton}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faPlus}
                  color="black"
                  size={width * 0.05}
                />
                {` Update Product`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncUpToServer}
              activeOpacity={0.8}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faUpload}
                  color="black"
                  size={width * 0.05}
                />
                {` Sync Up`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.syncButton}
              onPress={reSyncData}
              activeOpacity={0.8}
            >
              <Text style={{ ...styles.text, color: "black" }}>
                <FontAwesomeIcon
                  icon={faSync}
                  color="black"
                  size={width * 0.05}
                />
                {` Resync`}
              </Text>
            </TouchableOpacity>
          </View>
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
    width: width * 0.5,
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
    justifyContent: "space-around",
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
