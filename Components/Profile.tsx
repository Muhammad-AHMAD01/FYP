// screens/ProfilePage.tsx
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Input from '../Abstracts/TextInputs';
import Button from '../Abstracts/Button';
import Container from '../Abstracts/Container';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { Colors, FontSize } from '../Theme';
import { useNavigation } from '@react-navigation/native';
import ValidText from '../Abstracts/ValidText';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HeaderBar from '../Abstracts/HeaderBar';

type ProfilePageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const ProfilePage: React.FC = () => {
  const navigation = useNavigation<ProfilePageNavigationProp>();
  const { width } = useWindowDimensions();

  const [editMode, setEditMode] = useState(false);
  const [profilePic, setProfilePic] = useState(
    'https://randomuser.me/api/portraits/men/1.jpg',
  );
  const [userName, setUserName] = useState('John Doe');
  const [phone, setPhone] = useState('+923001234567');
  const [dob, setDob] = useState(new Date('1990-01-01'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (response.assets && response.assets.length > 0) {
        setProfilePic(response.assets[0].uri || profilePic);
      }
    });
  }, [profilePic]);

  const validateForm = useCallback(() => {
    if (!userName.trim()) {
      Toast.show({ type: 'error', text1: 'Full Name is required' });
      return false;
    }
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Enter a valid format like +923001234567',
      });
      return false;
    }
    return true;
  }, [userName, phone]);

  const toggleEditSave = useCallback(() => {
    if (editMode) {
      if (!validateForm()) return;
      Toast.show({ type: 'success', text1: 'Profile saved' });
    }
    setEditMode(prev => !prev);
  }, [editMode, validateForm]);

  const onChangeDate = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (!selectedDate) return;
    }
    if (selectedDate) setDob(selectedDate);
  }, []);

  const formatDate = useCallback(
    (date: Date) =>
      date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );

  // 🔹 Field Renderer
  const renderField = useCallback(
    (
      label: string,
      value: string | Date,
      setter?: (val: string) => void,
      isDate?: boolean,
      iconName?: string,
      editable: boolean = true,
    ) => {
      const displayValue = isDate
        ? formatDate(value as Date)
        : (value as string);
      const canEdit = editMode && editable;

      return (
        <View style={styles.fieldWrapper} key={label}>
          <ValidText text={label} style={styles.label} />

          {isDate ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => canEdit && setShowDatePicker(true)}
            >
              <Input
                value={displayValue}
                setValue={undefined}
                placeholder={label}
                editable={false}
                backgroundColor={Colors.offwhite}
                borderRadius={12}
                fontSize={FontSize.Body}
                paddingHorizontal={iconName ? 40 : 14}
                style={styles.input}
              />
              {iconName && (
                <Icon
                  name={iconName}
                  size={20}
                  color={Colors.grey}
                  style={styles.inputIcon}
                />
              )}
            </TouchableOpacity>
          ) : (
            <View>
              <Input
                value={displayValue}
                setValue={canEdit && setter ? setter : undefined}
                placeholder={label}
                editable={canEdit}
                backgroundColor={Colors.offwhite}
                borderRadius={12}
                fontSize={FontSize.Body}
                paddingHorizontal={iconName ? 40 : 14}
                style={styles.input}
              />
              {iconName && (
                <Icon
                  name={iconName}
                  size={20}
                  color={Colors.grey}
                  style={styles.inputIcon}
                />
              )}
            </View>
          )}
        </View>
      );
    },
    [editMode, formatDate],
  );
  const renderReadOnlyField = useCallback(
    (label: string, value: string) => (
      <View style={styles.fieldWrapper}>
        <ValidText text={label} style={styles.label} />
        <View style={styles.readonlyBox}>
          <ValidText text={value} style={styles.readonlyText} />
        </View>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Container style={styles.container}>
        <HeaderBar title="Profile" showBack={true} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Pic */}
          <View style={styles.profilePicContainer}>
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
            {editMode && (
              <TouchableOpacity
                style={styles.cameraOverlay}
                onPress={pickImage}
              >
                <Icon name="camera-alt" size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentWrapper}>
            <ValidText text="Personal Info" style={styles.sectionTitle} />

            {renderField('Full Name', userName, setUserName, false, 'person')}
            {renderField(
              'Email',
              'john.doe@example.com',
              undefined,
              false,
              'email',
              false, // ❌ always readonly
            )}
            {renderField('Phone Number', phone, setPhone, false, 'phone')}
            {renderField(
              'Date of Birth',
              dob,
              undefined,
              true,
              'calendar-today',
            )}

            <ValidText text="Work Info" style={styles.sectionTitle} />
            <View style={styles.workRow}>
              <View style={styles.workCol}>
                {renderReadOnlyField('Employee Number', 'EMP 1235')}
              </View>
              <View style={styles.workCol}>
                {renderReadOnlyField('Date of Joining', 'Jun 1, 2023')}
              </View>
            </View>

            <View style={styles.buttonsRow}>
              <Button
                text={editMode ? 'Save Changes' : 'Edit Profile'}
                width="100%"
                backgroundColor={editMode ? Colors.primaryblue : Colors.green}
                color={Colors.white}
                fontSize={FontSize.Button}
                paddingVertical={12}
                borderRadius={10}
                onPress={toggleEditSave}
                style={styles.primaryButton}
                TextIcon={() => (
                  <Icon
                    name={editMode ? 'save' : 'edit'}
                    size={20}
                    color={Colors.white}
                  />
                )}
              />
              <Button
                text="Change Password"
                width="100%"
                backgroundColor={Colors.orange}
                color={Colors.white}
                fontSize={FontSize.Button}
                paddingVertical={12}
                borderRadius={10}
                onPress={() => navigation.navigate('ChangePassword')}
                style={[styles.primaryButton, { marginTop: 10 }]}
                TextIcon={() => (
                  <Icon name="lock" size={20} color={Colors.white} />
                )}
              />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </ScrollView>

        <Toast />
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.offwhite, flex: 1 },
  safe: { flex: 1, paddingTop: StatusBar.currentHeight ?? 0 },

  scrollContent: { padding: 20, alignItems: 'center' },

  profilePicContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePic: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primaryblue,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.primaryblue,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.white,
  },

  contentWrapper: { width: '100%', maxWidth: 700 },

  sectionTitle: {
    fontSize: FontSize.H2,
    fontWeight: '600',
    color: Colors.primaryblue,
    marginBottom: 10,
    textAlign: 'center',
  },
  readonlyBox: {
    minHeight: 47,
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.offwhite,
    borderWidth: 1,
    borderColor: Colors.grey,
  },
  readonlyText: {
    fontSize: FontSize.Body,
    color: Colors.black,
    lineHeight: 20,
  },

  fieldWrapper: { marginBottom: 4, },
  label: { fontSize: FontSize.Body, color: Colors.grey, marginBottom: 6 },

  input: { height: 48, paddingVertical: 0, color: Colors.black, width:'100%' },
  inputIcon: { position: 'absolute', left: 12, top: 14 },

  workRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '4%',
    marginBottom: '3%',
  },
  workCol: {
    flex: 1,
  },

  buttonsRow: { marginTop: 0 },
  primaryButton: { alignSelf: 'center', width: '100%' },
});

export default ProfilePage;
