import React, { useState } from 'react';
import {Text, View, StyleSheet, Modal, TextInput, Button } from 'react-native';
import facade from "../serverFacade";

const NearbyPlayersModal = props => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [distance, setDistance] = useState();

  const userNameInputHandler = enteredUserName => {
    setUserName(enteredUserName);
  }

  const passwordInputHandler = enteredPassword => {
    setPassword(enteredPassword);
  }

  const distanceInputHandler = enteredDistance => {
    setDistance(enteredDistance);
  }

  const handleCancelButton = () => {
    props.setVisible(false);
  }

  const findNearbyPlayersHandler = async () => {
    try{
    const status = await facade.nearbyPlayers(userName, password, props.position.longitude, props.position.latitude, distance)
    if(status.code === 403){
      alert('Wrong username or password');
      return;
    }
    const result = status.map(obj => Object.values(obj));
    setTimeout(() => {  alert(`${result.length} Teams found!`); }, 1000);
    props.setVisible(false);
    return result;
  }catch(err){
    console.log(err);
    alert('Something went wrong');
  }
  }

return(
  <Modal visible={props.visible} animationType='slide'>
    <View style={styles.inputContainer}>
    <TextInput 
    placeholder='Username' onChangeText={userNameInputHandler} value={userName} style={styles.input}/>
    <TextInput 
    placeholder='Password' secureTextEntry={true} onChangeText={passwordInputHandler} value={password} style={styles.input}/>
    <TextInput 
    placeholder='Distance to search' keyboardType = 'numeric' onChangeText={distanceInputHandler} value={distance} style={styles.input}/>
    <Button title='Cancel' color='red' onPress={handleCancelButton}/>
    <Button title='Search' onPress={async () => props.onSearch(await findNearbyPlayersHandler())}/>
    <Text style={{ paddingTop: 35 }}>cph-ol38@cphbusiness.dk</Text>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    width: '80%',
    borderColor: 'black',
    borderWidth: 1,
    padding: 10
  }
})
export default NearbyPlayersModal;