import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

export default function PublishAvailabilityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publish Availability</Text>

      <Text style={styles.heading}>Hours</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.slot}>
          <Text>10</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>11</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>12</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.slot}>
          <Text>1</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>2</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>3</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Minutes</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.slot}>
          <Text>00</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>15</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>30</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slot}>
          <Text>45</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Discount</Text>

      <TextInput
        placeholder="20%"
        style={styles.input}
      />

      <Text style={styles.heading}>Note</Text>

      <TextInput
        placeholder="Enter note..."
        multiline
        style={[styles.input, { height: 80 }]}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.publishBtn}>
          <Text style={styles.btnText}>Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn}>
          <Text style={styles.btnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  slot: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },

  publishBtn: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    width: '45%',
  },

  closeBtn: {
    backgroundColor: 'gray',
    padding: 15,
    borderRadius: 10,
    width: '45%',
  },

  btnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});