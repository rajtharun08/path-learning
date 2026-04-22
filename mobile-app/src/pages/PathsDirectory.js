import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Search as SearchIcon, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function PathsDirectory() {
  const navigation = useNavigation();
  const [paths, setPaths] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';

  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  const fetchEnrolledPaths = () => {
    fetch(`http://${API_HOST}:8006/users/${USER_ID}/enrolled-paths?started_only=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContinuePaths(data);
        }
      })
      .catch(err => console.error('Error fetching enrolled paths:', err));
  };

  useEffect(() => {
    fetchEnrolledPaths();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const url = searchQuery.trim() === '' 
        ? `http://${API_HOST}:8006/paths/top` 
        : `http://${API_HOST}:8006/paths/search?q=${encodeURIComponent(searchQuery)}`;

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
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
          const mock = [
            { id: '11111111-1111-4111-a111-111111111111', title: 'Frontend Development', desc: 'Complete roadmap to becoming a frontend master.', rating: 4.8, duration: '45h', enrollments: '2.5k' },
            { id: '22222222-2222-4222-a222-222222222222', title: 'Python Developer', desc: 'Zero to hero Python syllabus.', rating: 4.7, duration: '38h', enrollments: '1.8k' }
          ];
          setPaths(mock);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.dirHeader}>
        <Text style={styles.subtitle}>Track your learning progress and continue where you left off. Stay on track with your learning goals.</Text>
      </View>

      <View style={styles.dirSectionTitle}>
        <Text style={styles.blueBarText}>All paths</Text>
        <Text style={styles.h2}>All paths</Text>
        <Text style={styles.desc}>Browse and find all public Hexaware paths here.</Text>
        
        <View style={styles.searchBarWithBtn}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search learning paths" 
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchSubmit}>
            <SearchIcon size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Continue Learning</Text>
        {continuePaths.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.continueCards}>
            {continuePaths.map(path => (
              <TouchableOpacity key={`continue-${path.path_id}`} style={styles.continueCard} onPress={() => navigation.navigate('LearningPath', { id: path.path_id })}>
                <Text style={styles.cardTitle}>{path.title}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${path.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{path.progress}% complete</Text>
                </View>
                <TouchableOpacity style={styles.btnPrimarySmall} onPress={() => navigation.navigate('LearningPath', { id: path.path_id })}>
                  <Text style={styles.btnPrimaryText}>Resume</Text>
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

      <View style={styles.pathsList}>
        {loading ? (
          <ActivityIndicator size="large" color="#4E6BFF" />
        ) : (
          paths.map(path => (
            <TouchableOpacity key={`path-${path.id}`} style={styles.courseCardTextual} onPress={() => navigation.navigate('LearningPath', { id: path.id })}>
              <View style={styles.textHeader}>
                <Text style={styles.cardTitle}>{path.title}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} fill="#FFC837" color="#FFC837" />
                  <Text style={styles.ratingText}>{path.rating}</Text>
                </View>
              </View>
              <Text style={styles.courseDesc}>{path.desc}</Text>
              <View style={styles.courseMetaBottom}>
                <Text style={styles.metaText}>Total Time: {path.duration}</Text>
                <Text style={styles.metaText}>Enrollments: {path.enrollments}</Text>
              </View>
              <TouchableOpacity style={styles.btnPrimaryFull} onPress={() => navigation.navigate('LearningPath', { id: path.id })}>
                <Text style={styles.btnPrimaryText}>View Path</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  dirHeader: { marginTop: 40, marginBottom: 24 },
  subtitle: { color: '#A0AEC0', fontSize: 14, lineHeight: 22 },
  dirSectionTitle: { marginBottom: 32 },
  blueBarText: { color: '#4E6BFF', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#4E6BFF', paddingLeft: 8 },
  h2: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  desc: { color: '#A0AEC0', fontSize: 14, marginBottom: 16 },
  searchBarWithBtn: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 16, color: '#fff', height: 48 },
  searchSubmit: { backgroundColor: '#4E6BFF', width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 32 },
  continueCards: { flexDirection: 'row' },
  continueCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, width: 260, marginRight: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  progressContainer: { marginBottom: 16 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#4E6BFF', borderRadius: 3 },
  progressText: { color: '#A0AEC0', fontSize: 13 },
  btnPrimarySmall: { backgroundColor: '#4E6BFF', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#A0AEC0', fontSize: 13, textAlign: 'center' },
  pathsList: { gap: 16 },
  courseCardTextual: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16 },
  textHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  courseDesc: { color: '#A0AEC0', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  courseMetaBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metaText: { color: '#A0AEC0', fontSize: 13 },
  btnPrimaryFull: { backgroundColor: '#4E6BFF', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }
});
