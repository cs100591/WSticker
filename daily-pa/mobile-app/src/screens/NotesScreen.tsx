import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    FlatList,
    Modal,
    SafeAreaView,
    Animated,
    StatusBar,
    TextInput,
    TouchableWithoutFeedback,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '@/services/supabase';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { todoService } from '@/services/TodoService';
import { Todo } from '@/models';
import { useThemeStore } from '@/store/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://daily-pa1.vercel.app';

const LANGUAGES = [
    { label: 'Auto Detect', code: 'auto', flag: '🌐', inputOnly: true },
    { label: 'English', code: 'en', flag: '🇺🇸' },
    { label: 'Chinese', code: 'zh', flag: '🇨🇳' },
    { label: 'Malay', code: 'ms', flag: '🇲🇾' },
    { label: 'Tamil', code: 'ta', flag: '🇮🇳' },
    { label: 'Japanese', code: 'ja', flag: '🇯🇵' },
    { label: 'Korean', code: 'ko', flag: '🇰🇷' },
    { label: 'Indonesian', code: 'id', flag: '🇮🇩' },
    { label: 'Spanish', code: 'es', flag: '🇪🇸' },
    { label: 'French', code: 'fr', flag: '🇫🇷' },
    { label: 'German', code: 'de', flag: '🇩🇪' },
    { label: 'Thai', code: 'th', flag: '🇹🇭' },
    { label: 'Vietnamese', code: 'vi', flag: '🇻🇳' },
];

// Interface for Local Storage
interface Note {
    id: string;
    text: string;
    timestamp: number;
    inputLang: string;
    outputLang: string;
    linkedTaskId?: string;
    linkedTaskTitle?: string;
    extraNotes?: string;
}

