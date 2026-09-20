import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const STORAGE_KEY = '@ledger_transactions_v1';

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setTransactions(JSON.parse(stored));
    } catch (e) {
      Alert.alert('Error', 'Failed to load local records.');
    }
  };

  const saveTransactions = async (newTransactions) => {
    try {
      setTransactions(newTransactions);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
    } catch (e) {
      Alert.alert('Error', 'Failed to save record.');
    }
  };

  const addTransaction = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid positive amount.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Invalid Input', 'Please specify a category.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      type,
      amount: numAmount,
      category: category.trim(),
      note: note.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [newItem, ...transactions];
    saveTransactions(updated);

    setAmount('');
    setCategory('');
    setNote('');
  };

  const deleteTransaction = (id) => {
    Alert.alert('Delete Record', 'Are you sure you want to remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const filtered = transactions.filter((item) => item.id !== id);
          saveTransactions(filtered);
        },
      },
    ]);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text
          style={[
            styles.amountText,
            item.type === 'income' ? styles.incomeText : styles.expenseText,
          ]}
        >
          {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.subText}>{item.date} {item.note ? `• ${item.note}` : ''}</Text>
        <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
          <Text style={styles.deleteBtn}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>Income & Expense Ledger</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryVal, styles.incomeText]}>
            ${totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryVal, styles.expenseText]}>
            ${totalExpense.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.summaryVal,
              netBalance >= 0 ? styles.incomeText : styles.expenseText,
            ]}
          >
            ${netBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Input Form */}
      <View style={styles.formCard}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'income' && styles.activeIncomeBtn,
            ]}
            onPress={() => setType('income')}
          >
            <Text
              style={[
                styles.typeBtnText,
                type === 'income' && styles.activeBtnText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'expense' && styles.activeExpenseBtn,
            ]}
            onPress={() => setType('expense')}
          >
            <Text
              style={[
                styles.typeBtnText,
                type === 'expense' && styles.activeBtnText,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 50.00)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (e.g. Sales, Rent)"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note / Details (Optional)"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={addTransaction}>
          <Text style={styles.submitBtnText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No records stored locally.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 12, color: '#0f172a' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryVal: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  typeSelector: { flexDirection: 'row', marginBottom: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 2,
  },
  activeIncomeBtn: { backgroundColor: '#16a34a' },
  activeExpenseBtn: { backgroundColor: '#dc2626' },
  typeBtnText: { fontWeight: '600', color: '#475569' },
  activeBtnText: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold' },
  listContainer: { paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryText: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  amountText: { fontSize: 15, fontWeight: 'bold' },
  incomeText: { color: '#16a34a' },
  expenseText: { color: '#dc2626' },
  subText: { fontSize: 12, color: '#64748b', marginTop: 4 },
  deleteBtn: { fontSize: 12, color: '#dc2626', fontWeight: 'bold', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
});
