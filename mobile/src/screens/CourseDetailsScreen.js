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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ added
import { ArrowLeft, Star, Clock } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets(); // ✅ added

  const { courseId } = route.params || { courseId: 'playlist-fastapi-basics' };
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState({
     title: "Loading Course...",
     rating: 0,
     students: "0",
     duration: "-",
     desc: "",
     instructor: "Loading...",
     img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
  });

  const generateConsistentHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollment();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}?user_id=${USER_ID}`);
      const data = await res.json();
      if(data && data.title) {
         const hash = generateConsistentHash(courseId);
         const dynamicRating = (4.0 + (hash % 10) / 10).toFixed(1);
         const dynamicStudents = `${(hash % 9) + 1}.${hash % 10}k`;
         const instructorName = data.author_name || `${data.title.split(' ')[0]} Expert`;

         setCourse({
           title: data.title,
           rating: data.rating || dynamicRating, 
           students: dynamicStudents,
           duration: data.duration || (data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours"),
           desc: data.description || "",
           instructor: instructorName,
           img: data.thumbnail || (data.lessons && data.lessons[0]?.thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
         });
         if (data.lessons) {
           setLessons(data.lessons.map((l, i) => ({
              id: l.youtube_video_id || i,
              title: l.title || `Lesson ${i+1}`,
              duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
              status: l.completed ? 'complete' : 'playing'
           })));
         }
      }
    } catch (err) {
      console.log('Backend not available', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const enrolled = await AsyncStorage.getItem('enrolled_courses');
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
      const enrolled = await AsyncStorage.getItem('enrolled_courses');
      const enrolledList = enrolled ? JSON.parse(enrolled) : [];
      if(!enrolledList.includes(courseId)) {
        enrolledList.push(courseId);
        await AsyncStorage.setItem('enrolled_courses', JSON.stringify(enrolledList));
      }
      setIsEnrolled(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
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
            { paddingBottom: insets.bottom + 20 } // ✅ FIX
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
            </View>

            {isEnrolled ? (
              <TouchableOpacity style={styles.enrollBtn} onPress={() => navigation.navigate('VideoPlayer', { courseId })}>
                <Text style={styles.enrollBtnText}>Resume Course</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.enrollBtn} onPress={handleCourseEnroll}>
                <Text style={styles.enrollBtnText}>Enroll in Course</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabs}>
            {['Overview', 'Lessons', 'Reviews'].map(tab => (
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
                <Text style={styles.subTitle}>About this course</Text>
                <Text style={styles.desc}>{course.desc || "Learn everything you need to know in this comprehensive and straightforward video course."}</Text>
                
                <Text style={styles.subTitle}>Instructor</Text>
                <View style={styles.instructor}>
                  <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor)}&background=07125E&color=fff` }} style={styles.instructorImg} />
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{course.instructor}</Text>
                    <Text style={styles.instructorRole}>Course Author</Text>
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
                ) : (
                  <View style={styles.lessonsList}>
                    {lessons.map((lesson, idx) => (
                      <TouchableOpacity 
                        key={lesson.id} 
                        style={styles.lessonItem}
                        onPress={() => navigation.navigate('VideoPlayer', { courseId })}
                      >
                        <View style={styles.lessonIndex}>
                          <Text style={styles.lessonIndexText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={styles.lessonTitle}>{lesson.title}</Text>
                          <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'Reviews' && (
              <View style={styles.overview}>
                <Text style={styles.desc}>4.8 out of 5 stars based on 1,200 reviews</Text>
              </View>
            )}
          </View>

        </ScrollView>
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
  scrollContent: {
    flexGrow: 1, // ✅ updated
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
  enrollBtn: {
    backgroundColor: Colors.brandBlue,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
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
  lessonIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonIndexText: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
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
  lessonDuration: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
});
