import React, { useState, useRef, useMemo, useEffect, use } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
  Pressable,
  TouchableOpacity,
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
import { useWindowDimensions } from 'react-native';
import Container from '../Abstracts/Container';
import ValidText from '../Abstracts/ValidText';
import { Colors, FontSize } from '../Theme';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shop } from '../types/shop';
import HeaderBar from '../Abstracts/HeaderBar';

type HistoryProps = NativeStackScreenProps<RootStackParamList, 'History'>;

const HistoryScreen: React.FC<HistoryProps> = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const cardWidth = isLandscape ? width * 0.85 : width * 0.88;

  const { visitedShops } = route.params;

  const [selectedShopIndex, setSelectedShopIndex] = useState(0);
  const [filterToday, setFilterToday] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [routeCoords, setRouteCoords] = useState<number[][]>([]);

  const pagerRef = useRef<PagerView>(null);
  const flatListRef = useRef<FlatList<Shop>>(null);
  const cameraRef = useRef<CameraRef>(null);

  /** Mock coordinates if no location available */
  const getMockCoords = (index: number): [number, number] => {
    const baseLng = 73.0551;
    const baseLat = 31.4181;
    return [baseLng + 0.01 * (index % 5), baseLat + 0.01 * (index % 5)];
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
      hour12: true,
    });
  };

  const onlyVisitedShops = useMemo(
    () => visitedShops.filter(s => s.status === 'Visited'),
    [visitedShops],
  );

  const todayVisitedShops = useMemo(() => {
    if (!filterToday) return onlyVisitedShops;
    const today = new Date().toDateString();
    return onlyVisitedShops.filter(
      s => s.lastVisited && new Date(s.lastVisited).toDateString() === today,
    );
  }, [filterToday, onlyVisitedShops]);

  const getShopCoords = (shop: Shop, idx: number): [number, number] =>
    shop.location ? [shop.location.lng, shop.location.lat] : getMockCoords(idx);

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
      if (todayVisitedShops.length < 2) {
        setRouteCoords([]);
        return;
      }

      let allCoords: number[][] = [];
      for (let i = 0; i < todayVisitedShops.length - 1; i++) {
        const start = getShopCoords(todayVisitedShops[i], i);
        const end = getShopCoords(todayVisitedShops[i + 1], i + 1);
        const segment = await fetchRoute(start, end);
        allCoords = [...allCoords, ...segment];
      }
      setRouteCoords(allCoords);
    };

    buildRoute();
  }, [todayVisitedShops]);

  const flyTo = (shop: Shop, idx: number) => {
    const coords = getShopCoords(shop, idx);
    cameraRef.current?.setCamera({
      centerCoordinate: coords,
      zoomLevel: 15,
      animationDuration: 1200,
    });
  };

  const handleMarkerPress = (index: number) => {
    setSelectedShopIndex(index);
    const shop = todayVisitedShops[index];
    if (shop) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      flyTo(shop, index);
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== selectedShopIndex) {
      setSelectedShopIndex(newIndex);
      const shop = todayVisitedShops[newIndex];
      if (shop) flyTo(shop, newIndex);
    }
  };

  const renderShopCard = ({ item, index }: { item: Shop; index: number }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.9}
      onPress={() => {
        setSelectedShopIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
        flyTo(item, index);
      }}
    >
      <View style={styles.cardHeader}>
        <ValidText text={item.name} style={styles.shopName} />
        {item.lastVisited && (
          <ValidText
            text={formatDate(item.lastVisited)}
            style={styles.dateTime}
          />
        )}
      </View>
      {item.owner && <ValidText text={item.owner} style={styles.shopDetails} />}
      {item.phone && <ValidText text={item.phone} style={styles.shopDetails} />}
      <ValidText text={item.address} style={styles.shopDetails} />
    </TouchableOpacity>
  );

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Reusable HeaderBar */}
      <HeaderBar title="History" showBack={true} />

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
            {onlyVisitedShops.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ValidText
                  text="No Shop is Visited Yet"
                  style={styles.emptyText}
                />
              </View>
            ) : (
              <FlatList
                data={onlyVisitedShops}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <View style={{ marginVertical: 6 }}>
                    {renderShopCard({ item, index })}
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Container>
        </View>

        <View key="2" style={{ flex: 1 }}>
          {onlyVisitedShops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ValidText
                text="No Shop is Visited to Display on Map"
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

                {todayVisitedShops.map((shop, index) => {
                  const coords = getShopCoords(shop, index);
                  const isSelected = selectedShopIndex === index;

                  let markerColor = Colors.grey;
                  if (shop.status === 'Visited') markerColor = Colors.green;
                  if (isSelected) markerColor = Colors.red;

                  return (
                    <PointAnnotation
                      key={`${shop.id}-${shop.status}-${isSelected}`}
                      id={`${shop.id}-${index}`}
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
                          color={markerColor}
                        />
                      </View>
                    </PointAnnotation>
                  );
                })}
              </MapView>

              {todayVisitedShops.length > 0 && (
                <View style={styles.shopCardContainer}>
                  <FlatList
                    ref={flatListRef}
                    data={todayVisitedShops}
                    keyExtractor={item => item.id}
                    renderItem={renderShopCard}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={cardWidth + 20}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onScrollEnd}
                    ItemSeparatorComponent={() => (
                      <View style={{ width: 25 }} />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </PagerView>
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    //  backgroundColor: Colors.offwhite
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
    backgroundColor: '#f7faff',
    borderLeftWidth: 6,
    borderLeftColor: Colors.primaryblue,
    padding: 10,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    alignSelf: 'center',
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
    textAlign: 'center',
  },
});