// Subject Study Guide app: the live website inside a Material Design shell.
// Site updates reach the app automatically; only the native parts live here.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Linking, Platform, Share, StyleSheet, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Appbar, BottomNavigation, Button, Icon, PaperProvider, ProgressBar, Snackbar, Text, useTheme,
} from 'react-native-paper';
import { lightTheme, darkTheme } from './theme';
import { BACK, BRIDGE, SITE_URL, TABS, goTo, themeScript } from './bridge';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const dark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <PaperProvider theme={dark ? darkTheme : lightTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Main dark={dark} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function Main({ dark }) {
  const theme = useTheme();
  const web = useRef(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [snack, setSnack] = useState('');
  const view = TABS[index].key;

  // Keep the page's light/dark mode in step with the phone.
  useEffect(() => { web.current?.injectJavaScript(themeScript(dark)); }, [dark]);

  // Hide the bottom bar while typing so it doesn't cover the answer box.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Android back button: close the student menu, then go back to Practice, then leave the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!menuOpen && view === 'practice') return false;
      web.current?.injectJavaScript(BACK);
      return true;
    });
    return () => sub.remove();
  }, [menuOpen, view]);

  const onTabPress = useCallback(({ route }) => {
    Haptics.selectionAsync().catch(() => {});
    setIndex(TABS.findIndex((t) => t.key === route.key));
    web.current?.injectJavaScript(goTo(route.key));
  }, []);

  const onMessage = useCallback(async (e) => {
    let msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    switch (msg.type) {
      case 'ready':
      case 'view': {
        const i = TABS.findIndex((t) => t.key === msg.view);
        if (i >= 0) setIndex(i);
        break;
      }
      case 'menu':
        setMenuOpen(!!msg.open);
        break;
      case 'haptic':
        Haptics.notificationAsync(
          msg.kind === 'good' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
        ).catch(() => {});
        break;
      case 'copy':
        await Clipboard.setStringAsync(msg.code);
        setSnack('Backup code copied');
        break;
      case 'file':
        await shareBackup(msg.name, msg.text);
        break;
    }
  }, []);

  // Links that leave the site open in the phone's browser.
  const onNav = useCallback((req) => {
    const url = req.url || '';
    if (url.startsWith(SITE_URL) || !/^https?:/i.test(url)) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated mode="small" style={{ backgroundColor: theme.colors.surface }}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <Icon source="school" size={22} color={theme.colors.onPrimary} />
        </View>
        <Appbar.Content title="Study Guide" titleStyle={styles.title} />
        <Appbar.Action icon="refresh" accessibilityLabel="Reload" onPress={() => web.current?.reload()} />
      </Appbar.Header>

      <View style={styles.fill}>
        <WebView
          ref={web}
          source={{ uri: SITE_URL }}
          style={{ backgroundColor: theme.colors.background }}
          injectedJavaScriptBeforeContentLoaded={themeScript(dark)}
          injectedJavaScript={BRIDGE}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onNav}
          onLoadStart={() => { setLoading(true); setProgress(0); }}
          onLoadProgress={(e) => setProgress(e.nativeEvent.progress)}
          onLoadEnd={() => { setLoading(false); SplashScreen.hideAsync().catch(() => {}); }}
          renderError={() => <Offline onRetry={() => web.current?.reload()} />}
          domStorageEnabled
          javaScriptEnabled
          setSupportMultipleWindows={false}
          pullToRefreshEnabled
          overScrollMode="never"
          textZoom={100}
          webviewDebuggingEnabled={__DEV__}
        />
        {loading && (
          <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progress} />
        )}
        <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>
          {snack}
        </Snackbar>
      </View>

      {!keyboard && (
        <BottomNavigation.Bar
          navigationState={{ index, routes: TABS }}
          onTabPress={onTabPress}
          style={{ backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outline }}
          activeColor={theme.colors.primary}
          inactiveColor={theme.colors.onSurfaceVariant}
        />
      )}
    </View>
  );
}

// Shown in place of the page when it can't load (no internet, site down).
function Offline({ onRetry }) {
  const theme = useTheme();
  return (
    <View style={[styles.offline, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.offlineIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source="wifi-off" size={40} color={theme.colors.primary} />
      </View>
      <Text variant="titleLarge" style={styles.center}>Can't reach the study guide</Text>
      <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
        Check your internet connection and try again. Your progress is saved on this phone.
      </Text>
      <Button mode="contained" icon="refresh" onPress={onRetry} style={{ marginTop: 8 }}>
        Try again
      </Button>
    </View>
  );
}

// "Save backup file": write it to the app's cache, then open the share sheet
// (Save to Files, Drive, email, etc.). Falls back to sharing the text itself.
async function shareBackup(name, text) {
  try {
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(text);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save backup', UTI: 'public.json' });
      return;
    }
  } catch {}
  await Share.share(Platform.OS === 'ios' ? { message: text } : { message: text, title: name }).catch(() => {});
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  logo: {
    width: 34, height: 34, borderRadius: 10, marginLeft: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontWeight: '700', letterSpacing: 0.2 },
  progress: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  offline: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  offlineIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center' },
});
