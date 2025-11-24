/**
 * AudioManager - управляет аудио потоками и звуковыми эффектами
 */
export class AudioManager {
  constructor() {
    this.ringtoneAudio = null;
    this.dialToneAudio = null;
    this.remoteAudio = null;
    this.soundsEnabled = true;
    
    this.initializeAudioElements();
  }

  /**
   * Инициализирует аудио элементы
   */
  initializeAudioElements() {
    // Создаем audio элемент для удаленного аудио
    this.remoteAudio = document.getElementById('remote-audio');
    if (!this.remoteAudio) {
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.id = 'remote-audio';
      this.remoteAudio.autoplay = true;
      document.body.appendChild(this.remoteAudio);
    }

    // Создаем audio для рингтона (используем Web Audio API для генерации)
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  /**
   * Воспроизводит звук входящего звонка
   */
  playRingtone() {
    if (!this.soundsEnabled) return;

    this.stopRingtone(); // Останавливаем предыдущий если есть

    // Создаем осциллятор для рингтона
    this.ringtoneOscillator = this.audioContext.createOscillator();
    this.ringtoneGain = this.audioContext.createGain();
    
    this.ringtoneOscillator.connect(this.ringtoneGain);
    this.ringtoneGain.connect(this.audioContext.destination);
    
    this.ringtoneOscillator.frequency.value = 440; // A4 note
    this.ringtoneGain.gain.value = 0.3;
    
    this.ringtoneOscillator.start();
    
    // Пульсация звука
    this.ringtoneInterval = setInterval(() => {
      if (this.ringtoneGain) {
        this.ringtoneGain.gain.value = this.ringtoneGain.gain.value > 0 ? 0 : 0.3;
      }
    }, 500);
  }

  /**
   * Останавливает звук входящего звонка
   */
  stopRingtone() {
    if (this.ringtoneOscillator) {
      this.ringtoneOscillator.stop();
      this.ringtoneOscillator = null;
    }
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Воспроизводит звук ожидания
   */
  playDialTone() {
    if (!this.soundsEnabled) return;

    this.stopDialTone();

    this.dialToneOscillator = this.audioContext.createOscillator();
    this.dialToneGain = this.audioContext.createGain();
    
    this.dialToneOscillator.connect(this.dialToneGain);
    this.dialToneGain.connect(this.audioContext.destination);
    
    this.dialToneOscillator.frequency.value = 350;
    this.dialToneGain.gain.value = 0.2;
    
    this.dialToneOscillator.start();
  }

  /**
   * Останавливает звук ожидания
   */
  stopDialTone() {
    if (this.dialToneOscillator) {
      this.dialToneOscillator.stop();
      this.dialToneOscillator = null;
    }
  }

  /**
   * Воспроизводит звук завершения звонка
   */
  playEndCallSound() {
    if (!this.soundsEnabled) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.value = 200;
    gain.gain.value = 0.2;
    
    osc.start();
    setTimeout(() => osc.stop(), 200);
  }

  /**
   * Подключает удаленный аудио поток
   * @param {MediaStream} stream
   */
  attachRemoteAudio(stream) {
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = stream;
    }
  }

  /**
   * Отключает удаленный аудио поток
   */
  detachRemoteAudio() {
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
    }
  }

  /**
   * Включает/выключает звуковые сигналы
   * @param {boolean} enabled
   */
  setSoundsEnabled(enabled) {
    this.soundsEnabled = enabled;
    if (!enabled) {
      this.stopRingtone();
      this.stopDialTone();
    }
  }
}
