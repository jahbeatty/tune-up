import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import tw from 'twrnc';
import useAuth from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

const ModalScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();

    const [name, setName] = useState(null)
    const [image, setImage] = useState(null);
    const [occupation, setOccupation] = useState(null);
    const [age, setAge] = useState(null);
    const [userProfile, setUserProfile] = useState();
    const [imageAdded, setImageAdded] = useState(false);

    //  user changes at least one value on the form
    const incompleteForm = !name && !image && !occupation && !age

    const updateUserProfile = () => {
        setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            displayName: !!name ? name : userProfile?.displayName,
            photoURL: !!image ? image : userProfile?.photoURL,
            occupation: !!occupation ? occupation : userProfile?.occupation,
            age: !!age ? age : userProfile?.age,
            timestamp: serverTimestamp()
        }).then(() => {
            navigation.navigate('Home')
        }).catch(error => {
            alert(error.message)
        })
    };

    const addImage = async () => {
        let _image = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!_image.cancelled) {
            setImage(_image.uri)
            setImageAdded(true)
        }
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

            {/* User input fields */}
            <Text style={tw`text-xl text-gray-500 p-2 font-bold`}>
                Welcome {!!name ? name : userProfile?.displayName}
            </Text>

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Edit Name
            </Text>
            <TextInput
                value={name}
                onChangeText={setName}
                style={tw`text-center text-xl pb-2`}
                placeholder="Enter Name"
            />

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Change Profile Pic
            </Text>
            <TouchableOpacity
                onPress={addImage}
                style={[
                    tw`w-64 p-3 rounded-xl`,
                    imageAdded ? tw`bg-green-500` : tw`bg-gray-500`
                ]}>
                <Text style={tw`text-center text-white text-xl`}>{imageAdded ? "Image Uploaded" : "Upload Image"}</Text>
            </TouchableOpacity>

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Change Occupation
            </Text>
            <TextInput
                value={occupation}
                onChangeText={setOccupation}
                style={tw`text-center text-xl pb-2`}
                placeholder="Enter your occupation"
            />

            <Text style={tw`text-center p-4 font-bold text-red-400`}>
                Change Age
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