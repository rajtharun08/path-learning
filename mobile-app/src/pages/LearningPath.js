import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function LearningPath() {
  const navigation = useNavigation();
  const route = useRoute();
  const id = route.params?.id || 'frontend-dev';
  
  const [modules, setModules] = useState([]);
  const [pathName, setPathName] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
  
  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const res = await fetch(`http://${API_HOST}:8006/paths/${id}?user_id=${USER_ID}`);
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

        const historyRes = await fetch(`http://${API_HOST}:8006/paths/${id}/history?user_id=${USER_ID}`);
        if(historyRes.ok) {
           const historyData = await historyRes.json();
           const enrolledInHistory = historyData.some(ev => ev.event_type === 'enrolled');
           const enrolled = enrolledInHistory;

           setIsEnrolled(enrolled);
           
           if(enrolled) {
             const progRes = await fetch(`http://${API_HOST}:8006/paths/${id}/progress?user_id=${USER_ID}`);
             if(progRes.ok) {
                const progData = await progRes.json();
                setProgressData(progData);
             }
           }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    
    fetchPathData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      const res = await fetch(`http://${API_HOST}:8006/paths/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
      });
      if(res.ok || res.status === 409) {
        setIsEnrolled(true);
        // Normally we'd fetch progress here too
      }
    } catch(err) {
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4E6BFF" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pathName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.pathHeaderMeta}>
          <Text style={styles.h2}>{pathName}</Text>
          <Text style={styles.totalDuration}>Total Duration: 45h 30m</Text>
        </View>

        {isEnrolled ? (
          <View style={styles.progressCard}>
            <Text style={styles.h3}>Your Progress</Text>
            <View style={styles.flexBetween}>
               <Text style={styles.textSilver}>Overall Completion</Text>
               <Text style={styles.percentActive}>{progressData ? progressData.progress_percentage : 0}%</Text>
            </View>
            <View style={styles.progressBarLg}>
               <View style={[styles.progressFillLg, { width: `${progressData ? progressData.progress_percentage : 0}%` }]} />
            </View>
            <Text style={styles.encouragement}>You're making great progress! Keep going to complete this learning path.</Text>
          </View>
        ) : (
          <View style={[styles.progressCard, { alignItems: 'center' }]}>
             <Text style={[styles.h3, { marginBottom: 8 }]}>Lock your future</Text>
             <Text style={styles.enrollDesc}>Enroll in this learning path to start tracking your curriculum progress and earn your certification.</Text>
             <TouchableOpacity style={[styles.btnPrimary, { width: '100%' }]} onPress={handleEnroll}>
               <Text style={styles.btnPrimaryText}>Enroll in Path</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.curriculum}>
          <Text style={styles.h2}>Curriculum <Text style={styles.moduleCount}>({modules.length} Modules)</Text></Text>
          
          <View style={styles.moduleList}>
            {modules.map(mod => (
              <TouchableOpacity key={mod.id} style={[styles.moduleCard, mod.status === 'locked' && styles.moduleCardLocked]} onPress={() => navigation.navigate('CourseDetails', { id: mod.id })}>
                <View style={styles.moduleImgWrapper}>
                  <Image source={{ uri: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop` }} style={styles.moduleImg} />
                  {mod.status === 'complete' && <View style={[styles.statusIcon, styles.statusSuccess]}><CheckCircle2 color="white" size={20} /></View>}
                  {mod.status === 'playing' && <View style={[styles.statusIcon, styles.statusActive]}><PlayCircle color="white" size={20} /></View>}
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  {mod.status === 'playing' && isEnrolled && <Text style={styles.playingBadge}>Now Playing</Text>}
                  <View style={styles.moduleMeta}>
                    <Text style={styles.durationText}>{mod.duration}</Text>
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
          <TouchableOpacity style={styles.btnPrimary} onPress={() => {
              if (progressData && progressData.next_up) {
                  navigation.navigate('VideoPlayer', { courseId: progressData.next_up.playlist_id });
              } else if (modules.length > 0) {
                  navigation.navigate('VideoPlayer', { courseId: modules[0].id });
              } else {
                  navigation.navigate('VideoPlayer');
              }
          }}>
            <PlayCircle size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnPrimaryText}>Resume Learning</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  pathHeaderMeta: { marginBottom: 24 },
  h2: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  totalDuration: { color: '#4E6BFF', fontSize: 14, fontWeight: '600' },
  progressCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#1E293B' },
  h3: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  flexBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  textSilver: { color: '#A0AEC0', fontSize: 14 },
  percentActive: { color: '#FFC837', fontSize: 14, fontWeight: '700' },
  progressBarLg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 16 },
  progressFillLg: { height: '100%', backgroundColor: '#FFC837', borderRadius: 4 },
  encouragement: { color: '#A0AEC0', fontSize: 13, lineHeight: 20 },
  enrollDesc: { color: '#A0AEC0', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#4E6BFF', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  curriculum: { marginBottom: 20 },
  moduleCount: { color: '#A0AEC0', fontSize: 16, fontWeight: 'normal' },
  moduleList: { marginTop: 16, gap: 16 },
  moduleCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 12, alignItems: 'center' },
  moduleCardLocked: { opacity: 0.5 },
  moduleImgWrapper: { position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  moduleImg: { width: '100%', height: '100%' },
  statusIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  statusSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.4)' },
  statusActive: { backgroundColor: 'rgba(78, 107, 255, 0.4)' },
  moduleInfo: { flex: 1, marginLeft: 16 },
  moduleTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  playingBadge: { alignSelf: 'flex-start', backgroundColor: '#4E6BFF', color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  moduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durationText: { color: '#A0AEC0', fontSize: 13 },
  completeText: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  activeText: { color: '#4E6BFF', fontSize: 13, fontWeight: '600' },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B' }
});
