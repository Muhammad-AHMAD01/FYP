import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import Container from '../Abstracts/Container';
import ValidText from '../Abstracts/ValidText';
import Button from '../Abstracts/Button';
import ShopCard from '../Components/ShopCard';
import { Colors, FontSize } from '../Theme';
import { Shop } from '../types/shop';
import { Leave } from '../types/leaves';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import HeaderBar from '../Abstracts/HeaderBar';

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

type DashboardRouteProp = RouteProp<RootStackParamList, 'Dashboard'>;

interface DashboardProps {
  navigation: DashboardNavigationProp;
  route: DashboardRouteProp;
}

const initialShops: Shop[] = [
  { id: '1', name: 'Al-Hadi Store', address: 'Block A, Main St.', owner: 'Mr. Ali', phone: '+92 300 1234567', status: 'Pending' },
  { id: '2', name: 'Khan Grocers', address: 'Market Rd, Plaza 3', owner: 'Mr. Khan', phone: '+92 312 7654321', status: 'Pending' },
  { id: '3', name: 'City Pharmacy', address: 'Street 5, Near Mall', owner: 'Mrs. Sana', phone: '+92 321 4567890', status: 'Pending' },
  { id: '4', name: 'Islam Bookstore', address: 'Street 1, Near Mall', owner: 'Mrs. Talha', phone: '+92 321 4567890', status: 'Pending' },
  { id: '5', name: 'Imitiaz Mart', address: 'Street 10, Near Mall', owner: 'Mr. Ahmed', phone: '+92 321 4567890', status: 'Pending' },
];

