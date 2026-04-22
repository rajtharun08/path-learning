import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Modal, TextInput, Alert } from 'react-native';
import { ArrowLeft, Bookmark, FileText, RotateCcw, CheckCircle2, PlayCircle, Lock } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';

export default function VideoPlayer() {
  const navigation = useNavigation();
  const route = useRoute();
  const courseId = route.params?.courseId || 'playlist-fastapi-basics';

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
  const [status, setStatus] = useState({});
  const videoRef = useRef(null);
  
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  
  useEffect(() => {
    fetch(`http://${API_HOST}:8006/courses/${courseId}?user_id=${USER_ID}`)
      .then(res => res.json())
      .then(data => {
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
               setIsBookmarked(data.lessons[0].is_bookmarked || false);
             } else if (data.current_lesson) {
                 const currentFromLessons = data.lessons.find(l => l.youtube_video_id === data.current_lesson.youtube_video_id);
                 setIsBookmarked(currentFromLessons?.is_bookmarked || false);
             }
          }
        }
      })
      .catch(err => console.log('Backend down or failed', err));
  }, [courseId]);
  
  useEffect(() => {
    if (syllabus.length > 0) {
      const completedCount = syllabus.filter(s => s.completed).length;
      const newProgress = Math.round((completedCount / syllabus.length) * 100);
      setCourseProgress(newProgress);
    }
  }, [syllabus]);

  const sendProgressAnalytics = async (eventType, seconds, completed) => {
    try {
      await fetch(`http://${API_HOST}:8003/video/progress`, {
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

  const fetchNotes = async () => {
    if (!currentVideoId) return;
    try {
      const res = await fetch(`http://${API_HOST}:8003/video/notes/${currentVideoId}?user_id=${USER_ID}`);
      const data = await res.json();
      setVideoNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentVideoId]);

  const toggleBookmark = async () => {
    try {
       const res = await fetch(`http://${API_HOST}:8003/video/bookmark`, {
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
      const ts = status.positionMillis ? Math.floor(status.positionMillis / 1000) : 0;
      try {
          await fetch(`http://${API_HOST}:8003/video/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: USER_ID, video_id: currentVideoId, content: noteText, video_timestamp: ts })
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
          const res = await fetch(`http://${API_HOST}:8003/video/resume/${currentVideoId}?user_id=${USER_ID}`);
          const data = await res.json();
          if (data.resume_at_seconds > 0 && videoRef.current) {
              videoRef.current.setPositionAsync(data.resume_at_seconds * 1000);
          }
      } catch (err) {
          console.error("Resume failed", err);
      }
  };

  const handlePlaybackStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      const cur = newStatus.positionMillis / 1000;
      const tot = newStatus.durationMillis ? newStatus.durationMillis / 1000 : 1;
      setVideoStats({ current: cur, total: tot });

      if (cur / tot >= 0.4) {
        setLessonUnlocked(true);
      }

      if (newStatus.didJustFinish) {
        sendProgressAnalytics('complete', cur, true).then(() => {
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
                  setSyllabus(prev => prev.map((s, idx) => ({
                     ...s,
                     status: idx === currentIndex + 1 ? 'playing' : (idx === currentIndex ? 'complete' : s.status),
                     completed: idx === currentIndex ? true : s.completed
                  })));
              }
          }
       });
      }
    }
  };

  // Mock video URI for demo purposes. In real app, map YouTube ID to actual stream/video.
  const videoUri = "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        <TouchableOpacity style={styles.backBtnVideo} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailsContainer}>
        <Text style={styles.h1}>{currentLesson}</Text>
        <Text style={styles.lessonCount}>
          Lesson {syllabus.findIndex(s => s.id === currentVideoId) + 1} of {syllabus.length}
        </Text>

        <View style={styles.courseProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Course Progress</Text>
            <Text style={styles.progressPercent}>{courseProgress}% completed</Text>
          </View>
          <View style={styles.progressBarLg}>
            <View style={[styles.progressFillLg, { width: `${courseProgress}%` }]} />
          </View>
        </View>

        <Text style={styles.h2}>Course Syllabus</Text>
        <View style={styles.syllabusList}>
          {syllabus.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.syllabusItem, item.status === 'locked' && styles.syllabusItemLocked]}
              disabled={item.status === 'locked'}
              onPress={() => {
                const clickedId = item.id;
                const clickedTitle = item.title;
                setCurrentVideoId(clickedId);
                setCurrentLesson(clickedTitle);
                setLessonUnlocked(false);
                setVideoStats({ current: 0, total: 1 });
                setSyllabus(prev => prev.map(s => ({
                  ...s,
                  status: s.id === clickedId ? 'playing' : (s.status === 'playing' ? (s.completed ? 'complete' : 'available') : s.status)
                })));
                const newlyClicked = syllabus.find(s => s.id === clickedId);
                setIsBookmarked(newlyClicked?.is_bookmarked || false);
              }}
            >
              <View style={styles.iconWrapper}>
                {item.status === 'complete' && <CheckCircle2 size={24} color="#10B981" />}
                {item.status === 'playing' && <PlayCircle size={24} color="#FFC837" fill="#FFC837" />}
                {item.status === 'locked' && <Lock size={20} color="#A0AEC0" />}
                {item.status === 'available' && <PlayCircle size={24} color="#A0AEC0" />}
              </View>
              <View style={styles.syllabusInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.syllabusMeta}>
                  <Text style={styles.duration}>{item.duration}</Text>
                  {item.status === 'playing' && <Text style={styles.playingBadge}>Now Playing</Text>}
                </View>
              </View>
              <View style={styles.syllabusTrailing}>
                {item.completed && <Text style={styles.completeText}>100%</Text>}
                {item.status === 'playing' && !item.completed && (
                  <Text style={styles.activeText}>
                    {Math.floor((videoStats.current / videoStats.total) * 100)}%
                  </Text>
                )}
                {!item.completed && item.status !== 'playing' && <Text style={styles.lockedText}>0%</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.btnIcon} onPress={() => setShowNotesModal(true)}>
            <FileText size={20} color="#fff" />
            <Text style={styles.btnIconText}>Add Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnIcon} onPress={toggleBookmark}>
            <Bookmark size={20} color={isBookmarked ? "#FFC837" : "#fff"} />
            <Text style={styles.btnIconText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnIcon} onPress={handleResume}>
            <RotateCcw size={20} color="#fff" />
            <Text style={styles.btnIconText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        {(() => {
            const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
            const isLast = currentIndex === syllabus.length - 1;
            const currentItem = syllabus[currentIndex];
            const canProceed = lessonUnlocked || (currentItem && currentItem.completed); 

            return (
              <TouchableOpacity 
                style={[styles.btnPrimary, !canProceed && styles.btnDisabled]}
                disabled={!canProceed}
                onPress={() => {
                  if (isLast) {
                      Alert.alert('Assessment', 'Take Assessment module coming soon!');
                  } else {
                      const nextLesson = syllabus[currentIndex + 1];
                      setCurrentVideoId(nextLesson.id);
                      setCurrentLesson(nextLesson.title);
                      setSyllabus(prev => prev.map((s, idx) => ({
                        ...s,
                        status: idx === currentIndex + 1 ? 'playing' : (idx === currentIndex ? 'complete' : s.status),
                        completed: idx === currentIndex ? true : s.completed
                      })));
                      setIsBookmarked(nextLesson.is_bookmarked || false);
                      setVideoStats({ current: 0, total: 1 });
                      setLessonUnlocked(false);
                  }
                }}
              >
                <Text style={styles.btnPrimaryText}>{isLast ? 'Take Assessment' : 'Next Lesson'}</Text>
                {!canProceed && <Text style={styles.unlockText}>Watch 40% to unlock</Text>}
              </TouchableOpacity>
            );
        })()}
      </View>

      <Modal visible={showNotesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Add Note</Text>
             <TextInput 
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Type your notes here..."
                placeholderTextColor="#A0AEC0"
                style={styles.textInput}
                multiline
             />
             <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowNotesModal(false)} style={styles.btnCancel}>
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveNote} style={styles.btnSave}>
                  <Text style={styles.btnSaveText}>Save Note</Text>
                </TouchableOpacity>
             </View>

             {videoNotes.length > 0 && (
                <View style={styles.prevNotesContainer}>
                   <Text style={styles.prevNotesTitle}>Previous Notes</Text>
                   <ScrollView style={{ maxHeight: 150 }}>
                     {videoNotes.map(n => (
                        <View key={n.id} style={styles.noteItem}>
                           <Text style={styles.noteTime}>{Math.floor(n.video_timestamp / 60)}:{String(n.video_timestamp % 60).padStart(2, '0')}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  playerContainer: { width: '100%', height: 250, backgroundColor: '#000', position: 'relative' },
  video: { flex: 1 },
  backBtnVideo: { position: 'absolute', top: 40, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, zIndex: 10 },
  detailsContainer: { padding: 20, paddingBottom: 100 },
  h1: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  lessonCount: { color: '#A0AEC0', fontSize: 14, marginBottom: 24 },
  courseProgress: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 32 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#A0AEC0', fontSize: 14 },
  progressPercent: { color: '#4E6BFF', fontSize: 14, fontWeight: '700' },
  progressBarLg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressFillLg: { height: '100%', backgroundColor: '#4E6BFF', borderRadius: 3 },
  h2: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  syllabusList: { marginBottom: 32 },
  syllabusItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12 },
  syllabusItemLocked: { opacity: 0.5 },
  iconWrapper: { marginRight: 16 },
  syllabusInfo: { flex: 1 },
  itemTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  syllabusMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duration: { color: '#A0AEC0', fontSize: 13 },
  playingBadge: { backgroundColor: '#4E6BFF', color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  syllabusTrailing: { marginLeft: 16 },
  completeText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  activeText: { color: '#4E6BFF', fontSize: 13, fontWeight: '700' },
  lockedText: { color: '#A0AEC0', fontSize: 13 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnIcon: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B', paddingVertical: 12, borderRadius: 8, marginHorizontal: 4 },
  btnIconText: { color: '#fff', fontSize: 12, marginTop: 4 },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B' },
  btnPrimary: { backgroundColor: '#4E6BFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#334155' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  unlockText: { color: '#A0AEC0', fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1E293B', width: '90%', maxWidth: 400, borderRadius: 16, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  textInput: { backgroundColor: '#0F172A', color: '#fff', height: 100, borderRadius: 8, padding: 12, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#334155' },
  btnCancelText: { color: '#fff', fontWeight: '600' },
  btnSave: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#4E6BFF' },
  btnSaveText: { color: '#fff', fontWeight: '600' },
  prevNotesContainer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16 },
  prevNotesTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  noteItem: { borderBottomWidth: 1, borderBottomColor: '#334155', paddingVertical: 8 },
  noteTime: { color: '#4E6BFF', fontSize: 12, fontWeight: '700' },
  noteContent: { color: '#fff', fontSize: 13, marginTop: 4 }
});
