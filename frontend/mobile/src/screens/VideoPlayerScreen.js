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
import { ArrowLeft, FileText, CheckCircle2, PlayCircle, Lock, ChevronDown, Check, Play, AlignLeft, MessageSquare, ThumbsUp, Send, Sparkles, Search, Printer } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getCurrentUserId, getAuthSession, getCurrentUser } from '../constants/Auth';

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
  const [noteTitle, setNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [videoNotes, setVideoNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [activeQATab, setActiveQATab] = useState('All Questions');
  const [playing, setPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [resources, setResources] = useState([]);
  const [userName, setUserName] = useState('Student');
  const [userId, setUserId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyingToAnswerId, setReplyingToAnswerId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedItems, setExpandedItems] = useState({}); // { [id]: boolean }
  const [collapsedThreads, setCollapsedThreads] = useState({}); // { [qId]: boolean } (true means hidden)
  const [downloadedItems, setDownloadedItems] = useState([]); // Array of downloaded lesson notes
  const [nextAction, setNextAction] = useState({ type: 'next_lesson', label: 'Next Lesson' });

  const playerRef = useRef();
  const getLessonByVideoId = useCallback(
    (videoId) => syllabus.find((lesson) => lesson.id === videoId),
    [syllabus]
  );

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return;
      }
      const res = await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}?user_id=${userId}`);
      const data = await res.json();
      if(data) {
        if (data.current_lesson) {
           setCurrentLesson(data.current_lesson.title || `Lesson ${data.current_lesson.position}`);
           setCurrentVideoId(data.current_lesson.youtube_video_id);
        }
        setCourseProgress(data.progress_percent || 0);
        setResources(data.resources || []);
        setNextAction({
            type: data.next_action_type || 'next_lesson',
            label: data.next_action_label || 'Next Lesson'
         });

        if (data.lessons && data.lessons.length > 0) {
          setSyllabus(data.lessons.map((l, i) => {
            const isPlaying = data.current_lesson && l.youtube_video_id === data.current_lesson.youtube_video_id;
            return {
              id: l.youtube_video_id || `temp-${i}`,
              title: l.title || `Lesson ${i+1}`,
              duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
              rawDuration: l.duration || 0,
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
      const userId = await getCurrentUserId();
      if (!userId) {
        return;
      }
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/notes/${currentVideoId}?user_id=${userId}`);
      const data = await res.json();
      setVideoNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    if (!courseId) {
      console.log('No courseId provided to fetchQuestions');
      return;
    }
    try {
      const uId = await getCurrentUserId();
      const url = uId 
        ? `${API_URLS.VIDEO_SERVICE}/course/${courseId}/questions?user_id=${uId}`
        : `${API_URLS.VIDEO_SERVICE}/course/${courseId}/questions`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        console.error('Fetch questions failed with status:', res.status);
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const handleExportPDF = () => {
    if (videoNotes.length === 0) {
      Alert.alert('No Notes', 'You have no notes to export for this lesson.');
      return;
    }

    const noteContent = videoNotes.map((n, i) => (
      `${i + 1}. ${n.title || 'Untitled Note'}\n${n.content}\n\n`
    )).join('');

    const fullContent = `NOTES FOR: ${currentLesson}\n--------------------------\n\n${noteContent}`;

    if (Platform.OS === 'web') {
      const element = document.createElement("a");
      const file = new Blob([fullContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${currentLesson.replace(/\s+/g, '_')}_Notes.txt`;
      document.body.appendChild(element);
      element.click();
    } else {
      Alert.alert('Download Started', 'Your notes are being prepared for download.');
    }

    // Track the download
    const lessonIdx = syllabus.findIndex(s => s.id === currentVideoId) + 1;
    const newItem = {
      id: Date.now(),
      lessonNum: lessonIdx,
      title: currentLesson,
      date: new Date().toLocaleDateString(),
      size: `${(fullContent.length / 1024).toFixed(1)} KB`
    };
    
    setDownloadedItems(prev => {
      // Avoid duplicates for the same lesson
      if (prev.find(item => item.title === currentLesson)) return prev;
      return [newItem, ...prev];
    });
  };

  useEffect(() => {
    const loadUserData = async () => {
      const user = await getCurrentUser();
      if (user && user.email) {
        const namePart = user.email.split('@')[0];
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        setUserId(user.id);
      }
    };
    loadUserData();
    fetchNotes();
  }, [currentVideoId]);

  const sendProgressAnalytics = async (eventType, seconds) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return;
      }
      await fetch(`${API_URLS.VIDEO_SERVICE}/video/progress`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            user_id: userId,
            video_id: currentVideoId,
            watched_seconds: Math.floor(seconds),
            event_type: eventType,
         })
      });
    } catch(err) {
      console.log('Progress tracking error:', err);
    }
  };

  const syncLessonCompletion = useCallback(async (videoId, watchedSeconds = 0) => {
    if (!videoId) {
      return false;
    }

    const lesson = getLessonByVideoId(videoId);
    const fallbackDuration = Math.floor(lesson?.rawDuration || 0);
    const completionSeconds = Math.max(Math.floor(watchedSeconds), fallbackDuration);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return false;
      }
      await fetch(`${API_URLS.VIDEO_SERVICE}/video/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          video_id: videoId,
          watched_seconds: completionSeconds,
          event_type: 'complete',
        }),
      });

      setSyllabus((prev) =>
        prev.map((item) =>
          item.id === videoId ? { ...item, status: 'complete', completed: true } : item
        )
      );
      return true;
    } catch (err) {
      console.log('Completion sync error:', err);
      return false;
    }
  }, [getLessonByVideoId]);

  useEffect(() => {
    if (syllabus.length > 0) {
      const completedCount = syllabus.filter(s => s.completed).length;
      const pct = (completedCount / syllabus.length) * 100;
      setCourseProgress(Math.round(pct));
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
    const lesson = getLessonByVideoId(currentVideoId);
    await syncLessonCompletion(currentVideoId, time || lesson?.rawDuration || 0);
    
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
            setLessonUnlocked(false);
        }
    }
    await fetchCourseData();
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
            
            sendProgressAnalytics('progress', cur);
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
       const userId = await getCurrentUserId();
       if (!userId) {
         return;
       }
       const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/bookmark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, video_id: currentVideoId })
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
          const userId = await getCurrentUserId();
          if (!userId) return;
          await fetch(`${API_URLS.VIDEO_SERVICE}/video/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                user_id: userId, 
                video_id: currentVideoId, 
                title: noteTitle,
                content: noteText, 
                video_timestamp: Math.floor(ts) 
              })
          });
          setNoteText('');
          setNoteTitle('');
          setShowNotesModal(false);
          fetchNotes();
      } catch (err) {
          console.error("Save note failed", err);
      }
  };

  const handlePostQuestion = async () => {
    if (!newQuestionText.trim()) return;
    try {
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/course/${courseId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId || 'anonymous', user_name: userName, content: newQuestionText })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions([data, ...questions]);
        setNewQuestionText('');
      }
    } catch (err) {
      console.error('Failed to post question', err);
    }
  };

  const handlePostReply = async (qId, pId = null) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/questions/${qId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId || 'anonymous', 
          user_name: userName, 
          content: replyText,
          is_instructor: false,
          parent_id: pId
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh all questions to get the new nested structure
        fetchQuestions();
        setReplyText('');
        setReplyingToId(null);
        setReplyingToAnswerId(null);
      }
    } catch (err) {
      console.error('Failed to post reply', err);
    }
  };


  const renderAnswer = (ans, qId, depth = 0) => (
    <View key={ans.id} style={{
      marginLeft: depth === 0 ? 0 : 16, 
      borderLeftWidth: depth === 0 ? 0 : 2, 
      borderLeftColor: Colors.offWhite, 
      paddingLeft: depth === 0 ? 0 : 12, 
      marginBottom: 12
    }}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
        <Text style={{fontSize: 12, fontFamily: 'Inter_600SemiBold', color: ans.is_instructor ? Colors.brandBlue : Colors.navy}}>{ans.user_name || 'Student'}</Text>
        {ans.is_instructor && <Sparkles size={10} color={Colors.brandBlue} style={{marginLeft: 4}} />}
        <Text style={{fontSize: 10, color: Colors.silver, marginLeft: 8}}>Just now</Text>
      </View>
      <View style={{marginBottom: 6}}>
        {renderTruncatedText(ans.content, `ans_${ans.id}`, 100)}
      </View>
      
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}} onPress={() => handleUpvoteAnswer(ans.id)}>
          <ThumbsUp size={12} color={ans.has_upvoted ? Colors.brandBlue : Colors.silver} fill={ans.has_upvoted ? Colors.brandBlue : 'transparent'} />
          <Text style={{color: ans.has_upvoted ? Colors.brandBlue : Colors.silver, fontSize: 11, marginLeft: 4}}>{ans.upvotes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReplyingToAnswerId(replyingToAnswerId === ans.id ? null : ans.id)}>
          <Text style={{color: Colors.silver, fontSize: 11, fontFamily: 'Inter_600SemiBold'}}>Reply</Text>
        </TouchableOpacity>
      </View>

      {replyingToAnswerId === ans.id && (
        <View style={{flexDirection: 'row', marginTop: 10, alignItems: 'center'}}>
          <TextInput 
            style={{flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: 4, fontSize: 12}}
            placeholder={`Reply to ${ans.user_name}...`}
            value={replyText}
            onChangeText={setReplyText}
            autoFocus
          />
          <TouchableOpacity onPress={() => handlePostReply(qId, ans.id)} style={{marginLeft: 8}}>
            <Send size={16} color={Colors.brandBlue} />
          </TouchableOpacity>
        </View>
      )}

      {ans.replies && ans.replies.length > 0 && (
        <View style={{marginTop: 10}}>
          {ans.replies.map(reply => renderAnswer(reply, qId, depth + 1))}
        </View>
      )}
    </View>
  );

  const handleUpvoteQuestion = async (qId) => {
    try {
      const uId = await getCurrentUserId();
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/questions/${qId}/upvote?user_id=${uId || 'anonymous'}`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to upvote question', err);
    }
  };

  const handleUpvoteAnswer = async (aId) => {
    try {
      const uId = await getCurrentUserId();
      const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/answers/${aId}/upvote?user_id=${uId || 'anonymous'}`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to upvote answer', err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTruncatedText = (text, id, limit = 150) => {
    if (!text || text.length <= limit) return <Text style={{fontSize: 14, color: Colors.navy, lineHeight: 20}}>{text}</Text>;
    
    const isExpanded = expandedItems[id];
    return (
      <View>
        <Text style={{fontSize: 14, color: Colors.navy, lineHeight: 20}}>
          {isExpanded ? text : `${text.substring(0, limit)}...`}
        </Text>
        <TouchableOpacity onPress={() => toggleExpand(id)}>
          <Text style={{color: Colors.brandBlue, fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 4}}>
            {isExpanded ? 'Show Less' : 'See More'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleResume = async () => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
          return;
        }
        const res = await fetch(`${API_URLS.VIDEO_SERVICE}/video/resume/${currentVideoId}?user_id=${userId}`);
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
                 <View style={[
                   styles.progressRing, 
                   { 
                     borderColor: Colors.borderLight,
                     borderTopColor: courseProgress > 0 ? Colors.brandBlue : Colors.borderLight,
                     borderRightColor: courseProgress >= 25 ? Colors.brandBlue : Colors.borderLight,
                     borderBottomColor: courseProgress >= 50 ? Colors.brandBlue : Colors.borderLight,
                     borderLeftColor: courseProgress >= 75 ? Colors.brandBlue : Colors.borderLight,
                   }
                 ]}>
                    <View style={styles.progressInnerRing}>
                       <Text style={styles.progressPercentage}>{courseProgress}%</Text>
                    </View>
                 </View>
                <View style={styles.progressTextContainer}>
                   <Text style={styles.progressLabel}>Course Progress</Text>
                   <Text style={styles.progressValue}>You've watched {Math.round((courseProgress/100) * syllabus.length)} of {syllabus.length} lessons</Text>
                   <View style={styles.progressBarTrack}>
                     <View
                       style={[
                         styles.progressBarFill,
                         { width: `${Math.max(0, Math.min(courseProgress, 100))}%` },
                       ]}
                     />
                   </View>
                </View>
             </View>
              <TouchableOpacity 
                style={styles.viewCourseChip}
                onPress={() => navigation.navigate('CourseDetails', { courseId })}
              >
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
           <TouchableOpacity style={[styles.tabItem, activeTab === 'Downloads' && styles.activeTabItem]} onPress={() => setActiveTab('Downloads')}>
              <Text style={[styles.tabText, activeTab === 'Downloads' && styles.activeTabText]}>Downloads</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.tabItem, activeTab === 'Q&A' && styles.activeTabItem]} onPress={() => setActiveTab('Q&A')}>
              <Text style={[styles.tabText, activeTab === 'Q&A' && styles.activeTabText]}>Q&A</Text>
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
                  <View style={styles.completedIconCircle}><CheckCircle2 size={16} color="#10B981" /></View>
                ) : item.status === 'locked' ? (
                  <View style={styles.lockedIconCircle}><Lock size={14} color={Colors.silver} /></View>
                ) : (
                  <View style={styles.inactiveIconCircle}><Text style={styles.circleNumber}>{idx + 1}</Text></View>
                )}
              </View>
              <View style={styles.syllabusInfo}>
                <Text style={[styles.syllabusTitle, item.id === currentVideoId && {color: Colors.brandBlue}]}>{item.title}</Text>
                <Text style={[styles.syllabusMetaText, item.id === currentVideoId && {color: Colors.brandBlue, fontWeight: '600'}]}>
                   {item.id === currentVideoId ? `${item.duration}  ·  Now Playing` : item.duration}
                </Text>
              </View>
              <View style={styles.syllabusRightAction}>
                {item.status === 'complete' && <CheckCircle2 size={20} color="#10B981" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        ) : activeTab === 'Notes' ? (
           <View style={styles.syllabusSection}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10}}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.offWhite, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.borderLight}}>
                  <Search size={18} color={Colors.silver} />
                  <TextInput 
                    style={{flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14}}
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <TouchableOpacity 
                  style={{padding: 10, backgroundColor: Colors.brandBlue + '10', borderRadius: 8}}
                  onPress={handleExportPDF}
                >
                  <Printer size={20} color={Colors.brandBlue} />
                </TouchableOpacity>
              </View>

               {videoNotes.length > 0 ? (
                 videoNotes
                  .filter(n => 
                    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                    n.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((n, idx) => (
                    <View key={n.id} style={[styles.noteItem, {backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight}]}>
                        <View style={{marginBottom: 8}}>
                          <Text style={{fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.navy}}>
                            {idx + 1}. {n.title || 'Untitled Note'}
                          </Text>
                        </View>
                        <Text style={{fontSize: 14, color: Colors.textSecondary, lineHeight: 20}}>
                          {n.content}
                        </Text>
                    </View>
                  ))
               ) : (
                  <Text style={styles.progressLabel}>No notes for this lesson yet.</Text>
               )}
              {videoNotes.length > 0 && videoNotes.filter(n => (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) || n.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <Text style={{textAlign: 'center', color: Colors.silver, marginTop: 20}}>No matching notes found.</Text>
              )}
            </View>
        ) : activeTab === 'Downloads' ? (
           <View style={styles.syllabusSection}>
              <View style={{backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: Colors.borderLight}}>
                <Text style={{fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.navy, marginBottom: 8}}>Storage Management</Text>
                <View style={{height: 8, backgroundColor: Colors.offWhite, borderRadius: 4, overflow: 'hidden', marginBottom: 8}}>
                  <View style={{width: '15%', height: '100%', backgroundColor: Colors.brandBlue}} />
                </View>
                <Text style={{fontSize: 11, color: Colors.silver}}>1.2 MB used of 100 MB available</Text>
              </View>

              <Text style={styles.subTitle}>Download History</Text>
              
              {downloadedItems.length > 0 ? (
                downloadedItems.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={{
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: Colors.white, 
                      padding: 16, 
                      borderRadius: 12, 
                      marginBottom: 10, 
                      borderWidth: 1, 
                      borderColor: Colors.borderLight
                    }}
                    onPress={() => Alert.alert('Already Downloaded', `This file was downloaded on ${item.date}`)}
                  >
                      <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandBlue + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                         <FileText size={20} color={Colors.brandBlue} />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={{fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.navy, marginBottom: 2}}>Notes: Lesson {item.lessonNum}</Text>
                        <Text style={{fontSize: 12, color: Colors.silver, fontFamily: 'Inter_400Regular'}}>{item.title} • {item.size}</Text>
                      </View>
                      <CheckCircle2 size={18} color="#10B981" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{alignItems: 'center', paddingVertical: 40}}>
                  <FileText size={40} color={Colors.borderLight} />
                  <Text style={{color: Colors.silver, marginTop: 12, fontSize: 13}}>No downloads yet.</Text>
                </View>
              )}
           </View>
        ) : activeTab === 'Q&A' ? (
        <View style={styles.syllabusSection}>
          <Text style={{color: Colors.silver, fontSize: 13, marginBottom: 16}}>Ask questions and get answers from your instructor and peers.</Text>
          
          <View style={{flexDirection: 'row', marginBottom: 20}}>
            <TextInput 
              style={{flex: 1, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 8, padding: 12, backgroundColor: Colors.white, marginRight: 12}}
              placeholder="Ask a question..."
              value={newQuestionText}
              onChangeText={setNewQuestionText}
            />
            <TouchableOpacity 
              style={{backgroundColor: Colors.brandBlue, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8}}
              onPress={handlePostQuestion}
            >
              <Text style={{color: Colors.white, fontFamily: 'Inter_600SemiBold'}}>Ask</Text>
            </TouchableOpacity>
          </View>

          <View style={{flexDirection: 'row', marginBottom: 16}}>
             <TouchableOpacity onPress={() => setActiveQATab('All Questions')} style={[{paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8}, activeQATab === 'All Questions' ? {backgroundColor: Colors.brandBlue + '20'} : {backgroundColor: Colors.offWhite}]}>
               <Text style={[{fontSize: 13, fontFamily: 'Inter_500Medium'}, activeQATab === 'All Questions' ? {color: Colors.brandBlue} : {color: Colors.silver}]}>All Questions ({questions.length})</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setActiveQATab('My Questions')} style={[{paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16}, activeQATab === 'My Questions' ? {backgroundColor: Colors.brandBlue + '20'} : {backgroundColor: Colors.offWhite}]}>
               <Text style={[{fontSize: 13, fontFamily: 'Inter_500Medium'}, activeQATab === 'My Questions' ? {color: Colors.brandBlue} : {color: Colors.silver}]}>My Questions ({questions.filter(q => q.user_id === userId).length})</Text>
             </TouchableOpacity>
          </View>

          {questions.filter(q => activeQATab === 'All Questions' || q.user_id === userId).map(q => (
             <View key={q.id} style={{backgroundColor: Colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 12}}>
               <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                   <View style={{width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brandBlue + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                     <Text style={{color: Colors.brandBlue, fontFamily: 'Inter_600SemiBold', fontSize: 12}}>{q.user_name ? q.user_name.substring(0, 2).toUpperCase() : 'ST'}</Text>
                   </View>
                   <View>
                     <Text style={{fontFamily: 'Inter_600SemiBold', color: Colors.navy, fontSize: 14}}>{q.user_name || 'Anonymous'}</Text>
                     <Text style={{color: Colors.silver, fontSize: 11}}>Just now</Text>
                   </View>
                 </View>
                 <View style={{backgroundColor: q.status === 'Answered' ? '#E1FCEF' : '#FFF4E5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12}}>
                   <Text style={{color: q.status === 'Answered' ? '#10B981' : '#F59E0B', fontSize: 10, fontFamily: 'Inter_600SemiBold'}}>{q.status}</Text>
                 </View>
               </View>
               <View style={{marginBottom: 12}}>
                 {renderTruncatedText(q.content, `q_${q.id}`, 200)}
               </View>
               
               {/* Replies List */}
               {q.answers && q.answers.length > 0 && (
                 <View style={{marginBottom: 12}}>
                   {!collapsedThreads[q.id] ? (
                     <View style={{marginLeft: 20, borderLeftWidth: 2, borderLeftColor: Colors.offWhite, paddingLeft: 12}}>
                       {q.answers.map(ans => renderAnswer(ans, q.id))}
                       <TouchableOpacity 
                         onPress={() => setCollapsedThreads(prev => ({ ...prev, [q.id]: true }))}
                         style={{marginTop: 4}}
                       >
                         <Text style={{color: Colors.brandBlue, fontSize: 12, fontFamily: 'Inter_600SemiBold'}}>Hide replies</Text>
                       </TouchableOpacity>
                     </View>
                   ) : (
                     <TouchableOpacity 
                       onPress={() => setCollapsedThreads(prev => ({ ...prev, [q.id]: false }))}
                       style={{marginLeft: 32, flexDirection: 'row', alignItems: 'center'}}
                     >
                       <View style={{width: 20, height: 1, backgroundColor: Colors.borderLight, marginRight: 8}} />
                       <Text style={{color: Colors.brandBlue, fontSize: 12, fontFamily: 'Inter_600SemiBold'}}>
                         View {q.answers.length} {q.answers.length === 1 ? 'reply' : 'replies'}
                       </Text>
                     </TouchableOpacity>
                   )}
                 </View>
               )}

               <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                 <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}} onPress={() => handleUpvoteQuestion(q.id)}>
                      <ThumbsUp size={14} color={q.has_upvoted ? Colors.brandBlue : Colors.silver} fill={q.has_upvoted ? Colors.brandBlue : 'transparent'} />
                      <Text style={{color: q.has_upvoted ? Colors.brandBlue : Colors.silver, fontSize: 12, marginLeft: 6}}>{q.upvotes || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}} onPress={() => setReplyingToId(replyingToId === q.id ? null : q.id)}>
                      <MessageSquare size={14} color={Colors.silver} />
                      <Text style={{color: Colors.silver, fontSize: 12, fontFamily: 'Inter_500Medium', marginLeft: 6}}>Reply</Text>
                    </TouchableOpacity>
                 </View>
                 <Text style={{color: Colors.silver, fontSize: 12}}>{q.answers ? q.answers.length : 0} Replies</Text>
               </View>

               {replyingToId === q.id && (
                 <View style={{flexDirection: 'row', marginTop: 12, alignItems: 'center'}}>
                   <TextInput 
                     style={{flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: 4, fontSize: 13}}
                     placeholder="Write a reply..."
                     value={replyText}
                     onChangeText={setReplyText}
                     autoFocus
                   />
                   <TouchableOpacity onPress={() => handlePostReply(q.id)} style={{marginLeft: 8}}>
                     <Send size={18} color={Colors.brandBlue} />
                   </TouchableOpacity>
                 </View>
               )}
             </View>
          ))}
          {questions.length === 0 && (
            <View style={{padding: 24, alignItems: 'center'}}>
              <Text style={{color: Colors.silver}}>No questions yet. Be the first to ask!</Text>
            </View>
          )}
        </View>
        ) : null}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        {(() => {
          const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
          const currentItem = syllabus[currentIndex];
          
          const isReadyForAssessment = syllabus.length > 0 && syllabus.every(s => s.completed);
          
          const isLastIndex = currentIndex === syllabus.length - 1;
          const needsToLoopBack = isLastIndex && !isReadyForAssessment && !!currentItem?.completed;
          
          let btnText = nextAction.label;
          if (currentItem && !currentItem.completed) {
             btnText = "Mark Lesson Complete";
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
                     const completionSeconds = Platform.OS === 'web'
                       ? (currentItem.rawDuration || 0)
                       : (videoStats.current || currentItem.rawDuration || 0);
                     await syncLessonCompletion(currentVideoId, completionSeconds);
                     await fetchCourseData();
                     return;
                  }

                   if (isReadyForAssessment || btnText === "Take Assessment") {
                     Alert.alert(
                        'Course Assessment',
                        'You have completed all lessons! Are you ready to take the assessment?',
                        [
                           { text: 'Later', style: 'cancel' },
                           { 
                             text: 'Start Assessment', 
                             onPress: async () => {
                                // Mock assessment: instantly complete it for now
                                try {
                                   const userId = await getCurrentUserId();
                                   const res = await fetch(`${API_URLS.VIDEO_SERVICE}/course/${courseId}/assessment/complete?user_id=${userId}&score=100`, {
                                      method: 'POST'
                                   });
                                   if (res.ok) {
                                      Alert.alert('Congratulations!', 'You have passed the assessment and completed the course!');
                                      fetchCourseData();
                                   }
                                } catch (err) {
                                   console.log('Assessment failed', err);
                                }
                             }
                           }
                        ]
                     );
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
              style={[styles.noteInput, {height: 40, marginBottom: 12, fontWeight: '700'}]}
              placeholder="Note Title (e.g. Introduction to AI)"
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
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
    maxWidth: 820,
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
  progressBarTrack: {
    marginTop: 8,
    width: 180,
    maxWidth: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.brandBlue,
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
  noteContent: {
    fontSize: 14,
    color: Colors.navy,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resourceIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 102, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
    marginBottom: 2,
  },
  resourceMeta: {
    fontSize: 11,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
});
