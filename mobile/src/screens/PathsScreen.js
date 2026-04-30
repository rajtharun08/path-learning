import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

export default function PathsScreen() {
  const navigation = useNavigation();
  const [paths, setPaths] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEnrolledPaths();
  }, []);

  const fetchEnrolledPaths = async () => {
    try {
      const res = await fetch(`${API_URLS.PATH_SERVICE}/users/${USER_ID}/enrolled-paths?started_only=true`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setContinuePaths(data);
      }
    } catch (err) {
      console.error('Error fetching enrolled paths:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
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
              rating: path.rating || 4.5,
              duration: "45hr 30min",
              enrollments: path.total_views || "1,234"
            }));
            setPaths(formatted);
          } else {
            setPaths([]);
          }
        })
        .catch(err => {
          console.error('Error fetching paths:', err);
          setPaths([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paths Directory</Text>
      </View>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Text style={styles.subtitle}>Track your learning progress and continue where you left off. Stay on track with your learning goals.</Text>
          
          <View style={styles.sectionTitleRow}>
            <View style={styles.blueBar} />
            <Text style={styles.sectionTitle}>All paths</Text>
          </View>
          <Text style={styles.sectionDesc}>Browse and find all public Hexaware paths here.</Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput 
                style={styles.searchInput}
                placeholder="Search learning paths" 
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchSubmit}>
                <SearchIcon size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Continue Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleMain}>Continue Learning</Text>
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
                      <View style={[styles.progressFill, { width: `${path.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{path.progress}% complete</Text>
                  </View>
                  <TouchableOpacity style={styles.resumeBtn}>
                    <Text style={styles.resumeBtnText}>Resume</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
               <Text style={styles.emptyText}>You are not currently enrolled in any paths. Start exploring below!</Text>
            </View>
          )}
        </View>

        {/* Paths List */}
        <View style={styles.pathsList}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryDark} />
          ) : (
            paths.map(path => (
              <TouchableOpacity 
                key={path.id} 
                style={styles.pathCard} 
                onPress={() => navigation.navigate('LearningPath', { pathId: path.id })}
              >
                <View style={styles.pathHeader}>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  <View style={styles.ratingRow}>
                    <Star size={14} fill={Colors.canary} color={Colors.canary} />
                    <Text style={styles.ratingText}> {path.rating}</Text>
                  </View>
                </View>
                <Text style={styles.pathDesc}>{path.desc}</Text>
                <View style={styles.pathMeta}>
                  <Text style={styles.metaText}>Total Time: {path.duration}</Text>
                  <Text style={styles.metaText}>Enrollments: {path.enrollments}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate('LearningPath', { pathId: path.id })}
                >
                  <Text style={styles.viewBtnText}>View Path</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const luminoShadow = {
  shadowColor: '#040D43',
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
    maxWidth: 800,
    backgroundColor: Colors.bgWhite,
    flex: 1,
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
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
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  topSection: {
    padding: 20,
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
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...luminoShadow,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_400Regular',
  },
  searchSubmit: {
    backgroundColor: Colors.brandBlue,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 16,
  },
  continueCards: {
    paddingRight: 20,
  },
  continueCard: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_500Medium',
  },
  resumeBtn: {
    backgroundColor: Colors.brandBlue,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.silver,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  pathsList: {
    padding: 20,
    gap: 16,
  },
  pathCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pathTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: Colors.navy,
    fontFamily: 'Inter_600SemiBold',
  },
  pathDesc: {
    fontSize: 14,
    color: Colors.silver,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  pathMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  viewBtn: {
    backgroundColor: Colors.brandBlue,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