const Dashboard: React.FC<DashboardProps> = ({ navigation, route }) => {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [leaves, setLeaves] = useState<Leave[]>(route.params?.leaves || []);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const salesmanName = 'Ali';

  useEffect(() => {
    if (route.params?.updatedShops) {
      setShops(route.params.updatedShops);
    }
  }, [route.params?.updatedShops]);

  useEffect(() => {
    if (route.params?.leaves) {
      setLeaves(route.params.leaves);
    }
  }, [route.params?.leaves]);

  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  const markVisited = useCallback(
    (shopId: string) => {
      const shop = shops.find(s => s.id === shopId);
      if (!shop) return;

      const updated = shops.map(s =>
        s.id === shopId
          ? { ...s, status: 'Visited' as const, lastVisited: new Date().toISOString() }
          : s,
      );
      setShops(updated);

      Toast.show({
        type: 'success',
        text1: `${shop.name} visited`,
        position: 'top',
      });
    },
    [shops],
  );

  const renderShop = ({ item }: { item: Shop }) => (
    <View style={styles.shopCardWrapper}>
      <ShopCard
        shop={{
          ...item,
          lastVisited: item.lastVisited ? formatDate(item.lastVisited) : undefined,
        }}
        onMarkVisited={markVisited}
        style={{ flex: 1 }}
      />
    </View>
  );

  const renderHeader = () => (
    <View>
      <ValidText text={`Welcome, ${salesmanName}`} style={styles.welcome} />

      {/* Stats */}
      <View style={[styles.statsRow, isLandscape && styles.statsRowLandscape]}>
        <View style={[styles.statCard, { backgroundColor: Colors.primaryblue }]}>
          <Icon name="place" size={20} color={Colors.white} />
          <ValidText text={`${shops.filter(s => s.status === 'Visited').length}`} style={styles.statValue} />
          <ValidText text={'Visits Today'} style={styles.statLabel} />
        </View>

        <View style={[styles.statCard, { backgroundColor: Colors.orange }]}>
          <Icon name="event-busy" size={20} color={Colors.white} />
          <ValidText text={`${pendingLeaves}`} style={styles.statValue} />
          <ValidText text={'Pending Leaves'} style={styles.statLabel} />
        </View>

        <View style={[styles.statCard, { backgroundColor: Colors.green }]}>
          <Icon name="store" size={20} color={Colors.white} />
          <ValidText text={`${shops.length}`} style={styles.statValue} />
          <ValidText text={'Shops Allocated'} style={styles.statLabel} />
        </View>
      </View>

      {/* Assigned Shops Section */}
      <View style={styles.sectionHeader}>
        <ValidText text="Assigned Shops" style={styles.sectionTitle} />
        <Button
          text="View All"
          onPress={() =>
            shops.length > 0 &&
            navigation.navigate('Shops', {
              shops,
              onUpdate: (updated: Shop[]) => navigation.setParams({ updatedShops: updated }),
            })
          }
          backgroundColor={shops.length > 0 ? Colors.white : Colors.grey}
          color={shops.length > 0 ? Colors.primaryblue : Colors.white}
          width={100}
          height={40}
          borderRadius={10}
          elevation={shops.length > 0 ? 1 : 0}
          fontSize={FontSize.Button}
        />
      </View>

      {shops.length === 0 && (
        <View style={styles.noShopsContainer}>
          <Icon name="info-outline" size={40} color={Colors.grey} style={{ marginBottom: 8 }} />
          <ValidText text="No shops have been assigned to you yet." style={styles.noShopsText} />
          <ValidText text="Please check back later or contact your manager." style={styles.noShopsSubText} />
        </View>
      )}
    </View>
  );

  // const renderNotifications = () => (
  //   <View style={{ marginTop: 16 }}>
  //     <ValidText text="Notifications" style={styles.sectionTitle} />
  //     <View style={styles.notifications}>
  //       <View style={styles.notificationCard}>
  //         <Icon name="check-circle" size={20} color={Colors.green} style={{ marginRight: 8 }} />
  //         <ValidText text="Leave approved by Manager" style={styles.notificationText} />
  //       </View>

  //       <View style={styles.notificationCard}>
  //         <Icon name="alarm" size={20} color={Colors.orange} style={{ marginRight: 8 }} />
  //         <ValidText text="Reminder: Visit Al-Hadi Store before 5 PM" style={styles.notificationText} numberOfLines={2} />
  //       </View>
  //     </View>
  //     <View style={{ height: 32 }} />
  //   </View>
  // );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offwhite , paddingTop: StatusBar.currentHeight}}>
      
      <Container>
        <HeaderBar title="Dashboard" showBack={false} />
        {/* Bottom Nav Bar */}
        <View style={styles.topBar}>
          <Icon name="home" size={26} color={Colors.primaryblue} onPress={() => navigation.navigate('Home')} />
          <Icon name="store" size={26} color={Colors.grey} onPress={() => navigation.navigate('Shops', {
            shops,
            onUpdate: (updated: Shop[]) => navigation.setParams({ updatedShops: updated }),
          })} />
          {/* <Icon name="event" size={26} color={Colors.grey} onPress={() => navigation.navigate('Leaves', {
            leaves,
            onUpdate: (updatedLeaves: Leave[]) => setLeaves(updatedLeaves),
          })} /> */}
          <Icon name="history" size={26} color={Colors.grey} onPress={() => navigation.navigate('History', {
            visitedShops: shops.filter(s => s.status === 'Visited'),
          })} />
          <Icon name="person" size={26} color={Colors.grey} onPress={() => navigation.navigate('Profile')} />
        </View>

        {/* Scrollable Content */}
        <FlatList
          data={shops.length > 0 ? shops.slice(0, 3) : []}
          key={isLandscape ? 'landscape' : 'portrait'}
          numColumns={isLandscape ? 2 : 1}
          keyExtractor={item => item.id}
          renderItem={renderShop}
          ListHeaderComponent={renderHeader}
         // ListFooterComponent={renderNotifications}
          columnWrapperStyle={isLandscape ? { justifyContent: 'space-between', alignItems: 'stretch' } : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Toast />
      </Container>
    </SafeAreaView>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // backgroundColor: Colors.offwhite,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'center',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 15,
    elevation: 2,
    marginBottom: 12,
    marginTop:10
  },

  listContent: {
    paddingBottom: 20,
  },

  welcome: {
    fontSize: FontSize.H2,
    fontWeight: '700',
    color: Colors.black,
    marginVertical: 12,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsRowLandscape: { marginHorizontal: 4 },

  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 25,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 94,
  },
  statValue: {
    color: Colors.white,
    fontSize: FontSize.H2,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: Colors.white,
    fontSize: FontSize.Caption,
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: FontSize.H3,
    fontWeight: '700',
    color: Colors.black,
  },

  shopCardWrapper: {
    flex: 1,
    margin: 6,
  },

  notifications: { marginTop: 8 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  notificationText: {
    fontSize: FontSize.Body,
    color: Colors.black,
    flex: 1,
    flexWrap: 'wrap',
  },

  noShopsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 12,
    elevation: 1,
  },
  noShopsText: {
    fontSize: FontSize.Body,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
  },
  noShopsSubText: {
    fontSize: FontSize.Caption,
    color: Colors.grey,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Dashboard;
