import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getCurrentUserId } from '../constants/Auth';

const luminoShadow = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All Courses');
  const tabs = ['All Courses', 'Design', 'Development', 'Business'];

  const [popularCourses, setPopularCourses] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [allEnrolledPaths, setAllEnrolledPaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCache();
  }, []);

  const loadCache = async () => {
    try {
      const [courses, cont, enrolled] = await Promise.all([
        AsyncStorage.getItem('dashboard_courses'),
        AsyncStorage.getItem('dashboard_continue'),
        AsyncStorage.getItem('dashboard_all_enrolled')
      ]);

      if (courses) setPopularCourses(JSON.parse(courses));
      if (cont) setContinuePaths(JSON.parse(cont));
      if (enrolled) setAllEnrolledPaths(JSON.parse(enrolled));
      
      // If we have cache, stop showing loading spinner so UI is instant
      if (courses) setLoading(false);
    } catch (err) {
      console.error('Cache load failed:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!searchQuery) fetchData();
    });
    return unsubscribe;
  }, [navigation, searchQuery]);

  useEffect(() => {
    // Sync activeTab with searchQuery
    const matchingTab = tabs.find(t => t.toLowerCase() === searchQuery.trim().toLowerCase());
    if (matchingTab) {
      setActiveTab(matchingTab);
    } else if (!searchQuery.trim()) {
      setActiveTab('All Courses');
    } else {
      setActiveTab('All Courses'); // Default to All if typing something else
    }

    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchCourses(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const renderStars = (rating) => {
    return (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s}
            size={12} 
            fill={s <= Math.round(rating) ? Colors.canary : 'transparent'} 
            color={Colors.canary} 
          />
        ))}
        <Text style={styles.ratingText}> {rating.toFixed(1)}</Text>
      </View>
    );
  };

  const searchCourses = async (query) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URLS.PLAYLIST_SERVICE}/playlist/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const items = data.items || [];
      
      let formatted = items.map(course => ({
        id: String(course.youtube_playlist_id || course.id),
        title: course.title,
        category: course.author_name || "Development",
        rating: course.rating || 5.0,
        students: course.total_views || 0,
        description: course.description || "Master the core concepts of this course.",
        img: course.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop",
        total_score: course.total_score
      }));

      // Use cached allEnrolledPaths to map progress instantly
      if (allEnrolledPaths.length > 0) {
        formatted = formatted.map(course => {
          const match = allEnrolledPaths.find(p => 
            p.title === course.title || 
            String(p.path_id) === course.id || 
            (p.playlist_ids && p.playlist_ids.some(pid => String(pid) === course.id))
          );
          return match ? { ...course, progress: match.progress } : course;
        });
      }
      
      setPopularCourses(formatted);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      
      // Parallel Fetch: Courses and Enrolled Paths at the same time
      const [courseRes, pathRes] = await Promise.all([
        fetch(`${API_URLS.PLAYLIST_SERVICE}/playlist/all`),
        userId ? fetch(`${API_URLS.PATH_SERVICE}/users/${userId}/enrolled-paths`) : Promise.resolve(null)
      ]);

      const courseData = await courseRes.json();
      const pathData = pathRes ? await pathRes.json() : [];
      
      const items = courseData.items || [];
      
      if (Array.isArray(pathData)) {
        setAllEnrolledPaths(pathData);
        setContinuePaths(pathData.filter(p => (p.progress || 0) < 100));
      }

      let formatted = [];
      if (Array.isArray(items) && items.length > 0) {
        formatted = items.map(course => ({
          id: String(course.youtube_playlist_id || course.id || course.playlist_id),
          title: course.title,
          category: course.author_name || "Development",
          rating: course.rating || 5.0,
          students: course.total_views || 0,
          description: course.description || "Master the core concepts of this path.",
          img: course.thumbnail || (course.videos && course.videos[0] && course.videos[0].thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
        }));
      } else {
        formatted = [{
          id: 'mock-1', title: 'React Complete Course 2024', category: 'Development', rating: 4.9, students: '18.2k', img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop"
        }];
      }

      // Map progress from parallel pathData
      if (Array.isArray(pathData) && pathData.length > 0) {
        formatted = formatted.map(course => {
          const match = pathData.find(p => 
            p.title === course.title || 
            String(p.path_id) === course.id || 
            (p.playlist_ids && p.playlist_ids.some(pid => String(pid) === course.id))
          );
          return match ? { ...course, progress: match.progress } : course;
        });
      }
      
      setPopularCourses(formatted);

      // Persist to disk for instant load next time
      AsyncStorage.setItem('dashboard_courses', JSON.stringify(formatted));
      AsyncStorage.setItem('dashboard_continue', JSON.stringify(pathData.filter(p => (p.progress || 0) < 100)));
      AsyncStorage.setItem('dashboard_all_enrolled', JSON.stringify(pathData));
    } catch (err) {
      console.error('Dashboard Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>
      <ScrollView style={{ flex: 1, width: '100%' }} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSilver} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search courses..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.content}>
          {/* Continue Learning */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            {continuePaths.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueCards}>
                {continuePaths.map(path => (
                  <TouchableOpacity 
                    key={path.path_id} 
                    style={styles.continueCard} 
                    onPress={() => navigation.navigate('LearningPath', { pathId: path.path_id })}
                  >
                    <Text style={styles.cardTitle}>{path.title}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${path.progress || 0}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{path.progress || 0}% complete</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.resumeBtn} 
                      onPress={() => navigation.navigate('LearningPath', { pathId: path.path_id })}
                    >
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>You haven't enrolled in any paths yet. Explore the Paths directory to start your journey!</Text>
                <TouchableOpacity 
                  style={styles.exploreBtn} 
                  onPress={() => navigation.navigate('Paths')}
                >
                  <Text style={styles.exploreBtnText}>Explore Paths</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Popular Courses */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
              {tabs.map(tab => (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tag, activeTab === tab && styles.activeTag]}
                  onPress={() => {
                    setActiveTab(tab);
                    if (tab === 'All Courses') {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(tab);
                    }
                  }}
                >
                  <Text style={[styles.tagText, activeTab === tab && styles.activeTagText]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Popular Courses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.courseList}>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.primaryDark} />
              ) : (
                popularCourses
                  .map(course => (
                  <TouchableOpacity 
                    key={course.id} 
                    style={styles.courseCard} 
                    onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })}
                  >
                    <Image source={{ uri: course.img }} style={styles.courseImage} />
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                      
                      {renderStars(course.rating)}
                      
                      <Text style={styles.courseDesc} numberOfLines={1}>{course.description}</Text>
                      
                      <View style={styles.courseFooter}>
                        <Text style={styles.progressTextSmall}>{Math.round(course.progress || 0)}% complete</Text>
                        <TouchableOpacity 
                          style={styles.startBtn}
                          onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })}
                        >
                          <Text style={styles.startBtnText}>View Course</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
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
    padding: 20,
    backgroundColor: Colors.offWhite,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    ...luminoShadow,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: Colors.silver,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_400Regular',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 16,
  },
  continueCards: {
    paddingRight: 20,
    paddingVertical: 10,
  },
  continueCard: {
    width: 220,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    ...luminoShadow,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandBlue,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
  },
  resumeBtn: {
    backgroundColor: Colors.brandBlue,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  emptyText: {
    color: Colors.silver,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: Colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exploreBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  activeTag: {
    backgroundColor: Colors.navy,
    borderWidth: 0,
  },
  tagText: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
  },
  activeTagText: {
    color: Colors.white,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: Colors.brandBlue,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  courseList: {
    gap: 16,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
    marginBottom: 12,
    alignItems: 'center',
  },
  courseImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
    marginLeft: 4,
  },
  courseDesc: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTextSmall: {
    fontSize: 11,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  startBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
