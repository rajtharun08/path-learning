import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Download, Layers, Pencil, Plus, ShieldCheck, Trash2, Youtube } from 'lucide-react-native';
import Colors from '../theme/Colors';
import { API_URLS } from '../constants/Config';
import { getAuthHeaders, getAuthSession } from '../constants/Auth';

const luminoShadow = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

const emptyCourseForm = {
  title: '',
  description: '',
  outcomes: '',
  thumbnail: '',
  author_name: '',
  resources: [],
};

const emptyLessonForm = {
  youtube_url: '',
  title: '',
  duration: '',
  position: '',
};

const emptyPathForm = {
  title: '',
  description: '',
  editor_name: '',
};

const QUICK_PICK_LIMIT = 10;

export default function AdminCoursesScreen() {
  const [session, setSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [paths, setPaths] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [resourceForm, setResourceForm] = useState({ title: '', url: '' });
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [pathForm, setPathForm] = useState(emptyPathForm);
  const [selectedPathCourseIds, setSelectedPathCourseIds] = useState([]);
  const [pathCourseSearch, setPathCourseSearch] = useState('');

  const addResource = () => {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return;
    setCourseForm(current => ({
      ...current,
      resources: [...current.resources, { title: resourceForm.title.trim(), url: resourceForm.url.trim(), resource_type: 'link' }]
    }));
    setResourceForm({ title: '', url: '' });
  };

  const removeResource = (index) => {
    setCourseForm(current => ({
      ...current,
      resources: current.resources.filter((_, i) => i !== index)
    }));
  };
  const [managedPathId, setManagedPathId] = useState(null);
  const [managedPathCourseIds, setManagedPathCourseIds] = useState([]);
  const [managedPathSearch, setManagedPathSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [submittingPath, setSubmittingPath] = useState(false);
  const [updatingPathItems, setUpdatingPathItems] = useState(false);
  const [activeTab, setActiveTab] = useState('Courses'); // 'Courses' or 'Paths'
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreatePath, setShowCreatePath] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [showImportYoutube, setShowImportYoutube] = useState(false);
  const [importPlaylistUrl, setImportPlaylistUrl] = useState('');
  const [importingYoutube, setImportingYoutube] = useState(false);

  useEffect(() => {
    loadScreen();
  }, []);

  const loadScreen = async () => {
    try {
      setLoading(true);
      const auth = await getAuthSession();
      setSession(auth);
      await Promise.all([fetchCourses(), fetchPaths()]);
    } catch (error) {
      Alert.alert('Unable to load admin tools', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaths = async () => {
    const response = await fetch(`${API_URLS.PATH_SERVICE}/paths/top`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to load paths');
    }
    setPaths(Array.isArray(data) ? data : []);
  };

  const loadPathItems = async (pathId) => {
    try {
      setManagedPathId(pathId);
      const response = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to load path courses');
      }

      const itemIds = Array.isArray(data.items)
        ? data.items.map(item => item.playlist_id).filter(Boolean)
        : [];
      setManagedPathCourseIds(itemIds);
    } catch (error) {
      Alert.alert('Unable to load path', error.message || 'Please try again.');
    }
  };

  const fetchCourses = async () => {
    const response = await fetch(`${API_URLS.PLAYLIST_SERVICE}/playlist/all`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to load courses');
    }

    const items = Array.isArray(data.items) ? data.items : [];
    setCourses(items);
    if (!selectedCourseId && items.length > 0) {
      setSelectedCourseId(items[0].youtube_playlist_id);
    }
    if (selectedCourseId && !items.some(course => course.youtube_playlist_id === selectedCourseId)) {
      setSelectedCourseId(items[0]?.youtube_playlist_id || null);
    }
  };

  const createCourse = async () => {
    if (!courseForm.title.trim()) {
      Alert.alert('Missing title', 'Add a course title before saving.');
      return;
    }

    try {
      setSubmittingCourse(true);
      const headers = await getAuthHeaders();
      const isUpdating = Boolean(editingCourseId);
      
      const url = isUpdating 
        ? `${API_URLS.PLAYLIST_SERVICE}/courses/${editingCourseId}`
        : `${API_URLS.PLAYLIST_SERVICE}/courses`;
        
      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          ...courseForm,
          title: courseForm.title.trim(),
          description: courseForm.description.trim(),
          outcomes: courseForm.outcomes
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean),
          lessons: isUpdating ? undefined : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || `Failed to ${isUpdating ? 'update' : 'create'} course`);
      }

      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      setSelectedCourseId(data.youtube_playlist_id);
      await fetchCourses();
      if (isUpdating) setShowCreateCourse(false);
    } catch (error) {
      Alert.alert(`Course ${editingCourseId ? 'update' : 'creation'} failed`, error.message || 'Please try again.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const editCourse = (course) => {
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      outcomes: Array.isArray(course.outcomes) ? course.outcomes.join('\n') : (course.outcomes || ''),
      thumbnail: course.thumbnail || '',
      author_name: course.author_name || '',
      resources: course.resources || [],
    });
    setEditingCourseId(course.youtube_playlist_id);
    setShowCreateCourse(true);
  };

  const cancelEditCourse = () => {
    setCourseForm(emptyCourseForm);
    setEditingCourseId(null);
    setShowCreateCourse(false);
  };

  const importYoutubeCourse = async () => {
    if (!importPlaylistUrl.trim()) {
      Alert.alert('Missing URL', 'Paste a YouTube playlist URL to import.');
      return;
    }
    try {
      setImportingYoutube(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URLS.PLAYLIST_SERVICE}/courses/import-youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json', ...headers },
        body: JSON.stringify({ playlist_url: importPlaylistUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Import failed');
      }
      setImportPlaylistUrl('');
      setShowImportYoutube(false);
      await fetchCourses();
      setSelectedCourseId(data.youtube_playlist_id);
      Alert.alert('Import successful!', `"${data.title}" has been imported with ${data.videos?.length || 0} lessons.`);
    } catch (error) {
      Alert.alert('Import failed', error.message || 'Please try again.');
    } finally {
      setImportingYoutube(false);
    }
  };

  const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  };

  const deleteCourse = (courseId) => {
    confirmAction('Delete course', 'This will remove the course and all of its lessons.', async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URLS.PLAYLIST_SERVICE}/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
            ...headers,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'Failed to delete course');
        }
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
        }
        await fetchCourses();
      } catch (error) {
        Alert.alert('Delete failed', error.message || 'Please try again.');
      }
    });
  };

  const addLesson = async () => {
    if (!selectedCourseId) {
      Alert.alert('Pick a course', 'Select a course before adding lessons.');
      return;
    }
    if (!lessonForm.youtube_url.trim()) {
      Alert.alert('Missing lesson link', 'Paste a YouTube lesson link to continue.');
      return;
    }
    if (!lessonForm.title.trim()) {
      Alert.alert('Missing title', 'Add a lesson title.');
      return;
    }

    try {
      setSubmittingLesson(true);
      const isUpdating = Boolean(editingLessonId);
      const selectedCourse = courses.find(course => course.youtube_playlist_id === selectedCourseId);
      const nextPosition = selectedCourse?.videos?.length || 0;
      const headers = await getAuthHeaders();
      
      const url = isUpdating
        ? `${API_URLS.PLAYLIST_SERVICE}/courses/${selectedCourseId}/lessons/${editingLessonId}`
        : `${API_URLS.PLAYLIST_SERVICE}/courses/${selectedCourseId}/lessons`;

      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          youtube_url: lessonForm.youtube_url.trim(),
          title: lessonForm.title.trim(),
          duration: lessonForm.duration.trim() !== '' ? parseInt(lessonForm.duration.trim()) : 0,
          position: lessonForm.position.trim() !== '' ? parseInt(lessonForm.position.trim()) : (isUpdating ? undefined : nextPosition),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || `Failed to ${isUpdating ? 'update' : 'add'} lesson`);
      }

      setLessonForm(emptyLessonForm);
      setEditingLessonId(null);
      await fetchCourses();
      setSelectedCourseId(data.youtube_playlist_id);
    } catch (error) {
      Alert.alert(`Lesson ${editingLessonId ? 'update' : 'creation'} failed`, error.message || 'Please try again.');
    } finally {
      setSubmittingLesson(false);
    }
  };

  const editLesson = (lesson) => {
    setLessonForm({
      youtube_url: lesson.youtube_url || `https://www.youtube.com/watch?v=${lesson.youtube_video_id}`,
      title: lesson.title || '',
      duration: String(lesson.duration || ''),
      position: String(lesson.position || ''),
    });
    setEditingLessonId(lesson.id);
  };

  const cancelEditLesson = () => {
    setLessonForm(emptyLessonForm);
    setEditingLessonId(null);
  };

  const deleteLesson = (courseId, lessonId) => {
    confirmAction('Delete lesson', 'This lesson will be removed from the course.', async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URLS.PLAYLIST_SERVICE}/courses/${courseId}/lessons/${lessonId}`, {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
            ...headers,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'Failed to delete lesson');
        }
        await fetchCourses();
        setSelectedCourseId(data.youtube_playlist_id);
      } catch (error) {
        Alert.alert('Delete failed', error.message || 'Please try again.');
      }
    });
  };

  const deletePath = (pathId) => {
    confirmAction('Delete learning path', 'This will permanently remove the learning path.', async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URLS.PATH_SERVICE}/paths/${pathId}`, {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
            ...headers,
          },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.detail || 'Failed to delete path');
        }
        if (managedPathId === pathId) {
          setManagedPathId(null);
        }
        await fetchPaths();
      } catch (error) {
        Alert.alert('Delete failed', error.message || 'Please try again.');
      }
    });
  };

  const selectedCourse = courses.find(course => course.youtube_playlist_id === selectedCourseId) || null;
  const selectedCourseIsManual = Boolean(selectedCourse?.is_manual);
  const managedPath = paths.find(path => path.path_id === managedPathId) || null;
  const normalizedPathCourseSearch = pathCourseSearch.trim().toLowerCase();
  const normalizedManagedPathSearch = managedPathSearch.trim().toLowerCase();
  const quickPickCourses = courses.slice(0, QUICK_PICK_LIMIT);
  const searchedCourses = normalizedPathCourseSearch
    ? courses.filter((course) =>
        course.title?.toLowerCase().includes(normalizedPathCourseSearch)
      )
    : courses;
  const managedPathSearchCourses = normalizedManagedPathSearch
    ? courses.filter((course) =>
        course.title?.toLowerCase().includes(normalizedManagedPathSearch)
      )
    : courses;
  const managedPathCourses = managedPathCourseIds
    .map(courseId => courses.find(course => course.youtube_playlist_id === courseId))
    .filter(Boolean);

  const togglePathCourse = (courseId) => {
    setSelectedPathCourseIds(current =>
      current.includes(courseId)
        ? current.filter(id => id !== courseId)
        : [...current, courseId]
    );
  };

  const createPath = async () => {
    if (!pathForm.title.trim()) {
      Alert.alert('Missing title', 'Add a path title before creating the path.');
      return;
    }
    if (!pathForm.description.trim()) {
      Alert.alert('Missing description', 'Add a path description before creating the path.');
      return;
    }
    if (!pathForm.editor_name.trim()) {
      Alert.alert('Missing editor', 'Add an editor name before creating the path.');
      return;
    }
    if (selectedPathCourseIds.length === 0) {
      Alert.alert('Pick courses', 'Select at least one course for this path.');
      return;
    }

    try {
      setSubmittingPath(true);
      const headers = await getAuthHeaders();
      const createResponse = await fetch(`${API_URLS.PATH_SERVICE}/paths`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          title: pathForm.title.trim(),
          description: pathForm.description.trim(),
          editor_name: pathForm.editor_name.trim(),
          rating: 0,
        }),
      });
      const createdPath = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createdPath?.detail || 'Failed to create path');
      }

      const itemsResponse = await fetch(`${API_URLS.PATH_SERVICE}/paths/${createdPath.path_id}/items`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          playlist_ids: selectedPathCourseIds,
        }),
      });
      const pathWithItems = await itemsResponse.json();
      if (!itemsResponse.ok) {
        throw new Error(pathWithItems?.detail || 'Failed to add path courses');
      }

      setPathForm(emptyPathForm);
      setSelectedPathCourseIds([]);
      await fetchPaths();
      await loadPathItems(createdPath.path_id);
    } catch (error) {
      Alert.alert('Path creation failed', error.message || 'Please try again.');
    } finally {
      setSubmittingPath(false);
    }
  };

  const updateManagedPathItems = async (nextCourseIds) => {
    if (!managedPathId) {
      Alert.alert('Pick a path', 'Select a path before changing its courses.');
      return;
    }
    if (nextCourseIds.length === 0) {
      Alert.alert('At least one course', 'A path needs at least one course.');
      return;
    }

    try {
      setUpdatingPathItems(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URLS.PATH_SERVICE}/paths/${managedPathId}/items`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          playlist_ids: nextCourseIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to update path courses');
      }

      setManagedPathCourseIds(nextCourseIds);
      await fetchPaths();
    } catch (error) {
      Alert.alert('Path update failed', error.message || 'Please try again.');
    } finally {
      setUpdatingPathItems(false);
    }
  };

  const addCourseToManagedPath = (courseId) => {
    if (managedPathCourseIds.includes(courseId)) {
      return;
    }
    updateManagedPathItems([...managedPathCourseIds, courseId]);
  };

  const removeCourseFromManagedPath = (courseId) => {
    updateManagedPathItems(managedPathCourseIds.filter(id => id !== courseId));
  };

  const moveCourseInPath = (index, direction) => {
    const nextIds = [...managedPathCourseIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextIds.length) return;
    
    const temp = nextIds[index];
    nextIds[index] = nextIds[targetIndex];
    nextIds[targetIndex] = temp;
    updateManagedPathItems(nextIds);
  };

  const pickThumbnailFile = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert('Web only for now', 'Thumbnail file upload is available in the web admin view.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        setCourseForm(current => ({ ...current, thumbnail: result }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleThumbnailDrop = (event) => {
    if (Platform.OS !== 'web') {
      return;
    }
    event.preventDefault();
    const file = event?.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setCourseForm(current => ({ ...current, thumbnail: result }));
    };
    reader.readAsDataURL(file);
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Admin Studio</Text>
              <Text style={styles.subtitle}>
                {session?.role === 'admin' ? 'Admin access enabled' : 'Staff access enabled'}
              </Text>
            </View>
            <View style={styles.badge}>
              <ShieldCheck size={16} color={Colors.brandBlue} />
              <Text style={styles.badgeText}>{session?.role || 'admin'}</Text>
            </View>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Courses' && styles.activeTabItem]} 
              onPress={() => setActiveTab('Courses')}
            >
              <BookOpen size={20} color={activeTab === 'Courses' ? Colors.brandBlue : Colors.silver} />
              <Text style={[styles.tabText, activeTab === 'Courses' && styles.activeTabText]}>Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Paths' && styles.activeTabItem]} 
              onPress={() => setActiveTab('Paths')}
            >
              <Layers size={20} color={activeTab === 'Paths' ? Colors.brandBlue : Colors.silver} />
              <Text style={[styles.tabText, activeTab === 'Paths' && styles.activeTabText]}>Paths</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Paths' ? (
            <>
              <TouchableOpacity 
                style={styles.expandableHeader} 
                onPress={() => setShowCreatePath(!showCreatePath)}
              >
                <Text style={styles.sectionTitle}>Create New Path</Text>
                <Plus size={20} color={Colors.brandBlue} style={{ transform: [{ rotate: showCreatePath ? '45deg' : '0deg' }] }} />
              </TouchableOpacity>

              {showCreatePath && (
                <View style={styles.card}>
                  <TextInput
                    style={styles.input}
                    placeholder="Path title"
                    placeholderTextColor={Colors.silver}
                    value={pathForm.title}
                    onChangeText={(value) => setPathForm(current => ({ ...current, title: value }))}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Path description"
                    placeholderTextColor={Colors.silver}
                    multiline
                    value={pathForm.description}
                    onChangeText={(value) => setPathForm(current => ({ ...current, description: value }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Editor name"
                    placeholderTextColor={Colors.silver}
                    value={pathForm.editor_name}
                    onChangeText={(value) => setPathForm(current => ({ ...current, editor_name: value }))}
                  />
                  <Text style={styles.inlineLabel}>Quick picks</Text>
                  <View style={styles.selectorWrap}>
                    {quickPickCourses.map((course) => {
                      const isSelected = selectedPathCourseIds.includes(course.youtube_playlist_id);
                      return (
                        <TouchableOpacity
                          key={`path-course-${course.youtube_playlist_id}`}
                          style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                          onPress={() => togglePathCourse(course.youtube_playlist_id)}
                        >
                          <Text style={[styles.selectorChipText, isSelected && styles.selectorChipTextActive]}>
                            {course.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Search courses to add to this path"
                    placeholderTextColor={Colors.silver}
                    value={pathCourseSearch}
                    onChangeText={setPathCourseSearch}
                  />
                  <View style={styles.searchResultsCard}>
                    <Text style={styles.searchResultsTitle}>Course search</Text>
                    {searchedCourses.length === 0 ? (
                      <Text style={styles.emptyText}>No matching courses found.</Text>
                    ) : (
                      searchedCourses.slice(0, 12).map((course) => {
                        const isSelected = selectedPathCourseIds.includes(course.youtube_playlist_id);
                        return (
                          <TouchableOpacity
                            key={`path-search-${course.youtube_playlist_id}`}
                            style={[styles.searchResultRow, isSelected && styles.searchResultRowActive]}
                            onPress={() => togglePathCourse(course.youtube_playlist_id)}
                          >
                            <View style={styles.searchResultTextWrap}>
                              <Text style={styles.searchResultTitle}>{course.title}</Text>
                              <Text style={styles.searchResultMeta}>
                                {course.is_manual ? 'Manual course' : 'Imported course'}
                              </Text>
                            </View>
                            <Text style={[styles.searchResultAction, isSelected && styles.searchResultActionActive]}>
                              {isSelected ? 'Added' : 'Add'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, submittingPath && styles.disabledBtn]}
                    disabled={submittingPath}
                    onPress={createPath}
                  >
                    <Plus size={16} color={Colors.white} />
                    <Text style={styles.primaryBtnText}>
                      {submittingPath ? 'Creating...' : 'Create Path'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Manage Paths</Text>
                  <Text style={styles.helperText}>{paths.length} total</Text>
                </View>
                {paths.length === 0 ? (
                  <Text style={styles.emptyText}>No paths found yet.</Text>
                ) : (
                  paths.map((path) => (
                    <View
                      key={path.path_id}
                      style={[styles.courseCard, managedPathId === path.path_id && styles.courseCardActive]}
                    >
                      <TouchableOpacity
                        style={styles.courseCardBody}
                        onPress={() => loadPathItems(path.path_id)}
                        activeOpacity={0.8}
                      >
                        <Layers size={18} color={managedPathId === path.path_id ? Colors.brandBlue : Colors.navy} />
                        <View style={styles.courseCardText}>
                          <Text style={styles.courseTitle}>{path.title}</Text>
                          <Text style={styles.courseMeta} numberOfLines={1}>{path.description}</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deletePath(path.path_id)}
                        style={styles.iconBtn}
                      >
                        <Trash2 size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {managedPath && (
                <View style={styles.card}>
                  <View style={styles.sectionHead}>
                    <View>
                      <Text style={styles.sectionTitle}>Path Content</Text>
                      <Text style={styles.helperText}>{managedPath.title}</Text>
                    </View>
                    {updatingPathItems ? <ActivityIndicator size="small" color={Colors.brandBlue} /> : null}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Search courses to add"
                    placeholderTextColor={Colors.silver}
                    value={managedPathSearch}
                    onChangeText={setManagedPathSearch}
                  />

                  <View style={styles.searchResultsCard}>
                    <Text style={styles.searchResultsTitle}>Add courses</Text>
                    {managedPathSearchCourses.length === 0 ? (
                      <Text style={styles.emptyText}>No matching courses found.</Text>
                    ) : (
                      managedPathSearchCourses.slice(0, 12).map((course) => {
                        const isAdded = managedPathCourseIds.includes(course.youtube_playlist_id);
                        return (
                          <TouchableOpacity
                            key={`managed-path-search-${course.youtube_playlist_id}`}
                            style={[styles.searchResultRow, isAdded && styles.searchResultRowActive]}
                            onPress={() => addCourseToManagedPath(course.youtube_playlist_id)}
                            disabled={isAdded || updatingPathItems}
                          >
                            <View style={styles.searchResultTextWrap}>
                              <Text style={styles.searchResultTitle}>{course.title}</Text>
                              <Text style={styles.searchResultMeta}>
                                {course.is_manual ? 'Manual' : 'Imported'}
                              </Text>
                            </View>
                            <Text style={[styles.searchResultAction, isAdded && styles.searchResultActionActive]}>
                              {isAdded ? 'Added' : 'Add'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>

                  <Text style={styles.inlineLabel}>Sequence Order</Text>
                  {managedPathCourses.length === 0 ? (
                    <Text style={styles.emptyText}>This path has no courses yet.</Text>
                  ) : (
                    managedPathCourses.map((course, index) => (
                      <View key={`managed-path-course-${course.youtube_playlist_id}`} style={styles.lessonCard}>
                        <View style={styles.lessonTextWrap}>
                          <Text style={styles.lessonTitle}>{course.title}</Text>
                          <Text style={styles.lessonMeta}>Step {index + 1}</Text>
                        </View>
                        <View style={styles.row}>
                          <TouchableOpacity
                            onPress={() => moveCourseInPath(index, 'up')}
                            style={styles.iconBtn}
                            disabled={index === 0 || updatingPathItems}
                          >
                            <Text style={[styles.arrowBtn, index === 0 && styles.disabledText]}>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => moveCourseInPath(index, 'down')}
                            style={styles.iconBtn}
                            disabled={index === managedPathCourses.length - 1 || updatingPathItems}
                          >
                            <Text style={[styles.arrowBtn, index === managedPathCourses.length - 1 && styles.disabledText]}>↓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeCourseFromManagedPath(course.youtube_playlist_id)}
                            style={styles.iconBtn}
                            disabled={updatingPathItems}
                          >
                            <Trash2 size={18} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Import from YouTube */}
              <TouchableOpacity
                style={styles.expandableHeader}
                onPress={() => setShowImportYoutube(!showImportYoutube)}
              >
                <View style={styles.row}>
                  <Youtube size={18} color={Colors.danger} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Import from YouTube</Text>
                </View>
                <Plus size={20} color={Colors.brandBlue} style={{ transform: [{ rotate: showImportYoutube ? '45deg' : '0deg' }] }} />
              </TouchableOpacity>

              {showImportYoutube && (
                <View style={styles.card}>
                  <Text style={styles.helperText}>
                    Paste a YouTube playlist URL to automatically import all videos as lessons.
                    Re-importing the same playlist will sync new/removed videos.
                  </Text>
                  <TextInput
                    style={[styles.input, { marginTop: 12 }]}
                    placeholder="https://www.youtube.com/playlist?list=PL..."
                    placeholderTextColor={Colors.silver}
                    value={importPlaylistUrl}
                    onChangeText={setImportPlaylistUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.primaryBtn, importingYoutube && styles.disabledBtn]}
                    disabled={importingYoutube}
                    onPress={importYoutubeCourse}
                  >
                    <Download size={16} color={Colors.white} />
                    <Text style={styles.primaryBtnText}>
                      {importingYoutube ? 'Importing...' : 'Import Playlist'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Create Manually */}
              <TouchableOpacity
                style={styles.expandableHeader}
                onPress={() => editingCourseId ? cancelEditCourse() : setShowCreateCourse(!showCreateCourse)}
              >
                <Text style={styles.sectionTitle}>{editingCourseId ? 'Update Course' : 'Create New Course'}</Text>
                <Plus size={20} color={Colors.brandBlue} style={{ transform: [{ rotate: (showCreateCourse || editingCourseId) ? '45deg' : '0deg' }] }} />
              </TouchableOpacity>

              {showCreateCourse && (
                <View style={styles.card}>
                  <TextInput
                    style={styles.input}
                    placeholder="Course title"
                    placeholderTextColor={Colors.silver}
                    value={courseForm.title}
                    onChangeText={(value) => setCourseForm(current => ({ ...current, title: value }))}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Overview / About this course"
                    placeholderTextColor={Colors.silver}
                    multiline
                    value={courseForm.description}
                    onChangeText={(value) => setCourseForm(current => ({ ...current, description: value }))}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={"What you'll learn (one point per line)"}
                    placeholderTextColor={Colors.silver}
                    multiline
                    value={courseForm.outcomes}
                    onChangeText={(value) => setCourseForm(current => ({ ...current, outcomes: value }))}
                  />
                  <View
                    style={styles.uploadCard}
                    onDragOver={Platform.OS === 'web' ? (event) => event.preventDefault() : undefined}
                    onDrop={Platform.OS === 'web' ? handleThumbnailDrop : undefined}
                  >
                    <Text style={styles.uploadTitle}>Thumbnail</Text>
                    <Text style={styles.uploadText}>Drop image here or tap to upload.</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={pickThumbnailFile}>
                      <Text style={styles.secondaryBtnText}>Upload Image</Text>
                    </TouchableOpacity>
                    {courseForm.thumbnail ? (
                      <Image source={{ uri: courseForm.thumbnail }} style={styles.thumbnailPreview} />
                    ) : null}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Author name"
                    placeholderTextColor={Colors.silver}
                    value={courseForm.author_name}
                    onChangeText={(value) => setCourseForm(current => ({ ...current, author_name: value }))}
                  />
                  <Text style={styles.inlineLabel}>Course Resources</Text>
                  {courseForm.resources.map((resource, index) => (
                    <View key={`resource-${index}`} style={styles.searchResultRow}>
                      <View style={styles.searchResultTextWrap}>
                        <Text style={styles.searchResultTitle}>{resource.title}</Text>
                        <Text style={styles.searchResultMeta}>{resource.url}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeResource(index)} style={styles.iconBtn}>
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={[styles.addLessonForm, { marginBottom: 16 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Resource Title (e.g. Slide Deck)"
                      placeholderTextColor={Colors.silver}
                      value={resourceForm.title}
                      onChangeText={(value) => setResourceForm(current => ({ ...current, title: value }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Resource URL"
                      placeholderTextColor={Colors.silver}
                      value={resourceForm.url}
                      onChangeText={(value) => setResourceForm(current => ({ ...current, url: value }))}
                    />
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={addResource}
                    >
                      <Text style={styles.secondaryBtnText}>Add Resource</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, submittingCourse && styles.disabledBtn]}
                    disabled={submittingCourse}
                    onPress={createCourse}
                  >
                    {editingCourseId ? <Pencil size={16} color={Colors.white} /> : <Plus size={16} color={Colors.white} />}
                    <Text style={styles.primaryBtnText}>
                      {submittingCourse ? (editingCourseId ? 'Updating...' : 'Creating...') : (editingCourseId ? 'Update Course' : 'Create Course')}
                    </Text>
                  </TouchableOpacity>
                  
                  {editingCourseId && (
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { marginTop: 8, borderColor: Colors.silver }]}
                      onPress={cancelEditCourse}
                    >
                      <Text style={[styles.secondaryBtnText, { color: Colors.silver }]}>Cancel Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Manage Courses</Text>
                  <Text style={styles.helperText}>{courses.length} total</Text>
                </View>
                {courses.length === 0 ? (
                  <Text style={styles.emptyText}>No courses yet.</Text>
                ) : (
                  courses.map(course => {
                    const isSelected = course.youtube_playlist_id === selectedCourseId;
                    return (
                      <View
                        key={course.youtube_playlist_id}
                        style={[styles.courseCard, isSelected && styles.courseCardActive]}
                      >
                        <TouchableOpacity
                          style={styles.courseCardBody}
                          onPress={() => setSelectedCourseId(course.youtube_playlist_id)}
                          activeOpacity={0.8}
                        >
                          <BookOpen size={18} color={isSelected ? Colors.brandBlue : Colors.navy} />
                          <View style={styles.courseCardText}>
                            <Text style={styles.courseTitle}>{course.title}</Text>
                            <Text style={styles.courseMeta}>
                              {(course.videos || []).length} lessons • {course.is_manual ? 'Manual' : 'Imported'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.row}>
                            <TouchableOpacity
                              onPress={() => editCourse(course)}
                              style={styles.iconBtn}
                            >
                              <Pencil size={18} color={Colors.brandBlue} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deleteCourse(course.youtube_playlist_id)}
                              style={styles.iconBtn}
                            >
                              <Trash2 size={18} color={Colors.danger} />
                            </TouchableOpacity>
                          </View>
                      </View>
                    );
                  })
                )}
              </View>

              {selectedCourse && (
                <View style={styles.card}>
                  <View style={styles.sectionHead}>
                    <View>
                      <Text style={styles.sectionTitle}>Curriculum</Text>
                      <Text style={styles.helperText}>{selectedCourse.title}</Text>
                    </View>
                  </View>

                  <View>
                    <Text style={styles.sectionTitle}>{editingLessonId ? 'Update Lesson' : 'Add New Lesson'}</Text>
                    <View style={styles.addLessonForm}>
                        <TextInput
                          style={styles.input}
                          placeholder="YouTube video URL"
                          placeholderTextColor={Colors.silver}
                          value={lessonForm.youtube_url}
                          onChangeText={(value) => setLessonForm(current => ({ ...current, youtube_url: value }))}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Lesson title"
                          placeholderTextColor={Colors.silver}
                          value={lessonForm.title}
                          onChangeText={(value) => setLessonForm(current => ({ ...current, title: value }))}
                        />
                        <View style={styles.row}>
                          <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Duration (sec)"
                            placeholderTextColor={Colors.silver}
                            keyboardType="numeric"
                            value={lessonForm.duration}
                            onChangeText={(value) => setLessonForm(current => ({ ...current, duration: value }))}
                          />
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Position"
                            placeholderTextColor={Colors.silver}
                            keyboardType="numeric"
                            value={lessonForm.position}
                            onChangeText={(value) => setLessonForm(current => ({ ...current, position: value }))}
                          />
                        </View>
                        <TouchableOpacity
                          style={[styles.primaryBtn, submittingLesson && styles.disabledBtn]}
                          disabled={submittingLesson}
                          onPress={addLesson}
                        >
                          {editingLessonId ? <Pencil size={16} color={Colors.white} /> : <Plus size={16} color={Colors.white} />}
                          <Text style={styles.primaryBtnText}>
                            {submittingLesson ? (editingLessonId ? 'Updating...' : 'Adding...') : (editingLessonId ? 'Update Lesson' : 'Add Lesson')}
                          </Text>
                        </TouchableOpacity>
                        
                        {editingLessonId && (
                          <TouchableOpacity
                            style={[styles.secondaryBtn, { marginTop: 8, borderColor: Colors.silver }]}
                            onPress={cancelEditLesson}
                          >
                            <Text style={[styles.secondaryBtnText, { color: Colors.silver }]}>Cancel Edit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                  <View style={styles.lessonList}>
                    {(selectedCourse.videos || []).length === 0 ? (
                      <Text style={styles.emptyText}>No lessons yet.</Text>
                    ) : (
                      selectedCourse.videos
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((video) => (
                          <View key={video.id} style={styles.lessonCard}>
                            <View style={styles.lessonTextWrap}>
                              <Text style={styles.lessonTitle}>{video.title}</Text>
                              <Text style={styles.lessonMeta}>Position {video.position + 1}</Text>
                            </View>
                            <View style={styles.row}>
                                <TouchableOpacity
                                  onPress={() => editLesson(video)}
                                  style={styles.iconBtn}
                                >
                                  <Pencil size={18} color={Colors.brandBlue} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => deleteLesson(selectedCourse.youtube_playlist_id, video.id)}
                                  style={styles.iconBtn}
                                >
                                  <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                              </View>
                          </View>
                        ))
                    )}
                  </View>
                </View>
              )}
            </>
          )}
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.offWhite,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
  },
  subtitle: {
    marginTop: 6,
    color: Colors.silver,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...luminoShadow,
  },
  badgeText: {
    color: Colors.brandBlue,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    ...luminoShadow,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 12,
  },
  helperText: {
    color: Colors.silver,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.navy,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  inlineLabel: {
    color: Colors.navy,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectorChip: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorChipActive: {
    backgroundColor: Colors.brandBlue,
    borderColor: Colors.brandBlue,
  },
  selectorChipText: {
    color: Colors.navy,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  selectorChipTextActive: {
    color: Colors.white,
  },
  searchResultsCard: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 12,
    marginBottom: 12,
  },
  searchResultsTitle: {
    color: Colors.navy,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  searchResultRowActive: {
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  searchResultTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  searchResultTitle: {
    color: Colors.navy,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  searchResultMeta: {
    color: Colors.silver,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  searchResultAction: {
    color: Colors.brandBlue,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  searchResultActionActive: {
    color: Colors.navy,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  uploadCard: {
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    padding: 14,
    marginBottom: 12,
  },
  uploadTitle: {
    color: Colors.navy,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  uploadText: {
    color: Colors.silver,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.brandBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: Colors.navy,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  thumbnailPreview: {
    marginTop: 12,
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  emptyText: {
    color: Colors.silver,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.offWhite,
    marginBottom: 12,
  },
  courseCardActive: {
    borderColor: Colors.brandBlue,
    backgroundColor: '#EEF4FF',
  },
  courseCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseCardText: {
    marginLeft: 12,
    flex: 1,
  },
  courseTitle: {
    color: Colors.navy,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  courseMeta: {
    color: Colors.silver,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  iconBtn: {
    padding: 8,
  },
  lessonList: {
    marginTop: 16,
  },
  readOnlyBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
  },
  readOnlyTitle: {
    color: Colors.navy,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  readOnlyText: {
    color: Colors.silver,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight2,
  },
  lessonTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  lessonTitle: {
    color: Colors.navy,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  lessonMeta: {
    color: Colors.silver,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
    ...luminoShadow,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTabItem: {
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabText: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_600SemiBold',
  },
  activeTabText: {
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...luminoShadow,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addLessonForm: {
    backgroundColor: Colors.offWhite,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  playingBadge: {
    fontSize: 10,
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    fontSize: 20,
    color: Colors.brandBlue,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  disabledText: {
    color: Colors.borderLight,
  },
});