export const NotesScreen = () => {
    const navigation = useNavigation<any>();
    const lang = useEffectiveLanguage();
    const t = translations[lang];

    const { mode } = useThemeStore();
    const isSage = mode === 'sage';
    const isBlueSage = mode === 'system';
    const isGlassy = mode !== 'minimal';
    const gradient = React.useMemo(() => {
        switch (mode) {
            case 'sage': return ['#C3E0D8', '#D6E8E2', '#F9F6F0'];
            case 'sunset': return ['#FECDD3', '#FFE4E6', '#FFF5F5'];
            case 'ocean': return ['#BAE6FD', '#E0F2FE', '#F0F9FF'];
            default: return ['#E0F2FE', '#DBEAFE', '#EFF6FF'];
        }
    }, [mode]);

    // Note State
    const [notes, setNotes] = useState<Note[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [duration, setDuration] = useState(0);
    const [showLanguageModal, setShowLanguageModal] = useState<'input' | 'output' | null>(null);
    const [showToast, setShowToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Task Linking State
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskList, setTaskList] = useState<Todo[]>([]);
    const [filteredTaskList, setFilteredTaskList] = useState<Todo[]>([]);
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [linkingNoteId, setLinkingNoteId] = useState<string | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    // Language State
    const [inputLang, setInputLang] = useState({ code: 'zh', label: 'Chinese', flag: '🇨🇳' });
    const [outputLang, setOutputLang] = useState({ code: 'ms', label: 'Malay', flag: '🇲🇾' });

    // Load Notes on Mount
    useEffect(() => {
        loadNotes();
    }, []);

    // Timer for recording
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(prev => {
                    if (prev >= 120) { // 2 minutes limit
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Fetch Tasks when Modal Opens
    useEffect(() => {
        if (showTaskModal) {
            fetchTasks();
        }
    }, [showTaskModal]);

    // Filter Tasks
    useEffect(() => {
        if (!taskSearchQuery) {
            setFilteredTaskList(taskList);
        } else {
            const query = taskSearchQuery.toLowerCase();
            setFilteredTaskList(taskList.filter(t => t.title.toLowerCase().includes(query)));
        }
    }, [taskSearchQuery, taskList]);

    const loadNotes = async () => {
        try {
            const stored = await AsyncStorage.getItem('voice_notes');
            if (stored) {
                setNotes(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load notes', e);
        }
    };

    const saveNotesToStorage = async (updatedNotes: Note[]) => {
        setNotes(updatedNotes);
        try {
            await AsyncStorage.setItem('voice_notes', JSON.stringify(updatedNotes));
        } catch (e) {
            console.error('Failed to save notes', e);
        }
    };

    const deleteNote = async (id: string) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        saveNotesToStorage(updatedNotes);
    };

    const updateNoteContent = (id: string, newText: string) => {
        const updatedNotes = notes.map(n => n.id === id ? { ...n, text: newText } : n);
        saveNotesToStorage(updatedNotes);
    };

    const showToastMessage = (message: string) => {
        setShowToast({ visible: true, message });
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setShowToast({ visible: false, message: '' }));
            }, 2000);
        });
    };

    // --- Task Linking Logic ---

    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        try {
            const tasks = await todoService.getTodos({ status: 'active' });
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            setTaskList(tasks);
            setFilteredTaskList(tasks);
        } catch (e) {
            console.error('Failed to fetch tasks', e);
            Alert.alert('Error', 'Could not load tasks');
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const openLinkModal = (noteId: string) => {
        setLinkingNoteId(noteId);
        setTaskSearchQuery('');
        setShowTaskModal(true);
    };

    const handleLinkTask = async (task: Todo) => {
        if (!linkingNoteId) return;

        // 1. Update Note with link info
        const note = notes.find(n => n.id === linkingNoteId);
        const updatedNotes = notes.map(n => {
            if (n.id === linkingNoteId) {
                return {
                    ...n,
                    linkedTaskId: task.id,
                    linkedTaskTitle: task.title,
                };
            }
            return n;
        });

        saveNotesToStorage(updatedNotes);

        // 2. Update the actual Task description
        if (note && note.text) {
            try {
                const currentDesc = task.description || '';
                // Avoid duplicating if already present
                if (!currentDesc.includes(note.text)) {
                    const newDesc = currentDesc + (currentDesc ? '\n\n' : '') + `[Voice Note]: ${note.text}`;
                    await todoService.updateTodo(task.id, { description: newDesc });
                }
            } catch (err) {
                console.error('Failed to update task description', err);
            }
        }

        setShowTaskModal(false);
        showToastMessage('Task Linked & Updated');
    };

    // --- Audio Logic ---

    const startRecording = async () => {
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (perm.status !== 'granted') return Alert.alert('Permission Denied', 'Microphone needed');

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        setTranscribing(true);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (!uri) throw new Error('No URI');

            // Check for Client-side OpenAI Key first
            const openAIKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

            if (openAIKey) {
                console.log('Using direct client-side OpenAI transcription in Notes');
                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri,
                        type: 'audio/m4a',
                        name: 'audio.m4a',
                    } as any);
                    formData.append('model', 'whisper-1');

                    // OpenAI Whisper accepts ISO-639-1 language codes
                    if (inputLang.code !== 'auto') {
                        formData.append('language', inputLang.code);
                    }

                    // Force Simplified Chinese prompt
                    if (inputLang.code === 'zh' || inputLang.code === 'auto') {
                        formData.append('prompt', '请使用简体中文。');
                    }

                    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openAIKey}`,
                            'Content-Type': 'multipart/form-data',
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`OpenAI API Error: ${response.status} ${errText}`);
                    }

                    const data = await response.json();
                    let text = data.text;

                    if (text) {
                        // Translation Logic
                        const needsTranslation = outputLang.code !== 'auto' &&
                            outputLang.code !== inputLang.code &&
                            !(inputLang.code === 'zh' && outputLang.code === 'zh');

                        if (needsTranslation) {
                            console.log(`Translating from ${inputLang.label} to ${outputLang.label}`);
                            try {
                                const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${openAIKey}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        model: "gpt-4o-mini",
                                        messages: [
                                            {
                                                role: "system",
                                                content: `You are a professional translator and content organizer. Translate the following text to ${outputLang.label}. Ensure the translation is professional, well-organized, and uses bullet points where appropriate for clarity. Output ONLY the translated text without quotes.${outputLang.code === 'zh' ? ' Use Simplified Chinese.' : ''}`
                                            },
                                            { role: "user", content: text }
                                        ],
                                        temperature: 0.3
                                    })
                                });
                                if (completionResponse.ok) {
                                    const compData = await completionResponse.json();
                                    const translatedText = compData.choices[0]?.message?.content?.trim();
                                    if (translatedText) text = translatedText;
                                }
                            } catch (e) {
                                console.warn('Translation failed:', e);
                            }
                        }

                        const newNote: Note = {
                            id: Date.now().toString(),
                            text,
                            timestamp: Date.now(),
                            inputLang: inputLang.label,
                            outputLang: outputLang.label,
                        };
                        saveNotesToStorage([newNote, ...notes]);
                        showToastMessage('Saved to Notes');
                        return; // Success, exit
                    } else {
                        throw new Error('No text in response');
                    }
                } catch (error) {
                    console.warn('Direct transcription failed, falling back to backend:', error);
                }
            }

            // Fallback: Backend API
            // Read file as Base64 using FileSystem directly
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_URL}/api/voice/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : 'Bearer guest-user',
                },
                body: JSON.stringify({
                    audio: base64,
                    language: inputLang.code === 'auto' ? undefined : inputLang.code,
                    targetLanguage: outputLang.code
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error('Transcription Failed: ' + (errText.substring(0, 50) || 'Backend Error'));
            }

            const data = await response.json();
            const text = data.text || data.transcription || 'No text detected';

            const newNote: Note = {
                id: Date.now().toString(),
                text,
                timestamp: Date.now(),
                inputLang: inputLang.label,
                outputLang: outputLang.label,
            };
            saveNotesToStorage([newNote, ...notes]);
            showToastMessage('Saved to Notes');

        } catch (error: any) {
            console.error('Transcription Error:', error);
            if (error.message.includes('Network') || error.message.includes('Backend') || error.message.includes('Forbidden') || error.message.includes('OpenAI API Error')) {
                const mockText = "Offline/Error Mode: Could not reach transcription service.";
                const newNote: Note = {
                    id: Date.now().toString(),
                    text: mockText,
                    timestamp: Date.now(),
                    inputLang: inputLang.label,
                    outputLang: outputLang.label
                };
                saveNotesToStorage([newNote, ...notes]);
                Alert.alert('Transcribing Failed', 'Saved as offline draft due to API error.');
            } else {
                Alert.alert('Error', error.message || 'Processing failed.');
            }
        } finally {
            setRecording(null);
            setTranscribing(false);
        }
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handlePlayback = (text: string) => {
        Speech.speak(text, { language: outputLang.code });
    };

    // --- Render ---

    const renderNoteItem = ({ item }: { item: Note }) => {
        return (
            <View style={[
                styles.card,
                isGlassy && { borderRadius: 24, borderWidth: 0, shadowColor: 'rgba(0,0,0,0.05)', shadowOpacity: 1, shadowRadius: 15, backgroundColor: 'rgba(255,255,255,0.7)' }
            ]}>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.timestamp}>
                            {new Date(item.timestamp).toLocaleString(lang, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </Text>
                        <View style={styles.tags}>
                            <View style={styles.tag}><Text style={styles.tagText}>{item.inputLang}</Text></View>
                            <Ionicons name="arrow-forward" size={12} color="#9CA3AF" />
                            <View style={styles.tag}><Text style={styles.tagText}>{item.outputLang}</Text></View>
                        </View>
                    </View>

                    {/* Editable Text Area */}
                    <TextInput
                        style={styles.cardTextInput}
                        multiline
                        defaultValue={item.text}
                        onEndEditing={(e) => updateNoteContent(item.id, e.nativeEvent.text)}
                    />

                    {/* Linked Task Tag */}
                    {item.linkedTaskId && (
                        <TouchableOpacity
                            style={styles.linkedTaskTag}
                            onPress={() => navigation.navigate('Todos')}
                        >
                            <Ionicons name="checkbox-outline" size={14} color="#000" />
                            <Text style={styles.linkedTaskText}>{t.associated}: {item.linkedTaskTitle}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Actions Row */}
                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handlePlayback(item.text)}>
                            <Ionicons name="play-circle-outline" size={20} color="#3B82F6" />
                            <Text style={styles.actionText}>{t.play}</Text>
                        </TouchableOpacity>

                        {/* Link Task Button - Moved Here */}
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openLinkModal(item.id)}>
                            <Ionicons name="link-outline" size={18} color="#3B82F6" />
                            <Text style={styles.actionText}>{t.linkTask}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteNote(item.id)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>{t.delete}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderTaskModal = () => (
        <Modal visible={showTaskModal} animationType="slide" transparent>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Link a Task</Text>
                    <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tasks..."
                        value={taskSearchQuery}
                        onChangeText={setTaskSearchQuery}
                    />
                </View>

                {isLoadingTasks ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredTaskList}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.taskList}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.taskItem} onPress={() => handleLinkTask(item)}>
                                <View style={[styles.priorityDot, { backgroundColor: item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#F59E0B' : '#10B981' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.taskTitle}>{item.title}</Text>
                                    <Text style={styles.taskDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No tasks found</Text>}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );

    return (
        <View style={[styles.container, isGlassy && { backgroundColor: 'transparent' }]}>
            {isGlassy && (
                <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
                    <LinearGradient
                        colors={gradient as any}
                        style={{ flex: 1 }}
                    />
                </View>
            )}
            <SafeAreaView style={{ flex: 1 }}>
                {/* Toast */}
                {showToast.visible && (
                    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        <Text style={styles.toastText}>{showToast.message}</Text>
                    </Animated.View>
                )}

                {/* Header */}
                <View style={[styles.header, isGlassy && { backgroundColor: 'transparent', borderBottomWidth: 0 }]}>
                    <Text style={styles.headerTitle}>{t.voiceNotes}</Text>
                    <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={24} color="#374151" /></TouchableOpacity>
                </View>

                {/* Language Selector */}
                <View style={[styles.languageRow, isGlassy && { backgroundColor: 'transparent' }]}>
                    <TouchableOpacity style={[styles.langButton, isGlassy && { backgroundColor: 'rgba(255,255,255,0.5)' }]} onPress={() => setShowLanguageModal('input')} disabled={isRecording}>
                        <Text style={styles.langLabel}>{t.input}</Text>
                        <View style={styles.langValue}>
                            <Text style={styles.langText}>{inputLang.flag} {inputLang.label}</Text>
                            <Ionicons name="chevron-down" size={14} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                    <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={{ marginTop: 14 }} />
                    <TouchableOpacity style={[styles.langButton, isGlassy && { backgroundColor: 'rgba(255,255,255,0.5)' }]} onPress={() => setShowLanguageModal('output')} disabled={isRecording}>
                        <Text style={styles.langLabel}>{t.output}</Text>
                        <View style={styles.langValue}>
                            <Text style={styles.langText}>{outputLang.flag} {outputLang.label}</Text>
                            <Ionicons name="chevron-down" size={14} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Modals */}
                {renderTaskModal()}
                {/* Language Modal */}
                <Modal visible={!!showLanguageModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{t.language}</Text>
                            <FlatList
                                data={LANGUAGES}
                                keyExtractor={item => item.code}
                                renderItem={({ item }) => {
                                    if (showLanguageModal === 'output' && item.inputOnly) return null;
                                    return (
                                        <TouchableOpacity style={styles.modalItem}
                                            onPress={() => {
                                                if (showLanguageModal === 'input') setInputLang(item);
                                                else setOutputLang(item);
                                                setShowLanguageModal(null);
                                            }}
                                        >
                                            <Text style={styles.modalItemText}>{item.flag} {item.label}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                                style={{ maxHeight: 400 }}
                            />
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowLanguageModal(null)}>
                                <Text style={styles.closeModalText}>{t.cancel}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Main List */}
                <View style={styles.content}>
                    <FlatList
                        data={notes}
                        renderItem={renderNoteItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 150 }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            !isRecording && !transcribing ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="mic-outline" size={48} color="#E5E7EB" />
                                    <Text style={styles.emptyText}>No recordings yet</Text>
                                </View>
                            ) : null
                        }
                    />

                    {(isRecording || transcribing) && (
                        <View style={styles.activeCard}>
                            <Text style={styles.activeTitle}>{transcribing ? 'Transcribing...' : 'Listening...'}</Text>
                            {transcribing && <ActivityIndicator color="#3B82F6" style={{ marginTop: 8 }} />}
                        </View>
                    )}
                </View>

                {/* Controls */}
                <View style={[styles.controls, isGlassy && { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
                    {isRecording && <Text style={styles.timer}>{formatDuration(duration)} / 2:00</Text>}
                    <TouchableOpacity
                        style={[styles.recordBtn, isRecording ? styles.recording : null, transcribing ? styles.disabledBtn : null]}
                        onPress={isRecording ? stopRecording : startRecording}
                        disabled={transcribing}
                    >
                        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.hintText}>{isRecording ? "Tap to Stop" : transcribing ? "Processing..." : t.tapToRecord}</Text>
                </View>

                <StatusBar barStyle="dark-content" />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
    languageRow: { flexDirection: 'row', padding: 16, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF' },
    langButton: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6', marginHorizontal: 8 },
    langLabel: { fontSize: 10, color: '#6B7280', marginBottom: 2, textTransform: 'uppercase' },
    langValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    langText: { fontSize: 15, fontWeight: '500', color: '#1F2937' },
    content: { flex: 1, padding: 16 },
    listContent: { paddingBottom: 100 },

    // Card Styles
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardContent: { flex: 1 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    timestamp: { fontSize: 12, color: '#9CA3AF' },
    tags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, color: '#6B7280' },

    // Text Input
    cardTextInput: { fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8, padding: 0, textAlignVertical: 'top' },

    // Linked Task Tag
    linkedTaskTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
    linkedTaskText: { fontSize: 12, color: '#000', marginLeft: 6, fontWeight: '500' },

    // Actions
    cardActions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 24, marginTop: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },

    // Controls
    controls: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
    recordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    recording: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
    disabledBtn: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
    hintText: { fontSize: 14, color: '#9CA3AF' },
    timer: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    activeCard: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
    activeTitle: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
    emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9CA3AF' },
    toast: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(16, 185, 129, 0.95)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
    toastText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

    // Task Modal
    modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
    modalHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, height: 40, marginLeft: 8 },
    taskList: { padding: 16 },
    taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    taskTitle: { fontSize: 16, color: '#374151', fontWeight: '500' },
    taskDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    // Lang Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalItemText: { fontSize: 16, textAlign: 'center', color: '#374151' },
    closeModalBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
    closeModalText: { color: '#EF4444', fontWeight: '600' }
});
