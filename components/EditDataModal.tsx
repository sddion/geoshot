import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GeoData } from '@/utils/geoOverlay';
import { editDataModalStyles as styles } from '@/styles/component.styles';

interface EditDataModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: Partial<GeoData>) => void;
    initialData: GeoData | null;
}

export default function EditDataModal({ visible, onClose, onSave, initialData }: EditDataModalProps) {
    const [formData, setFormData] = useState<Partial<GeoData>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData, visible]);

    const handleChange = (field: keyof GeoData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: ['latitude', 'longitude', 'altitude', 'speed', 'temperature'].includes(field)
                ? parseFloat(value) || 0
                : value
        }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    if (!initialData) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit GPS Data</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Place Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.placeName}
                                onChangeText={(v) => handleChange('placeName', v)}
                                placeholder="E.g. Eiffel Tower"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.address}
                                onChangeText={(v) => handleChange('address', v)}
                                placeholder="Full address"
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Latitude</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.latitude?.toString()}
                                    onChangeText={(v) => handleChange('latitude', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Longitude</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.longitude?.toString()}
                                    onChangeText={(v) => handleChange('longitude', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Altitude (m)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.altitude?.toString()}
                                    onChangeText={(v) => handleChange('altitude', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Speed (m/s)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.speed?.toString()}
                                    onChangeText={(v) => handleChange('speed', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Weather Condition</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.weatherCondition}
                                onChangeText={(v) => handleChange('weatherCondition', v)}
                                placeholder="E.g. Sunny"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Apply Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}


