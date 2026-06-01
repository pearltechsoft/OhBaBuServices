import React from 'react';
import TouchableOpacity from 'react-native/Libraries/Components/Touchable/TouchableOpacity';
import {
    View,
    Text,
    FlatList,
    StyleSheet
} from 'react-native';

const bookings = [
    { id: '123', date: '28 Oct', time: '1:00-1:15 PM' },
    { id: '126', date: '28 Oct', time: '2:00-2:15 PM' },
    { id: '127', date: '28 Oct', time: '3:00-3:15 PM' },
];

export default function BookingListScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>
                All Booked Slots
            </Text>

            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate('BookingDetails')
                        }
                    >
                        <Text>
                            #{item.id} - {item.date} - {item.time}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
});