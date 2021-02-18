import React, { Component } from "react";

import {
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { addContact, saveContact } from "./store_configuration/store";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
export default class AddProduct extends Component {
  constructor(props) {
    super(props);
    const length = 18;
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    this.state = {
      ExternalId: result,
      Name: "",
      Description: "",
      LastModifiedById: new Date(),
      products: "",
    };
  }

  componentDidMount() {
    addContact((prod) => this.setState({ ...this.state, products: prod }));
  }

  stateUpdate = (value, key) => {
    this.setState({ ...this.state, [key]: value });
  };

  displayDate(date) {
    if (date !== null && date !== undefined) {
      let formatDate = JSON.stringify(date).split("T");
      let newDate = formatDate[0].split('"')[1].split("-");
      return `${newDate[2]}-${newDate[1]}-${newDate[0]}`;
    } else {
      return "none";
    }
  }

  addProduct = () => {
    let object = { ...this.state.products };

    object.Name = this.state.Name;
    object.Description = this.state.Description;
    object.LastModifiedById = this.state.ExternalId;
    object.ExternalId = this.state.ExternalId;
    this.setState({ ...this.state, products: object }, () =>
      saveContact(this.state.products, this.props.navigation.pop)
    );
  };

  render() {
    return (
      <View style={style.container}>
        <View style={style.container2}>
          <TouchableOpacity onPress={this.props.navigation.goBack}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              color="white"
              size={width * 0.05}
            />
          </TouchableOpacity>
          <Text style={style.textHead}>Add Product</Text>
        </View>
        <View style={style.container1}>
          <Text style={style.text}>Name:</Text>
          <TextInput
            style={style.inputStyle}
            value={this.state.Name}
            onChangeText={(value) => this.stateUpdate(value, "Name")}
          />
        </View>
        <View style={style.container1}>
          <Text style={style.text}>Description:</Text>
          <TextInput
            style={style.inputStyle}
            value={this.state.Description}
            onChangeText={(value) => this.stateUpdate(value, "Description")}
          />
        </View>
        <View style={style.container1}>
          <Text style={style.text}>External Id:</Text>
          <TextInput
            editable={false}
            style={style.inputStyle}
            value={this.state.ExternalId}
            onChangeText={(value) => this.stateUpdate(value, "ExternalId")}
          />
        </View>
        <View style={style.container1}>
          <Text style={style.text}>Date:</Text>
          <TextInput
            editable={false}
            style={style.inputStyle}
            value={this.displayDate(this.state.LastModifiedById)}
            onChangeText={(value) =>
              this.stateUpdate(value, "LastModifiedById")
            }
          />
        </View>
        <TouchableOpacity onPress={this.addProduct} style={style.button}>
          <Text style={style.text1}>Add Product</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const { height, width } = Dimensions.get("screen");

const style = StyleSheet.create({
  container: {
    width,
    height,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  textHead: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05,
    paddingLeft: width * 0.02,
  },
  text1: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  container1: {
    marginTop: width * 0.05,
    width: width * 0.95,
    height: width * 0.22,
    paddingTop: width * 0.02,
    paddingLeft: width * 0.05,
  },
  button: {
    width: width * 0.4,
    height: width * 0.12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    marginTop: width * 0.1,
    borderRadius: 4,
  },
  text: {
    fontSize: width * 0.04,
    fontWeight: "700",
  },
  inputStyle: {
    marginTop: width * 0.01,
    paddingLeft: width * 0.02,
    width: width * 0.85,
    height: width * 0.12,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "grey",
  },
  container2: {
    width: width,
    paddingLeft: width * 0.033,
    height: width * 0.15,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "black",
    flexDirection: "row",
  },
});
