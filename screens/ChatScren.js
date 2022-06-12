import { SafeAreaView } from 'react-native';
import React from 'react';
import Header from '../components/Header';
import ChatList from '../components/ChatList';

const ChatScren = () => {
    return (
        <SafeAreaView>
            <Header title="Chat" />
            <ChatList />
        </SafeAreaView>
    );
};

export default ChatScren;