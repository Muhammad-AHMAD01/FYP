import {
  StatusBar,
} from 'react-native';


import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import Login from './Components/Login';
import ForgotPasswordEmail from './Components/ForgottenEmail';
import ForgotPasswordOTP from './Components/PasswordOTP';
import ResetPassword from './Components/ResetPassword';
import ChangePassword from './Components/ChangePassword';
import ProfilePage from './Components/Profile';
import Dashboard from './Components/Dashboard';
import Shops from './Components/Shops';
import Leaves from './Components/Leaves';
import History from './Components/History';

import { RootStackParamList } from './types/navigation';
import HeaderBar from './Abstracts/HeaderBar';
const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (

   <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen
          name="ForgotPasswordEmail"
          component={ForgotPasswordEmail}
        />
        <Stack.Screen name="ForgotPasswordOTP" component={ForgotPasswordOTP} />
        <Stack.Screen
          name="ForgotPasswordNewPassword"
          component={ResetPassword}
        />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Shops" component={Shops} />
        <Stack.Screen name="Profile" component={ProfilePage} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        {/* <Stack.Screen name="Leaves" component={Leaves} /> */}
        <Stack.Screen name="History" component={History} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );

}

export default App;
