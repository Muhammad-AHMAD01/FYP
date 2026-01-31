import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  MapView,
  Camera,
  PointAnnotation,
  CameraRef,
  ShapeSource,
  LineLayer,
} from '@maplibre/maplibre-react-native';
import Toast from 'react-native-toast-message';

import Container from '../Abstracts/Container';
import ValidText from '../Abstracts/ValidText';
import ShopCard from '../Components/ShopCard';
import { Colors, FontSize } from '../Theme';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shop } from '../types/shop';
import HeaderBar from '../Abstracts/HeaderBar';

type ShopsProps = NativeStackScreenProps<RootStackParamList, 'Shops'>;

const { width } = Dimensions.get('window');

const ShopsScreen: React.FC<ShopsProps> = ({ route, navigation }) => {
  const { shops, onUpdate } = route.params;

  const [shopList, setShopList] = useState<Shop[]>(shops);
  const [selectedShopIndex, setSelectedShopIndex] = useState(0);
  const [filterToday, setFilterToday] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [routeCoords, setRouteCoords] = useState<number[][]>([]);

  const pagerRef = useRef<PagerView>(null);
  const flatListRef = useRef<FlatList<Shop>>(null);
  const cameraRef = useRef<CameraRef>(null);

  /** Mock coords near Faisalabad */
  const getMockCoords = (index: number): [number, number] => {
    const baseLng = 73.0551;
    const baseLat = 31.4181;
    return [baseLng + 0.01 * (index % 5), baseLat + 0.01 * (index % 5)];
  };

  const getShopCoords = (
    shop: Shop | undefined,
    idx: number,
  ): [number, number] =>
    shop?.location
      ? [shop.location.lng, shop.location.lat]
      : getMockCoords(idx);

  const fetchRoute = async (start: number[], end: number[]) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes && json.routes.length > 0) {
        return json.routes[0].geometry.coordinates as number[][];
      }
    } catch (e) {
      console.warn('Route fetch error:', e);
    }
    return [];
  };

  useEffect(() => {
    const buildRoute = async () => {
      const visited = shopList.filter(s => s.status === 'Visited');
      if (visited.length < 2) {
        setRouteCoords([]);
        return;
      }

      let allCoords: number[][] = [];
      for (let i = 0; i < visited.length - 1; i++) {
        const start = getShopCoords(visited[i], i);
        const end = getShopCoords(visited[i + 1], i + 1);
        const segment = await fetchRoute(start, end);
        allCoords = [...allCoords, ...segment];
      }
      setRouteCoords(allCoords);

      const last = visited[visited.length - 1];
      if (last) {
        const coords = getShopCoords(last, visited.length - 1);
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: 15,
          animationDuration: 1200,
        });
      }
    };

    buildRoute();
  }, [shopList]);

  const routeGeoJSON = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: routeCoords,
        },
        properties: {},
      },
    ],
  };

  const todayShops = useMemo(() => {
    if (!filterToday) return shopList;
    const today = new Date().toDateString();
    return shopList.filter(
      s => s.lastVisited && new Date(s.lastVisited).toDateString() === today,
    );
  }, [shopList, filterToday]);

  const handleMarkerPress = (index: number) => {
    setSelectedShopIndex(index);
    const shop = todayShops[index];
    if (shop) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      flyTo(shop, index);
    }
  };

  const flyTo = (shop: Shop, idx: number) => {
    const coords = getShopCoords(shop, idx);
    cameraRef.current?.setCamera({
      centerCoordinate: coords,
      zoomLevel: 15,
      animationDuration: 1200,
    });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== selectedShopIndex) {
      setSelectedShopIndex(newIndex);
      const shop = todayShops[newIndex];
      if (shop) flyTo(shop, newIndex);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderBar title="Assigned Shops" showBack={true} />

      <View style={styles.tabRow}>
        {['List View', 'Map View'].map((tab, idx) => {
          const isActive = activePage === idx;
          return (
            <Pressable
              key={tab}
              onPress={() => {
                pagerRef.current?.setPage(idx);
                setActivePage(idx);
              }}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={e => setActivePage(e.nativeEvent.position)}
      >
        <View key="1">
          <Container>
            {shopList.length === 0 ? (
              <View style={styles.emptyBox}>
                <ValidText
                  text="No shop is assigned"
                  style={styles.emptyText}
                />
              </View>
            ) : (
              <FlatList
                data={shopList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{ flex: 1, margin: 6 }}>
                    <ShopCard
                      shop={item}
                      onMarkVisited={(id: string) => {
                        const updated = shopList.map(s =>
                          s.id === id
                            ? {
                                ...s,
                                status: 'Visited' as const,
                                lastVisited: new Date().toISOString(),
                              }
                            : s,
                        );
                        setShopList(updated);
                        onUpdate?.(updated);
                        Toast.show({
                          type: 'success',
                          text1: `${item.name} visited`,
                          visibilityTime: 2000,
                          position: 'top',
                        });
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Container>
        </View>

        <View key="2" style={{ flex: 1 }}>
          {todayShops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ValidText
                text="No shop is assigned to display on map"
                style={styles.emptyText}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setFilterToday(prev => !prev)}
              >
                <Text style={styles.filterText}>
                  {filterToday ? 'Show All Shops' : 'Show Today’s Shops'}
                </Text>
              </TouchableOpacity>

              <MapView
                style={StyleSheet.absoluteFillObject}
                mapStyle="https://api.maptiler.com/maps/streets/style.json?key=d32QYUyZavtY6E2jfGra"
              >
                <Camera
                  ref={cameraRef}
                  zoomLevel={14}
                  centerCoordinate={getMockCoords(selectedShopIndex)}
                />

                {routeCoords.length > 0 && (
                  <ShapeSource id="routeSource" shape={routeGeoJSON}>
                    <LineLayer
                      id="routeLayer"
                      style={{
                        lineColor: Colors.primaryblue,
                        lineWidth: 5,
                      }}
                    />
                  </ShapeSource>
                )}

                {todayShops.map((shop, index) => {
                  const coords = getShopCoords(shop, index);
                  return (
                    <PointAnnotation
                      key={`${shop.id}-${shop.status}`}
                      id={shop.id}
                      coordinate={coords}
                      onSelected={() => handleMarkerPress(index)}
                    >
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          name="location-on"
                          size={34}
                          color={
                            shop.status === 'Visited'
                              ? Colors.green
                              : Colors.red
                          }
                        />
                      </View>
                    </PointAnnotation>
                  );
                })}
              </MapView>

              <View style={styles.shopCardContainer}>
                <FlatList
                  ref={flatListRef}
                  data={todayShops}
                  keyExtractor={item => item.id}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleMarkerPress(index)}
                      style={styles.card}
                    >
                      <View style={styles.cardHeader}>
                        <ValidText text={item.name} style={styles.shopName} />
                        {item.lastVisited && (
                          <ValidText
                            text={new Date(item.lastVisited).toLocaleString()}
                            style={styles.dateTime}
                          />
                        )}
                      </View>
                      <ValidText text={item.owner} style={styles.shopDetails} />
                      <ValidText text={item.phone} style={styles.shopDetails} />
                      <ValidText
                        text={item.address}
                        style={styles.shopDetails}
                      />
                    </TouchableOpacity>
                  )}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width}
                  decelerationRate="fast"
                  onMomentumScrollEnd={onScrollEnd}
                />
              </View>
            </>
          )}
        </View>
      </PagerView>

      <Toast />
    </SafeAreaView>
  );
};

export default ShopsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offwhite },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    elevation: 2,
    borderRadius: 12,
    margin: 10,
  },
  backBtn: { marginRight: 10 },
  topBarTitle: {
    fontSize: FontSize.H2,
    fontWeight: '700',
    color: Colors.black,
  },

  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: 4,
    marginHorizontal: '5%',
    marginBottom: 12,
    borderRadius: 30,
    elevation: 2,
    marginTop: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.primaryblue,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: FontSize.Body,
    fontWeight: '600',
    color: Colors.grey,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },

  shopCardContainer: { position: 'absolute', bottom: 10 },

  filterBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: Colors.primaryblue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  filterText: {
    color: Colors.white,
    fontSize: FontSize.Caption,
    fontWeight: '600',
  },

  card: {
    width: width - 20,
    marginHorizontal: 10,
    backgroundColor: '#f7faff',
    borderLeftWidth: 6,
    borderLeftColor: Colors.primaryblue,
    padding: 10,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: FontSize.H3,
    fontWeight: '700',
    color: Colors.primaryblue,
  },
  dateTime: {
    fontSize: FontSize.Caption,
    color: Colors.white,
    backgroundColor: Colors.primaryblue,
    padding: 5,
    borderRadius: 10,
  },
  shopDetails: { fontSize: FontSize.Body, color: Colors.grey },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: FontSize.Body,
    color: Colors.grey,
    fontWeight: '600',
  },
});
