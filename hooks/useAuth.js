import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { EXPO_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID } from '@env'

const AuthContext = createContext({});

WebBrowser.maybeCompleteAuthSession();

export const AuthProvider = ({ children }) => {
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loading, setLoading] = useState(false);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        expoClientId: EXPO_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        scopes: ["profile", "email"],
    });

    // checks if user is logged in
    useEffect(
        () =>
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Logged in
                    setUser(user);
                } else {
                    setUser(null);
                }

                setLoadingInitial(false);
            }),
        []
    );

    // logout function
    const logout = async () => {
        setLoading(true);
        signOut(auth)
            .catch((error) => setError(error))
            .finally(() => setLoading(false))
    }

    // login function
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential);
        };
        setLoading(false);
    }, [response]);

    // firebase signin with Google call
    const signInWithGoogle = async () => {
        setLoading(true);
        promptAsync();
    };

    // cache values until they're updated
    const memoedValue = useMemo(() => ({
        user,
        loading,
        error,
        signInWithGoogle,
        logout
    }), [user, loading, error]);

    return (
        <AuthContext.Provider value={memoedValue}>
            {!loadingInitial && children}
        </AuthContext.Provider>
    );
};

export default function useAuth() {
    return useContext(AuthContext);
};