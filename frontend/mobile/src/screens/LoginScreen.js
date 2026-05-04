import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URLS } from '../constants/Config';
import { saveAuthSession } from '../constants/Auth';
import Colors from '../theme/Colors';

const { width } = Dimensions.get('window');

const luminoShadow = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 8,
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    if (mode === 'signup' && password.trim().length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters for a new account password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = mode === 'signup' ? '/users/auth/signup' : '/users/auth/login';
      const response = await fetch(`${API_URLS.USER_SERVICE}${endpoint}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'signup'
            ? {
                email: email.trim(),
                password,
                role,
              }
            : {
                email: email.trim(),
                password,
              }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        const detailMessage = Array.isArray(data?.detail)
          ? data.detail.map((item) => item?.msg).filter(Boolean).join('\n')
          : data?.detail;
        throw new Error(detailMessage || 'Login failed');
      }

      await saveAuthSession(data);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert(mode === 'signup' ? 'Sign up failed' : 'Login failed', error.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.white, Colors.offWhite]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Logo/Branding Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Luminous</Text>
              <Text style={styles.subtitle}>Ignite your potential through learning</Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <Text style={styles.loginTitle}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.loginDesc}>
                {mode === 'signup' ? 'Create your account to track your own learning progress' : 'Please sign in to continue'}
              </Text>

              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === 'signin' && styles.activeModeBtn]}
                  onPress={() => setMode('signin')}
                >
                  <Text style={[styles.modeBtnText, mode === 'signin' && styles.activeModeBtnText]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === 'signup' && styles.activeModeBtn]}
                  onPress={() => setMode('signup')}
                >
                  <Text style={[styles.modeBtnText, mode === 'signup' && styles.activeModeBtnText]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Role Selector */}
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'student' && styles.activeRoleBtn]}
                  onPress={() => setRole('student')}
                >
                  <User size={18} color={role === 'student' ? Colors.white : Colors.silver} />
                  <Text style={[styles.roleBtnText, role === 'student' && styles.activeRoleBtnText]}>Student</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleBtn, role === 'admin' && styles.activeRoleBtn]}
                  onPress={() => setRole('admin')}
                >
                  <ShieldCheck size={18} color={role === 'admin' ? Colors.white : Colors.silver} />
                  <Text style={[styles.roleBtnText, role === 'admin' && styles.activeRoleBtnText]}>Admin</Text>
                </TouchableOpacity>
              </View>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={Colors.silver} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.silver}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color={Colors.silver} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.silver}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color={Colors.silver} /> : <Eye size={20} color={Colors.silver} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                <Text style={styles.loginBtnText}>
                  {isSubmitting ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                  <Text style={styles.signUpText}>{mode === 'signup' ? 'Sign In' : 'Sign Up'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    ...luminoShadow,
  },
  logoLetter: {
    color: Colors.white,
    fontSize: 32,
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight2,
    ...luminoShadow,
  },
  loginTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.navy,
    marginBottom: 4,
  },
  loginDesc: {
    fontSize: 14,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeModeBtn: {
    backgroundColor: Colors.white,
    ...luminoShadow,
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.silver,
  },
  activeModeBtnText: {
    color: Colors.navy,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeRoleBtn: {
    backgroundColor: Colors.brandBlue,
    ...luminoShadow,
  },
  roleBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.silver,
  },
  activeRoleBtnText: {
    color: Colors.white,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.navy,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    color: Colors.brandBlue,
    fontFamily: 'Inter_600SemiBold',
  },
  loginBtn: {
    backgroundColor: Colors.brandBlue,
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...luminoShadow,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.silver,
    fontFamily: 'Inter_400Regular',
  },
  signUpText: {
    fontSize: 13,
    color: Colors.brandBlue,
    fontFamily: 'Inter_700Bold',
  },
});
