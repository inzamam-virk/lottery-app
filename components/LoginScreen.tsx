import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { UI } from '../constants';

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'dealer' | 'admin'>('dealer');

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    clearError();

    if (isSignUp) {
      const success = await signUp(email.trim(), password, role);
      if (success) {
        onLoginSuccess();
      }
    } else {
      const success = await signIn(email.trim(), password);
      if (success) {
        onLoginSuccess();
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    clearError();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>LotteryApp</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'dealer' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('dealer')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'dealer' && styles.roleButtonTextActive,
                    ]}
                  >
                    Dealer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'admin' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('admin')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'admin' && styles.roleButtonTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={UI.COLORS.CARD} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleButtonText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: UI.SPACING.LG,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: UI.SPACING.XL * 2,
  },
  
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI.COLORS.PRIMARY,
    marginBottom: UI.SPACING.SM,
  },
  
  subtitle: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  
  form: {
    width: '100%',
  },
  
  inputContainer: {
    marginBottom: UI.SPACING.LG,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SM,
  },
  
  input: {
    backgroundColor: UI.COLORS.CARD,
    borderWidth: 1,
    borderColor: UI.COLORS.BACKGROUND,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    fontSize: 16,
    color: UI.COLORS.TEXT,
  },
  
  roleContainer: {
    flexDirection: 'row',
    gap: UI.SPACING.MD,
  },
  
  roleButton: {
    flex: 1,
    backgroundColor: UI.COLORS.CARD,
    borderWidth: 1,
    borderColor: UI.COLORS.BACKGROUND,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    alignItems: 'center',
  },
  
  roleButtonActive: {
    backgroundColor: UI.COLORS.PRIMARY,
    borderColor: UI.COLORS.PRIMARY,
  },
  
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.COLORS.TEXT,
  },
  
  roleButtonTextActive: {
    color: UI.COLORS.CARD,
  },
  
  errorContainer: {
    backgroundColor: UI.COLORS.ERROR + '20',
    borderWidth: 1,
    borderColor: UI.COLORS.ERROR,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    marginBottom: UI.SPACING.LG,
  },
  
  errorText: {
    color: UI.COLORS.ERROR,
    fontSize: 14,
    textAlign: 'center',
  },
  
  submitButton: {
    backgroundColor: UI.COLORS.PRIMARY,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    alignItems: 'center',
    marginBottom: UI.SPACING.LG,
  },
  
  submitButtonDisabled: {
    opacity: 0.6,
  },
  
  submitButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  toggleButton: {
    alignItems: 'center',
  },
  
  toggleButtonText: {
    color: UI.COLORS.PRIMARY,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
