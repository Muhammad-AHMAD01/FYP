import { Shop } from './shop';
import { Leave } from './leaves';

export type RootStackParamList = {
  Login: undefined;
  ForgotPasswordEmail: undefined;
  ForgotPasswordOTP: { email: string };
  ForgotPasswordNewPassword: { email: string; otp: string };
  Dashboard: { updatedShops?: Shop[]; leaves: Leave[] } | undefined;
  Home: undefined;
  Shops: { shops: Shop[]; onUpdate?: (shops: Shop[]) => void };
  ShopDetails: { shopId: string; onUpdate?: (shops: Shop[]) => void };
  Leaves: { leaves?: Leave[]; onUpdate?: (leaves: Leave[]) => void };  Profile: undefined;
  ChangePassword: undefined;
  History: { visitedShops: Shop[] };
};
