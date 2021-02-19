import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import { createStackNavigator } from "@react-navigation/stack";

import { NavigationContainer } from "@react-navigation/native";
import { oauth, net } from "react-native-force";
import {
  syncData,
  reSyncData,
  addStoreChangeListener,
  getProducts,
} from "./store_configuration/store";

import { faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import AddProduct from "./AddProduct";
class ContactListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], queryNumber: 0 };
  }

  componentDidMount() {
    var that = this;
    oauth.getAuthCredentials(
      () => that.fetchData(), // already logged in
      () => {
        oauth.authenticate(
          () => that.fetchData(),
          (error) => console.log("Failed to authenticate:" + error)
        );
      }
    );
  }

  fetchData() {
    syncData();
    addStoreChangeListener(this.refresh);
  }

  refresh = () => {
    getProducts(
      "",
      (products, currentStoreQuery) => {
        this.setState({
          data: products,
          queryNumber: currentStoreQuery,
        });
        // net.query(
        //   `Select Id, Name FROM Product2 WHERE Product2.Name="TestProduct" LIMIT 2`,
        //   (response) => {
        //     console.log("-------------", response.records);
        //   }
        // );
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

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.container2}>
          <Text style={styles.textHead}>Local Store</Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => reSyncData()}
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
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate("add_product")}
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
          </View>
        </View>
        {/* {console.log(
          this.state.data[this.state.data.length - 3],
          "----------------------",
          this.state.data[this.state.data.length - 1]
        )} */}
        <View style={styles.flatView}>
          <FlatList
            data={this.state.data}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.faltViewCard}>
                <View style={styles.container1}>
                  <Text style={styles.text}>Product Name:</Text>
                  <Text style={styles.text1}>{item.Name}</Text>
                </View>
                <View style={styles.container1}>
                  <Text style={styles.text}>Description:</Text>
                  <Text style={styles.text3}>
                    {item.Description || "Description yet to be added"}
                  </Text>
                </View>
                <Text style={styles.text2}>
                  {this.displayDate(item.LastModifiedDate)}
                </Text>
              </View>
            )}
            keyExtractor={(item, index) => "key_" + index}
          />
        </View>
      </View>
    );
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
