import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type ExpenseItem = { id: string; name: string; cents: number };
type Expense = { id: string; merchant: string; date: string; category: string; cents: number; time: string };
type IconName = React.ComponentProps<typeof Feather>['name'];

const C = {
  canvas: '#F4F1EA', white: '#FFFFFF', navy: '#0F172A', muted: '#64748B', faint: '#94A3A1',
  green: '#10B981', greenDark: '#008F68', greenPale: '#DDF3EB', border: '#E4E1DB',
  input: '#F8F7F4', red: '#E36B65',
};
const categories = ['Food & Dining', 'Groceries', 'Transport', 'Shopping', 'Travel', 'Health', 'Other'];
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const initialItems: ExpenseItem[] = [
  { id: '1', name: 'Avocado toast', cents: 1400 },
  { id: '2', name: 'Cappuccino', cents: 650 },
  { id: '3', name: 'Banana pancakes', cents: 800 },
];
const initialExpenses: Expense[] = [
  { id: 'a', merchant: 'Cafe Kumbuk', date: 'Today, 10:42 AM', category: 'Food & Dining', cents: 2850, time: '10:42 AM' },
  { id: 'b', merchant: 'Keells Super', date: 'Yesterday, 6:18 PM', category: 'Groceries', cents: 6420, time: '6:18 PM' },
  { id: 'c', merchant: 'Uber', date: 'Nov 22, 2026', category: 'Transport', cents: 1280, time: '' },
  { id: 'd', merchant: 'The Good Market', date: 'Nov 21, 2026', category: 'Shopping', cents: 3500, time: '' },
];

