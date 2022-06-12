import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { AuthProvider } from './hooks/useAuth';
import StackNavigator from './StackNavigator';

const App = () => {
  useEffect(() => {
    LogBox.ignoreAllLogs();
  });

  return (
    <NavigationContainer>
      <AuthProvider>
        <StackNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
};

export default App;
