import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Play, CheckCircle2, Circle, Timer, Sparkles, ChevronRight, BookOpen, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import { getAuthSession, getScopedStorageKey, getCurrentUserId, getCurrentUser } from '../constants/Auth';
import { API_URLS } from '../constants/Config';

const luminoShadow = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('Student');
  const [activeCourse, setActiveCourse] = useState(null);
  
  // Local state for Today's Plan
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Local state for Focus Time
  const [isFocusing, setIsFocusing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    let timer;
    if (isFocusing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isFocusing && timeLeft === 0) {
      setIsFocusing(false);
      setTimeLeft(25 * 60);
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      AsyncStorage.setItem('dashboard_focus_sessions', newCount.toString());
      if (Platform.OS === 'web') {
        window.alert('Focus Session Complete! Great job!');
      } else {
        Alert.alert('Focus Session Complete!', 'Great job! Take a short break.');
      }
    }
    return () => clearInterval(timer);
  }, [isFocusing, timeLeft]);

  const loadUserData = async () => {
    const user = await getCurrentUser();
    if (user && user.email) {
      const namePart = user.email.split('@')[0];
      setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    }

    try {
      let loadedCourse = null;

      // First try cache for instant load
      const contData = await AsyncStorage.getItem('dashboard_continue');
      if (contData) {
        try {
          const cachedCourse = JSON.parse(contData);
          if (cachedCourse && cachedCourse.course_id) {
            loadedCourse = cachedCourse;
            setActiveCourse(cachedCourse);
          }
        } catch (e) {
          // Ignore cache parsing errors
        }
      }
      
      const userId = await getCurrentUserId();
      
      const enrolledCoursesKey = await getScopedStorageKey('enrolled_courses');
      const enrolled = await AsyncStorage.getItem(enrolledCoursesKey);
      if (enrolled) {
        const enrolledList = JSON.parse(enrolled);
        if (enrolledList && enrolledList.length > 0) {
          const courseId = enrolledList[enrolledList.length - 1]; // most recent
          const fetchUrl = userId 
            ? `${API_URLS.PATH_SERVICE}/courses/${courseId}?user_id=${userId}`
            : `${API_URLS.PLAYLIST_SERVICE}/playlist/${courseId}`;
            
          const res = await fetch(fetchUrl);
          if (res.ok) {
            const data = await res.json();
            loadedCourse = {
              title: data.title,
              course_id: courseId,
              progress: data.progress_percent || 0 
            };
            setActiveCourse(loadedCourse);
            AsyncStorage.setItem('dashboard_continue', JSON.stringify(loadedCourse));
          }
        }
      }
      
      // Load dynamic tasks
      const savedTasks = await AsyncStorage.getItem('dashboard_tasks');
      let currentTasks = savedTasks ? JSON.parse(savedTasks) : [];
      
      // Filter out old dummy hardcoded tasks
      currentTasks = currentTasks.filter(t => t.text !== 'Complete API Authentication' && t.text !== 'Practice Quiz' && t.id !== 'focus_goal' && t.id !== 'explore_goal' && !t.id.startsWith('course_goal_'));

      setTasks(currentTasks);
      AsyncStorage.setItem('dashboard_tasks', JSON.stringify(currentTasks));

      // Load focus sessions
      const savedSessions = await AsyncStorage.getItem('dashboard_focus_sessions');
      if (savedSessions) {
        setCompletedSessions(parseInt(savedSessions, 10));
      }

    } catch (err) {
      console.error('Failed to load active course', err);
    }
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    AsyncStorage.setItem('dashboard_tasks', JSON.stringify(updated));
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    AsyncStorage.setItem('dashboard_tasks', JSON.stringify(updated));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const updated = [...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }];
    setTasks(updated);
    AsyncStorage.setItem('dashboard_tasks', JSON.stringify(updated));
    setNewTaskText('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerProfile}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greetingText}>Hello, {userName}! 👋</Text>
                <Text style={styles.subtitleText}>Your AI Learning Coach</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn}>
              <Bell size={24} color={Colors.navy} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            
            {/* AI Welcome Banner */}
            <View style={styles.bannerContainer}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerText}>Hi {userName}! I'm here to help you learn smarter every day.</Text>
              </View>
              {/* Using a placeholder emoji instead of an image to ensure it loads perfectly without external assets */}
              <View style={styles.robotContainer}>
                <Text style={styles.robotEmoji}>🤖</Text>
              </View>
            </View>

            {/* Continue Learning */}
            <View style={styles.section}>
              {activeCourse ? (
                <View style={styles.continueCard}>
                  <View style={styles.continueCardHeader}>
                    <View style={styles.courseIconContainer}>
                      <BookOpen size={24} color={Colors.brandBlue} />
                    </View>
                    <View style={styles.continueCardText}>
                      <Text style={styles.continueLabel}>Continue Learning</Text>
                      <Text style={styles.continueTitle} numberOfLines={1}>{activeCourse.title}</Text>
                      <Text style={styles.progressPercentText}>{activeCourse.progress || 0}% completed</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${activeCourse.progress || 0}%` }]} />
                    </View>
                    <TouchableOpacity 
                      style={styles.resumeBtn}
                      onPress={() => navigation.navigate('VideoPlayer', { courseId: activeCourse.course_id })}
                    >
                      <Text style={styles.resumeBtnText}>Resume</Text>
                      <ChevronRight size={14} color={Colors.white} style={{marginLeft: 4}} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>You haven't enrolled in any courses yet. Explore the directory to start your journey!</Text>
                  <TouchableOpacity 
                    style={styles.exploreBtn} 
                    onPress={() => navigation.navigate('Explore')}
                  >
                    <Text style={styles.exploreBtnText}>Explore Courses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Today's Plan */}
            <View style={styles.section}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <View>
                  <Text style={[styles.sectionTitle, {marginBottom: 4}]}>Today's Plan</Text>
                  <Text style={{fontSize: 13, color: Colors.silver, fontFamily: 'Inter_500Medium'}}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={{backgroundColor: Colors.brandBlue + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20}}>
                  <Text style={{fontSize: 13, color: Colors.brandBlue, fontFamily: 'Inter_700Bold'}}>
                    {tasks.length > 0 ? `${Math.round((tasks.filter(t=>t.completed).length / tasks.length) * 100)}%` : '0%'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tasksContainer}>
                {tasks.length === 0 ? (
                  <View style={{padding: 24, alignItems: 'center'}}>
                    <Text style={{color: Colors.silver, fontFamily: 'Inter_400Regular', textAlign: 'center'}}>Your plan is empty. Add a task to start your day!</Text>
                  </View>
                ) : (
                  tasks.map(task => (
                    <View key={task.id} style={styles.taskRow}>
                      <TouchableOpacity style={{paddingRight: 12}} onPress={() => toggleTask(task.id)}>
                        {task.completed ? (
                          <CheckCircle2 size={24} color={Colors.brandBlue} />
                        ) : (
                          <Circle size={24} color={Colors.borderLight} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={{flex: 1}} onPress={() => toggleTask(task.id)}>
                        <Text style={[styles.taskText, task.completed && styles.taskTextCompleted, {marginLeft: 0}]}>
                          {task.text}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteTask(task.id)} style={{padding: 8, backgroundColor: Colors.borderLight2, borderRadius: 8}}>
                        <Trash2 size={16} color={Colors.danger || '#DA2D2C'} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                
                {/* Add New Task Input */}
                <View style={[styles.taskRow, {borderBottomWidth: 0, backgroundColor: Colors.bgLight || '#F8F8F9'}]}>
                  <TextInput 
                    style={[styles.taskText, {marginLeft: 0, flex: 1}]} 
                    placeholder="Type a new task..." 
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    onSubmitEditing={addTask}
                    returnKeyType="done"
                    placeholderTextColor={Colors.silver}
                  />
                  <TouchableOpacity 
                    onPress={addTask} 
                    style={{
                      padding: 8, 
                      backgroundColor: newTaskText.trim() ? Colors.brandBlue : Colors.borderLight, 
                      borderRadius: 8,
                      marginLeft: 12
                    }}
                    disabled={!newTaskText.trim()}
                  >
                    <Plus size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Focus Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Focus Time</Text>
              <View style={styles.focusCard}>
                <View style={styles.focusInfo}>
                  <View style={styles.timerIconContainer}>
                    <Timer size={24} color={Colors.brandBlue} />
                  </View>
                  <View style={styles.focusTextContainer}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.focusSubText}>
                      {isFocusing ? "Keep going! You're doing great." : `Stay focused. Sessions today: ${completedSessions} 💪`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.startFocusBtn, isFocusing && styles.stopFocusBtn]}
                  onPress={() => setIsFocusing(!isFocusing)}
                >
                  {!isFocusing && <Play size={14} color={Colors.white} fill={Colors.white} style={{marginRight: 4}} />}
                  <Text style={styles.startFocusText}>{isFocusing ? 'Pause' : 'Start Focus'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ask AI Coach Bottom Banner */}
            <TouchableOpacity style={styles.askAiCard} onPress={() => console.log("AI Coach Pressed")}>
              <View style={styles.askAiIconBg}>
                <Sparkles size={24} color={Colors.brandBlue} />
              </View>
              <View style={styles.askAiTextContainer}>
                <Text style={styles.askAiTitle}>Ask your AI Coach</Text>
                <Text style={styles.askAiSubtitle}>Get help, explanations, or guidance.</Text>
              </View>
              <ChevronRight size={24} color={Colors.navy} />
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  webContainer: {
    backgroundColor: Colors.offWhite,
  },
  webContentWrapper: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: Colors.offWhite,
    flex: 1,
    boxShadow: '0 0 20px rgba(4,13,67,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.offWhite,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  bellBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandBlue,
    borderWidth: 1,
    borderColor: Colors.offWhite,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bannerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF', // Very light blue/purple
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.navy,
    lineHeight: 22,
  },
  robotContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    ...luminoShadow,
  },
  robotEmoji: {
    fontSize: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
    marginBottom: 16,
  },
  continueCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    ...luminoShadow,
  },
  continueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  courseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  continueCardText: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  continueTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  progressPercentText: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginRight: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandBlue,
    borderRadius: 4,
  },
  resumeBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    ...luminoShadow,
  },
  emptyText: {
    color: Colors.silver,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: Colors.brandBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exploreBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  tasksContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    ...luminoShadow,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.navy,
    marginLeft: 12,
  },
  taskTextCompleted: {
    color: Colors.silver,
    textDecorationLine: 'line-through',
  },
  focusCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...luminoShadow,
  },
  focusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  focusTextContainer: {
    flex: 1,
  },
  timerText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  focusSubText: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  startFocusBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopFocusBtn: {
    backgroundColor: Colors.silver,
  },
  startFocusText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  askAiCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  askAiIconBg: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  askAiTextContainer: {
    flex: 1,
  },
  askAiTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
    marginBottom: 2,
  },
  askAiSubtitle: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
});
