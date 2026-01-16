
class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  private constructor() {
    this.isMuted = localStorage.getItem('audio_muted') === 'true';
    
    // 基础交互音效
    this.loadSound('tap', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
    this.loadSound('click', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    this.loadSound('pack_select', 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
    this.loadSound('pack_tear', 'https://www.soundjay.com/misc/sounds/tear-paper-1.mp3');
    
    // 皇冠级 (CROWN)
    this.loadSound('crown_reveal', 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    this.loadSound('crown_impact', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    
    // 金色级 (GOLD)
    this.loadSound('gold_reveal', 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    this.loadSound('gold_sparkle', 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3');
    
    // 紫色级 (PURPLE)
    this.loadSound('purple_reveal', 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    
    this.loadSound('meteor', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    this.loadSound('card_slide', 'https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3');

    // --- 战斗技能独立音效 ---
    this.loadSound('attack_weak', 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'); // 轻攻击/抓
    this.loadSound('attack_blunt', 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'); // 钝击/撞击
    this.loadSound('attack_slash', 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'); // 飞踢/斩击
    this.loadSound('attack_fire', 'https://assets.mixkit.co/active_storage/sfx/1269/1269-preview.mp3'); // 爆炸/火
    this.loadSound('attack_beam', 'https://assets.mixkit.co/active_storage/sfx/228/228-preview.mp3'); // 激光/能量
    this.loadSound('attack_thunder', 'https://assets.mixkit.co/active_storage/sfx/1271/1271-preview.mp3'); // 雷电
    this.loadSound('attack_impact', 'https://assets.mixkit.co/active_storage/sfx/2759/2759-preview.mp3'); // 物理重击/地震
    this.loadSound('faint', 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'); // 倒下/失败
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private loadSound(name: string, url: string) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = this.isMuted ? 0 : 0.5;
    this.sounds.set(name, audio);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('audio_muted', muted.toString());
    
    // Update existing sounds volume
    this.sounds.forEach((sound, name) => {
        // We calculate appropriate volume here too to reflect current state
        if (muted) {
            sound.volume = 0;
        } else {
            // Re-apply default volumes
            if (name.includes('crown')) sound.volume = 1.0;
            else if (name.includes('gold')) sound.volume = 0.9; 
            else if (name.includes('attack_beam') || name.includes('attack_fire')) sound.volume = 0.5;
            else if (name.includes('attack_')) sound.volume = 0.4;
            else if (name.includes('purple')) sound.volume = 0.7;
            else sound.volume = 0.3;
        }
    });

    if (this.bgm) {
        this.bgm.volume = muted ? 0 : 0.08;
        if (muted) {
            this.bgm.pause();
        } else if (localStorage.getItem('bgm_playing') === 'true') {
            this.bgm.play().catch(() => {});
        }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public play(name: string) {
    if (this.isMuted) return;
    const sound = this.sounds.get(name);
    if (sound) {
      try {
        sound.currentTime = 0;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch (e) {
        console.warn(`Audio play error: ${name}`, e);
      }
    }
  }

  public startBGM() {
    localStorage.setItem('bgm_playing', 'true');
    if (!this.bgm) {
      this.bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'); 
      this.bgm.loop = true;
    }
    this.bgm.volume = this.isMuted ? 0 : 0.08;
    if (!this.isMuted) {
        this.bgm.play().catch(() => {});
    }
  }

  public stopBGM() {
    localStorage.setItem('bgm_playing', 'false');
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  public fadeBGM(isOut: boolean) {
    if (!this.bgm || this.isMuted) return;
    this.bgm.volume = isOut ? 0.02 : 0.08;
  }
}

export const audioManager = AudioManager.getInstance();
