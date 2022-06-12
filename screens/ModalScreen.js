import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import tw from 'twrnc';
import useAuth from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';

const ModalScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();

    const [image, setImage] = useState(user?.photoURL);
    const [occupation, setOccupation] = useState(null);
    const [age, setAge] = useState(null);
    const [userProfile, setUserProfile] = useState();

    const incompleteForm = !image || !occupation || !age

    // TODO: add upload image functionality
    const updateUserProfile = () => {
        setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            displayName: user.displayName,
            photoURL: image,
            occupation: occupation,
            age: age,
            timestamp: serverTimestamp()
        }).then(() => {
            navigation.navigate('Home')
        }).catch(error => {
            alert(error.message)
        })
    };

    useEffect(() => {
        let unsub;
        const fetchCards = async () => {
            unsub = onSnapshot(query(
                collection(db, 'users'),
            ),
                (snapshot) => {
                    setUserProfile(
                        snapshot.docs
                            .filter((doc) => doc.id === user.uid)
                            .map((doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            }))[0]
                    )
                });
        };

        fetchCards();
        return unsub;
    }, [db]);

    return (
        <View style={tw`flex-1 items-center pt-1`}>
            <Image
                style={tw`h-20 w-full`}
                resizeMode="contain"
                source={require("../assets/tune_up_banner.png")}
            />

            <Text style={tw`text-xl text-gray-500 p-2 font-bold`}>
                Welcome {userProfile?.displayName}
            </Text>

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Step 1: The Profile Pic
            </Text>
            <TextInput
                value={image}
                onChangeText={setImage}
                style={tw`text-center text-xl pb-2`}
                placeholder="Enter a Profile Pic URL"
            />

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Step 2: The Occupation
            </Text>
            <TextInput
                value={occupation}
                onChangeText={setOccupation}
                style={tw`text-center text-xl pb-2`}
                placeholder="Enter your occupation"
            />

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Step 3: The Age
            </Text>
            <TextInput
                value={age}
                onChangeText={setAge}
                style={tw`text-center text-xl pb-2`}
                placeholder="Enter your age"
                keyboardType="numeric"
            />

            <TouchableOpacity
                onPress={updateUserProfile}
                disabled={incompleteForm}
                style={[
                    tw`w-64 p-3 rounded-xl absolute bottom-10 bg-red-400`,
                    incompleteForm ? tw`bg-gray-400` : tw`bg-red-400`
                ]}>
                <Text style={tw`text-center text-white text-xl`}>Update Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ModalScreen;