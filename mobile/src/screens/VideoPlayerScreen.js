import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ArrowLeft, FileText, CheckCircle2, PlayCircle, Lock, ChevronDown, Check, Play, AlignLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params || { courseId: 'playlist-fastapi-basics' };

  const [syllabus, setSyllabus] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [currentLesson, setCurrentLesson] = useState('Lesson Loading...');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [videoStats, setVideoStats] = useState({ current: 0, total: 1 });
  const [lessonUnlocked, setLessonUnlocked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [videoNotes, setVideoNotes] = useState([]);
  const [playing, setPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const playerRef = useRef();

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}?user_id=${USER_ID}`);
      const data = await res.json();
      if(data) {
        if (data.current_lesson) {
           setCurrentLesson(data.current_lesson.title || `Lesson ${data.current_lesson.position}`);
           setCurrentVideoId(data.current_lesson.youtube_video_id);
        }
        setCourseProgress(data.progress_percent || 0);

        if (data.lessons && data.lessons.length > 0) {
          setSyllabus(data.lessons.map((l, i) => {
            const isPlaying = data.current_lesson && l.youtube_video_id === data.current_lesson.youtube_video_id;
            return {
              id: l.youtube_video_id || `temp-${i}`,
              title: l.title || `Lesson ${i+1}`,
              duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
              status: l.completed ? 'complete' : (isPlaying ? 'playing' : 'available'),
              completed: l.completed || false,
              nextId: data.lessons[i + 1]?.youtube_video_id || null
            };
          }));
          
          if(!data.current_lesson && data.lessons[0]) {
            setCurrentVideoId(data.lessons[0].youtube_video_id);
            setCurrentLesson(data.lessons[0].title);
          } else if (data.current_lesson) {
            const currentFromLessons = data.lessons.find(l => l.youtube_video_id === data.current_lesson.youtube_video_id);
            setIsBookmarked(currentFromLessons?.is_bookmarked || false);
          }
        }
      }
    } catch (err) {
      console.log('Fetch failed', err);
    }
  };

  const fetchNotes = async () => {
    if (!currentVideoId) return;
    try {
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/notes/${currentVideoId}?user_id=${USER_ID}`);
      const data = await res.json();
      setVideoNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentVideoId]);

  const sendProgressAnalytics = async (eventType, seconds, completed) => {
    try {
      await fetch(`${API_URLS.VIDEO_SERVICE}/video/progress`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            user_id: USER_ID,
            video_id: currentVideoId,
            watched_seconds: Math.floor(seconds),
            event_type: eventType,
            completed: completed || false
         })
      });
    } catch(err) {
      console.log('Progress tracking error:', err);
    }
  };

  useEffect(() => {
    if (syllabus.length > 0) {
      const completedCount = syllabus.filter(s => s.completed).length;
      const pct = (completedCount / syllabus.length) * 100;
      setCourseProgress(Number.isInteger(pct) ? pct : parseFloat(pct.toFixed(2)));
    }
  }, [syllabus]);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
      handleVideoEnd();
    }
    if (state === "playing") {
      setPlaying(true);
    }
    if (state === "paused") {
      setPlaying(false);
    }
  }, [currentVideoId, syllabus]);

  const handleVideoEnd = async () => {
    let time = 0;
    if (Platform.OS !== 'web') {
      time = await playerRef.current?.getCurrentTime();
    }
    await sendProgressAnalytics('complete', time, true);
    
    const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
    if (currentIndex !== -1) {
        setSyllabus(prev => prev.map((s, idx) => ({
           ...s,
           status: idx === currentIndex ? 'complete' : s.status,
           completed: idx === currentIndex ? true : s.completed
        })));

        if (currentIndex < syllabus.length - 1) {
            const nextLesson = syllabus[currentIndex + 1];
            setCurrentVideoId(nextLesson.id);
            setCurrentLesson(nextLesson.title);
        }
    }
  };

  // Poll progress for 40% unlock logic
  useEffect(() => {
    let interval;
    if (playing && Platform.OS !== 'web') {
      interval = setInterval(async () => {
        if (playerRef.current) {
          try {
            const cur = await playerRef.current.getCurrentTime();
            const tot = await playerRef.current.getDuration();
            setVideoStats({ current: cur, total: tot || 1 });
            
            if (tot > 0 && cur / tot >= 0.4) {
              setLessonUnlocked(true);
            }
            
            sendProgressAnalytics('progress', cur, false);
          } catch (e) {
            console.log("Ref call failed", e);
          }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [playing, currentVideoId]);

  const toggleBookmark = async () => {
    try {
       const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/bookmark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: USER_ID, video_id: currentVideoId })
       });
       const data = await res.json();
       if (data.bookmarked !== undefined) {
           setIsBookmarked(data.bookmarked);
       }
    } catch (err) {
       console.error("Bookmark toggle failed", err);
    }
  };

  const saveNote = async () => {
      if (!noteText.trim()) return;
      let ts = 0;
      if (Platform.OS !== 'web') {
        ts = await playerRef.current?.getCurrentTime() || 0;
      }
      try {
          await fetch(`${API_URLS.VIDEO_SERVICE}/video/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: USER_ID, video_id: currentVideoId, content: noteText, video_timestamp: Math.floor(ts) })
          });
          setNoteText('');
          setShowNotesModal(false);
          fetchNotes();
      } catch (err) {
          console.error("Save note failed", err);
      }
  };

  const handleResume = async () => {
    try {
        const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/resume/${currentVideoId}?user_id=${USER_ID}`);
        const data = await res.json();
        if (data.resume_at_seconds > 0 && Platform.OS !== 'web') {
            playerRef.current?.seekTo(data.resume_at_seconds, true);
        }
    } catch (err) {
        console.error("Resume failed", err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>
        <View style={styles.playerWrapper}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        {Platform.OS === 'web' ? (
          <View style={{ width: '100%', height: 400, backgroundColor: 'black' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </View>
        ) : (
          <YoutubePlayer
            ref={playerRef}
            height={(width * 9) / 16}
            play={playing}
            videoId={currentVideoId}
            onChangeState={onStateChange}
            initialPlayerParams={{
              controls: true,
              rel: false,
            }}
          />
        )}
      </View>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonSubtitle}>
            Lesson {syllabus.findIndex(s => s.id === currentVideoId) + 1} of {syllabus.length}
          </Text>
          <Text style={styles.lessonTitle}>{currentLesson}</Text>
          <View style={styles.metaRow}>
             <View style={styles.statusTag}><Text style={styles.statusTagText}>In Progress</Text></View>
             <Text style={styles.lessonMeta}>10:22  ·  1,234 views</Text>
          </View>
          
          <View style={styles.courseProgress}>
             <View style={styles.progressCircleContainer}>
                <View style={styles.progressRing}>
                   <View style={styles.progressInnerRing}>
                      <Text style={styles.progressPercentage}>{courseProgress}%</Text>
                   </View>
                </View>
                <View style={styles.progressTextContainer}>
                   <Text style={styles.progressLabel}>Course Progress</Text>
                   <Text style={styles.progressValue}>You've watched {Math.round((courseProgress/100) * syllabus.length)} of {syllabus.length} lessons</Text>
                </View>
             </View>
             <TouchableOpacity style={styles.viewCourseChip}>
                 <Text style={styles.viewCourseText}>View Course &gt;</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsRow}>
           <TouchableOpacity style={[styles.tabItem, activeTab === 'Overview' && styles.activeTabItem]} onPress={() => setActiveTab('Overview')}>
              <Text style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>Overview</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.tabItem, activeTab === 'Notes' && styles.activeTabItem]} onPress={() => setActiveTab('Notes')}>
              <Text style={[styles.tabText, activeTab === 'Notes' && styles.activeTabText]}>Notes</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{videoNotes.length}</Text></View>
           </TouchableOpacity>
           <TouchableOpacity style={styles.tabItem} disabled>
              <Text style={styles.tabText}>Resources</Text>
           </TouchableOpacity>
        </View>

        {activeTab === 'Overview' ? (
        <View style={styles.syllabusSection}>
          <Text style={styles.subTitle}>Course Syllabus</Text>
          {syllabus.map((item, idx) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.syllabusItem, item.id === currentVideoId && styles.activeSyllabusItem]}
              onPress={async () => {
                if (item.status !== 'locked') {
                  const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
                  const currentItem = syllabus[currentIndex];
                  
                  if (currentItem && !currentItem.completed) {
                     await sendProgressAnalytics('complete', videoStats.current || 0, true);
                     setSyllabus(prev => prev.map((s, idx) => ({
                        ...s,
                        status: idx === currentIndex ? 'complete' : s.status,
                        completed: idx === currentIndex ? true : s.completed
                     })));
                  }

                  setCurrentVideoId(item.id);
                  setCurrentLesson(item.title);
                  setLessonUnlocked(false);
                }
              }}
            >
              <View style={styles.statusIconWrapper}>
                {item.id === currentVideoId ? (
                  <View style={styles.activeIconCircle}><Play size={14} color={Colors.brandBlue} fill={Colors.brandBlue} /></View>
                ) : item.status === 'complete' ? (
                  <View style={styles.completedIconCircle}><Text style={styles.circleNumber}>{idx + 1}</Text></View>
                ) : item.status === 'locked' ? (
                  <View style={styles.lockedIconCircle}><Lock size={14} color={Colors.silver} /></View>
                ) : (
                  <View style={styles.inactiveIconCircle}><Text style={styles.circleNumber}>{idx + 1}</Text></View>
                )}
              </View>
              <View style={styles.syllabusInfo}>
                <Text style={[styles.syllabusTitle, item.id === currentVideoId && {color: Colors.silver}]}>{item.title}</Text>
                <Text style={[styles.syllabusMetaText, item.id === currentVideoId && {color: Colors.brandBlue, fontWeight: '600'}]}>
                   {item.id === currentVideoId ? `${item.duration}  ·  Now Playing` : item.duration}
                </Text>
              </View>
              <View style={styles.syllabusRightAction}>
                {item.status === 'complete' && <CheckCircle2 size={20} color="#10B981" />}
                {item.id === currentVideoId && <AlignLeft size={20} color={Colors.brandBlue} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        ) : (
           <View style={styles.syllabusSection}>
              {videoNotes.length > 0 ? (
                 videoNotes.map(n => (
                   <View key={n.id} style={styles.noteItem}>
                      <Text style={styles.noteTimestamp}>
                         {Math.floor(n.video_timestamp / 60)}:{String(n.video_timestamp % 60).padStart(2, '0')}
                      </Text>
                      <Text style={styles.noteContent}>{n.content}</Text>
                   </View>
                 ))
              ) : (
                 <Text style={styles.progressLabel}>No notes for this lesson yet.</Text>
              )}
           </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        {(() => {
          const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
          const currentItem = syllabus[currentIndex];
          
          const uncompletedCount = syllabus.filter(s => !s.completed).length;
          const isReadyForAssessment = uncompletedCount === 0 || (uncompletedCount === 1 && currentItem && !currentItem.completed);
          
          const isLastIndex = currentIndex === syllabus.length - 1;
          const needsToLoopBack = isLastIndex && !isReadyForAssessment;
          
          let btnText = "Next Lesson";
          if (isReadyForAssessment) {
             btnText = "Take Assessment";
          } else if (needsToLoopBack) {
             btnText = "Complete Missed Lessons";
          }

          const canProceed = Platform.OS === 'web' || lessonUnlocked || (currentItem && currentItem.completed); 

          return (
            <View style={styles.dualFooterRow}>
              <TouchableOpacity 
                disabled={!canProceed}
                style={[styles.footerBtnPrimary, !canProceed && styles.disabledBtn]}
                onPress={async () => {
                  if (currentItem && !currentItem.completed) {
                     await sendProgressAnalytics('complete', videoStats.current || 0, true);
                     setSyllabus(prev => prev.map((s, idx) => ({
                        ...s,
                        status: idx === currentIndex ? 'complete' : s.status,
                        completed: idx === currentIndex ? true : s.completed
                     })));
                  }

                  if (isReadyForAssessment) {
                    Alert.alert('Coming Soon', 'Take Assessment module coming soon!');
                  } else if (needsToLoopBack) {
                    const nextTarget = syllabus.find(s => !s.completed && s.id !== currentVideoId) || syllabus[0];
                    setCurrentVideoId(nextTarget.id);
                    setCurrentLesson(nextTarget.title);
                    setLessonUnlocked(false);
                  } else {
                    const nextLesson = syllabus[currentIndex + 1];
                    setCurrentVideoId(nextLesson.id);
                    setCurrentLesson(nextLesson.title);
                    setLessonUnlocked(false);
                  }
                }}
              >
                <Play size={20} color={Colors.white} />
                <Text style={styles.footerBtnPrimaryText}>{btnText}</Text>
                {!canProceed && <Text style={styles.lockInfo}>Watch 40%</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerBtnSecondary} onPress={() => setShowNotesModal(true)}>
                 <FileText size={20} color={Colors.navy} />
                 <Text style={styles.footerBtnSecondaryText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* Notes Modal */}
      <Modal visible={showNotesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <ChevronDown size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>
            <TextInput 
              style={styles.noteInput}
              multiline
              placeholder="Type your notes here..."
              value={noteText}
              onChangeText={setNoteText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNotesModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </View>

            {videoNotes.length > 0 && (
              <View style={styles.previousNotes}>
                <Text style={styles.prevNotesTitle}>Previous Notes</Text>
                <ScrollView style={{maxHeight: 200}}>
                  {videoNotes.map(n => (
                    <View key={n.id} style={styles.noteItem}>
                      <Text style={styles.noteTimestamp}>
                        {Math.floor(n.video_timestamp / 60)}:{String(n.video_timestamp % 60).padStart(2, '0')}
                      </Text>
                      <Text style={styles.noteContent}>{n.content}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const luminoShadow = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

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
    maxWidth: 800,
    backgroundColor: Colors.offWhite,
    flex: 1,
    boxShadow: '0 0 20px rgba(4,13,67,0.05)',
  },
  playerWrapper: {
    backgroundColor: 'black',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'web' ? 150 : 120,
  },
  lessonHeader: {
    padding: 20,
  },
  lessonSubtitle: {
    fontSize: 14,
    color: Colors.brandBlue,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  statusTag: {
    backgroundColor: Colors.offWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusTagText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
  },
  lessonMeta: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  courseProgress: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...luminoShadow,
  },
  progressCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: Colors.brandBlue,
    borderLeftColor: Colors.borderLight, // Simulating 75% progress
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInnerRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  progressTextContainer: {
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  viewCourseChip: {
    backgroundColor: Colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewCourseText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.brandBlue,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 24,
    gap: 6,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.brandBlue,
  },
  tabText: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
  },
  activeTabText: {
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
  },
  badge: {
    backgroundColor: Colors.offWhite,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.brandBlue,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    color: Colors.navy,
    fontWeight: '600',
  },
  syllabusSection: {
    padding: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 16,
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activeSyllabusItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    ...luminoShadow,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  activeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNumber: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.silver,
  },
  statusIconWrapper: {
    marginRight: 16,
    width: 32,
    alignItems: 'center',
  },
  syllabusInfo: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
    marginBottom: 2,
  },
  syllabusMetaText: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  syllabusRightAction: {
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    zIndex: 1000,
  },
  dualFooterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtnPrimaryText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  footerBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    gap: 8,
  },
  footerBtnSecondaryText: {
    color: Colors.navy,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  lockInfo: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  noteInput: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.offWhite,
  },
  cancelBtnText: {
    fontWeight: '600',
    color: Colors.navy,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.brandBlue,
  },
  saveBtnText: {
    fontWeight: '700',
    color: Colors.white,
  },
  previousNotes: {
    marginTop: 24,
  },
  prevNotesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 8,
    marginBottom: 12,
  },
  noteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.offWhite,
  },
  noteTimestamp: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandBlue,
    marginBottom: 2,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.navy,
  },
});
