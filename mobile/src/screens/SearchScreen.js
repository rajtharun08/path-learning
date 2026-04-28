import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Star, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`${API_URLS.PLAYLIST_SERVICE}/playlist/search?q=${encodeURIComponent(query)}`)
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
          console.log('Error searching backend', err);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={Colors.textSilver} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search all content..." 
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primaryDark} />
            <Text style={styles.statusText}>Searching...</Text>
          </View>
        )}
        
        {!loading && query !== '' && results.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.statusText}>No courses found matching your query.</Text>
          </View>
        )}
        
        {!loading && results.map(course => (
          <TouchableOpacity 
            key={course.id} 
            style={styles.courseCard} 
            onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })}
          >
            <Image source={{ uri: course.img }} style={styles.courseImage} />
            <View style={styles.courseInfo}>
              <Text style={styles.courseCat}>{course.category}</Text>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <View style={styles.courseMeta}>
                <View style={styles.ratingRow}>
                  <Star size={14} fill={Colors.accentHoney} color={Colors.accentHoney} />
                  <Text style={styles.ratingText}> {course.rating}</Text>
                </View>
                <Text style={styles.studentsText}>{course.students} students</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textDark,
  },
  resultsContainer: {
    padding: 16,
    gap: 16,
  },
  center: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusText: {
    marginTop: 12,
    color: Colors.textSilver,
    fontSize: 14,
  },
  courseCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courseImage: {
    width: '100%',
    height: 160,
  },
  courseInfo: {
    padding: 16,
  },
  courseCat: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    fontSize: 12,
    color: Colors.textSilver,
  },
});
