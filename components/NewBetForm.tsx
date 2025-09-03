import React, { useState, useEffect } from 'react';
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
import { useLotteryStore } from '../stores/lotteryStore';
import { useAuthStore } from '../stores/authStore';
import { BetForm } from '../types';
import { UI, LOTTERY_CONFIG } from '../constants';
import { formatPKT, isBettingOpen } from '../lib/utils/time';

interface NewBetFormProps {
  onBetPlaced: () => void;
  onCancel: () => void;
}

const NewBetForm: React.FC<NewBetFormProps> = ({ onBetPlaced, onCancel }) => {
  const { user } = useAuthStore();
  const { currentDraw, placeBet, isLoading, error } = useLotteryStore();

  const [formData, setFormData] = useState<BetForm>({
    client_name: '',
    client_phone: '',
    number: 0,
    stake: 0,
  });

  const [validationErrors, setValidationErrors] = useState<Partial<BetForm>>({});

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const validateForm = (): boolean => {
    const errors: Partial<BetForm> = {};

    if (!formData.client_name.trim()) {
      errors.client_name = 'Client name is required';
    }

    if (formData.client_name.trim().length < 2) {
      errors.client_name = 'Client name must be at least 2 characters';
    }

    if (formData.number < LOTTERY_CONFIG.NUMBER_RANGE.MIN || 
        formData.number > LOTTERY_CONFIG.NUMBER_RANGE.MAX) {
      errors.number = `Number must be between ${LOTTERY_CONFIG.NUMBER_RANGE.MIN} and ${LOTTERY_CONFIG.NUMBER_RANGE.MAX}`;
    }

    if (formData.stake <= 0) {
      errors.stake = 'Stake must be greater than 0';
    }

    if (formData.stake > 100000) { // Max stake limit
      errors.stake = 'Stake cannot exceed Rs. 100,000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!currentDraw) {
      Alert.alert('Error', 'No active draw available');
      return;
    }

    if (!isBettingOpen(currentDraw.scheduled_at)) {
      Alert.alert('Error', 'Betting is currently closed for this draw');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const success = await placeBet({
        dealer_id: user!.id,
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim() || undefined,
        number: formData.number,
        stake: formData.stake,
        draw_id: currentDraw.id,
      });

      if (success) {
        Alert.alert(
          'Success',
          `Bet placed successfully!\n\nClient: ${formData.client_name}\nNumber: ${formData.number.toString().padStart(3, '0')}\nStake: Rs. ${formData.stake.toLocaleString()}`,
          [
            {
              text: 'OK',
              onPress: onBetPlaced,
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place bet. Please try again.');
    }
  };

  const handleNumberChange = (text: string) => {
    const number = parseInt(text, 10);
    if (!isNaN(number) && number >= 0 && number <= 999) {
      setFormData(prev => ({ ...prev, number }));
      if (validationErrors.number) {
        setValidationErrors(prev => ({ ...prev, number: undefined }));
      }
    }
  };

  const handleStakeChange = (text: string) => {
    const stake = parseInt(text, 10);
    if (!isNaN(stake) && stake >= 0) {
      setFormData(prev => ({ ...prev, stake }));
      if (validationErrors.stake) {
        setValidationErrors(prev => ({ ...prev, stake: undefined }));
      }
    }
  };

  const getBettingStatus = () => {
    if (!currentDraw) return { text: 'No upcoming draws', color: UI.COLORS.TEXT_SECONDARY };
    
    if (isBettingOpen(currentDraw.scheduled_at)) {
      return { text: 'Betting Open', color: UI.COLORS.SUCCESS };
    } else {
      return { text: 'Betting Closed', color: UI.COLORS.ERROR };
    }
  };

  const getCutOffTime = () => {
    if (!currentDraw) return null;
    const drawTime = new Date(currentDraw.scheduled_at);
    const cutOffTime = new Date(drawTime.getTime() - (LOTTERY_CONFIG.BET_CUTOFF_MINUTES * 60 * 1000));
    return formatPKT(cutOffTime, 'HH:mm');
  };

  if (!currentDraw) {
    return (
      <View style={styles.container}>
        <View style={styles.noDrawContainer}>
          <Text style={styles.noDrawText}>No active draw available</Text>
          <Text style={styles.noDrawSubtext}>Please wait for the next draw</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Place New Bet</Text>
          <Text style={styles.subtitle}>Current Draw Information</Text>
        </View>

        {/* Draw Status */}
        <View style={styles.drawStatusCard}>
          <Text style={styles.drawStatusTitle}>Draw #{currentDraw.id.slice(-6)}</Text>
          <Text style={styles.drawTime}>
            {formatPKT(currentDraw.scheduled_at, 'PPpp')}
          </Text>
          
          <View style={styles.bettingStatus}>
            <Text style={styles.bettingStatusLabel}>Status:</Text>
            <Text style={[styles.bettingStatusText, { color: getBettingStatus().color }]}>
              {getBettingStatus().text}
            </Text>
          </View>
          
          {getCutOffTime() && (
            <Text style={styles.cutOffTime}>
              Betting closes at {getCutOffTime()}
            </Text>
          )}
        </View>

        {/* Betting Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Client Name *</Text>
            <TextInput
              style={[styles.input, validationErrors.client_name && styles.inputError]}
              value={formData.client_name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, client_name: text }));
                if (validationErrors.client_name) {
                  setValidationErrors(prev => ({ ...prev, client_name: undefined }));
                }
              }}
              placeholder="Enter client's full name"
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              editable={!isLoading}
            />
            {validationErrors.client_name && (
              <Text style={styles.errorText}>{validationErrors.client_name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Client Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.client_phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, client_phone: text }))}
              placeholder="Enter client's phone number"
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number *</Text>
            <TextInput
              style={[styles.input, validationErrors.number && styles.inputError]}
              value={formData.number.toString()}
              onChangeText={handleNumberChange}
              placeholder={`Enter number (${LOTTERY_CONFIG.NUMBER_RANGE.MIN}-${LOTTERY_CONFIG.NUMBER_RANGE.MAX})`}
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              maxLength={3}
              editable={!isLoading}
            />
            {validationErrors.number && (
              <Text style={styles.errorText}>{validationErrors.number}</Text>
            )}
            <Text style={styles.helperText}>
              Number range: {LOTTERY_CONFIG.NUMBER_RANGE.MIN} - {LOTTERY_CONFIG.NUMBER_RANGE.MAX}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Stake Amount (Rs.) *</Text>
            <TextInput
              style={[styles.input, validationErrors.stake && styles.inputError]}
              value={formData.stake.toString()}
              onChangeText={handleStakeChange}
              placeholder="Enter stake amount"
              placeholderTextColor={UI.COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              editable={!isLoading}
            />
            {validationErrors.stake && (
              <Text style={styles.errorText}>{validationErrors.stake}</Text>
            )}
            <Text style={styles.helperText}>
              Maximum stake: Rs. 100,000
            </Text>
          </View>

          {/* Bet Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Bet Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Client:</Text>
              <Text style={styles.summaryValue}>{formData.client_name || 'Not specified'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Number:</Text>
              <Text style={styles.summaryValue}>
                #{formData.number.toString().padStart(3, '0')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stake:</Text>
              <Text style={styles.summaryValue}>Rs. {formData.stake.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Potential Refund:</Text>
              <Text style={styles.summaryValue}>
                Rs. {(formData.stake * (LOTTERY_CONFIG.REFUND_PERCENTAGE / 100)).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.submitButton,
                (!getBettingStatus().text.includes('Open') || isLoading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!getBettingStatus().text.includes('Open') || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={UI.COLORS.CARD} />
              ) : (
                <Text style={styles.submitButtonText}>Place Bet</Text>
              )}
            </TouchableOpacity>
          </View>
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
    padding: UI.SPACING.MD,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: UI.SPACING.LG,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.XS,
  },
  
  subtitle: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  drawStatusCard: {
    backgroundColor: UI.COLORS.CARD,
    borderRadius: UI.BORDER_RADIUS.LG,
    padding: UI.SPACING.LG,
    marginBottom: UI.SPACING.LG,
    borderLeftWidth: 4,
    borderLeftColor: UI.COLORS.PRIMARY,
  },
  
  drawStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SM,
  },
  
  drawTime: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.MD,
  },
  
  bettingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI.SPACING.SM,
  },
  
  bettingStatusLabel: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
    marginRight: UI.SPACING.SM,
  },
  
  bettingStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  cutOffTime: {
    fontSize: 12,
    color: UI.COLORS.WARNING,
    fontStyle: 'italic',
  },
  
  form: {
    marginBottom: UI.SPACING.LG,
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
  
  inputError: {
    borderColor: UI.COLORS.ERROR,
  },
  
  errorText: {
    color: UI.COLORS.ERROR,
    fontSize: 12,
    marginTop: UI.SPACING.XS,
  },
  
  helperText: {
    color: UI.COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: UI.SPACING.XS,
    fontStyle: 'italic',
  },
  
  summaryCard: {
    backgroundColor: UI.COLORS.CARD,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.LG,
    marginBottom: UI.SPACING.LG,
    borderWidth: 1,
    borderColor: UI.COLORS.BACKGROUND,
  },
  
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.MD,
    textAlign: 'center',
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.SM,
  },
  
  summaryLabel: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.COLORS.TEXT,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: UI.SPACING.MD,
  },
  
  actionButton: {
    flex: 1,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    alignItems: 'center',
  },
  
  submitButton: {
    backgroundColor: UI.COLORS.PRIMARY,
  },
  
  cancelButton: {
    backgroundColor: UI.COLORS.CARD,
    borderWidth: 1,
    borderColor: UI.COLORS.TEXT_SECONDARY,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  submitButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  cancelButtonText: {
    color: UI.COLORS.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  noDrawContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING.XL,
  },
  
  noDrawText: {
    fontSize: 18,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.SM,
  },
  
  noDrawSubtext: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: UI.SPACING.LG,
  },
});

export default NewBetForm;
