import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image, 
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Clock, Check, Lock, PlayCircle, FileText, ChevronRight, BarChart } from 'lucide-react-native';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getCurrentUserId, getScopedStorageKey } from '../constants/Auth';

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { courseId, initialData } = route.params || {};
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEnrolled, setIsEnrolled] = useState(initialData?.isEnrolled || false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(!initialData); // Don't show full screen spinner if we have initial data
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [course, setCourse] = useState(initialData ? {
    title: initialData.title,
    rating: initialData.rating,
    students: initialData.students,
    desc: initialData.desc,
    img: initialData.img,
    instructor: "Loading...",
    difficulty: "Beginner",
    duration: "-"
  } : {
     title: "Loading Course...",
     rating: 0,
     students: "0",
     duration: "-",
     desc: "",
     instructor: "Loading...",
     difficulty: "Beginner",
     img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
  });

  const generateConsistentHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const [outcomes, setOutcomes] = useState([
    "Build scalable REST APIs",
    "Master JSON serialization",
    "Understand data types",
    "Implement best practices"
  ]);

  useEffect(() => {
    loadCourseCache();
    fetchCourseDetails();
    checkEnrollment();
  }, [courseId]);

  const loadCourseCache = async () => {
    try {
      const cacheKey = `course_cache_${courseId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setCourse({
          title: data.title,
          rating: data.rating, 
          students: data.students,
          duration: data.duration,
          difficulty: data.difficulty,
          desc: data.description || data.desc || "",
          instructor: data.author_name || data.instructor || 'Instructor',
          img: data.thumbnail || data.img
        });
        if (data.lessons) {
          setLessons(data.lessons.map((l, i) => ({
             id: l.youtube_video_id || l.id || i,
             title: l.title,
             duration: l.duration_text || "15:00",
             status: l.completed ? 'complete' : 'playing'
          })));
        }
        setLoading(false);
        setLessonsLoading(false);
      }
    } catch (e) {
      console.log('Cache load failed', e);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const userId = await getCurrentUserId();
      const res = await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}${userId ? `?user_id=${userId}` : ''}`);
      const data = await res.json();
      if(data && data.title) {
         const hash = generateConsistentHash(courseId);
         const dynamicRating = (4.0 + (hash % 10) / 10).toFixed(1);
         const instructorName = data.author_name || 'Unknown Instructor';

         const newCourseData = {
           title: data.title,
           rating: data.rating || dynamicRating, 
           students: data.students || 0,
           duration: data.duration || (data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours"),
           difficulty: data.difficulty || "Beginner",
           desc: data.description || "",
           instructor: instructorName,
           img: data.thumbnail || (data.lessons && data.lessons[0]?.thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
         };

         // Only update state if data actually changed to prevent flicker
         setCourse(prev => {
            if (JSON.stringify(prev) === JSON.stringify(newCourseData)) return prev;
            return newCourseData;
         });

         // Persist to local storage
         AsyncStorage.setItem(`course_cache_${courseId}`, JSON.stringify(data));

         if (data.resources) {
            setResources(data.resources);
         }
         
          if (data.is_enrolled) {
            setIsEnrolled(true);
          } else {
            const enrolledCoursesKey = await getScopedStorageKey('enrolled_courses');
            const enrolled = await AsyncStorage.getItem(enrolledCoursesKey);
            const enrolledList = enrolled ? JSON.parse(enrolled) : [];
            if (enrolledList.includes(courseId)) {
              setIsEnrolled(true);
            } else {
              setIsEnrolled(false);
            }
          }

         if (data.lessons) {
            const newLessons = data.lessons.map((l, i) => ({
               id: l.youtube_video_id || i,
               title: l.title || `Lesson ${i+1}`,
               duration: (l.duration !== null && l.duration !== undefined) ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
               status: l.completed ? 'complete' : 'playing'
            }));
            
            setLessons(prev => {
               if (JSON.stringify(prev) === JSON.stringify(newLessons)) return prev;
               return newLessons;
            });
         }
      }
    } catch (err) {
      console.log('Backend not available', err);
    } finally {
      setLoading(false);
      setLessonsLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrolledCoursesKey = await getScopedStorageKey('enrolled_courses');
      const enrolled = await AsyncStorage.getItem(enrolledCoursesKey);
      const enrolledList = enrolled ? JSON.parse(enrolled) : [];
      if(enrolledList.includes(courseId)) {
        setIsEnrolled(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCourseEnroll = async () => {
    try {
      const enrolledCoursesKey = await getScopedStorageKey('enrolled_courses');
      const enrolled = await AsyncStorage.getItem(enrolledCoursesKey);
      const enrolledList = enrolled ? JSON.parse(enrolled) : [];
      if(!enrolledList.includes(courseId)) {
        enrolledList.push(courseId);
        await AsyncStorage.setItem(enrolledCoursesKey, JSON.stringify(enrolledList));
        
        // Record enrollment on backend
        const userId = await getCurrentUserId();
        if (userId) {
          await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}/enroll?user_id=${userId}`, { 
            method: 'POST' 
          }).catch(e => console.log('Backend enrollment failed', e));
        }

        // Trigger a view record on enrollment too to ensure they are counted
        fetch(`${API_URLS.PLAYLIST_SERVICE}/courses/${courseId}/view`, { method: 'POST' }).catch(e => {});
      }
      setIsEnrolled(true);
      
      // Refresh course details to get updated student count
      fetchCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  // ONLY show full screen loader if we have NO data at all
  if (loading && !initialData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1 }}>
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.primaryDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Course Details</Text>
          </View>

          <Image source={{ uri: course.img }} style={styles.heroImage} />

          <View style={styles.courseHeader}>
            <View style={styles.tagWrapper}>
              <Text style={styles.tag}>Development</Text>
            </View>
            <Text style={styles.title}>{course.title}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Star size={16} fill={Colors.canary} color={Colors.canary} />
                <Text style={styles.metaText}> {course.rating}</Text>
              </View>
              <Text style={styles.metaText}>{course.students} students</Text>
              <View style={styles.metaItem}>
                <Clock size={16} color={Colors.textSilver} />
                <Text style={styles.metaText}> {course.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <BarChart size={16} color={Colors.textSilver} style={{ transform: [{ rotate: '90deg' }, { scaleY: -1 }] }} />
                <Text style={styles.metaText}> {course.difficulty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tabs}>
            {['Overview', 'Lessons', 'Resources', 'Reviews'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'Overview' && (
              <View style={styles.overview}>
                <Text style={styles.subTitle}>What you'll learn</Text>
                <View style={styles.learnGrid}>
                  {outcomes.map((item, idx) => (
                    <View key={idx} style={styles.learnItem}>
                      <Check size={16} color={Colors.brandBlue} style={styles.checkIcon} />
                      <Text style={styles.learnText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.subTitle}>About this course</Text>
                <Text style={styles.desc}>{course.desc || "Learn everything you need to know in this comprehensive and straightforward video course."}</Text>
                
                <Text style={styles.subTitle}>Instructor</Text>
                <View style={styles.instructor}>
                  <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor)}&background=07125E&color=fff` }} style={styles.instructorImg} />
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{course.instructor}</Text>
                    <Text style={styles.instructorRole}>{course.instructor === 'Unknown Instructor' ? 'No instructor listed' : 'Instructor'}</Text>
                  </View>
                </View>
              </View>
            )}
            
            {activeTab === 'Lessons' && (
              <View style={styles.overview}>
                {!isEnrolled ? (
                  <View style={styles.lockedState}>
                    <Text style={styles.lockedTitle}>Content Locked</Text>
                    <Text style={styles.lockedText}>Please enroll in the course to view the full curriculum map.</Text>
                    <TouchableOpacity style={styles.smallEnrollBtn} onPress={handleCourseEnroll}>
                      <Text style={styles.smallEnrollBtnText}>Enroll</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                  <View style={styles.lessonsList}>
                    {lessonsLoading ? (
                      <ActivityIndicator size="small" color={Colors.primaryDark} style={{ marginTop: 20 }} />
                    ) : (
                      lessons.map((lesson, idx) => {
                      const isLocked = !isEnrolled && idx > 0;
                      return (
                        <TouchableOpacity 
                          key={lesson.id} 
                          style={[styles.lessonItem, isLocked && styles.lessonItemLocked]}
                          onPress={() => {
                            if (isLocked) {
                              handleCourseEnroll();
                            } else {
                              navigation.navigate('VideoPlayer', { courseId });
                            }
                          }}
                        >
                          <View style={styles.lessonIconWrapper}>
                             {isLocked ? (
                               <Lock size={18} color={Colors.silver} />
                             ) : (
                               <PlayCircle size={18} color={Colors.brandBlue} />
                             )}
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>{lesson.title}</Text>
                            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }))}
                    {!lessonsLoading && lessons.length === 0 && (
                      <Text style={styles.emptyLessons}>No lessons found for this course.</Text>
                    )}
                  </View>
              </View>
            )}

            {activeTab === 'Resources' && (
              <View style={styles.overview}>
                <Text style={styles.subTitle}>Course Resources</Text>
                {resources.length > 0 ? (
                  <View style={styles.lessonsList}>
                    {resources.map((res, idx) => (
                      <TouchableOpacity 
                        key={res.id || idx} 
                        style={styles.lessonItem}
                        onPress={() => Alert.alert('Open Resource', `Opening: ${res.url}`)}
                      >
                        <View style={styles.lessonIconWrapper}>
                           <FileText size={18} color={Colors.brandBlue} />
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={styles.lessonTitle}>{res.title}</Text>
                          <Text style={styles.lessonDuration}>{res.resource_type.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.lockedState}>
                    <Text style={styles.lockedText}>No resources currently available for this course.</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'Reviews' && (
              <View style={styles.overview}>
                <Text style={styles.subTitle}>Rate this course</Text>
                <View style={[styles.metaRow, { marginVertical: 10 }]}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity 
                      key={star} 
                      onPress={async () => {
                        try {
                          const userId = await getCurrentUserId();
                          const res = await fetch(`${API_URLS.PLAYLIST_SERVICE}/courses/${courseId}/rate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rating: star, user_id: userId })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setCourse(prev => ({ ...prev, rating: data.rating }));
                            alert(`You rated this course ${star} stars!`);
                          }
                        } catch (e) {
                          console.log('Rating failed', e);
                        }
                      }}
                    >
                      <Star 
                        size={32} 
                        fill={star <= Math.round(course.rating) ? Colors.canary : 'transparent'} 
                        color={Colors.canary} 
                        style={{ marginRight: 8 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.desc}>Current Rating: {parseFloat(course.rating).toFixed(1)} / 5.0</Text>
                <Text style={styles.desc}>Your feedback helps other students find the best content.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </View>

      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>

        {isEnrolled ? (
          <TouchableOpacity style={[styles.footerBtn, styles.resumeBtn]} onPress={() => navigation.navigate('VideoPlayer', { courseId })}>
            <Text style={styles.footerBtnText}>Resume Course</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.footerBtn, styles.enrollBtn]} onPress={handleCourseEnroll}>
            <Text style={styles.footerBtnText}>Enroll Now</Text>
          </TouchableOpacity>
        )}
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
  scrollContent: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  backBtn: {
    padding: 4,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  courseHeader: {
    padding: 20,
    backgroundColor: Colors.white,
    ...luminoShadow,
    zIndex: 2,
  },
  tagWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  tag: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.brandBlue,
  },
  tabText: {
    fontSize: 15,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
  },
  activeTabText: {
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
  },
  tabContent: {
    padding: 20,
  },
  subTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 12,
    marginTop: 8,
  },
  desc: {
    fontSize: 15,
    color: Colors.silver,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
  },
  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    ...luminoShadow,
  },
  instructorImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  instructorName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  instructorRole: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  lockedState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 12,
    ...luminoShadow,
  },
  lockedTitle: {
    fontFamily: 'Inter_700Bold',
    color: Colors.silver,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 13,
    color: Colors.silver,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  smallEnrollBtn: {
    backgroundColor: Colors.brandBlue,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  smallEnrollBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  lessonsList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  lessonItemLocked: {
    opacity: 0.7,
  },
  lessonIconWrapper: {
    width: 32,
    alignItems: 'flex-start',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.navy,
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: Colors.silver,
  },
  lessonDuration: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...luminoShadow,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollBtn: {
    backgroundColor: Colors.brandBlue,
  },
  resumeBtn: {
    backgroundColor: Colors.navy,
  },
  footerBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  learnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  learnItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  learnText: {
    flex: 1,
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  emptyLessons: {
    color: Colors.silver,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 40,
  },
});