function AppContent() {
  const [screen, setScreen] = useState<'expenses' | 'review'>('expenses');
  const [activeTab, setActiveTab] = useState('Expenses');
  const [expenses, setExpenses] = useState(initialExpenses);
  const [merchant, setMerchant] = useState('Cafe Kumbuk');
  const [date, setDate] = useState('Nov 24, 2026');
  const [category, setCategory] = useState('Food & Dining');
  const [items, setItems] = useState(initialItems);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [scanOptionsOpen, setScanOptionsOpen] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.cents, 0), [items]);

  function openReview(uri: string | null) {
    Keyboard.dismiss();
    setReceiptUri(uri);
    setMerchant('Cafe Kumbuk');
    setDate('Nov 24, 2026');
    setCategory('Food & Dining');
    setItems(initialItems.map(item => ({ ...item, id: newId() })));
    setScreen('review');
    setLoading(true);
    setTimeout(() => setLoading(false), 850);
  }

  async function pickReceipt(source: 'camera' | 'gallery') {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', `Allow ${source === 'camera' ? 'camera' : 'photo library'} access to add a receipt.`);
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      if (!result.canceled) openReview(result.assets[0]?.uri ?? null);
    } catch {
      Alert.alert('Could not open image picker', 'Please try again.');
    }
  }

  function updateItem(id: string, patch: Partial<ExpenseItem>) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function updatePrice(id: string, value: string) {
    const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
    const [whole = '', ...fractionParts] = normalized.split('.');
    const fraction = fractionParts.join('').slice(0, 2);
    const parsed = Number(`${whole || '0'}${fraction ? `.${fraction}` : ''}`);
    updateItem(id, { cents: Number.isFinite(parsed) ? Math.round(parsed * 100) : 0 });
  }

  function addItem() {
    setItems(current => [...current, { id: newId(), name: '', cents: 0 }]);
  }

  function saveExpense() {
    Keyboard.dismiss();
    const cleanedMerchant = merchant.trim();
    const cleanedItems = items.map(item => ({ ...item, name: item.name.trim() }));
    if (!cleanedMerchant) return Alert.alert('Merchant required', 'Enter a merchant name before saving.');
    if (!date.trim()) return Alert.alert('Date required', 'Enter the receipt date before saving.');
    if (!cleanedItems.length) return Alert.alert('Add an item', 'Add at least one receipt item before saving.');
    if (cleanedItems.some(item => !item.name || item.cents <= 0)) return Alert.alert('Check your items', 'Each item needs a name and a price greater than $0.00.');
    const amount = cleanedItems.reduce((sum, item) => sum + item.cents, 0);
    if (!Number.isSafeInteger(amount) || amount <= 0) return Alert.alert('Invalid total', 'The total must be a valid amount greater than $0.00.');
    setExpenses(current => [{ id: newId(), merchant: cleanedMerchant, date: 'Today, just now', category, cents: amount, time: '' }, ...current]);
    setScreen('expenses');
    setActiveTab('Expenses');
    Alert.alert('Expense saved', `${cleanedMerchant} · ${money(amount)} added to recent activity.`);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ExpoStatusBar style="dark" backgroundColor={C.canvas} />
        {screen === 'expenses' ? (
          <ExpensesScreen expenses={expenses} onPick={pickReceipt} onScan={() => setScanOptionsOpen(true)} activeTab={activeTab} onTab={setActiveTab} />
        ) : (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 2 : 16}>
            <ReviewScreen
              merchant={merchant} setMerchant={setMerchant} date={date} setDate={setDate} category={category}
              items={items} total={total} receiptUri={receiptUri} loading={loading}
              onBack={() => { Keyboard.dismiss(); setScreen('expenses'); }}
              onCategory={() => setCategoryOpen(true)} onUpdateItem={updateItem} onUpdatePrice={updatePrice}
              onAdd={addItem} onDelete={(id) => setItems(current => current.filter(item => item.id !== id))} onSave={saveExpense}
            />
          </KeyboardAvoidingView>
        )}
        <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCategoryOpen(false)}>
            <View style={styles.categorySheet}>
              <Text style={styles.sheetTitle}>Choose a category</Text>
              {categories.map(option => (
                <Pressable key={option} style={styles.categoryOption} onPress={() => { setCategory(option); setCategoryOpen(false); }}>
                  <Text style={[styles.categoryOptionText, option === category && styles.selectedCategoryText]}>{option}</Text>
                  {option === category && <Feather name="check" size={18} color={C.greenDark} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
        <Modal visible={scanOptionsOpen} transparent animationType="fade" onRequestClose={() => setScanOptionsOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setScanOptionsOpen(false)}>
            <View style={styles.categorySheet}>
              <Text style={styles.sheetTitle}>Add a receipt</Text>
              <Text style={styles.scanSheetHint}>Choose how you’d like to add your bill.</Text>
              <Pressable style={styles.scanOption} onPress={() => { setScanOptionsOpen(false); pickReceipt('camera'); }}>
                <View style={styles.scanOptionIcon}><Feather name="camera" size={19} color={C.greenDark} /></View>
                <View style={styles.scanOptionCopy}><Text style={styles.scanOptionTitle}>Take a photo</Text><Text style={styles.scanOptionSubtitle}>Use your camera to scan a receipt</Text></View>
                <Feather name="chevron-right" size={18} color={C.muted} />
              </Pressable>
              <Pressable style={styles.scanOption} onPress={() => { setScanOptionsOpen(false); pickReceipt('gallery'); }}>
                <View style={styles.scanOptionIcon}><Feather name="image" size={19} color={C.greenDark} /></View>
                <View style={styles.scanOptionCopy}><Text style={styles.scanOptionTitle}>Choose from gallery</Text><Text style={styles.scanOptionSubtitle}>Select a receipt photo from your device</Text></View>
                <Feather name="chevron-right" size={18} color={C.muted} />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ExpensesScreen({ expenses, onPick, onScan, activeTab, onTab }: {
  expenses: Expense[]; onPick: (source: 'camera' | 'gallery') => void; onScan: () => void; activeTab: string; onTab: (tab: string) => void;
}) {
  const iconData: { icon: IconName; color: string; bg: string }[] = [
    { icon: 'coffee', color: '#07966D', bg: '#DFF3EA' }, { icon: 'shopping-bag', color: '#8752B3', bg: '#EFE7F7' },
    { icon: 'truck', color: '#24416B', bg: '#E3EBF5' }, { icon: 'shopping-bag', color: '#AF6826', bg: '#F8EBDC' },
  ];
  const tabs: { name: string; icon: IconName }[] = [
    { name: 'Home', icon: 'home' }, { name: 'Expenses', icon: 'clipboard' }, { name: 'Insights', icon: 'bar-chart-2' }, { name: 'Profile', icon: 'user' },
  ];
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.expensesContent} showsVerticalScrollIndicator={false}>
        <View style={styles.expenseHeader}>
          <View><Text style={styles.eyebrow}>KOIN</Text><Text style={styles.pageTitle}>Expenses</Text></View>
          <Pressable onPress={onScan} style={styles.scanButton}><Feather name="plus" size={18} color={C.navy} /><Text style={styles.scanButtonText}>Scan Bill</Text></Pressable>
        </View>
        <View style={styles.uploadCard}>
          <View style={styles.receiptBadge}><Feather name="clipboard" size={21} color={C.greenDark} /></View>
          <Text style={styles.uploadTitle}>Upload or Snap a Bill</Text>
          <Text style={styles.uploadSubtitle}>Less typing. More living.</Text>
          <View style={styles.uploadActions}>
            <Pressable style={styles.uploadAction} onPress={() => onPick('camera')}><Feather name="camera" size={16} color={C.navy} /><Text style={styles.uploadActionText}>Camera</Text></Pressable>
            <Pressable style={styles.uploadAction} onPress={() => onPick('gallery')}><Feather name="image" size={16} color={C.navy} /><Text style={styles.uploadActionText}>Gallery</Text></Pressable>
          </View>
        </View>
        <View style={styles.activityHeading}><Text style={styles.sectionTitle}>Recent Activity</Text><Text style={styles.weekLabel}>This week</Text></View>
        <View>
          {expenses.map((expense, index) => {
            const preset = iconData[index % iconData.length];
            return <View key={expense.id} style={[styles.activityRow, index === expenses.length - 1 && styles.lastActivityRow]}>
              <View style={[styles.activityIcon, { backgroundColor: preset.bg }]}><Feather name={preset.icon} size={20} color={preset.color} /></View>
              <View style={styles.activityDetails}><Text style={styles.merchantName} numberOfLines={1}>{expense.merchant}</Text><Text style={styles.activityDate}>{expense.date}</Text></View>
              <Text style={styles.activityAmount}>{money(expense.cents)}</Text>
            </View>;
          })}
        </View>
      </ScrollView>
      <View style={styles.bottomTabs}>
        {tabs.map(tab => <Pressable key={tab.name} style={styles.tabButton} onPress={() => onTab(tab.name)}>
          <Feather name={tab.icon} size={21} color={activeTab === tab.name ? C.greenDark : '#6F7B7A'} />
          <Text style={[styles.tabLabel, activeTab === tab.name && styles.activeTabLabel]}>{tab.name}</Text>
        </Pressable>)}
      </View>
      <View style={styles.homeIndicatorWrap}><View style={styles.homeIndicator} /></View>
    </View>
  );
}

function ReviewScreen({ merchant, setMerchant, date, setDate, category, items, total, receiptUri, loading, onBack, onCategory, onUpdateItem, onUpdatePrice, onAdd, onDelete, onSave }: {
  merchant: string; setMerchant: (value: string) => void; date: string; setDate: (value: string) => void; category: string; items: ExpenseItem[];
  total: number; receiptUri: string | null; loading: boolean; onBack: () => void; onCategory: () => void;
  onUpdateItem: (id: string, patch: Partial<ExpenseItem>) => void; onUpdatePrice: (id: string, value: string) => void;
  onAdd: () => void; onDelete: (id: string) => void; onSave: () => void;
}) {
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.reviewContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.reviewHeader}>
          <Pressable style={styles.backButton} onPress={onBack} hitSlop={10}><Feather name="arrow-left" size={21} color={C.navy} /></Pressable>
          <Text style={styles.reviewTitle}>Review Receipt</Text>
          <View style={styles.receiptPreview}>
            {receiptUri ? <Image source={{ uri: receiptUri }} style={styles.receiptImage} /> : <View style={styles.receiptPaper}><View style={styles.paperNotch} /><Text style={styles.paperTitle}>CAFE{`\n`}KUMBUK</Text><View style={styles.paperLine} /><Text style={styles.paperText}>Avocado toast   14.00</Text><Text style={styles.paperText}>Cappuccino       6.50</Text><Text style={styles.paperText}>Banana pancakes  8.00</Text><View style={styles.paperLine} /><Text style={styles.paperTotal}>TOTAL     28.50</Text></View>}
          </View>
        </View>
        {loading && <View style={styles.loadingBanner}><Feather name="loader" size={14} color={C.greenDark} /><Text style={styles.loadingText}>Reading receipt…</Text></View>}
        <View style={styles.summaryCard}>
          <Text style={styles.fieldLabel}>Merchant Name</Text>
          <View style={styles.merchantEditRow}>
            <TextInput value={merchant} onChangeText={setMerchant} style={styles.merchantInput} placeholder="Merchant name" placeholderTextColor={C.faint} returnKeyType="done" />
            <Feather name="edit-2" size={16} color="#60716F" />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottom}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateEditRow}><TextInput value={date} onChangeText={setDate} style={styles.dateInput} placeholder="Receipt date" placeholderTextColor={C.faint} returnKeyType="done" /><Feather name="calendar" size={15} color="#60716F" /></View>
            </View>
            <View style={styles.categoryField}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Pressable onPress={onCategory} style={styles.categoryPill}><Text style={styles.categoryText} numberOfLines={1}>{category}</Text><Feather name="chevron-down" size={14} color={C.greenDark} /></Pressable>
            </View>
          </View>
        </View>
        <View style={styles.itemsHeading}><Text style={styles.sectionTitle}>Extracted Items</Text><Text style={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text></View>
        {items.map((item, index) => <View key={item.id} style={[styles.itemRow, index === items.length - 1 && styles.lastItemRow]}>
          <TextInput value={item.name} onChangeText={value => onUpdateItem(item.id, { name: value })} style={styles.itemNameInput} placeholder="Item name" placeholderTextColor={C.faint} returnKeyType="done" />
          <View style={styles.priceBox}><Text style={styles.dollarSign}>$</Text><TextInput value={(item.cents / 100).toFixed(2)} onChangeText={value => onUpdatePrice(item.id, value)} style={styles.priceInput} keyboardType="decimal-pad" selectTextOnFocus /></View>
          <Pressable onPress={() => onDelete(item.id)} style={styles.deleteButton} hitSlop={7} accessibilityLabel={`Delete ${item.name || 'item'}`}><Feather name="trash-2" size={17} color="#697A78" /></Pressable>
        </View>)}
        <Pressable onPress={onAdd} style={styles.addButton}><Feather name="plus" size={18} color={C.greenDark} /><Text style={styles.addText}>Add Item</Text></Pressable>
        <View style={styles.helperRow}><Feather name="check" size={14} color="#72807E" /><Text style={styles.helperText}>All set? Give your items a quick check.</Text></View>
      </ScrollView>
      <View style={styles.saveBar}>
        <View style={styles.totalRow}><View><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalAmount}>{money(total)}</Text></View><View style={styles.totalItemCount}><Feather name="check" size={14} color={C.greenDark} /><Text style={styles.totalItemText}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text></View></View>
        <Pressable onPress={onSave} style={styles.confirmButton}><Feather name="check" size={17} color="#062D24" /><Text style={styles.confirmText}>Confirm &amp; Save Expense</Text></Pressable>
        {Platform.OS === 'ios' && <View style={styles.reviewIndicatorWrap}><View style={styles.homeIndicator} /></View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas }, flex: { flex: 1 },
  expensesContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  expenseHeader: { height: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: C.greenDark, fontSize: 10, lineHeight: 14, letterSpacing: 2, fontWeight: '800' },
  pageTitle: { color: C.navy, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  scanButton: { height: 42, paddingHorizontal: 16, backgroundColor: C.green, borderRadius: 24, flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 },
  scanButtonText: { color: C.navy, fontSize: 13, fontWeight: '600' },
  uploadCard: { height: 220, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#8CCDB3', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  receiptBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.greenPale, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadTitle: { color: C.navy, fontSize: 18, fontWeight: '700', marginBottom: 6 }, uploadSubtitle: { color: '#75817F', fontSize: 12, marginBottom: 14 },
  uploadActions: { flexDirection: 'row', gap: 10 }, uploadAction: { height: 40, minWidth: 108, borderRadius: 11, borderWidth: 1, borderColor: '#DCDAD4', backgroundColor: '#F5F3EE', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  uploadActionText: { color: C.navy, fontSize: 13, fontWeight: '500' },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { color: C.navy, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 }, weekLabel: { color: '#667371', fontSize: 11 },
  activityRow: { height: 71, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D7D4CD' }, lastActivityRow: { borderBottomWidth: 0 }, activityIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityDetails: { flex: 1, minWidth: 0, gap: 4 }, merchantName: { color: C.navy, fontSize: 14, fontWeight: '500' }, activityDate: { color: '#77827F', fontSize: 11 }, activityAmount: { color: C.navy, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bottomTabs: { height: 64, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: '#E4E1DB', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, tabLabel: { fontSize: 10, color: '#64716F' }, activeTabLabel: { color: C.greenDark, fontWeight: '700' }, homeIndicatorWrap: { height: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, homeIndicator: { height: 4, width: 132, borderRadius: 4, backgroundColor: '#07113D' },
  reviewContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }, reviewHeader: { height: 54, flexDirection: 'row', alignItems: 'center', marginBottom: 21 }, backButton: { width: 34, height: 40, justifyContent: 'center', marginRight: 9 }, reviewTitle: { color: C.navy, fontSize: 21, fontWeight: '700', flex: 1, letterSpacing: -0.3 }, receiptPreview: { width: 40, height: 48, backgroundColor: '#3D4743', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, receiptImage: { width: '100%', height: '100%', resizeMode: 'cover' }, receiptPaper: { width: 28, height: 40, backgroundColor: '#F1EFE8', borderRadius: 2, paddingHorizontal: 3, paddingTop: 4 }, paperNotch: { position: 'absolute', top: -2, right: 4, width: 7, height: 5, backgroundColor: '#3D4743', transform: [{ rotate: '18deg' }] }, paperTitle: { fontSize: 5, lineHeight: 6, color: '#3F4944', fontWeight: '800', textAlign: 'center', marginBottom: 3 }, paperLine: { height: 1, backgroundColor: '#ADB3AC', marginVertical: 2 }, paperText: { fontSize: 3.3, color: '#515D56', lineHeight: 5 }, paperTotal: { fontSize: 4, color: '#303A34', fontWeight: '700' },
  loadingBanner: { backgroundColor: '#E5F7F0', borderRadius: 9, height: 32, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, marginBottom: 12 }, loadingText: { color: C.greenDark, fontSize: 12, fontWeight: '500' },
  summaryCard: { backgroundColor: C.white, borderWidth: 1, borderColor: '#DFDDD7', borderRadius: 17, paddingHorizontal: 16, paddingTop: 17, paddingBottom: 15, marginBottom: 25 }, fieldLabel: { color: '#677471', fontSize: 11, marginBottom: 7 }, merchantEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, merchantInput: { flex: 1, color: C.navy, fontSize: 16, fontWeight: '500', paddingVertical: 0 }, summaryDivider: { height: 1, backgroundColor: '#E8E6E0', marginTop: 16, marginBottom: 16 }, summaryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, dateField: { flex: 1 }, dateEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dateInput: { color: C.navy, fontSize: 13, paddingVertical: 1, minWidth: 0, flexShrink: 1 }, categoryField: { width: 126, alignItems: 'flex-start' }, categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E4F5ED', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 18, maxWidth: 126 }, categoryText: { color: C.greenDark, fontSize: 10, fontWeight: '500', flexShrink: 1 },
  itemsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }, itemCount: { color: '#667371', fontSize: 11 }, itemRow: { height: 58, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D7D4CD', flexDirection: 'row', alignItems: 'center' }, lastItemRow: { borderBottomWidth: 0 }, itemNameInput: { flex: 1, minWidth: 0, paddingVertical: 5, color: C.navy, fontSize: 13, fontWeight: '500' }, priceBox: { width: 78, height: 36, borderWidth: 1, borderColor: '#E2DFD9', borderRadius: 9, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 9, marginLeft: 7 }, dollarSign: { color: '#687673', fontSize: 12 }, priceInput: { width: 44, padding: 0, textAlign: 'right', color: C.navy, fontSize: 12, fontVariant: ['tabular-nums'] }, deleteButton: { width: 37, height: 44, alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  addButton: { alignSelf: 'flex-start', height: 42, flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 12, marginTop: 2 }, addText: { color: C.greenDark, fontSize: 13, fontWeight: '600' }, helperRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }, helperText: { color: '#77827F', fontSize: 11 },
  saveBar: { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: '#E2DFD9', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 10 : 14 }, totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, totalLabel: { color: '#65716F', fontSize: 12, marginBottom: 4 }, totalAmount: { color: '#08133B', fontSize: 36, lineHeight: 41, letterSpacing: -1, fontWeight: '700', fontVariant: ['tabular-nums'] }, totalItemCount: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }, totalItemText: { color: C.greenDark, fontSize: 11 }, confirmButton: { height: 54, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, confirmText: { color: '#052A22', fontSize: 14, fontWeight: '700' },
  reviewIndicatorWrap: { height: 27, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'flex-end' }, categorySheet: { backgroundColor: C.white, paddingTop: 20, paddingBottom: 30, paddingHorizontal: 22, borderTopLeftRadius: 22, borderTopRightRadius: 22 }, sheetTitle: { fontSize: 18, fontWeight: '700', color: C.navy, marginBottom: 13 }, categoryOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }, categoryOptionText: { color: C.navy, fontSize: 14 }, selectedCategoryText: { color: C.greenDark, fontWeight: '600' },
  scanSheetHint: { color: C.muted, fontSize: 13, marginTop: -6, marginBottom: 12 }, scanOption: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, paddingVertical: 10 }, scanOptionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenPale, alignItems: 'center', justifyContent: 'center' }, scanOptionCopy: { flex: 1, gap: 4 }, scanOptionTitle: { color: C.navy, fontSize: 14, fontWeight: '600' }, scanOptionSubtitle: { color: C.muted, fontSize: 11 },
});

export default function App() { return <AppContent />; }
