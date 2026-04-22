import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, Star, Clock } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CourseDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const id = route.params?.id || 'playlist-fastapi-basics';
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
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

  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  useEffect(() => {
    fetch(`http://${API_HOST}:8006/courses/${id}?user_id=${USER_ID}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.title) {
           setCourse({
             title: data.title,
             rating: data.rating || 4.8, 
             students: "1.2k",
             duration: data.duration || (data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours"),
             desc: data.description || course.desc,
             img: data.thumbnail || (data.lessons && data.lessons[0]?.thumbnail) || course.img
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
      })
      .catch(err => {})
      .finally(() => setLoading(false));

      // Note: AsyncStorage should be used instead of localStorage in React Native
      // We will mock it for now since localStorage isn't available
      // const enrolledCourses = JSON.parse(localStorage.getItem('enrolled_courses') || '[]');
      // if(enrolledCourses.includes(id)) { setIsEnrolled(true); }
  }, [id]);

  const handleCourseEnroll = () => {
    setIsEnrolled(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFC837" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={{ uri: course.img }} style={styles.heroImg} />

        <View style={styles.courseHeader}>
          <Text style={styles.tag}>DEVELOPMENT</Text>
          <Text style={styles.h2}>{course.title}</Text>
          <View style={styles.courseMetaLarge}>
            <View style={styles.metaItem}>
              <Star size={16} color="#FFC837" fill="#FFC837" />
              <Text style={styles.metaText}>{course.rating}</Text>
            </View>
            <Text style={styles.metaTextSilver}>{course.students} students</Text>
            <View style={styles.metaItem}>
              <Clock size={16} color="#A0AEC0" />
              <Text style={styles.metaTextSilver}>{course.duration}</Text>
            </View>
          </View>
          
          {isEnrolled ? (
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#FFC837' }]} onPress={() => navigation.navigate('VideoPlayer', { courseId: id })}>
              <Text style={[styles.btnPrimaryText, { color: '#0F172A' }]}>Resume Course</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleCourseEnroll}>
              <Text style={styles.btnPrimaryText}>Enroll in Course</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Overview', 'Lessons', 'Reviews'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'Overview' && (
            <View>
              <Text style={styles.h3}>About this course</Text>
              <Text style={styles.descText}>{course.desc || "Learn everything you need to know in this comprehensive and straightforward video course."}</Text>
              
              <Text style={styles.h3}>Instructor</Text>
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
             <View>
               {!isEnrolled ? (
                 <View style={styles.lockedContent}>
                   <Text style={styles.lockedTitle}>Content Locked</Text>
                   <Text style={styles.lockedDesc}>Please enroll in the course to view the full curriculum map.</Text>
                   <TouchableOpacity style={styles.btnSmall} onPress={handleCourseEnroll}>
                     <Text style={styles.btnPrimaryText}>Enroll</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <View style={styles.lessonsList}>
                   {lessons.length > 0 ? (
                     lessons.map((lesson, idx) => (
                       <TouchableOpacity key={lesson.id} style={styles.lessonCard} onPress={() => navigation.navigate('VideoPlayer', { courseId: id })}>
                         <View style={styles.lessonNum}>
                           <Text style={styles.lessonNumText}>{idx + 1}</Text>
                         </View>
                         <View style={styles.lessonInfo}>
                           <Text style={styles.lessonTitle}>{lesson.title}</Text>
                           <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                         </View>
                       </TouchableOpacity>
                     ))
                   ) : (
                     <Text style={styles.descText}>Fetching playlist content...</Text>
                   )}
                 </View>
               )}
             </View>
          )}

          {activeTab === 'Reviews' && (
             <View>
               <Text style={styles.descText}>4.8 out of 5 stars based on 1,200 reviews</Text>
             </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'transparent', position: 'absolute', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', opacity: 0 }, // hidden intentionally unless scrolling up
  heroImg: { width: '100%', height: 240 },
  courseHeader: { padding: 20, backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  tag: { alignSelf: 'flex-start', color: '#FFC837', backgroundColor: 'rgba(255, 200, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontWeight: '700', marginBottom: 12 },
  h2: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  courseMetaLarge: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  metaTextSilver: { color: '#A0AEC0', fontSize: 14 },
  btnPrimary: { backgroundColor: '#4E6BFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tabsContainer: { paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 16 },
  tab: { marginRight: 24, paddingBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFC837' },
  tabText: { color: '#A0AEC0', fontSize: 16, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabContent: { padding: 20 },
  h3: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  descText: { color: '#A0AEC0', fontSize: 15, lineHeight: 24, marginBottom: 24 },
  instructor: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12 },
  instructorImg: { width: 48, height: 48, borderRadius: 24 },
  instructorInfo: { marginLeft: 16 },
  instructorName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  instructorRole: { color: '#A0AEC0', fontSize: 14 },
  lockedContent: { alignItems: 'center', backgroundColor: '#1E293B', padding: 40, borderRadius: 12 },
  lockedTitle: { color: '#A0AEC0', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  lockedDesc: { color: '#A0AEC0', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  btnSmall: { backgroundColor: '#4E6BFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  lessonsList: { gap: 12 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  lessonNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  lessonNumText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  lessonInfo: { flex: 1 },
  lessonTitle: { color: '#0F172A', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  lessonDuration: { color: '#64748B', fontSize: 13 }
});
