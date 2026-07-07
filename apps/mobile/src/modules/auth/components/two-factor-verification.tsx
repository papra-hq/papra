import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthClient } from '@/modules/api/providers/api.provider';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

const TOTP_CODE_LENGTH = 6;

export function TwoFactorVerificationForm({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const themeColors = useThemeColor();
  const authClient = useAuthClient();
  const { showAlert } = useAlert();

  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const styles = createStyles({ themeColors });

  const verifyCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    try {
      const response = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code: codeToVerify, trustDevice })
        : await authClient.twoFactor.verifyTotp({ code: codeToVerify, trustDevice });

      if (response.error) {
        throw new Error(response.error.message);
      }

      onSuccess();
    } catch (error) {
      showAlert({
        title: 'Verification Failed',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    setCode(newCode);

    if (!useBackupCode && newCode.length === TOTP_CODE_LENGTH && !isVerifying) {
      await verifyCode(newCode);
    }
  };

  const switchCodeMode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{useBackupCode ? 'Backup code' : 'Verification code'}</Text>
        <Text style={styles.description}>
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={useBackupCode ? 'Enter a backup code' : '000000'}
          placeholderTextColor={themeColors.mutedForeground}
          value={code}
          onChangeText={handleCodeChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType={useBackupCode ? 'default' : 'number-pad'}
          maxLength={useBackupCode ? undefined : TOTP_CODE_LENGTH}
          textContentType="oneTimeCode"
          editable={!isVerifying}
        />
      </View>

      <View style={styles.trustDeviceRow}>
        <Text style={styles.trustDeviceLabel}>Trust this device</Text>
        <Switch
          value={trustDevice}
          onValueChange={setTrustDevice}
          disabled={isVerifying}
          trackColor={{ true: themeColors.primary }}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isVerifying && styles.buttonDisabled]}
        onPress={async () => verifyCode(code)}
        disabled={isVerifying || code.length === 0}
      >
        {isVerifying ? (
          <ActivityIndicator color={themeColors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={switchCodeMode} disabled={isVerifying}>
        <Text style={styles.linkText}>
          {useBackupCode ? 'Use an authenticator code' : 'Use a backup code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={onBack} disabled={isVerifying}>
        <Text style={styles.linkText}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    formContainer: {
      gap: 16,
    },
    fieldContainer: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    description: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: themeColors.foreground,
      backgroundColor: themeColors.secondaryBackground,
    },
    trustDeviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    trustDeviceLabel: {
      fontSize: 14,
      color: themeColors.foreground,
    },
    button: {
      height: 50,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: themeColors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    linkButton: {
      alignItems: 'center',
    },
    linkText: {
      color: themeColors.primary,
      fontSize: 14,
    },
  });
}
