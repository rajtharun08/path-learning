import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, PlayCircle, Star } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getCurrentUserId, getScopedStorageKey } from '../constants/Auth';

export default function LearningPathScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pathId } = route.params || { pathId: 'frontend-dev' };
  
  const [modules, setModules] = useState([]);
  const [pathName, setPathName] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [pathRating, setPathRating] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPathData();
    });
    return unsubscribe;
  }, [navigation, pathId]);

  const fetchPathData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      const enrolledPathsKey = await getScopedStorageKey('enrolled_paths');
      // 1. Fetch Path Details
      const res = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}${userId ? `?user_id=${userId}` : ''}`);
      if(res.ok) {
          const data = await res.json();
          setPathName(data.title || "Frontend Development");
          setDescription(data.description || "");
          setEnrollmentCount(data.total_views || 0);
          setPathRating(data.rating || 5.0);
          
          // Record view
          fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/view`, { method: 'POST' }).catch(e => console.log('Path view failed', e));
 
          if(data.items) {
             const firstIncompleteIndex = data.items.findIndex((item) => !item.course_completed);
             setModules(data.items.map((item, index) => ({
                title: item.title,
                description: item.description || "",
                thumbnail: item.thumbnail || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop",
                duration: item.duration || "2h 30m",
                status: item.course_completed
                  ? "complete"
                  : (firstIncompleteIndex === -1 ? "complete" : (index === firstIncompleteIndex ? "playing" : "locked")),
                id: item.id || item.playlist_id
             })));
          }
      }

      // 2. Check Enrollment
      let enrolledInHistory = false;
      if (userId) {
        const historyRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/history?user_id=${userId}`);
        const historyData = await historyRes.json();
        enrolledInHistory = Array.isArray(historyData) && historyData.some(ev => ev.event_type === 'enrolled');
      }
      
      const stored = await AsyncStorage.getItem(enrolledPathsKey);
      const storedPaths = stored ? JSON.parse(stored) : [];
      const isLocallyEnrolled = storedPaths.includes(pathId);
      
      const enrolled = enrolledInHistory || isLocallyEnrolled;
      setIsEnrolled(enrolled);
      
      if(enrolled) {
        // 3. Fetch Progress if Enrolled
        const progRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/progress?user_id=${userId}`);
        if(progRes.ok) {
           const progData = await progRes.json();
           setProgressData(progData);
        }
      }
    } catch (err) {
      console.log('Error fetching path data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return;
      }
      const enrolledPathsKey = await getScopedStorageKey('enrolled_paths');
      const res = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if(res.ok || res.status === 409) {
        setIsEnrolled(true);
        const stored = await AsyncStorage.getItem(enrolledPathsKey);
        const storedPaths = stored ? JSON.parse(stored) : [];
        if(!storedPaths.includes(pathId)) {
           storedPaths.push(pathId);
           await AsyncStorage.setItem(enrolledPathsKey, JSON.stringify(storedPaths));
        }
        fetchPathData();
      }
    } catch(err) {
       console.error("Failed to enroll", err);
    }
  };

  const handleRatePath = async (rating) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const res = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, rating })
      });

      if (res.ok) {
        const data = await res.json();
        setPathRating(data.rating);
      }
    } catch (err) {
      console.error("Failed to rate path", err);
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
      <View style={Platform.OS === 'web' ? styles.webContentWrapper : { flex: 1, width: '100%' }}>

      <ScrollView style={{ flex: 1, width: '100%' }} stickyHeaderIndices={[0]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={20} color={Colors.silver} />
              <Text style={{ color: Colors.silver, fontSize: 14, fontFamily: 'Inter_500Medium' }}>Paths Directory</Text>
              <Text style={{ color: Colors.borderLight2, fontSize: 14 }}>/</Text>
              <Text style={{ color: Colors.navy, fontSize: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                {pathName}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.pathHeaderMeta}>
          <Text style={styles.mainTitle}>{pathName}</Text>
          <View style={styles.headerRatingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={14} 
                fill={star <= Math.round(pathRating) ? Colors.canary : 'transparent'} 
                color={Colors.canary} 
              />
            ))}
            <Text style={styles.ratingTextSmall}>{parseFloat(pathRating).toFixed(1)}</Text>
          </View>
          {description ? <Text style={styles.pathDescription}>{description}</Text> : null}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{enrollmentCount}</Text>
              <Text style={styles.statLabel}> Enrolled Students</Text>
            </View>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statLabel}>{modules.length} Modules</Text>
          </View>
        </View>

        {isEnrolled ? (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressHeader}>
               <Text style={styles.progressLabel}>Overall Completion</Text>
               <Text style={styles.progressPercent}>{progressData ? progressData.progress_percentage : 0}%</Text>
            </View>
            <View style={styles.progressBarLarge}>
               <View style={[styles.progressFillLarge, { width: `${progressData ? progressData.progress_percentage : 0}%` }]} />
            </View>
            <Text style={styles.encouragementText}>
              {(progressData?.status === 'completed' || (progressData?.progress_percentage || 0) >= 100)
                ? (progressData?.certification_message || 'Congratulations! You mastered this learning path.')
                : "You're making great progress! Keep going to complete this learning path."}
            </Text>
          </View>
        ) : (
          <View style={styles.enrollCard}>
             <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll}>
               <Text style={styles.enrollBtnText}>Enroll in Path</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.curriculum}>
          <Text style={styles.curriculumTitle}>Curriculum <Text style={styles.moduleCount}>({modules.length} Modules)</Text></Text>
          
          <View style={styles.moduleList}>
            {modules.map((mod, index) => (
              <TouchableOpacity 
                key={mod.id || index} 
                style={[styles.moduleCard, styles[mod.status]]} 
                onPress={() => navigation.navigate('CourseDetails', { courseId: mod.id })}
              >
                <View style={styles.moduleImgWrapper}>
                  <Image source={{ uri: mod.thumbnail }} style={styles.moduleImg} />
                  {mod.status === 'complete' && <View style={[styles.statusIcon, styles.successIcon]}><CheckCircle2 color="white" size={20} /></View>}
                  {mod.status === 'playing' && <View style={[styles.statusIcon, styles.activeIcon]}><PlayCircle color="white" size={20} /></View>}
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>{mod.title}</Text>
                  {mod.description ? <Text style={styles.moduleDesc} numberOfLines={2}>{mod.description}</Text> : null}
                  {mod.status === 'playing' && isEnrolled && <Text style={styles.playingBadge}>Now Playing</Text>}
                  <View style={styles.moduleMeta}>
                    <Text style={styles.moduleDuration}>{mod.duration}</Text>
                    {mod.status === 'complete' && isEnrolled && <Text style={styles.completeText}>100% Complete</Text>}
                    {mod.status === 'playing' && isEnrolled && <Text style={styles.activeText}>Started</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isEnrolled && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingSectionTitle}>Rate this Learning Path</Text>
            <View style={styles.starRowLarge}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRatePath(star)}>
                  <Star 
                    size={32} 
                    fill={star <= Math.round(pathRating) ? Colors.canary : 'transparent'} 
                    color={Colors.canary} 
                    style={{ marginRight: 8 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingHelpText}>Your feedback helps us improve the quality of our learning paths.</Text>
          </View>
        )}
      </ScrollView>

      {isEnrolled && (
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={[styles.resumeBtnLarge, (progressData?.status === 'completed' || (progressData?.progress_percentage || 0) >= 100) && { backgroundColor: Colors.success }]} 
            onPress={() => {
              if (progressData && progressData.next_up) {
                navigation.navigate('VideoPlayer', { courseId: progressData.next_up.playlist_id });
              } else if (modules.length > 0) {
                navigation.navigate('VideoPlayer', { courseId: modules[0].id });
              }
            }}
          >
            {(progressData?.status === 'completed' || (progressData?.progress_percentage || 0) >= 100) ? (
              <CheckCircle2 size={20} color="white" style={{ marginRight: 8 }} />
            ) : (
              <PlayCircle size={20} color="white" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.resumeBtnTextLarge}>
              {(progressData?.status === 'completed' || (progressData?.progress_percentage || 0) >= 100) ? 'Path Completed' : 'Resume Learning'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  webContentWrapper: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: Colors.offWhite,
    flex: 1,
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
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pathHeaderMeta: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  headerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  ratingTextSmall: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginLeft: 4,
  },
  pathDescription: {
    fontSize: 15,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.brandBlue,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  statDivider: {
    color: Colors.borderLight2,
    fontSize: 14,
  },
  totalDuration: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  progressCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_500Medium',
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.brandBlue,
  },
  progressBarLarge: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: 5,
    marginBottom: 12,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: Colors.brandBlue,
    borderRadius: 5,
  },
  encouragementText: {
    fontSize: 12,
    color: Colors.silver,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  enrollCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  enrollTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 8,
  },
  enrollDesc: {
    fontSize: 14,
    color: Colors.silver,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  enrollBtn: {
    backgroundColor: Colors.brandBlue,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  curriculum: {
    padding: 20,
  },
  curriculumTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 20,
  },
  moduleCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.silver,
  },
  moduleList: {
    gap: 16,
  },
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
  },
  moduleImgWrapper: {
    position: 'relative',
  },
  moduleImg: {
    width: 100,
    height: 100,
  },
  statusIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    backgroundColor: '#10B981',
  },
  activeIcon: {
    backgroundColor: Colors.brandBlue,
  },
  moduleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 8,
  },
  playingBadge: {
    fontSize: 10,
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  moduleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleDuration: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  completeText: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'Inter_700Bold',
  },
  activeText: {
    fontSize: 11,
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
  },
  locked: {
    opacity: 0.7,
  },
  ratingSection: {
    padding: 24,
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...luminoShadow,
    alignItems: 'center',
  },
  ratingSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 12,
  },
  starRowLarge: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ratingHelpText: {
    fontSize: 12,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  resumeBtnLarge: {
    backgroundColor: Colors.brandBlue,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnTextLarge: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
