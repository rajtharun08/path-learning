import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, Star, Clock } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
     img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
  });

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollment();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`${API_URLS.PATH_SERVICE}/courses/${courseId}?user_id=${USER_ID}`);
      const data = await res.json();
      if(data && data.title) {
         setCourse({
           title: data.title,
           rating: data.rating || 4.8, 
           students: "1.2k",
           duration: data.duration || (data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours"),
           desc: data.description || "",
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: course.img }} style={styles.heroImage} />

        <View style={styles.courseHeader}>
          <View style={styles.tagWrapper}>
            <Text style={styles.tag}>Development</Text>
          </View>
          <Text style={styles.title}>{course.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={16} fill={Colors.accentHoney} color={Colors.accentHoney} />
              <Text style={styles.metaText}> {course.rating}</Text>
            </View>
            <Text style={styles.metaText}>{course.students} students</Text>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.textSilver} />
              <Text style={styles.metaText}> {course.duration}</Text>
            </View>
          </View>

          {isEnrolled ? (
            <TouchableOpacity 
              style={[styles.enrollBtn, {backgroundColor: Colors.accentHoney}]}
              onPress={() => navigation.navigate('VideoPlayer', { courseId })}
            >
              <Text style={[styles.enrollBtnText, {color: Colors.textDark}]}>Resume Course</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.enrollBtn}
              onPress={handleCourseEnroll}
            >
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
                <Image source={{ uri: "https://ui-avatars.com/api/?name=Mike+Chen&background=07125E&color=fff" }} style={styles.instructorImg} />
                <View style={styles.instructorInfo}>
                  <Text style={styles.instructorName}>Mike Chen</Text>
                  <Text style={styles.instructorRole}>React Developer</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  courseHeader: {
    padding: 20,
  },
  tagWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  tag: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryDark,
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
    color: Colors.textSilver,
  },
  enrollBtn: {
    backgroundColor: Colors.primaryDark,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollBtnText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: 15,
    color: Colors.textSilver,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primaryDark,
  },
  tabContent: {
    padding: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 12,
    marginTop: 8,
  },
  desc: {
    fontSize: 15,
    color: Colors.textSilver,
    lineHeight: 22,
    marginBottom: 24,
  },
  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    padding: 16,
    borderRadius: 12,
  },
  instructorImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  instructorRole: {
    fontSize: 13,
    color: Colors.textSilver,
  },
  lockedState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.bgLight,
    borderRadius: 12,
  },
  lockedTitle: {
    fontWeight: 'bold',
    color: Colors.textSilver,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 13,
    color: Colors.textSilver,
    textAlign: 'center',
    marginBottom: 16,
  },
  smallEnrollBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  smallEnrollBtnText: {
    color: Colors.bgWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  lessonsList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  lessonIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonIndexText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  lessonDuration: {
    fontSize: 12,
    color: Colors.textSilver,
  },
});
