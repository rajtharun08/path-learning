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
  SafeAreaView,
  Platform
} from 'react-native';
import { Search, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All Courses');
  const tabs = ['All Courses', 'Design', 'Development', 'Business'];

  const [popularCourses, setPopularCourses] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch courses
      const courseRes = await fetch(`${API_URLS.PLAYLIST_SERVICE}/playlist/all`);
      const courseData = await courseRes.json();
      const items = courseData.items || [];
      
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

      // Fetch continue paths
      const pathRes = await fetch(`${API_URLS.PATH_SERVICE}/users/${USER_ID}/enrolled-paths?started_only=true`);
      const pathData = await pathRes.json();
      if (Array.isArray(pathData)) {
        setContinuePaths(pathData);
      }
    } catch (err) {
      console.error('Dashboard Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1 }}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
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
                  onPress={() => setActiveTab(tab)}
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
                  .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(course => (
                  <TouchableOpacity 
                    key={course.id} 
                    style={styles.courseCard} 
                    onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })}
                  >
                    <Image source={{ uri: course.img }} style={styles.courseImage} />
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseCat}>{course.category}</Text>
                      <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                      <View style={styles.courseMeta}>
                        <View style={styles.ratingRow}>
                          <Star size={14} fill={Colors.accentHoney} color={Colors.accentHoney} />
                          <Text style={styles.ratingText}> {course.rating}</Text>
                        </View>
                        <Text style={styles.studentsText}>{course.students} students</Text>
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
  header: {
    padding: 20,
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: Colors.textSilver,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.primaryDark,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  continueCards: {
    paddingRight: 20,
  },
  continueCard: {
    width: 200,
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight2,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentElectric,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSilver,
  },
  resumeBtn: {
    backgroundColor: Colors.primaryDark,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: Colors.bgWhite,
    fontSize: 12,
    fontWeight: '600',
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
    color: Colors.textSilver,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exploreBtnText: {
    color: Colors.bgWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.bgLight,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  activeTag: {
    backgroundColor: Colors.primaryDark,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSilver,
  },
  activeTagText: {
    color: Colors.bgWhite,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  courseList: {
    gap: 16,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  courseImage: {
    width: 100,
    height: 100,
  },
  courseInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  courseCat: {
    fontSize: 11,
    color: Colors.accentElectric,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '600',
  },
  studentsText: {
    fontSize: 11,
    color: Colors.textSilver,
  },
});
