import { Button, View, Text, ImageBackground, TouchableOpacity } from 'react-native'
import React from 'react'
import useAuth from '../hooks/useAuth';
import tw from 'twrnc';

const LoginScreen = () => {
    // TODO: add loading functionality
    const { signInWithGoogle, loading } = useAuth();

    return (
        <View style={tw`flex-1`}>
            <ImageBackground
                resizeMode="cover"
                style={tw`flex-1`}
                source={require("../assets/tune_up_splash_1.png")}>
                <TouchableOpacity style={[
                    tw`absolute bottom-40 w-52 bg-white p-4 rounded-2xl`,
                    { marginHorizontal: "25%" }]}
                    onPress={signInWithGoogle}
                >
                    <Text
                        style={tw`font-semibold text-center`}
                    >
                        Sign In
                    </Text>
                </TouchableOpacity>
            </ImageBackground>
        </View>
    );
};

export default LoginScreen;