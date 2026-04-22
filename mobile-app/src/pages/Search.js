import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Search as SearchIcon, Star, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function Search() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`http://${API_HOST}:8002/playlist/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          const items = data.items || [];
          if (Array.isArray(items)) {
            const formatted = items.map(course => ({
              id: course.youtube_playlist_id || course.id || course.playlist_id,
              title: course.title,
              category: "Course",
              rating: course.rating || 4.8,
              students: "1.2k",
              img: course.thumbnail_url || (course.videos && course.videos[0] && course.videos[0].thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
            }));
            setResults(formatted);
          } else {
            setResults([]);
          }
          setLoading(false);
        })
        .catch(err => {
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color="#A0AEC0" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search all content..." 
            placeholderTextColor="#A0AEC0"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && <ActivityIndicator size="large" color="#4E6BFF" style={{ marginTop: 20 }} />}
        
        {!loading && query.length > 0 && results.length === 0 && (
          <Text style={styles.noResults}>No courses found matching your query.</Text>
        )}
        
        <View style={styles.courseList}>
          {!loading && results.map(course => (
            <TouchableOpacity key={course.id} style={styles.courseCard} onPress={() => navigation.navigate('CourseDetails', { id: course.id })}>
              <Image source={{ uri: course.img }} style={styles.courseImg} />
              <View style={styles.courseInfo}>
                <Text style={styles.courseCat}>{course.category}</Text>
                <Text style={styles.courseTitle}>{course.title}</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, color: '#fff', marginLeft: 12, fontSize: 15 },
  scrollContent: { padding: 20 },
  noResults: { color: '#A0AEC0', textAlign: 'center', marginTop: 20 },
  courseList: { gap: 16 },
  courseCard: { flexDirection: 'column', backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  courseImg: { width: '100%', height: 140 },
  courseInfo: { padding: 16 },
  courseCat: { color: '#4E6BFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  courseTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  studentsText: { color: '#A0AEC0', fontSize: 13 }
});
