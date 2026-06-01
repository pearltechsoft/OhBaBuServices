import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

export default function BookingDetailsScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>
                Booking Details
            </Text>

            <Text>Customer: Krishna Rao</Text>
            <Text>Service: Service Details</Text>
            <Text>Date: 28 Oct</Text>
            <Text>Time: 1:00 - 1:15 PM</Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.accept}
                    onPress={() =>
                        navigation.navigate('PublishAvailability')
                    }
                >
                    <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.suggest}>
                    <Text style={styles.btnText}>Suggest</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.reject}>
                    <Text style={styles.btnText}>Reject</Text>
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

    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },

    buttonRow: {
        flexDirection: 'row',
        marginTop: 30,
        justifyContent: 'space-between',
    },

    accept: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 8,
    },

    suggest: {
        backgroundColor: 'orange',
        padding: 10,
        borderRadius: 8,
    },

    reject: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 8,
    },

    btnText: {
        color: 'white',
        fontWeight: 'bold',
    },
});