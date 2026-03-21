import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoLengthDial } from '../src/components/settings/VideoLengthDial';
import { BackgroundSelector } from '../src/components/settings/BackgroundSelector';
import { ToggleTile } from '../src/components/settings/ToggleTile';
import { TextScaleSlider } from '../src/components/settings/TextScaleSlider';
import { getSettings, updateSettings, videoSources } from '@paperflip/core';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    videoLength: 15,
    autoResume: true,
    darkMode: true,
    textScale: 110,
    backgroundUrl: videoSources[0].url
  });

  useEffect(() => {
    getSettings().then(s => setSettings(s)).catch(console.error);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    updateSettings({ [key]: value });
  };

  return (
    <View className="flex-1 bg-brand-bg relative flex-col overflow-hidden">
      {/* Background Gradients */}
      <View className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32" />
      <View className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full -ml-32 -mb-32" />

      <SafeAreaView style={{flex: 1}} edges={['top']}>
        <View className="pt-12 pb-6 px-6 z-10 flex-row justify-between items-end">
          <View>
            <Text className="text-3xl font-extrabold tracking-tight text-white">Settings</Text>
            <Text className="mt-1 text-brand-text-muted font-medium text-sm">
              Configure your experience
            </Text>
          </View>
        </View>

        <ScrollView className="px-6 flex-grow z-10" contentContainerStyle={{ paddingBottom: 100, gap: 24 }}>
          {/* Video Length */}
          <VideoLengthDial
            value={settings.videoLength}
            onChange={(val) => updateSetting('videoLength', val)}
          />

          {/* Background */}
          <BackgroundSelector
            selected={settings.backgroundUrl}
            onChange={(val) => updateSetting('backgroundUrl', val)}
          />

          {/* Toggles Grid */}
          <View className="flex-row space-x-4">
            <ToggleTile
              title="Auto-Resume"
              description="Continue from last point"
              icon="play-circle"
              checked={settings.autoResume}
              onChange={(val) => updateSetting('autoResume', val)}
            />
            <ToggleTile
              title="Dark Mode"
              description="System default"
              icon="dark-mode"
              checked={settings.darkMode}
              onChange={(val) => updateSetting('darkMode', val)}
            />
          </View>

          {/* Text Scale */}
          <TextScaleSlider
            scale={settings.textScale}
            onChange={(val) => updateSetting('textScale', val)}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
