import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Star, ChevronRight, Layers } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScopedStorageKey } from '../constants/Auth';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getCurrentUserId } from '../constants/Auth';

export default function PathsScreen() {
  const navigation = useNavigation();
  const [paths, setPaths] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [allEnrolledPaths, setAllEnrolledPaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={12} 
          fill={i < fullStars ? Colors.canary : 'transparent'} 
          color={i < fullStars ? Colors.canary : Colors.silver} 
        />
      );
    }
    return stars;
  };

  useEffect(() => {
    loadPathsCache();
    fetchEnrolledPaths();
  }, []);

  const loadPathsCache = async () => {
    try {
      const [enrolled, topPaths] = await Promise.all([
        AsyncStorage.getItem('paths_enrolled_cache'),
        AsyncStorage.getItem('paths_top_cache')
      ]);

      if (enrolled) {
        const data = JSON.parse(enrolled);
        setAllEnrolledPaths(data);
        setContinuePaths(data.filter(p => (p.progress || 0) < 100));
      }

      if (topPaths) {
        setPaths(JSON.parse(topPaths));
        setLoading(false);
      }
    } catch (e) {
      console.log('Cache load failed', e);
    }
  };

  const fetchEnrolledPaths = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setContinuePaths([]);
        return;
      }
      
      const res = await fetch(`${API_URLS.PATH_SERVICE}/users/${userId}/enrolled-paths`);
      const data = await res.json();
      let enrolledPaths = Array.isArray(data) ? data : [];
      
      if (enrolledPaths.filter(p => (p.progress || 0) < 100).length === 0) {
        const enrolledCoursesKey = await getScopedStorageKey('enrolled_courses');
        const enrolledCoursesRaw = await AsyncStorage.getItem(enrolledCoursesKey);
        if (enrolledCoursesRaw) {
          const enrolledList = JSON.parse(enrolledCoursesRaw);
          if (enrolledList && enrolledList.length > 0) {
            const latestCourseId = enrolledList[enrolledList.length - 1];
            const searchRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/search?q=${latestCourseId}`);
            const searchData = await searchRes.json();
            if (Array.isArray(searchData) && searchData.length > 0) {
              const suggestedPath = searchData[0];
              const progRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/${suggestedPath.path_id}/progress?user_id=${userId}`);
              if (progRes.ok) {
                const progData = await progRes.json();
                enrolledPaths = [{
                  path_id: suggestedPath.path_id,
                  title: suggestedPath.title,
                  progress: progData.progress_percentage || 0,
                  status: progData.status
                }];
              }
            }
          }
        }
      }

      const freshEnrolled = enrolledPaths.filter(p => (p.progress || 0) < 100);
      setContinuePaths(prev => JSON.stringify(prev) === JSON.stringify(freshEnrolled) ? prev : freshEnrolled);
      setAllEnrolledPaths(prev => JSON.stringify(prev) === JSON.stringify(enrolledPaths) ? prev : enrolledPaths);
      
      AsyncStorage.setItem('paths_enrolled_cache', JSON.stringify(enrolledPaths));
    } catch (err) {
      console.error('Error fetching enrolled paths:', err);
    }
  };

  useEffect(() => {
    if (paths.length === 0) setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const url = searchQuery.trim() === '' 
        ? `${API_URLS.PATH_SERVICE}/paths/top` 
        : `${API_URLS.PATH_SERVICE}/paths/search?q=${encodeURIComponent(searchQuery)}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map(path => ({
              id: path.path_id,
              title: path.title,
              desc: path.description || "Master modern web development with React, TypeScript, and responsive design patterns.",
              rating: path.rating || 5.0,
              duration: "Flexible",
              enrollments: path.total_views || 0
            }));
            
            setPaths(prev => {
              if (JSON.stringify(prev) === JSON.stringify(formatted)) return prev;
              return formatted;
            });

            if (!searchQuery) {
               AsyncStorage.setItem('paths_top_cache', JSON.stringify(formatted));
            }
          } else {
            setPaths([]);
          }
        })
        .catch(err => {
          console.error('Error fetching paths:', err);
          if (paths.length === 0) setPaths([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Paths Directory</Text>
          <View style={styles.searchBar}>
            <SearchIcon size={20} color={Colors.textSilver} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search learning paths..." 
              placeholderTextColor={Colors.silver}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Continue Learning Card - MOVE TO TOP */}
        {continuePaths.length > 0 && (
          <View style={styles.premiumContinueSection}>
            <TouchableOpacity 
              style={styles.premiumContinueCard}
              onPress={() => navigation.navigate('LearningPath', { pathId: continuePaths[0].path_id })}
            >
              <View style={styles.continueCardTop}>
                <View style={styles.pathIconBox}>
                  <Layers size={24} color={Colors.brandBlue} />
                </View>
                <View style={styles.continueCardText}>
                  <Text style={styles.continueLabel}>Continue Path</Text>
                  <Text style={styles.continueTitle}>{continuePaths[0].title}</Text>
                  <Text style={styles.progressPercentText}>{Math.round(continuePaths[0].progress || 0)}% completed</Text>
                </View>
              </View>
              
              <View style={styles.progressRow}>
                <View style={styles.progressBarLarge}>
                  <View style={[styles.progressFill, { width: `${continuePaths[0].progress}%` }]} />
                </View>
                <TouchableOpacity 
                  style={styles.premiumResumeBtn}
                  onPress={() => navigation.navigate('LearningPath', { pathId: continuePaths[0].path_id })}
                >
                  <Text style={styles.resumeBtnText}>Resume</Text>
                  <ChevronRight size={16} color={Colors.white} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.topSection}>
          <Text style={styles.subtitle}>Track your learning progress and continue where you left off. Stay on track with your learning goals.</Text>
          
          <View style={styles.sectionTitleRow}>
            <View style={styles.blueBar} />
            <Text style={styles.sectionTitle}>Featured Paths</Text>
          </View>
          <Text style={styles.sectionDesc}>Browse and find all public Hexaware paths here.</Text>
        </View>

        {/* Paths List */}
        <View style={styles.pathsList}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryDark} />
          ) : (
            paths.map(path => {
              const enrolled = allEnrolledPaths.find(p => p.path_id === path.id);
              const isCompleted = enrolled && enrolled.progress >= 100;
              
              return (
                <TouchableOpacity 
                  key={path.id} 
                  style={[styles.pathCard, isCompleted && styles.completedPathCard]} 
                  onPress={() => navigation.navigate('LearningPath', { 
                    pathId: path.id,
                    initialData: {
                      title: path.title,
                      desc: path.desc,
                      rating: path.rating,
                      enrollments: path.enrollments
                    }
                  })}
                >
                  <View style={styles.pathIconWrapper}>
                    <Layers size={22} color={isCompleted ? "#10B981" : Colors.brandBlue} />
                  </View>
                  
                  <View style={styles.pathInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.pathTitle} numberOfLines={1}>{path.title}</Text>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>COMPLETED</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.ratingRow}>
                      {renderStars(path.rating)}
                      <Text style={styles.ratingText}> {path.rating}</Text>
                    </View>
                    
                    <Text style={styles.pathDesc} numberOfLines={1}>{path.desc}</Text>
                    
                    <View style={styles.pathFooter}>
                      <Text style={styles.metaText}>{path.duration}</Text>
                      <TouchableOpacity 
                        style={[styles.viewBtn, isCompleted && styles.completedViewBtn]}
                        onPress={() => navigation.navigate('LearningPath', { pathId: path.id })}
                      >
                        <Text style={styles.viewBtnText}>{isCompleted ? "Review Path" : "View Path"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  webContentWrapper: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: Colors.white,
    flex: 1,
    boxShadow: '0 0 20px rgba(4,13,67,0.05)',
  },
  header: {
    padding: 24,
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_400Regular',
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.silver,
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  blueBar: {
    width: 4,
    height: 20,
    backgroundColor: Colors.navy,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.silver,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  premiumContinueSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
  },
  premiumContinueCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    ...luminoShadow,
    borderWidth: 1,
    borderColor: 'rgba(4,13,67,0.05)',
  },
  continueCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pathIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  continueCardText: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  continueTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  progressPercentText: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarLarge: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginRight: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandBlue,
    borderRadius: 4,
  },
  premiumResumeBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  emptyText: {
    color: Colors.silver,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  pathsList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  pathCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
    alignItems: 'center',
  },
  pathIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  pathTitle: {
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
  pathDesc: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  pathFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  viewBtn: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  viewBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    color: '#065F46',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  completedPathCard: {
    borderColor: '#10B981',
    backgroundColor: '#F9FAFB',
  },
  completedViewBtn: {
    backgroundColor: '#10B981',
  },
});
