import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ArrowLeft, Bookmark, FileText, RotateCcw, CheckCircle2, PlayCircle, Lock, ChevronDown } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1 }}>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{currentLesson}</Text>
          <Text style={styles.lessonMeta}>
            Lesson {syllabus.findIndex(s => s.id === currentVideoId) + 1} of {syllabus.length}
          </Text>
          
          <View style={styles.courseProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Course Progress</Text>
              <Text style={styles.progressValue}>{courseProgress}% completed</Text>
            </View>
            <View style={styles.progressBarLarge}>
              <View style={[styles.progressFillLarge, { width: `${courseProgress}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNotesModal(true)}>
            <FileText size={20} color={Colors.primaryDark} />
            <Text style={styles.actionBtnText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleBookmark}>
            <Bookmark size={20} color={isBookmarked ? Colors.accentHoney : Colors.primaryDark} fill={isBookmarked ? Colors.accentHoney : 'none'} />
            <Text style={styles.actionBtnText}>{isBookmarked ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleResume}>
            <RotateCcw size={20} color={Colors.primaryDark} />
            <Text style={styles.actionBtnText}>Resume</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.syllabusSection}>
          <Text style={styles.subTitle}>Course Syllabus</Text>
          {syllabus.map((item, idx) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.syllabusItem, item.id === currentVideoId && styles.activeSyllabusItem]}
              onPress={() => {
                if (item.status !== 'locked') {
                  setCurrentVideoId(item.id);
                  setCurrentLesson(item.title);
                  setLessonUnlocked(false);
                }
              }}
            >
              <View style={styles.statusIconWrapper}>
                {item.status === 'complete' && <CheckCircle2 size={24} color="#10B981" />}
                {item.id === currentVideoId && <PlayCircle size={24} color={Colors.primaryDark} />}
                {item.status === 'locked' && <Lock size={20} color={Colors.textSilver} />}
                {item.status === 'available' && item.id !== currentVideoId && <View style={styles.dot} />}
              </View>
              <View style={styles.syllabusInfo}>
                <Text style={styles.syllabusTitle}>{item.title}</Text>
                <Text style={styles.syllabusMetaText}>{item.duration}</Text>
              </View>
              {item.id === currentVideoId && (
                <Text style={styles.percentageText}>
                  {Math.floor((videoStats.current / videoStats.total) * 100)}%
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        {(() => {
          const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
          const isLast = currentIndex === syllabus.length - 1;
          const currentItem = syllabus[currentIndex];
          const canProceed = Platform.OS === 'web' || lessonUnlocked || (currentItem && currentItem.completed); 

          return (
            <TouchableOpacity 
              disabled={!canProceed}
              style={[styles.nextBtn, !canProceed && styles.disabledBtn]}
              onPress={() => {
                if (isLast) {
                  Alert.alert('Coming Soon', 'Take Assessment module coming soon!');
                } else {
                  const nextLesson = syllabus[currentIndex + 1];
                  setCurrentVideoId(nextLesson.id);
                  setCurrentLesson(nextLesson.title);
                }
              }}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? 'Take Assessment' : 'Next Lesson'}
              </Text>
              {!canProceed && <Text style={styles.lockInfo}>Watch 40% to unlock</Text>}
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  webContainer: {
    backgroundColor: '#f0f2f5',
  },
  webContentWrapper: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: Colors.bgWhite,
    minHeight: '100vh',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
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
  lessonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  lessonMeta: {
    fontSize: 14,
    color: Colors.textSilver,
    marginBottom: 20,
  },
  courseProgress: {
    backgroundColor: Colors.bgLight,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSilver,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  syllabusSection: {
    padding: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  activeSyllabusItem: {
    backgroundColor: Colors.bgLight,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  statusIconWrapper: {
    marginRight: 16,
  },
  syllabusInfo: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  syllabusMetaText: {
    fontSize: 12,
    color: Colors.textSilver,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accentElectric,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight2,
    zIndex: 1000,
  },
  nextBtn: {
    backgroundColor: Colors.primaryDark,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockInfo: {
    fontSize: 11,
    color: Colors.bgWhite,
    opacity: 0.8,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgWhite,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  noteInput: {
    backgroundColor: Colors.bgLight,
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
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
    backgroundColor: Colors.bgLight,
  },
  cancelBtnText: {
    fontWeight: '600',
    color: Colors.textDark,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
  },
  saveBtnText: {
    fontWeight: 'bold',
    color: Colors.bgWhite,
  },
  previousNotes: {
    marginTop: 24,
  },
  prevNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
    paddingBottom: 8,
    marginBottom: 12,
  },
  noteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgLight,
  },
  noteTimestamp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.textDark,
  },
});
