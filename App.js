import React, { useState, useEffect, useRef } from "react";
import {
  Platform,
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  Modal
} from "react-native";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Constants from "expo-constants";
import facade from "./serverFacade";
import NearbyModal from "./components/NearbyPlayersModal";

const SERVER_URL = "https://geojson.laurberg.codes";

const MyButton = ({ txt, onPressButton }) => {
  return (
    <TouchableHighlight style={styles.touchable} onPress={onPressButton}>
      <Text style={styles.touchableTxt}>{txt}</Text>
    </TouchableHighlight>
  );
};

export default App = () => {
  //HOOKS
  const [position, setPosition] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [gameArea, setGameArea] = useState([]);
  const [region, setRegion] = useState(null);
  const [serverIsUp, setServerIsUp] = useState(false);
  const [isLoggedIn, setisLoggedIn] = useState(false);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [teamPositions, setTeamPositions] = useState([]);
  const [marker, setMarker] = useState(undefined);
  let mapRef = useRef(null);

  function teamPositionHandler(teamPositions) {
    setTeamPositions(teamPositions);
  }

  useEffect(() => {
    getGameArea();
    getLocationAsync();
  }, []);

  async function getGameArea() {
    try {
      const area = await facade.fetchGameArea();
      setGameArea(area);
      setServerIsUp(true);
    } catch (err) {
      console.log(err);
      setErrorMessage("Could not fetch GameArea");
    }
  }
  //Request permission for users location, get the location and call this method from useEffect
  getLocationAsync = async () => {
    const { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Access denied");
      return;
    }
    const location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true
    });
    lat = location.coords.latitude;
    lon = location.coords.longitude;
    setPosition({
      latitude: lat,
      longitude: lon
    });
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    });
  };

  /*
  When a press is done on the map, coordinates (lat,lon) are provided via the event object
  */
  onMapPress = async (event) => {
    //Get location from where user pressed on map, and check it against the server
    const coordinate = event.nativeEvent.coordinate;
    setMarker(coordinate);
    const { longitude, latitude } = coordinate;
    try {
      const status = await facade.isUserInArea(longitude, latitude);
      showStatusFromServer(setStatus, status);
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
        },
        1000
      );
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Server could not be reached");
      setServerIsUp(false);
    }
  };

  onCenterGameArea = () => {
    // (RED) Center map around the gameArea fetched from the backend
    //Hardcoded, should be calculated as center of polygon received from server
    const latitude = 55.777055745928664;
    const longitude = 12.55897432565689;
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.04
      },
      1000
    );
  };

  sendRealPosToServer = async () => {
    const { latitude, longitude } = position;
    try {
      const status = await facade.isUserInArea(longitude, latitude);
      showStatusFromServer(setStatus, status);
    } catch (err) {
      setErrorMessage("Could not get result from server");
      setServerIsUp(false);
    }
  };
  const isServerUp = serverIsUp ? status : " Server is not up";
  return (
    <View style={{ flex: 1, paddingTop: 20, paddingBottom: 40 }}>
      {!region && <Text style={styles.fetching}>.. Fetching data</Text>}

      {region && (
        <MapView
          ref={mapRef}
          style={{ flex: 14 }}
          onPress={onMapPress}
          mapType="standard"
          region={region}
        >
          {/*App MapView.Polygon to show gameArea*/}
          {serverIsUp && (
            <MapView.Polygon
              coordinates={gameArea}
              strokeWidth={1}
              onPress={onMapPress}
              fillColor="rgba(128 ,153, 177, 0.5)"
            />
          )}
          {/*App MapView.Marker to show users current position*/}
          <MapView.Marker
            coordinate={{
              longitude: position.longitude,
              latitude: position.latitude
            }}
          />
          {teamPositions &&
            region &&
            teamPositions.map((teampos, i) => {
              return (
                <MapView.Marker
                  coordinate={{
                    longitude: teamPositions[i][1],
                    latitude: teamPositions[i][2]
                  }}
                  title={teamPositions[i][0]}
                  key={teamPositions[i][0]}
                  pinColor={"blue"}
                />
              );
            })}
          {marker && (
            <MapView.Marker
              coordinate={{
                longitude: marker.longitude,
                latitude: marker.latitude
              }}
              title={"X"}
              key={"marker"}
              pinColor={"green"}
            />
          )}
        </MapView>
      )}

      <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
        Your position (lat,long): {position.latitude}, {position.longitude}
      </Text>
      <Text style={{ flex: 1, textAlign: "center" }}>{isServerUp}</Text>

      <MyButton
        style={{ flex: 2 }}
        onPressButton={sendRealPosToServer}
        txt="Upload real Position"
      />
      {(mapRef.current != null) && 
        <MyButton
          style={{ flex: 2 }}
          onPressButton={() => onCenterGameArea()}
          txt="Show Game Area"
        />
      }
      {!isLoggedIn && (
        <View>
          <MyButton
            style={{ flex: 2 }}
            txt="Check for nearby players"
            onPressButton={() => setShowModal(true)}
          />
          <NearbyModal
            visible={showModal}
            setVisible={setShowModal}
            position={position}
            onSearch={teamPositionHandler}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1"
  },
  touchable: { backgroundColor: "#4682B4", margin: 3 },
  touchableTxt: { fontSize: 22, textAlign: "center", padding: 5 },

  fetching: {
    fontSize: 35,
    flex: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: "center"
  }
});

function showStatusFromServer(setStatus, status) {
  setStatus(status.msg);
  setTimeout(() => setStatus("- - - - - - - - - - - - - - - - - - - -"), 3000);
}
