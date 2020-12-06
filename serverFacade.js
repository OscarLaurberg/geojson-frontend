
import { SERVER_URL } from "./settings";

ServerFacade = () => {

  async function fetchGameArea() {
    const res = await fetch(`${SERVER_URL}/geoapi/gamearea`).then(res => res.json());
    return res.coordinates;
  }

  async function isUserInArea(lon, lat) {
    const status = await fetch(`${SERVER_URL}/geoapi/isuserinarea/${lon}/${lat}`).
                    then(res => res.json())
    return status;
  }

  async function nearbyPlayers(userName, password, lon, lat, distance) {
    const latitude = lat;
    const longitude = lon;
    const body = {
      userName,
      password,
      lon: longitude,
      lat: latitude,
      distance
    }
    const status = await fetch(`${SERVER_URL}/gameapi/nearbyplayers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(res => res.json());
    return status;
  }


  return {
    fetchGameArea,
    isUserInArea,
    nearbyPlayers
  }
}

export default ServerFacade();