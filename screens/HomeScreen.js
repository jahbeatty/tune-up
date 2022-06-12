import { View, Text, SafeAreaView, TouchableOpacity, Image, StyleSheet, Button, ImageBackground } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../hooks/useAuth';
import tw from 'twrnc';
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import Swiper from 'react-native-deck-swiper';
import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import generateId from '../lib/generateId';
import { Audio } from 'expo-av';

const HomeScreen = () => {
    const Tracks = [
        {
            id: 0,
            track: require('../sounds/lumberjack.mp3'),
        },
        {
            id: 1,
            track: require('../sounds/getlucky.mp3'),
        },
    ];

    // swipe and match var
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const swipeRef = useRef(null);

    // audio var
    const sound = React.useRef(new Audio.Sound());
    const [Loaded, SetLoaded] = React.useState(false);
    const [Loading, SetLoading] = React.useState(false);
    const [CurrentSong, SetCurrentSong] = React.useState(Tracks[0]);
    const [Playing, SetPlaying] = useState(false);


    // if user does not exist, open modal
    useLayoutEffect(() => {
        onSnapshot(doc(db, 'users', user.uid), snapshot => {
            if (!snapshot.exists()) {
                navigation.navigate("Modal")
            };
        });
    }, []);

    // filter to not show same user on their own screen
    useEffect(() => {
        let unsub;
        const fetchCards = async () => {

            const passes = await getDocs(collection(db, 'users', user.uid, 'passes'))
                .then(snapshot => snapshot.docs.map((doc) => doc.id));

            const swipes = await getDocs(collection(db, 'users', user.uid, 'swipes'))
                .then(snapshot => snapshot.docs.map((doc) => doc.id))

            const passedUserIds = passes.length > 0 ? passes : ['test'];
            const swipedUserIds = swipes.length > 0 ? swipes : ['test'];

            unsub = onSnapshot(query(
                collection(db, 'users'),
                where('id', 'not-in', [...passedUserIds, ...swipedUserIds])
            ),
                (snapshot) => {
                    setProfiles(
                        snapshot.docs
                            .filter((doc) => doc.id !== user.uid)
                            .map((doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            }))
                    );
                });
        };

        fetchCards();
        return unsub;
    }, [db]);

    // swipe left functionality
    const swipeLeft = (cardIndex) => {
        if (!profiles[cardIndex]) return;

        const userSwiped = profiles[cardIndex];
        console.log(`You swiped PASS on ${userSwiped.displayName}`)

        setDoc(doc(db, 'users', user.uid, 'passes', userSwiped.id),
            userSwiped)
    };

    // swipe right functionality
    const swipeRight = async (cardIndex) => {
        if (!profiles[cardIndex]) return;

        const userSwiped = profiles[cardIndex];
        const loggedInProfile = await (
            await getDoc(doc(db, 'users', user.uid)))
            .data();

        // TODO: Add to backend on cloud function

        getDoc(doc(db, 'users', userSwiped.id, 'swipes', user.uid)).then(
            (documentSnapshot) => {
                // matched with logged in user first
                if (documentSnapshot.exists()) {
                    console.log(`You MATCHED with ${userSwiped.displayName}`)

                    setDoc(doc(db, 'users', user.uid, 'swipes', userSwiped.id),
                        userSwiped)

                    setDoc(doc(db, 'matches', generateId(user.uid, userSwiped.id)), {
                        users: {
                            [user.uid]: loggedInProfile,
                            [userSwiped.id]: userSwiped
                        },
                        userMatched: [user.uid, userSwiped.id],
                        timestamp: serverTimestamp(),
                    })

                    navigation.navigate('Match', {
                        loggedInProfile,
                        userSwiped,
                    })
                } else {
                    console.log(`You swiped on ${userSwiped.displayName}`)
                }
            })

        setDoc(doc(db, 'users', user.uid, 'swipes', userSwiped.id),
            userSwiped)
    };

    // audio functionality
    React.useEffect(() => {
        LoadAudio();

        return () => Unload();
    }, [CurrentSong]);

    // unload sound
    const Unload = async () => {
        await sound.current.unloadAsync();
    };

    // play sound
    const PlayAudio = async () => {
        try {
            const result = await sound.current.getStatusAsync();
            if (result.isLoaded) {
                if (result.isPlaying === false) {
                    sound.current.playAsync();
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    // pause sound
    const PauseAudio = async () => {
        try {
            const result = await sound.current.getStatusAsync();
            if (result.isLoaded) {
                if (result.isPlaying === true) {
                    sound.current.pauseAsync();
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    // load sound
    const LoadAudio = async () => {
        SetLoaded(false);
        SetLoading(true);
        const checkLoading = await sound.current.getStatusAsync();
        if (checkLoading.isLoaded === false) {
            try {
                const result = await sound.current.loadAsync(
                    CurrentSong.track,
                    {},
                    true
                );
                if (result.isLoaded === false) {
                    SetLoading(false);
                    console.log('Error in Loading Audio');
                } else {
                    SetLoading(false);
                    // PlayAudio();
                    SetLoaded(true);
                }
            } catch (error) {
                console.log(error);
                SetLoading(false);
            }
        } else {
            SetLoading(false);
        }
    };

    // handle play and pause
    const HandlePlayPause = async () => {
        try {
            const result = await sound.current.getStatusAsync();
            if (result.isLoaded) {
                if (result.isPlaying === false) {
                    sound.current.playAsync();
                    SetPlaying(true);
                } else {
                    PauseAudio();
                    SetPlaying(false);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    // next song
    const NextSong = () => {
        if (CurrentSong.id === Tracks[Tracks.length - 1].id) {
            SetCurrentSong(Tracks[0]);
        } else {
            SetCurrentSong(Tracks[CurrentSong.id + 1]);
        }
        SetPlaying(false)
    };

    // previous song
    const PrevSong = () => {
        if (CurrentSong.id === 0) {
            SetCurrentSong(Tracks[Tracks.length - 1]);
        } else {
            SetCurrentSong(Tracks[CurrentSong.id - 1]);
        }
        SetPlaying(false)
    };

    return (
        <SafeAreaView style={tw`flex-1`}>
            {/* Header */}
            <View style={tw`items-center relative`}>
                <TouchableOpacity
                    style={tw`absolute left-5 top-3`}
                    onPress={logout}
                >
                    <Image
                        style={tw`h-10 w-10 rounded-full`}
                        source={{ uri: user.photoURL }}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Modal")}>
                    <Image
                        style={tw`h-14 w-14 rounded-full`} ß
                        source={require("../assets/tune_up_logo_2.png")}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={tw`absolute right-5 top-3`}
                    onPress={() => navigation.navigate("Chat")}
                >
                    <Ionicons name="chatbubbles-sharp" size={30} color="#3C0464" />
                </TouchableOpacity>
            </View>

            {/* Cards */}
            <View style={tw`flex-1 -mt-6`}>
                <Swiper
                    ref={swipeRef}
                    containerStyle={{ backgroundColor: "transparent" }}
                    cards={profiles}
                    stackSize={5}
                    cardIndex={0}
                    animateCardOpacity
                    verticalSwipe={false}
                    onSwipedLeft={(cardIndex) => {
                        swipeLeft(cardIndex);
                    }}
                    onSwipedRight={(cardIndex) => {
                        swipeRight(cardIndex);
                    }}
                    backgroundColor={"#4FD0E9"}
                    overlayLabels={{
                        left: {
                            title: "NOPE",
                            style: {
                                label: {
                                    textAlign: "right",
                                    color: "red",
                                },
                            },
                        },
                        right: {
                            title: "MATCH",
                            style: {
                                label: {
                                    textAlign: "left",
                                    color: "green",
                                },
                            },
                        },
                    }}
                    renderCard={card => card ? (
                        <View key={card.id} style={tw`relative bg-white h-3/4 rounded-xl`}>
                            <TouchableOpacity
                                style={tw`flex-1`}
                                onPress={() => HandlePlayPause()}
                            >
                                <ImageBackground style={tw`absolute top-0 h-full w-full rounded-xl justify-center items-center`} source={{ uri: card.photoURL }}>
                                    {/* {Playing ? <Text style={tw`text-white`}>Playing</Text> : <Text style={tw`text-white`}>Not Playing</Text>} */}
                                </ImageBackground>
                                <View
                                    style={[
                                        tw`absolute bottom-0 bg-white w-full flex-row justify-between items-center h-20 px-6 py-2 rounded-b-xl`,
                                        styles.cardShadow
                                    ]}>
                                    <View>
                                        <Text style={tw`text-xl font-bold`}>{card.displayName}</Text>
                                        <Text>{card.occupation}</Text>
                                    </View>
                                    <Text style={tw`text-2xl font-bold`}>{card.age}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View
                            style={[
                                tw`relative bg-white h-3/4 rounded-xl justify-center items-center`,
                                styles.cardShadow
                            ]}
                        >
                            <Text style={tw`font-bold pb-5`}>No more profiles</Text>
                            <Image
                                style={tw`h-20 w-full`}
                                height={100}
                                width={100}
                                source={{ uri: "https://links.papareact.com/6gb" }}
                            />
                        </View>
                    )}
                />
            </View>

            <View style={tw`justify-center items-center p-bottom-3`}>
                <Text style={tw`text-l font-bold`}>{Playing ? "Now Playing" : "Tap to Play"}</Text>
            </View>

            {/* Swipe and Pass buttons */}
            <View style={tw`flex flex-row justify-evenly`}>
                <TouchableOpacity
                    onPress={() => swipeRef.current.swipeLeft()}
                    style={tw`items-center justify-center rounded-full w-16 h-16 bg-red-200`}
                >
                    <Entypo name="cross" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={PrevSong}
                    style={tw`items-center justify-center rounded-full w-16 h-16 bg-gray-200`}
                >
                    <AntDesign name="left" size={24} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={NextSong}
                    style={tw`items-center justify-center rounded-full w-16 h-16 bg-gray-200`}
                >
                    <AntDesign name="right" size={24} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => swipeRef.current.swipeRight()}
                    style={tw`items-center justify-center rounded-full w-16 h-16 bg-green-200`}
                >
                    <AntDesign name="heart" size={24} color="green" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    }
});