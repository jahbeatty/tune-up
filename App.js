import { NavigationContainer } from '@react-navigation/native';;
import { AuthProvider } from './hooks/useAuth';
import StackNavigator from './StackNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <AuthProvider>
        <StackNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
};

export default App;
