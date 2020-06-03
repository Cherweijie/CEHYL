import React, { useState, useEffect } from 'react';
import { Image, FlatList, Text, TouchableOpacity, View, Alert} from 'react-native';
import {useTheme} from '@react-navigation/native';
import { styles } from '../styles/temperaturestyle'
import { TextInput } from 'react-native-gesture-handler';
import Card from '../components/card';
import firebase from '../Firebase';
import {v4 as uuidv4} from 'uuid';

import DateTimePicker from '@react-native-community/datetimepicker';

export default function TemperatureScreen({ navigation }) {
    const { header, textInput } = useTheme();
    const [temperature, setTemperature] = useState('');
    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);
    const [listOfTemperature, setListOfTemperature] = useState([])
  
    const user = firebase.auth().currentUser;

    const addTemperature = () => {
        if (isNaN(temperature) || temperature.length === 0) {
            return Alert.alert('Not a number')
        }
        addTemperatureToDatabase()

        setTemperature('')
        setDate(new Date())
        return Alert.alert('Temperature added')
    }

    const addTemperatureToDatabase = () => {
        const dateTime = dateTimeInString()
        firebase.database().ref('temperature/' + user.uid + '/' + dateTime).set({
            temperature: temperature,
            date: dateTime,
        })
    }

    const dateTimeInString = () => {
        let formattedDate = formatDate(date.getDate().toString())
        let minutes = formatMinutes(date.getMinutes().toString())
        let month = formatDate((date.getMonth() + 1).toString())
        return date.getFullYear() + "-" + month + '-' + formattedDate + " " + date.getHours() + ":" + minutes
    }

    const formatDate = (date) => {
        if (date.length === 2) {
            return date
        }
        return "0" + date
    }

    const formatMinutes = (minutes) => {
        if (minutes.length === 2) {
            return minutes
        }
        return "0" + minutes
    }

    const onChange = (event, selectedDate) => {
      const currentDate = selectedDate || date;
      setShow(Platform.OS === 'ios');
      setDate(currentDate);
    };
  
    const showMode = currentMode => {
      setShow(true);
      setMode(currentMode);
    };
  
    const showDatepicker = () => {
      showMode('date');
    };
  
    const showTimepicker = () => {
      showMode('time');
    };

    const processRetrievedData = (dataRetrieved) => {
        const sortedData = {}
        Object.keys(dataRetrieved).sort(
            (a, b) => {
                console.log(a)
                return new Date(a.replace(" ", "T")) - new Date(b.replace(" ", "T"))
            })
            .reverse()
            .forEach((key) => sortedData[key] = dataRetrieved[key])
        const result = Object.values(sortedData)
            .map(data => {
                return {...data, id: uuidv4()}
            })
            console.log(result)
        return result
    }

    const formatHour = (time) => {
        const splitTime = time.split(/:/)
        console.log(splitTime);
        if (splitTime[0].length === 2) {    
            return time
        }
        return '0' + splitTime[0] + ':' + splitTime[1]
    }

    const formatDisplayDate = (dataDate) => {
        const regexToSplit = /-| /
        const splitDate = dataDate.split(regexToSplit)
        return splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0] + ' ' + formatHour(splitDate[3])
    }

    useEffect(() =>{
        try {
            const listener = firebase.database().ref('temperature/' + user.uid)
            listener.on('value', function(snapshot) {
                const dataRetrieved = snapshot.val() || {} ;
                const result = processRetrievedData(dataRetrieved);
                setListOfTemperature(result)
            })
        } catch(err) {
            Alert.alert(err);
        }
    }, [])

    return(
        <View style={styles.screenView}>
            <View style={styles.container}>
                <Text style={header}>Temperature Record</Text>

                <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={showDatepicker}>
                        <Text style={styles.textCenter}>{formatDate(date.getDate().toString()) + "/" + formatDate((date.getMonth() + 1).toString()) + "/" + date.getFullYear()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={showTimepicker}>
                        <Text style={styles.textCenter}>{date.getHours() + ":" + formatMinutes(date.getMinutes().toString())}</Text>
                    </TouchableOpacity>
                </View>            

                {show && ( 
                    <DateTimePicker
                    testID="dateTimePicker"
                    timeZoneOffsetInMinutes={0}
                    value={date}
                    mode={mode}
                    is24Hour={true}
                    display="default"
                    onChange={onChange}
                    />
                )}
                <View style={styles.row}>
                    <TextInput 
                        keyboardType='numeric' 
                        style={textInput} 
                        placeholder="Your temperature here"
                        onChangeText={setTemperature}
                        value={temperature}
                    />
                    <TouchableOpacity onPress={() => {
                            addTemperature(temperature)
                        }}>
                        <Image source={require('../images/baseline_add_white_18dp.png')} style={styles.addIcon}/>                        
                    </TouchableOpacity>
                </View>
            </View>
            <View>
                <View style={styles.headerStyle}>
                    <Text style={styles.headerDate}>Date Time</Text>
                    <Text style={styles.headerTemp}>Temperature</Text>
                </View>
                <FlatList
                    style={styles.flatList}
                    data={listOfTemperature}
                    renderItem={({item}) => (
                        <Card style={styles.card}>
                            <View style={styles.cardViewLeft}>
                                <Text>{formatDisplayDate(item.date)}</Text>
                            </View>
                            <View style={styles.cardViewRight}> 
                                <Text>{item.temperature}</Text>
                            </View>
                        </Card>
                    )}
                    keyExtractor={item => item.id}
                />
            </View>
        </View>
    );
}

