import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { Search, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Dashboard() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All Courses');
  const tabs = ['All Courses', 'Design', 'Development', 'Business'];

  const [popularCourses, setPopularCourses] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';

  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  useEffect(() => {
    fetch(`http://${API_HOST}:8002/playlist/all`)
      .then(res => res.json())
      .then(data => {
        const items = data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          const formatted = items.map(course => ({
            id: course.youtube_playlist_id || course.id || course.playlist_id,
            title: course.title,
            category: "Development",
            rating: 4.8,
            students: "1.2k",
            img: course.thumbnail_url || (course.videos && course.videos[0] && course.videos[0].thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
          }));
          setPopularCourses(formatted);
        } else {
          setPopularCourses([{
            id: 'mock-1', title: 'React Complete Course 2024', category: 'Development', rating: 4.9, students: '18.2k', img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop"
          }]);
        }
      })
      .catch(err => {
         setPopularCourses([]);
      });

    fetch(`http://${API_HOST}:8006/users/${USER_ID}/enrolled-paths?started_only=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContinuePaths(data);
        }
      })
      .catch(err => {
         setContinuePaths([]);
      });
  }, []);

  return (
    <ScrollView style={styles.dashboard} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.h1}>Welcome Back</Text>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Search size={20} color="#A0AEC0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses and paths..."
            placeholderTextColor="#A0AEC0"
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Continue Learning</Text>
        {continuePaths.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.continueCards}>
            {continuePaths.map(path => (
              <TouchableOpacity key={path.path_id} style={styles.continueCard} onPress={() => navigation.navigate('LearningPath', { id: path.path_id })}>
                <Text style={styles.cardTitle} numberOfLines={1}>{path.title}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${path.progress || 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{path.progress || 0}% complete</Text>
                </View>
                <TouchableOpacity style={styles.btnPrimarySmall} onPress={() => navigation.navigate('LearningPath', { id: path.path_id })}>
                  <Text style={styles.btnPrimaryText}>Resume</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't enrolled in any paths yet. Explore the Paths directory to start your journey!</Text>
            <TouchableOpacity style={styles.btnPrimarySmall} onPress={() => navigation.navigate('Paths')}>
              <Text style={styles.btnPrimaryText}>Explore Paths</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer} contentContainerStyle={{ gap: 10 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tag, activeTab === tab && styles.tagActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tagText, activeTab === tab && styles.tagTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.h2}>Popular Courses</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <View style={styles.courseList}>
          {popularCourses.map(course => (
            <TouchableOpacity key={course.id} style={styles.courseCard} onPress={() => navigation.navigate('CourseDetails', { id: course.id })}>
              <Image source={{ uri: course.img }} style={styles.courseImg} />
              <View style={styles.courseInfo}>
                <Text style={styles.courseCat}>{course.category}</Text>
                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.ratingContainer}>
                    <Star size={14} fill="#FFC837" color="#FFC837" />
                    <Text style={styles.ratingText}>{course.rating}</Text>
                  </View>
                  <Text style={styles.studentsText}>{course.students} students</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dashboard: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 24,
  },
  h1: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  h2: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 12,
    fontSize: 15,
  },
  section: {
    marginBottom: 32,
  },
  continueCards: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  continueCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    width: 260,
    marginRight: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4E6BFF',
    borderRadius: 3,
  },
  progressText: {
    color: '#A0AEC0',
    fontSize: 13,
  },
  btnPrimarySmall: {
    backgroundColor: '#4E6BFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 10,
  },
  tagActive: {
    backgroundColor: '#4E6BFF',
  },
  tagText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  tagTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#4E6BFF',
    fontSize: 14,
  },
  courseList: {
    flexDirection: 'column',
    gap: 16,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  courseImg: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  courseCat: {
    color: '#4E6BFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  courseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  studentsText: {
    color: '#A0AEC0',
    fontSize: 13,
  },
});
