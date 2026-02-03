import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    FlatList,
    SectionList,
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
import { Todo, Note, useLocalStore } from '@/models';
import { useThemeStore } from '@/store/themeStore';
import { ENV } from '@/config/env';
import { LinearGradient } from 'expo-linear-gradient';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const API_URL = `${ENV.SUPABASE_URL}/functions/v1/api`;

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
// Note interface is imported from @/models

export const NotesScreen = () => {
    const navigation = useNavigation<any>();
    const lang = useEffectiveLanguage();
    const t = translations[lang];

    const { mode, colors: themeColors } = useThemeStore();
    const isGlassy = mode !== 'minimal';
    const gradient = React.useMemo(() => {
        return [themeColors.gradient.start, themeColors.gradient.middle, themeColors.gradient.end];
    }, [themeColors]);

    // Note State via Zustand
    const notes = useLocalStore(useShallow((state) =>
        state.notes
            .filter(n => !n.isDeleted)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ));
    const { addNote, updateNote, deleteNote } = useLocalStore();

    const [isRecording, setIsRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [duration, setDuration] = useState(0);
    const [showLanguageModal, setShowLanguageModal] = useState<'input' | 'output' | null>(null);
    const [showToast, setShowToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Collapsible sections state
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Task Linking State
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Voice Waveform Animation
    const waveformAnim = useRef(new Animated.Value(0)).current;
    const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(0.3));
    const waveformInterval = useRef<NodeJS.Timeout | null>(null);
    const [taskList, setTaskList] = useState<Todo[]>([]);
    const [filteredTaskList, setFilteredTaskList] = useState<Todo[]>([]);
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [linkingNoteId, setLinkingNoteId] = useState<string | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    // Language State
    const [inputLang, setInputLang] = useState({ code: 'zh', label: 'Chinese', flag: '🇨🇳' });
    const [outputLang, setOutputLang] = useState({ code: 'ms', label: 'Malay', flag: '🇲🇾' });

    // Migrate Legacy Notes on Mount
    useEffect(() => {
        const migrate = async () => {
            try {
                const stored = await AsyncStorage.getItem('voice_notes');
                if (stored) {
                    const oldNotes = JSON.parse(stored);
                    if (oldNotes.length > 0) {
                        const { data: { user } } = await supabase.auth.getUser();
                        const userId = user?.id || 'guest';

                        let migratedCount = 0;
                        oldNotes.forEach((n: any) => {
                            // Check if already exists to prevent duplicates
                            const exists = useLocalStore.getState().notes.find(sn => sn.id === n.id);
                            if (!exists) {
                                addNote({
                                    id: n.id,
                                    userId,
                                    text: n.text,
                                    inputLang: n.inputLang,
                                    outputLang: n.outputLang,
                                    linkedTaskId: n.linkedTaskId,
                                    linkedTaskTitle: n.linkedTaskTitle,
                                    extraNotes: n.extraNotes,
                                    createdAt: new Date(n.timestamp).toISOString(),
                                    updatedAt: new Date(n.timestamp).toISOString(),
                                    isDeleted: false,
                                });
                                migratedCount++;
                            }
                        });

                        if (migratedCount > 0) {
                            console.log(`Migrated ${migratedCount} notes to local store`);
                        }

                        // Clear legacy key only if we processed it
                        await AsyncStorage.removeItem('voice_notes');
                    }
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        };
        migrate();
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
            // Start waveform animation
            startWaveformAnimation();
        } else {
            setDuration(0);
            stopWaveformAnimation();
        }
        return () => {
            clearInterval(interval);
            stopWaveformAnimation();
        };
    }, [isRecording]);

    // Waveform animation
    const startWaveformAnimation = () => {
        waveformInterval.current = setInterval(() => {
            setWaveformBars(Array(20).fill(0).map(() => 0.2 + Math.random() * 0.8));
        }, 100);
    };

    const stopWaveformAnimation = () => {
        if (waveformInterval.current) {
            clearInterval(waveformInterval.current);
            waveformInterval.current = null;
        }
        setWaveformBars(Array(20).fill(0.3));
    };

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

    const handleDeleteNote = async (id: string) => {
        deleteNote(id);
    };

    const updateNoteContent = (id: string, newText: string) => {
        updateNote(id, { text: newText });
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
        updateNote(linkingNoteId, {
            linkedTaskId: task.id,
            linkedTaskTitle: task.title,
        });

        const note = notes.find(n => n.id === linkingNoteId);

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
        // 1. Clean up any existing recording first
        if (recording) {
            try { await recording.stopAndUnloadAsync(); } catch (e) { }
            setRecording(null);
        }

        try {
            const perm = await Audio.requestPermissionsAsync();
            if (perm.status !== 'granted') return Alert.alert('Permission Denied', 'Microphone needed');

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
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
            const openAIKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || Constants.expoConfig?.extra?.openaiApiKey;

            // Validate key: Must start with sk- and NOT resemble a template placeholder ($)
            const isValidKey = openAIKey && openAIKey.startsWith('sk-') && !openAIKey.startsWith('$');

            if (isValidKey) {
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
                        console.error('OpenAI Transcribe Error:', response.status, errText);
                        throw new Error(`OpenAI API Error: ${response.status}`);
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

                        const { data: { user } } = await supabase.auth.getUser();

                        addNote({
                            id: Date.now().toString(),
                            userId: user?.id || 'guest',
                            text,
                            inputLang: inputLang.label,
                            outputLang: outputLang.label,
                            isDeleted: false,
                        });
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

            const response = await fetch(`${API_URL}?route=/voice/transcribe`, {
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

            const { data: { user } } = await supabase.auth.getUser();

            addNote({
                id: Date.now().toString(),
                userId: user?.id || 'guest',
                text,
                inputLang: inputLang.label,
                outputLang: outputLang.label,
                isDeleted: false,
            });
            showToastMessage('Saved to Notes');

        } catch (error: any) {
            console.error('Transcription Error:', error);
            // Silent failure or gentle toast, do not block user
            Alert.alert('Voice Service Unavailable', 'Please use keyboard or try again later.');
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

    // Group notes by date
    const groupNotesByDate = (notesList: Note[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

        const groups: { title: string; data: Note[] }[] = [
            { title: 'Today', data: [] },
            { title: 'Yesterday', data: [] },
            { title: 'This Week', data: [] },
            { title: 'Earlier', data: [] },
        ];

        notesList.forEach(note => {
            const noteDate = new Date(note.createdAt);
            const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

            if (noteDay.getTime() === today.getTime()) {
                groups[0].data.push(note);
            } else if (noteDay.getTime() === yesterday.getTime()) {
                groups[1].data.push(note);
            } else if (noteDay >= thisWeekStart) {
                groups[2].data.push(note);
            } else {
                groups[3].data.push(note);
            }
        });

        // Remove empty groups
        return groups.filter(g => g.data.length > 0);
    };

    const groupedNotes = groupNotesByDate(notes);

    // Toggle section collapse
    const toggleSection = (title: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };

    // Filter out collapsed sections' data
    const visibleGroupedNotes = groupedNotes.map(section => ({
        ...section,
        data: collapsedSections.has(section.title) ? [] : section.data
    }));

    // --- Render ---

    const renderNoteItem = ({ item }: { item: Note }) => {
        const renderRightActions = () => {
            return (
                <View style={styles.deleteActionContainer}>
                    <TouchableOpacity
                        style={styles.deleteAction}
                        onPress={() => handleDeleteNote(item.id)}
                    >
                        <Ionicons name="trash-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            );
        };

        // Get flag from language code
        const getFlag = (langName: string) => {
            const langMap: Record<string, string> = {
                'Chinese': '🇨🇳', 'English': '🇺🇸', 'Malay': '🇲🇾', 'Tamil': '🇮🇳',
                'Japanese': '🇯🇵', 'Korean': '🇰🇷', 'Indonesian': '🇮🇩', 'Spanish': '🇪🇸',
                'French': '🇫🇷', 'German': '🇩🇪', 'Thai': '🇹🇭', 'Vietnamese': '🇻🇳'
            };
            return langMap[langName] || '🌐';
        };

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <View style={[
                    styles.card,
                    isGlassy && { borderRadius: 24, borderWidth: 0, shadowColor: 'rgba(0,0,0,0.05)', shadowOpacity: 1, shadowRadius: 15, backgroundColor: 'rgba(255,255,255,0.7)' }
                ]}>
                    <View style={styles.cardContent}>
                        {/* Header: Time only */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.timestamp}>
                                {new Date(item.createdAt).toLocaleString(lang, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
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

                        {/* Footer: Actions + Language Pills */}
                        <View style={styles.cardFooter}>
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handlePlayback(item.text)}>
                                    <Ionicons name="play-circle-outline" size={20} color="#3B82F6" />
                                    <Text style={styles.actionText}>{t.play}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtn} onPress={() => openLinkModal(item.id)}>
                                    <Ionicons name="link-outline" size={18} color="#3B82F6" />
                                    <Text style={styles.actionText}>{t.linkTask}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Language Pills - Bottom Right */}
                            <View style={styles.langPills}>
                                <Text style={styles.langPill}>{getFlag(item.inputLang)}</Text>
                                <Ionicons name="arrow-forward" size={10} color="#9CA3AF" style={{ marginHorizontal: 2 }} />
                                <Text style={styles.langPill}>{getFlag(item.outputLang)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Swipeable>
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
                    <SectionList
                        sections={visibleGroupedNotes}
                        renderItem={renderNoteItem}
                        renderSectionHeader={({ section: { title } }) => {
                            const isCollapsed = collapsedSections.has(title);
                            return (
                                <TouchableOpacity 
                                    style={styles.sectionHeader}
                                    onPress={() => toggleSection(title)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.sectionTitle}>{title}</Text>
                                    <View style={styles.sectionRight}>
                                        <View style={styles.sectionLine} />
                                        <Animated.View style={{
                                            transform: [{ 
                                                rotate: isCollapsed ? '0deg' : '180deg' 
                                            }]
                                        }}>
                                            <Ionicons 
                                                name="chevron-down" 
                                                size={18} 
                                                color="#64748B" 
                                            />
                                        </Animated.View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 150 }]}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={false}
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
                            
                            {/* Voice Waveform */}
                            {isRecording && (
                                <View style={styles.waveformContainer}>
                                    {waveformBars.map((height, index) => (
                                        <Animated.View
                                            key={index}
                                            style={[
                                                styles.waveformBar,
                                                {
                                                    height: `${height * 40}%`,
                                                    opacity: 0.8 + height * 0.2,
                                                }
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                            
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

    // Section Headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginRight: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },

    // Card Styles
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardContent: { flex: 1 },

    cardHeader: { marginBottom: 8 },
    timestamp: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

    // Text Input
    cardTextInput: { fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8, padding: 0, textAlignVertical: 'top' },

    // Linked Task Tag
    linkedTaskTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
    linkedTaskText: { fontSize: 12, color: '#000', marginLeft: 6, fontWeight: '500' },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    // Actions
    cardActions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 24 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },
    // Language Pills
    langPills: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    langPill: {
        fontSize: 14,
    },

    // Swipe Delete
    deleteActionContainer: {
        width: 80,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    deleteAction: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },

    // Controls
    controls: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
    recordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    recording: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
    disabledBtn: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
    hintText: { fontSize: 14, color: '#9CA3AF' },
    timer: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    activeCard: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
    activeTitle: { fontSize: 16, fontWeight: '600', color: '#3B82F6', marginBottom: 12 },

    // Waveform
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        gap: 3,
        marginVertical: 8,
    },
    waveformBar: {
        width: 4,
        backgroundColor: '#3B82F6',
        borderRadius: 2,
        minHeight: 4,
    },
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
