import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Button from '../Abstracts/Button';
import ValidText from '../Abstracts/ValidText';
import Container from '../Abstracts/Container';
import { Colors, FontSize } from '../Theme';
import { Shop } from '../types/shop';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ShopCardProps {
  shop: Shop;
  onMarkVisited?: (shopId: string) => void;
  style?: ViewStyle;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onMarkVisited, style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const visited = shop.status === 'Visited';

  return (
    <>
      <Container
        style={[styles.card, visited ? styles.visited : styles.pending, style]}
        paddingHorizontal={16}
        paddingVertical={16}
      >
        <View style={styles.header}>
          <ValidText text={shop.name} style={styles.shopName} />
          <View
            style={[
              styles.statusPill,
              visited ? styles.visitedPill : styles.pendingPill,
            ]}
          >
            <ValidText
              text={visited ? 'Visited' : 'Pending'}
              style={[
                styles.statusText,
                { color: visited ? Colors.green : Colors.primaryblue },
              ]}
            />
          </View>
        </View>

        <ValidText text={`Owner: ${shop.owner}`} style={styles.shopDetail} />
        {/* <ValidText
          text={`Address: ${shop.address}`}
          style={styles.shopDetail}
        />
        <ValidText
          text={`Phone: ${shop.phone ?? '-'}`}
          style={styles.shopDetail}
        />
        {visited && (
          <ValidText
            text={`Last Visited: ${shop.lastVisited ?? '-'}`}
            style={styles.visitedText}
          />
        )} */}

        <View style={styles.footer}>
          <Button
            text="Details"
            onPress={() => setModalVisible(true)}
            backgroundColor={visited ? '#f3faf5' : '#faf3ff'}
            color={visited ? Colors.green : Colors.primaryblue}
            width="48%"
            height={42}
            borderRadius={10}
            elevation={2}
            fontSize={FontSize.Button}
          />
          {onMarkVisited && (
            <Button
              text={visited ? 'Visited' : 'Mark Visit'}
              onPress={() => !visited && onMarkVisited(shop.id)}
              backgroundColor={visited ? '#f0f0f0' : Colors.primaryblue}
              color={visited ? Colors.grey : Colors.white}
              width="48%"
              height={42}
              borderRadius={10}
              elevation={2}
              fontSize={FontSize.Button}
            />
          )}
        </View>
      </Container>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              visited ? styles.visited : styles.pending,
            ]}
          >
            <View style={styles.modalHeader}>
              <ValidText text="Shop Details" style={styles.modalTitle} />
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={22} color={Colors.grey} />
              </TouchableOpacity>
            </View>

            <ValidText text={`Name: ${shop.name}`} style={styles.modalText} />
            <ValidText text={`Owner: ${shop.owner}`} style={styles.modalText} />
            <ValidText
              text={`Address: ${shop.address}`}
              style={styles.modalText}
            />
            <ValidText
              text={`Phone: ${shop.phone ?? '-'}`}
              style={styles.modalText}
            />
            <ValidText
              text={`Status: ${shop.status}`}
              style={styles.modalText}
            />
            {shop.lastVisited && (
              <ValidText
                text={`Last Visited: ${shop.lastVisited}`}
                style={styles.modalText}
              />
            )}

            <Button
              text="Close"
              onPress={()=>setModalVisible(false)}
              backgroundColor={visited ? '#f3faf5' : '#faf3ff'}
              color={visited ? Colors.green : Colors.primaryblue}
              width="100%"
              height={42}
              borderRadius={10}
              fontSize={FontSize.Button}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    elevation: 3,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 12,
  },
  visited: {
    borderLeftWidth: 6,
    borderLeftColor: Colors.green,
    backgroundColor: '#f3faf5',
  },
  pending: {
    borderLeftWidth: 6,
    borderLeftColor: Colors.primaryblue,
    backgroundColor: '#f7faff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  shopName: {
    fontSize: FontSize.Subhead,
    fontWeight: '700',
    color: Colors.black,
    flex: 1,
    marginRight: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    elevation: 1,
  },
  visitedPill: { backgroundColor: '#e0f5e8' },
  pendingPill: { backgroundColor: '#e7f0ff' },
  statusText: { fontSize: FontSize.Caption, fontWeight: '700' },
  shopDetail: {
    fontSize: FontSize.Body,
    color: Colors.grey,
    marginBottom: 4,
  },
  visitedText: {
    fontSize: FontSize.Caption,
    color: Colors.green,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 14,
    padding: 20,
    width: '100%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: FontSize.H3,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    flex: 1,
  },
  modalText: {
    fontSize: FontSize.Body,
    color: Colors.black,
    marginBottom: 8,
  },
});

export default ShopCard;
