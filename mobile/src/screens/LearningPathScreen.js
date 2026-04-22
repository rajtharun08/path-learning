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
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../theme/Colors';
import { API_URLS, USER_ID } from '../constants/Config';

export default function LearningPathScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { pathId } = route.params || { pathId: 'frontend-dev' };
  
  const [modules, setModules] = useState([]);
  const [pathName, setPathName] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPathData();
  }, [pathId]);

  const fetchPathData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Path Details
      const res = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}?user_id=${USER_ID}`);
      if(res.ok) {
         const data = await res.json();
         setPathName(data.title || "Frontend Development");
         if(data.items) {
           setModules(data.items.map((item, index) => ({
              title: item.title,
              duration: item.duration || "2h 30m",
              status: item.is_completed ? "complete" : (index === 0 ? "playing" : "locked"),
              id: item.id || item.playlist_id
           })));
         }
      }

      // 2. Check Enrollment
      const historyRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/history?user_id=${USER_ID}`);
      const historyData = await historyRes.json();
      const enrolledInHistory = Array.isArray(historyData) && historyData.some(ev => ev.event_type === 'enrolled');
      
      const stored = await AsyncStorage.getItem('enrolled_paths');
      const storedPaths = stored ? JSON.parse(stored) : [];
      const isLocallyEnrolled = storedPaths.includes(pathId);
      
      const enrolled = enrolledInHistory || isLocallyEnrolled;
      setIsEnrolled(enrolled);
      
      if(enrolled) {
        // 3. Fetch Progress if Enrolled
        const progRes = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/progress?user_id=${USER_ID}`);
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
      const res = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
      });
      if(res.ok || res.status === 409) {
        setIsEnrolled(true);
        const stored = await AsyncStorage.getItem('enrolled_paths');
        const storedPaths = stored ? JSON.parse(stored) : [];
        if(!storedPaths.includes(pathId)) {
           storedPaths.push(pathId);
           await AsyncStorage.setItem('enrolled_paths', JSON.stringify(storedPaths));
        }
        fetchPathData();
      }
    } catch(err) {
       console.error("Failed to enroll", err);
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
        <Text style={styles.headerTitle} numberOfLines={1}>{pathName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pathHeaderMeta}>
          <Text style={styles.mainTitle}>{pathName}</Text>
          <Text style={styles.totalDuration}>Total Duration: 45h 30m</Text>
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
            <Text style={styles.encouragementText}>You're making great progress! Keep going to complete this learning path.</Text>
          </View>
        ) : (
          <View style={styles.enrollCard}>
             <Text style={styles.enrollTitle}>Unlock your future</Text>
             <Text style={styles.enrollDesc}>Enroll in this learning path to start tracking your curriculum progress and earn your certification.</Text>
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
                  <Image source={{ uri: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop` }} style={styles.moduleImg} />
                  {mod.status === 'complete' && <View style={[styles.statusIcon, styles.successIcon]}><CheckCircle2 color="white" size={20} /></View>}
                  {mod.status === 'playing' && <View style={[styles.statusIcon, styles.activeIcon]}><PlayCircle color="white" size={20} /></View>}
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
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
      </ScrollView>

      {isEnrolled && (
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={styles.resumeBtnLarge} 
            onPress={() => {
              if (progressData && progressData.next_up) {
                navigation.navigate('VideoPlayer', { courseId: progressData.next_up.playlist_id });
              } else if (modules.length > 0) {
                navigation.navigate('VideoPlayer', { courseId: modules[0].id });
              }
            }}
          >
            <PlayCircle size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.resumeBtnTextLarge}>Resume Learning</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pathHeaderMeta: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  totalDuration: {
    fontSize: 14,
    color: Colors.textSilver,
  },
  progressCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSilver,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accentElectric,
  },
  progressBarLarge: {
    height: 10,
    backgroundColor: Colors.bgLight,
    borderRadius: 5,
    marginBottom: 12,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: Colors.accentElectric,
    borderRadius: 5,
  },
  encouragementText: {
    fontSize: 12,
    color: Colors.textSilver,
    fontStyle: 'italic',
  },
  enrollCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.bgLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  enrollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  enrollDesc: {
    fontSize: 14,
    color: Colors.textSilver,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  enrollBtn: {
    backgroundColor: Colors.primaryDark,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollBtnText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  curriculum: {
    padding: 20,
  },
  curriculumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 20,
  },
  moduleCount: {
    fontSize: 14,
    fontWeight: 'normal',
    color: Colors.textSilver,
  },
  moduleList: {
    gap: 16,
  },
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight2,
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
    backgroundColor: Colors.primaryDark,
  },
  moduleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  playingBadge: {
    fontSize: 10,
    color: Colors.accentElectric,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moduleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleDuration: {
    fontSize: 12,
    color: Colors.textSilver,
  },
  completeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  activeText: {
    fontSize: 11,
    color: Colors.accentElectric,
    fontWeight: 'bold',
  },
  locked: {
    opacity: 0.7,
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
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnTextLarge: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
