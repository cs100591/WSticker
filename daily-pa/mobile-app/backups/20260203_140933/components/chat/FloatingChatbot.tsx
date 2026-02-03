
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

        const { recording } = await Audio.Recording.createAsync(recordingOptions);