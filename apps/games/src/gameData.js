/**
 * Dangling Dice Gaming Lab™ — Master Game Profiles, Settings, Configs & Gear Directory
 */

export const GAMES_CATALOG = [
  {
    id: 'warzone',
    title: 'Call of Duty: Warzone & BO6',
    shortName: 'Warzone',
    genre: 'Battle Royale / FPS',
    engine: 'IW 9.0 / CoD Engine',
    badge: '🔥 #1 Popular',
    icon: '🎯',
    bannerGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Calibrated audio curve targeting the 125Hz heel strike and 3.8kHz tile clatter, plus dynamic response curve deadzones.',
    audioProfile: {
      profileName: 'Footstep Clarity & Audio Occlusion Tamer',
      targetMix: 'Headphone Bass Boost',
      description: 'Isolates enemy tactical sprint footsteps while dampening ear-piercing airstrikes and gunshot sibilance.',
      bands: [
        { freq: '32Hz', gain: -3, type: 'Low Cut', label: 'Sub Rumble' },
        { freq: '64Hz', gain: 0, type: 'Flat', label: 'Bass Base' },
        { freq: '125Hz', gain: 6, type: 'Boost', label: 'Footstep Heel Strike' },
        { freq: '250Hz', gain: -4, type: 'Cut', label: 'Explosion Mud' },
        { freq: '500Hz', gain: -2, type: 'Cut', label: 'Engine Drones' },
        { freq: '1kHz', gain: 1, type: 'Flat', label: 'Comms / Chat' },
        { freq: '2kHz', gain: 3, type: 'Boost', label: 'Reload & Rustle' },
        { freq: '3.8kHz', gain: 7, type: 'Peak', label: 'Footstep Tile & Gravel' },
        { freq: '8kHz', gain: -5, type: 'Cut', label: 'Gunshot Ear Piercing' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Air Whistle' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -2.5 dB, Q: 1.0',
        'Band 2 (125 Hz): +6.0 dB, Q: 1.41',
        'Band 3 (280 Hz): -4.0 dB, Q: 1.2',
        'Band 4 (3800 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8500 Hz): -5.0 dB, Q: 1.1',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-2), 64Hz(0), 125Hz(+5), 250Hz(-3), 500Hz(-1), 1k(0), 2k(+2), 4k(+6), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -4; 32 -3; 64 0; 125 6; 250 -4; 500 -2; 1000 1; 2000 3; 3800 7; 8000 -5; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Dynamic Micro-Aim & Hair Trigger Tuning',
      curveType: 'Dynamic (Reverse S-Curve)',
      leftStickDeadzoneMin: '0.03 (3%)',
      rightStickDeadzoneMin: '0.02 (2%)',
      stickDeadzoneMax: '0.99',
      leftTriggerDeadzone: '0.00 (Instant Digital Hair-Trigger)',
      rightTriggerDeadzone: '0.00 (Instant Digital Hair-Trigger)',
      horizontalSens: '6 - 7 (Competitive Standard)',
      verticalSens: '6 - 7 (1.00 ADS Multiplier)',
      aimAssistType: 'Default or Black Ops (Strongest rotational pull)',
      steamConfigCode: 'steam://controllerconfig/1938090/warzone_dynamic_hairtrigger_v2',
      ds4xmlSnippet: `<LeftDeadzone>3</LeftDeadzone><RightDeadzone>2</RightDeadzone><SensitivityCurve>Dynamic</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'options.3.cod24.cst',
      targetPath: 'Documents/Call of Duty/players/options.3.cod24.cst',
      fileContent: `// Dangling Dice Gaming Lab™ — Warzone Max FPS & Input Latency Tweak
RendererWorkerCount: 6 // Match physical CPU cores
VideoMemoryScale: 0.80
NvidiaReflex: "On + Boost"
SpotCache: "Ultra" // Eliminates micro-stutter when firing
ClutterMaxDistance: "Short"
ParticleLighting: "Low"
Tessellation: "Off"
VolumetricQuality: "Low"
DepthOfField: "false"
MotionBlur: "false"`,
      fpsTips: [
        'Set RendererWorkerCount to match your physical CPU core count (not threads).',
        'Enable Spot Cache to Ultra to preload shadow maps into VRAM and eliminate hitching.',
        'Always use Nvidia Reflex On + Boost to lower GPU frame queue latency.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'cs2',
    title: 'Counter-Strike 2',
    shortName: 'CS 2',
    genre: 'Tactical Shooter',
    engine: 'Source 2 Engine',
    badge: '⚡ Esports Classic',
    icon: '💣',
    bannerGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Pin-drop defusal audio curve, pro eDPI sensitivity standards, and ready-to-run autoexec.cfg file.',
    audioProfile: {
      profileName: 'Pin-Drop Audio & Bomb Beep Isolation',
      targetMix: 'Crisp Footsteps & Scope Scuff',
      description: 'Maximizes high-mid frequency response to hear bomb plant/defuse clicks and wood/metal footsteps across the map.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Sub Rumble' },
        { freq: '64Hz', gain: -3, type: 'Cut', label: 'Smoke Cloud' },
        { freq: '125Hz', gain: 2, type: 'Flat', label: 'Footsteps Base' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Grenade Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Natural Voice' },
        { freq: '1kHz', gain: 2, type: 'Boost', label: 'Wood Footsteps' },
        { freq: '2.5kHz', gain: 6, type: 'Peak', label: 'Scope Unzoom & Pin' },
        { freq: '4kHz', gain: 7, type: 'Peak', label: 'Defuse Beep & Metal Steps' },
        { freq: '8kHz', gain: -3, type: 'Cut', label: 'AK-47 Spray Ring' },
        { freq: '16kHz', gain: 0, type: 'Flat', label: 'Spatial Air' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -5.0 dB, Q: 1.0',
        'Band 2 (250 Hz): -3.0 dB, Q: 1.4',
        'Band 3 (1000 Hz): +2.0 dB, Q: 1.0',
        'Band 4 (4000 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8000 Hz): -3.0 dB, Q: 1.0',
      ],
      dolbyValues: 'EQ: 32Hz(-5), 64Hz(-2), 125Hz(+2), 250Hz(-3), 500Hz(0), 1k(+2), 2k(+4), 4k(+7), 8k(-3), 16k(0)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -6; 64 -3; 125 2; 250 -3; 500 0; 1000 2; 2500 6; 4000 7; 8000 -3; 16000 0`,
    },
    controllerProfile: {
      profileName: 'Mouse eDPI & Raw Input Standards',
      curveType: '1:1 Raw Mouse Input (Zero Acceleration)',
      leftStickDeadzoneMin: 'eDPI: 720 - 960 (400 DPI x 2.0 or 800 DPI x 1.0)',
      rightStickDeadzoneMin: 'Polling Rate: 1000Hz - 4000Hz',
      stickDeadzoneMax: 'Windows Sens: 6/11 (Raw Input ON)',
      leftTriggerDeadzone: 'Mouse Acceleration: OFF (m_customaccel 0)',
      rightTriggerDeadzone: 'Zoom Sensitivity: 1.00',
      horizontalSens: 'Pro Consensus: 800 eDPI (ZywOo, s1mple, m0NESY)',
      verticalSens: 'Crosshair: Small Green Gap Static',
      aimAssistType: 'N/A (Pure Raw Physics)',
      steamConfigCode: '',
      ds4xmlSnippet: '',
    },
    configProfile: {
      fileName: 'autoexec.cfg',
      targetPath: 'game/csgo/cfg/autoexec.cfg',
      fileContent: `// Dangling Dice Gaming Lab™ — CS2 Competitive Autoexec
fps_max "400"
rate "786432"
cl_interp "0"
cl_interp_ratio "1"

// Fast Q Knife Quickswitch
alias +knife "slot3"
alias -knife "lastinv"
bind "q" "+knife"

// Jump Throw Bind
alias "+jumpaction" "+jump;"
alias "+throwaction" "-attack; -attack2"
alias "-jumpaction" "-jump"
bind "space" "+jumpaction; +throwaction;"

// Audio Tweaks
volume "0.7"
snd_voipvolume "0.5"
snd_headphone_eq "1"

echo "Dangling Dice CS2 Autoexec Loaded Successfully!"`,
      fpsTips: [
        'Place this file in: steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg/',
        'Add +exec autoexec.cfg to your CS2 Steam launch options.',
      ],
    },
    recommendedGear: ['iem-waner', 'kb-wooting', 'mouse-viper-v3'],
  },
  {
    id: 'apex',
    title: 'Apex Legends',
    shortName: 'Apex',
    genre: 'Battle Royale / Movement',
    engine: 'Modified Source',
    badge: '⚡ High Movement',
    icon: '⚡',
    bannerGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Enemy occlusion footstep enhancer, Linear response curve with zero stick drift, and stutter-free video config.',
    audioProfile: {
      profileName: 'Enemy Occlusion & Jetpack Dampener',
      targetMix: 'Studio Headphone',
      description: 'Cuts through intense vertical air drops and loud gun battles to highlight enemy sliding and zipline audio cues.',
      bands: [
        { freq: '32Hz', gain: -4, type: 'Cut', label: 'Drop Ship Rumble' },
        { freq: '64Hz', gain: 1, type: 'Flat', label: 'Bass Anchor' },
        { freq: '125Hz', gain: 5, type: 'Boost', label: 'Heel Sprint & Slide' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Gibby/Bangalore Ult Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Voice Intel' },
        { freq: '1kHz', gain: 2, type: 'Boost', label: 'Zipline Hum' },
        { freq: '2.5kHz', gain: 4, type: 'Boost', label: 'Shield Crack Chime' },
        { freq: '4kHz', gain: 6, type: 'Peak', label: 'Flesh Hit & Foot Clatter' },
        { freq: '8kHz', gain: -4, type: 'Cut', label: 'R-99 Muzzle Hiss' },
        { freq: '16kHz', gain: -1, type: 'Cut', label: 'Wind Rush' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -4.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +5.0 dB, Q: 1.4',
        'Band 3 (4000 Hz): +6.0 dB, Q: 1.5',
        'Band 4 (8000 Hz): -4.0 dB, Q: 1.2',
      ],
      dolbyValues: 'EQ: 32Hz(-4), 64Hz(+1), 125Hz(+5), 250Hz(-3), 500Hz(0), 1k(+2), 2k(+3), 4k(+6), 8k(-4), 16k(-1)',
      peaceConfig: `GraphicEQ: 20 -4; 32 -4; 64 1; 125 5; 250 -3; 500 0; 1000 2; 2500 4; 4000 6; 8000 -4; 16000 -1`,
    },
    controllerProfile: {
      profileName: 'Linear 4-3 Classic / ALC Precision Tuning',
      curveType: 'Linear (0 Response Curve) or 4-3 Classic',
      leftStickDeadzoneMin: 'None / Small (0% - 2%)',
      rightStickDeadzoneMin: 'Small (2% - 3%)',
      stickDeadzoneMax: 'Look Deadzone: Small',
      leftTriggerDeadzone: '0.00 Digital Instant',
      rightTriggerDeadzone: '0.00 Digital Instant',
      horizontalSens: '4 (Look Sens)',
      verticalSens: '3 (ADS Sens)',
      aimAssistType: 'Target Compensation: ON',
      steamConfigCode: 'steam://controllerconfig/1172470/apex_linear_43_deadzone_v1',
      ds4xmlSnippet: `<LeftDeadzone>2</LeftDeadzone><RightDeadzone>2</RightDeadzone><Curve>Linear</Curve>`,
    },
    configProfile: {
      fileName: 'videoconfig.txt',
      targetPath: 'Saved Games/Respawn/Apex/local/videoconfig.txt',
      fileContent: `"VideoConfig"
{
  "setting.cl_ragdoll_maxcount" "0"
  "setting.r_lod_switch_scale" "0.60"
  "setting.shadow_enable" "0"
  "setting.shadow_depth_dimen_min" "0"
  "setting.modeldecals_forceDropping" "1"
  "setting.volumetric_lighting" "0"
  "setting.dvs_enable" "0"
  "setting.mat_picmip" "2"
}`,
      fpsTips: [
        'Setting shadow_enable to 0 removes heavy dynamic shadows for a massive +25% FPS boost.',
        'Lock file to Read-Only so Apex does not overwrite it upon reboot.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-dualsense-edge', 'grip-kontrolfreek'],
  },
  {
    id: 'valorant',
    title: 'Valorant',
    shortName: 'Valorant',
    genre: 'Tactical Hero Shooter',
    engine: 'Unreal Engine 4',
    badge: '🏹 Riot Tactical',
    icon: '🏹',
    bannerGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Directional footstep clarity, spike defuse ping separation, and verified pro player crosshair codes.',
    audioProfile: {
      profileName: 'Spike Defusal & Directional Audio Isolation',
      targetMix: 'Stereo Uncompressed',
      description: 'Enhances directional sound cues so you can immediately pinpoint footsteps behind walls on Haven and Ascent.',
      bands: [
        { freq: '32Hz', gain: -5, type: 'Cut', label: 'Brimstone Ult Mud' },
        { freq: '64Hz', gain: 0, type: 'Flat', label: 'Anchor' },
        { freq: '125Hz', gain: 3, type: 'Boost', label: 'Footstep Thump' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Smoke Ambience' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'Agent Voicelines' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Leather Footsteps' },
        { freq: '2.5kHz', gain: 5, type: 'Peak', label: 'Ability Cast Sizzle' },
        { freq: '4kHz', gain: 6, type: 'Peak', label: 'Spike Beep & Metal Steps' },
        { freq: '8kHz', gain: -3, type: 'Cut', label: 'Vandal Spray Harshness' },
        { freq: '16kHz', gain: 0, type: 'Flat', label: 'Air' },
      ],
      sonarValues: [
        'Band 1 (125 Hz): +3.0 dB, Q: 1.2',
        'Band 2 (1000 Hz): +3.0 dB, Q: 1.0',
        'Band 3 (4000 Hz): +6.0 dB, Q: 1.5',
        'Band 4 (8000 Hz): -3.0 dB, Q: 1.1',
      ],
      dolbyValues: 'EQ: 32Hz(-5), 64Hz(0), 125Hz(+3), 250Hz(-3), 500Hz(+1), 1k(+3), 2k(+4), 4k(+6), 8k(-3), 16k(0)',
      peaceConfig: `GraphicEQ: 20 -5; 32 -5; 64 0; 125 3; 250 -3; 500 1; 1000 3; 2500 5; 4000 6; 8000 -3; 16000 0`,
    },
    controllerProfile: {
      profileName: 'Pro eDPI & Raw Input Buffer',
      curveType: 'Raw Input Buffer: ON',
      leftStickDeadzoneMin: 'eDPI: 200 - 320 (800 DPI x 0.25 - 0.35)',
      rightStickDeadzoneMin: 'Polling Rate: 1000Hz - 8000Hz supported',
      stickDeadzoneMax: 'Enemy Outline: Yellow (Deuteranopia)',
      leftTriggerDeadzone: 'Raw Input Buffer: ON (Reduces input latency)',
      rightTriggerDeadzone: 'Sensitivity: 0.314 @ 800 DPI',
      horizontalSens: 'TenZ eDPI: 246 (800 x 0.308)',
      verticalSens: 'Boaster eDPI: 200 (800 x 0.250)',
      aimAssistType: 'N/A (Competitive PC)',
      steamConfigCode: '',
      ds4xmlSnippet: '',
    },
    configProfile: {
      fileName: 'pro-crosshair-codes.txt',
      targetPath: 'In-Game: Settings > Crosshair > Import Profile Code',
      fileContent: `// Sentinels TenZ Crosshair
0;s;1;P;c;5;h;0;m;1;0t;1;0l;3;0v;2;0o;2;0a;1;1b;0

// Fnatic Boaster Crosshair (Green Dot)
0;s;1;P;c;1;o;1;d;1;0b;0;1b;0

// Paper Rex f0rsakeN Crosshair
0;s;1;P;o;1;0t;1;0l;1;0o;1;0a;1;0f;0;1b;0`,
      fpsTips: [
        'Always turn ON "Raw Input Buffer" in General settings to skip Windows mouse polling queue.',
        'Set Enemy Highlight Color to "Yellow (Deuteranopia)" — proven to have the fastest human reaction time.',
      ],
    },
    recommendedGear: ['iem-waner', 'kb-wooting', 'mouse-viper-v3'],
  },
  {
    id: 'rocket-league',
    title: 'Rocket League',
    shortName: 'Rocket League',
    genre: 'Physics / Sports',
    engine: 'Unreal Engine 3',
    badge: '🏎️ Precision Physics',
    icon: '🏎️',
    bannerGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Square deadzone curve, aerial sensitivity multipliers, and max-FPS low latency video settings.',
    audioProfile: {
      profileName: 'Engine Pitch & Boost Sound Isolation',
      targetMix: 'Balanced Dynamic',
      description: 'Helps players track enemy boost audio queues and car flips when out of camera sight.',
      bands: [
        { freq: '32Hz', gain: -2, type: 'Flat', label: 'Sub' },
        { freq: '64Hz', gain: 2, type: 'Boost', label: 'Engine Purr' },
        { freq: '125Hz', gain: 0, type: 'Flat', label: 'Impact' },
        { freq: '250Hz', gain: -2, type: 'Cut', label: 'Crowd Cheering Mud' },
        { freq: '500Hz', gain: 2, type: 'Boost', label: 'Ball Bounce Thud' },
        { freq: '1kHz', gain: 0, type: 'Flat', label: 'Ambiance' },
        { freq: '2.5kHz', gain: 4, type: 'Peak', label: 'Boost Hiss Pickup' },
        { freq: '4kHz', gain: 3, type: 'Boost', label: 'Demolition Crack' },
        { freq: '8kHz', gain: -2, type: 'Cut', label: 'Stadium Speaker Ring' },
        { freq: '16kHz', gain: 0, type: 'Flat', label: 'High Air' },
      ],
      sonarValues: [
        'Band 1 (64 Hz): +2.0 dB, Q: 1.0',
        'Band 2 (500 Hz): +2.0 dB, Q: 1.2',
        'Band 3 (2500 Hz): +4.0 dB, Q: 1.5',
      ],
      dolbyValues: 'EQ: 32Hz(-2), 64Hz(+2), 125Hz(0), 250Hz(-2), 500Hz(+2), 1k(0), 2k(+2), 4k(+3), 8k(-2), 16k(0)',
      peaceConfig: `GraphicEQ: 20 -2; 32 -2; 64 2; 125 0; 250 -2; 500 2; 1000 0; 2500 4; 4000 3; 8000 -2; 16000 0`,
    },
    controllerProfile: {
      profileName: 'Zen / Vatira Pro Controller Deadzones',
      curveType: 'Cross / Square Deadzone Profile',
      leftStickDeadzoneMin: 'Controller Deadzone: 0.05 (5%)',
      rightStickDeadzoneMin: 'Dodge Deadzone: 0.65 - 0.70 (Prevents backflip accidents)',
      stickDeadzoneMax: 'Steering Sensitivity: 1.40',
      leftTriggerDeadzone: 'Aerial Sensitivity: 1.40',
      rightTriggerDeadzone: 'Camera Shake: OFF',
      horizontalSens: 'FOV: 110 (Max)',
      verticalSens: 'Distance: 270 | Height: 100 | Angle: -4.0',
      aimAssistType: 'N/A',
      steamConfigCode: 'steam://controllerconfig/252950/rocketleague_squaredeadzone_pro',
      ds4xmlSnippet: `<SquareStick>true</SquareStick><Deadzone>5</Deadzone>`,
    },
    configProfile: {
      fileName: 'TASystemSettings.ini',
      targetPath: 'Documents/My Games/Rocket League/TAGame/Config/TASystemSettings.ini',
      fileContent: `// Rocket League Pro Low-Latency Physics
DynamicShadows=False
Bloom=False
MotionBlur=False
AmbientOcclusion=False
DepthOfField=False
MaxFPS=240
OneFrameThreadLag=False`,
      fpsTips: [
        'Turn OneFrameThreadLag to False to reduce input buffer delay on fast air dribbles.',
        'Disable Bloom and Ambient Occlusion so ball position against the ceiling is crystal clear.',
      ],
    },
    recommendedGear: ['ctrl-vader-4', 'iem-waner', 'grip-kontrolfreek'],
  },
  {
    id: 'arc-raiders',
    title: 'ARC Raiders',
    shortName: 'ARC Raiders',
    genre: 'PvPvE Extraction Shooter',
    engine: 'Unreal Engine 5 (Lumen & Chaos)',
    badge: '🤖 Hyped • Embark Studios',
    icon: '🤖',
    bannerGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Acoustic profile isolating ARC machine servo whines, robot drone scans, and player footsteps, paired with Unreal Engine 5 max-FPS config.',
    audioProfile: {
      profileName: 'ARC Servo Whine & Extraction Audio Isolation',
      targetMix: 'Studio Monitor / Balanced Flat',
      description: 'Sub-bass cut dampens orbital drops and drop-pod booms, while boosted 125Hz and 3.5kHz isolate enemy player boots on metal structures and mechanical ARC drone hover frequencies.',
      bands: [
        { freq: '32Hz', gain: -5, type: 'Cut', label: 'Drop Pod Sub-Bass' },
        { freq: '64Hz', gain: -2, type: 'Cut', label: 'Explosion Reverb' },
        { freq: '125Hz', gain: 4, type: 'Boost', label: 'Heavy Boots on Metal' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Engine Drone Hum' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'Team Comms' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Foliage & Scrap Scuff' },
        { freq: '2.5kHz', gain: 5, type: 'Peak', label: 'Zip-line & Ladder Hooks' },
        { freq: '3.5kHz', gain: 7, type: 'Peak', label: 'ARC Drone Servo Scan' },
        { freq: '7.5kHz', gain: -4, type: 'Cut', label: 'Laser Sibilance Tamer' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'High Air Whistle' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -3.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +4.5 dB, Q: 1.41',
        'Band 3 (250 Hz): -3.0 dB, Q: 1.2',
        'Band 4 (3500 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (7500 Hz): -4.0 dB, Q: 1.2',
      ],
      dolbyValues: 'Surround: OFF | Leveler: OFF | EQ: 32Hz(-5), 64Hz(-2), 125Hz(+4), 250Hz(-3), 500Hz(+1), 1k(+3), 2.5k(+5), 3.5k(+7), 7.5k(-4), 16k(-3)',
      peaceConfig: `GraphicEQ: 20 -5; 32 -5; 64 -2; 125 4; 250 -3; 500 1; 1000 3; 2500 5; 3500 7; 7500 -4; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'UE5 Smooth-Linear Tracking & Snap Response',
      curveType: 'Linear with Anti-Deadzone Compensation',
      leftStickDeadzoneMin: '0.04 (4% Inner)',
      rightStickDeadzoneMin: '0.02 (2% Micro-Aim for Weakspots)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Instant ADS Hair-Trigger)',
      rightTriggerDeadzone: '0.00 (Instant Fire Hair-Trigger)',
      horizontalSens: '5.5 (Fast Tracking for Aerial Drones)',
      verticalSens: '5.0 (High Vertical Recoil Stability)',
      aimAssistType: 'Standard Rotational (Target Weakpoint Pull)',
      steamConfigCode: 'steam://controllerconfig/1808500/arc_raiders_linear_precision_v1',
      ds4xmlSnippet: `<LeftDeadzone>4</LeftDeadzone><RightDeadzone>2</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve><AntiDeadzone>3</AntiDeadzone>`,
    },
    configProfile: {
      fileName: 'GameUserSettings.ini',
      targetPath: '%LOCALAPPDATA%/ArcRaiders/Saved/Config/WindowsClient/GameUserSettings.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — ARC Raiders UE5 Max FPS & Low Latency Config
[ScalabilityGroups]
sg.ResolutionQuality=100.000000
sg.ViewDistanceQuality=3
sg.AntiAliasingQuality=2 // TSR / DLSS Quality
sg.ShadowQuality=1 // Drastic FPS gain while keeping cast shadows
sg.GlobalIlluminationQuality=1 // Disable heavy software Lumen bounce
sg.ReflectionQuality=1
sg.PostProcessQuality=1
sg.TextureQuality=3
sg.EffectsQuality=1
sg.FoliageQuality=1 // Strips non-essential grass clutter to spot prone enemies
sg.ShadingQuality=1

[/Script/ArcRaiders.ArcRaidersSettings]
bEnableMotionBlur=False
bEnableCameraShake=False
bEnableChromaticAberration=False
bEnableNvidiaReflex=True
bNvidiaReflexBoost=True
FieldOfView=105.000000`,
      fpsTips: [
        'Set sg.ShadowQuality=1 and sg.GlobalIlluminationQuality=1 to dramatically improve framerates on Unreal Engine 5 while retaining player drop shadows.',
        'Drop sg.FoliageQuality=1 to strip distracting decorative vegetation and easily spot crawling raiders.',
        'Enable Nvidia Reflex to On + Boost to bypass CPU-bound UE5 drawcall queue latency.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
];

export const ACCESSORIES_CATALOG = [
  {
    id: 'iem-truthear-zero',
    title: 'Truthear x Crinacle Zero:RED (Dual Dynamic Driver)',
    category: 'audio',
    categoryLabel: '🎧 In-Ear Monitors (IEMs)',
    tag: '🎯 Studio Tested • Footstep Separation King',
    price: '$54.99',
    rating: '4.9 ★',
    desc: 'The undisputed competitive gaming IEM. Dual-driver separation isolates footsteps and gunshots without piercing treble spikes. Zero soundstage compression.',
    specs: 'Dual Dynamic Drivers (10mm + 7.8mm) • 0.78mm 2-Pin Detachable • Includes 10Ω Bass Impedance Adapter',
    link: '/go/gear-truthear-red',
    icon: '🎧',
  },
  {
    id: 'iem-waner',
    title: 'Tangzu Wan’er S.G Studio Gaming IEM',
    category: 'audio',
    categoryLabel: '🎧 In-Ear Monitors (IEMs)',
    tag: '💰 Budget King • Sub-$25 Champion',
    price: '$19.99',
    rating: '4.8 ★',
    desc: 'Incredible acoustic performance under $25. Lightweight PET diaphragm delivers pinpoint horizontal imaging for footsteps in CS2 and Valorant.',
    specs: '10mm Dynamic Driver • Ergonomic Lightweight Shell • Microphone Cable Included',
    link: '/go/gear-tangzu-waner',
    icon: '🎧',
  },
  {
    id: 'ctrl-vader-4',
    title: 'Flydigi Vader 4 Pro (Adjustable Stick Tension & Hall Effect)',
    category: 'controllers',
    categoryLabel: '🎮 Pro Controllers',
    tag: '🕹️ Anti-Drift • 1000Hz Polling',
    price: '$79.99',
    rating: '4.9 ★',
    desc: 'Equipped with physical thumbstick tension adjustment rings and Hall-Effect magnetic sensors that never develop stick drift. 4 remappable back paddles and micro-switch clicky triggers.',
    specs: 'Mechanical Microswitch Face Buttons • 1000Hz Wireless Dongle • 4 Rear Paddles • Gyroscope & PC Software',
    link: '/go/gear-vader-4-pro',
    icon: '🎮',
  },
  {
    id: 'ctrl-dualsense-edge',
    title: 'PlayStation DualSense Edge Wireless Controller',
    category: 'controllers',
    categoryLabel: '🎮 Pro Controllers',
    tag: '⚡ Official Pro • Swappable Sticks',
    price: '$199.99',
    rating: '4.7 ★',
    desc: 'Replaceable stick modules, adjustable trigger travel stops, and swappable back paddle buttons for peak competitive console & PC play.',
    specs: 'Swappable Stick Modules • 3-Way Trigger Stop Locks • Custom Button Remapping • Braided Locking USB Cable',
    link: '/go/gear-dualsense-edge',
    icon: '🎮',
  },
  {
    id: 'grip-kontrolfreek',
    title: 'KontrolFreek FPS Freek Galaxy Thumbstick Risers',
    category: 'controllers',
    categoryLabel: '🎮 Grips & Mod Kits',
    tag: '🎯 Aim Precision • Micro-Adjustments',
    price: '$16.99',
    rating: '4.8 ★',
    desc: 'High-rise right stick gives +120% range of motion for laser-precise long-range tracking in Warzone and Apex. Mid-rise left stick provides tactile sprint grip.',
    specs: 'Compatible with Xbox & PlayStation Sticks • Proprietary Rubber Compound • Laser-Etched Galaxy Grip',
    link: '/go/gear-kontrolfreek-galaxy',
    icon: '🕹️',
  },
  {
    id: 'kb-wooting',
    title: 'Wooting 60HE+ / DrunkDeer A75 Rapid-Trigger Keyboard',
    category: 'keyboards',
    categoryLabel: '⌨️ Rapid-Trigger Keyboards',
    tag: '⚡ 0.1mm Rapid Trigger • CS2 Counter-Strafe',
    price: '$129.99',
    rating: '4.9 ★',
    desc: 'Magnetic Hall-Effect analog switches allow instant counter-strafing by deactivating the key the microsecond your finger lifts. Eliminates mechanical debounce lag.',
    specs: '0.1mm to 4.0mm Adjustable Actuation • Continuous Rapid Trigger • PBT Keycaps • Zero Debounce Delay',
    link: '/go/gear-rapid-trigger-kb',
    icon: '⌨️',
  },
  {
    id: 'mouse-viper-v3',
    title: 'Razer Viper V3 Pro Ultra-Lightweight 8000Hz Gaming Mouse',
    category: 'mice',
    categoryLabel: '🖱️ Precision Mice & Pads',
    tag: '🏆 Esports Pro Standard • 54 Grams',
    price: '$159.99',
    rating: '4.9 ★',
    desc: 'Symmetrical esports shape weighing just 54 grams. True 8,000Hz polling rate and Focus Pro 35K Gen-2 optical sensor for zero tracking skips.',
    specs: '54g Ultra-Lightweight • 8000Hz Wireless HyperPolling • Gen-3 Optical Switches (90M Clicks) • 95 Hr Battery',
    link: '/go/gear-viper-v3-pro',
    icon: '🖱️',
  },
];

export const SOFTWARE_GUIDE = [
  {
    id: 'equalizer-apo',
    name: 'Equalizer APO',
    category: 'Audio Core DSP Engine',
    price: '100% Free & Open Source',
    license: 'GPLv2',
    icon: '🎚️',
    badge: '⚡ Required Core Engine',
    downloadUrl: 'https://sourceforge.net/projects/equalizerapo/',
    officialSite: 'https://equalizerapo.com/',
    version: 'v1.3.2+ (64-bit Windows)',
    description: 'A system-wide 32-bit floating-point parametric audio equalizer that integrates directly into Windows audio pipeline with 0ms latency and negligible CPU usage.',
    whyNeedIt: 'Windows default audio drivers do not allow precise parametric frequency boosts. Equalizer APO hooks into your playback device so footstep frequency spikes work in all games, Discord, and media.',
    steps: [
      'Download and run the official Equalizer APO 64-bit installer.',
      'During installation, the <strong>Configurator</strong> dialog will appear. Go to the <strong>Playback devices</strong> tab.',
      'Check the checkbox next to your active primary audio device (e.g. <em>Headphones</em>, <em>Realtek Audio</em>, or your USB DAC). Do NOT select non-active devices.',
      'Click <strong>OK</strong> and allow the installer to complete.',
      '<strong>Crucial Step:</strong> Reboot your PC. The Windows audio filter driver hook requires a restart to activate.',
    ],
    troubleshooting: [
      'If audio stops working or no changes occur after reboot: open <code>C:\\Program Files\\EqualizerAPO\\Configurator.exe</code>, select your device, click <strong>Troubleshooting options</strong>, switch install mode to <strong>Install as LFX/GFX</strong> or <strong>SFX/EFX</strong>, and click OK.',
      'Make sure Windows Audio Enhancements / Spatial sound is not conflicting.',
    ],
  },
  {
    id: 'peace-gui',
    name: 'Peace Equalizer (GUI for Equalizer APO)',
    category: 'Graphical EQ & Preset Manager',
    price: '100% Free & Open Source',
    license: 'Freeware / Open Source',
    icon: '🎨',
    badge: '🔥 Essential GUI Overlay',
    downloadUrl: 'https://sourceforge.net/projects/peace-equalizer-apo-extension/',
    officialSite: 'https://sourceforge.net/projects/peace-equalizer-apo-extension/',
    version: 'v1.6.6+ (Windows 10/11)',
    description: 'The graphical interface and preset loader for Equalizer APO. Adds 10 to 31 parametric sliders, dynamic visual meters, hotkeys, and 1-click import for our downloadable .peace config files.',
    whyNeedIt: 'Equalizer APO alone only edits a text file (`config.txt`). Peace gives you a clean visual dashboard, real-time gain sliders, and allows 1-click loading of any game profile downloaded from this hub.',
    steps: [
      'Make sure Equalizer APO is installed first and your PC has been rebooted.',
      'Download and run <strong>PeaceSetup.exe</strong> from SourceForge.',
      'Click <strong>Install</strong>. When prompted, select <strong>"Start with Peace"</strong> (choose the standard or full interface).',
      '<strong>How to load our game presets:</strong> Download any <code>.peace</code> file on this site (e.g. Warzone, ARC Raiders, CS2). In Peace GUI, click the <strong>Import</strong> button at the bottom right, select the downloaded file, and click <strong>Done</strong>.',
      'The 10 frequency bands will immediately populate. Click <strong>Save</strong> to save it in your Peace preset tray.',
    ],
    troubleshooting: [
      'Verify the top-left ON/OFF switch in Peace is set to green (ON).',
      'Test the Pre-amplifying slider: dragging it down should noticeably lower overall volume immediately. If not, follow Equalizer APO troubleshooting.',
    ],
  },
  {
    id: 'steelseries-sonar',
    name: 'SteelSeries Sonar Audio Suite',
    category: 'All-in-One Headset Audio Suite',
    price: '100% Free Software',
    license: 'Freeware',
    icon: '🎧',
    badge: '✨ Best Plug & Play Alternative',
    downloadUrl: 'https://steelseries.com/gg/sonar',
    officialSite: 'https://steelseries.com/gg/sonar',
    version: 'Latest SteelSeries GG',
    description: 'An all-in-one virtual audio mixer with parametric EQ, directional spatial audio, and AI noise suppression that works on any headset brand (not just SteelSeries).',
    whyNeedIt: 'If you use a USB gaming headset and prefer not to modify Windows system driver hooks with Equalizer APO, Sonar gives you a clean parametric equalizer with Q-factor control.',
    steps: [
      'Download and install <strong>SteelSeries GG</strong> from the official website.',
      'Open SteelSeries GG and navigate to the <strong>Sonar</strong> tab in the left sidebar.',
      'In Sonar Settings, map your <strong>Game</strong> and <strong>Chat</strong> output channels to your headphones.',
      'Click the <strong>Game</strong> channel tab and locate the <strong>Parametric EQ</strong> module.',
      'Click the <strong>Copy Sonar Values</strong> button on any game on this page, then input the frequency (Hz), gain (dB), and Q values into Sonar.',
      'Set Windows default playback device to <code>SteelSeries Sonar - Gaming</code>.',
    ],
    troubleshooting: [
      'If you hear echo or delay, disable Windows Sonic or Dolby Atmos in Windows Sound Settings, as Sonar handles spatial virtualisation natively.',
    ],
  },
  {
    id: 'ds4windows',
    name: 'DS4Windows & Steam Input',
    category: 'Controller Overclocking & Deadzones',
    price: '100% Free & Open Source',
    license: 'GPLv3',
    icon: '🎮',
    badge: '🎯 Pro Controller Calibration',
    downloadUrl: 'https://github.com/Ryochan7/DS4Windows/releases',
    officialSite: 'https://ds4-windows.com/',
    version: 'v3.3.3+ (x64)',
    description: 'Virtual controller driver that remaps DualSense, PS4, Switch Pro, and Xbox pads into virtual 360/DS4 controllers with dynamic curves, 1000Hz polling rate, and custom deadzones.',
    whyNeedIt: 'Enables true dynamic S-curves, eliminates stick drift via sub-millimeter inner deadzones, and removes input latency down to 1 millisecond on PC.',
    steps: [
      'Download <code>DS4Windows_x64.zip</code> from GitHub and extract it to a dedicated folder.',
      'Run <code>DS4Windows.exe</code>. If prompted, complete the 1-click ViGEmBus virtual bus driver installation.',
      'Connect your controller via USB-C or Bluetooth.',
      'Under the <strong>Profiles</strong> tab, click <strong>New</strong>, choose <strong>Game Controller</strong>, and name your profile.',
      'Navigate to <strong>LS (Left Stick)</strong> and <strong>RS (Right Stick)</strong>: set Dead Zone (e.g. 0.02 - 0.04) and set Output Curve to <strong>Dynamic</strong> or <strong>Linear</strong> as indicated in our game guides.',
      'Apply and minimize to system tray.',
    ],
    troubleshooting: [
      'For Steam games, you can also paste our <code>steam://controllerconfig/...</code> URL straight into your browser to import into Steam Input without third-party drivers.',
    ],
  },
];

export const AUDIO_SETUPS = [
  {
    id: 'analog-35mm',
    title: '3.5mm Analog (Motherboard or Front Case Jack)',
    shortTitle: '3.5mm Analog & IEMs',
    category: 'Analog Jack',
    icon: '🎧',
    badge: '✅ 100% Native Compatibility',
    examples: 'In-Ear Monitors (Truthear Zero:RED, Tangzu Wan’er), HyperX Cloud II (3.5mm), Audio-Technica, Sennheiser plugged into green 3.5mm jack',
    windowsDeviceName: 'Speakers (Realtek(R) Audio) or High Definition Audio Device',
    configuratorCheck: 'Check "Speakers" or "Headphones" under your Realtek Audio controller in the Playback devices tab.',
    installMode: 'Default (Install as LFX/GFX on Win 10, or SFX/EFX on Win 11)',
    softwareRecommendation: 'Equalizer APO + Peace GUI (Best & lowest latency)',
    steps: [
      'Install Equalizer APO -> In Configurator, check your <strong>Realtek Audio / Speakers</strong> device.',
      'Reboot your PC to initialize the Windows kernel filter driver.',
      'Install Peace GUI -> Select <strong>"Start with Peace"</strong>.',
      'Download your game’s <code>.peace</code> file (or <code>.txt</code>) from this page and import it into Peace GUI.',
    ],
    windowsSettings: [
      'Open Windows Sound Settings (<code>mmsys.cpl</code>) -> Right-click Speakers -> Properties.',
      'Go to the <strong>Advanced</strong> tab: Set Default Format to <strong>24-bit, 48000 Hz (Studio Quality)</strong>.',
      'Go to the <strong>Spatial Sound</strong> tab: Turn Spatial sound <strong>OFF</strong> (Equalizer APO provides clean stereo pin-drop imaging without artificial reverb).',
      'Go to the <strong>Enhancements</strong> tab: Check <em>"Disable all sound effects"</em> if using Equalizer APO (prevents Realtek equalizer double-filtering).',
    ],
    pitfalls: 'If you plug into the PC case front panel jack and hear buzzing or electrical coil whine when your GPU is under load, plug directly into the green 3.5mm jack on the back of your motherboard instead.',
  },
  {
    id: 'usb-dac',
    title: 'Dedicated USB DAC / Amp / Audio Interface',
    shortTitle: 'USB DAC / Amp / Audio Interface',
    category: 'External USB DAC / Interface',
    icon: '🎛️',
    badge: '🏆 Audiophile Studio Grade',
    examples: 'Focusrite Scarlett, Schiit Hel / Magni, FiiO K-Series / KA13, Apple USB-C to 3.5mm Dongle, Sound BlasterX G6, EPOS GSX',
    windowsDeviceName: 'Your exact DAC name (e.g. "Focusrite USB Audio", "FiiO Q-Series", "USB Audio DAC", or "Speakers (Realtek USB2.0 Audio)")',
    configuratorCheck: 'Check ONLY the specific name of your USB DAC. Do NOT check onboard Realtek audio.',
    installMode: 'Install as LFX/GFX (for older USB interfaces) or SFX/EFX (for modern USB Audio Class 2.0 DACs)',
    softwareRecommendation: 'Equalizer APO + Peace GUI',
    steps: [
      'Ensure DAC firmware/manufacturer drivers are installed and the DAC is plugged into a motherboard USB 3.0/USB-C port.',
      'Open Equalizer APO Configurator -> Check ONLY your DAC’s name under Playback devices.',
      'Reboot your PC.',
      'Open Peace GUI -> Ensure the <strong>Preamp slider</strong> is set to <strong>-3.0 dB</strong> to avoid overloading high-power DAC amplifiers during explosions.',
    ],
    windowsSettings: [
      'Open Windows Sound Panel (<code>mmsys.cpl</code>) -> Right-click your DAC -> Properties.',
      'Under the <strong>Advanced</strong> tab: Choose <strong>24-bit, 48000 Hz</strong> or <strong>32-bit, 48000 Hz</strong>.',
      'In the <strong>Advanced</strong> tab: Check <em>"Allow applications to take exclusive control of this device"</em> but UNCHECK <em>"Give exclusive mode applications priority"</em> so game audio and Discord mix smoothly.',
      'Turn off any manufacturer "Surround 7.1" or "Scout Mode" DSP switches on the hardware itself.',
    ],
    pitfalls: 'High-end external amplifiers provide significant gain. Boosting 125Hz or 3.5kHz by +7dB without setting <code>Preamp: -3.0 dB</code> can cause digital clipping or DAC protection shutdown during loud artillery fire.',
  },
  {
    id: 'usb-proprietary',
    title: 'USB Gaming Headset with Brand Software (Logitech, Razer, Corsair)',
    shortTitle: 'USB Headset + Software (Logitech/Razer/Corsair)',
    category: 'Proprietary USB Headset',
    icon: '⚡',
    badge: '⚠️ Requires LFX/GFX Driver Switch',
    examples: 'Logitech G Pro X / G733 (G HUB), Razer BlackShark V2 / Kraken (Synapse / THX), Corsair Virtuoso / Void (iCUE)',
    windowsDeviceName: '"Logitech PRO X Gaming Headset", "Razer Audio Controller", or "Corsair USB Gaming Headset"',
    configuratorCheck: 'Check your headset’s specific USB endpoint in Equalizer APO Configurator.',
    installMode: 'REQUIRED: Check "Troubleshooting options" -> Change from SFX/EFX to "Install as LFX/GFX"',
    softwareRecommendation: 'SteelSeries Sonar (No driver conflicts) OR Equalizer APO in LFX/GFX mode',
    steps: [
      '<strong>Why they conflict:</strong> Logitech G HUB, Razer Synapse, and Corsair iCUE install proprietary virtual audio drivers that block Equalizer APO by default.',
      'Open Equalizer APO <code>Configurator.exe</code> -> Click your USB Headset name.',
      'Check the box <strong>"Troubleshooting options"</strong> in the bottom right.',
      'Change the dropdown from <em>SFX/EFX (default)</em> to <strong>Install as LFX/GFX</strong>.',
      'Click OK and reboot your PC.',
      '<strong>In your brand software (G HUB / Synapse):</strong> Turn off "DTS Headphone:X" or "THX Spatial Audio" and set the built-in EQ to Flat 0dB.',
    ],
    windowsSettings: [
      'Disable Windows Sonic for Headphones in Windows Sound Settings.',
      'If you prefer zero setup hassle, you can skip Equalizer APO completely and use <strong>SteelSeries Sonar</strong> or enter our frequency numbers directly into your brand software’s built-in 10-band EQ!',
    ],
    pitfalls: 'If after rebooting you hear robotic stutter or complete silence, re-open Configurator, check Troubleshooting options, switch to "Install as SFX/EFX (experimental)" or use SteelSeries Sonar instead.',
  },
  {
    id: 'wireless-24ghz',
    title: '2.4GHz Wireless Gaming Headset with USB Dongle',
    shortTitle: '2.4GHz Wireless (USB Dongle)',
    category: 'Low-Latency Wireless',
    icon: '📶',
    badge: '⚡ Low Latency 2.4GHz Transceiver',
    examples: 'HyperX Cloud II/Alpha Wireless, SteelSeries Arctis Nova Pro Wireless, Audeze Maxwell, Corsair HS80 Wireless',
    windowsDeviceName: '"[Brand] Wireless Gaming Headset" or "Wireless USB Audio Transceiver"',
    configuratorCheck: 'Check your wireless USB dongle name in Equalizer APO Configurator. Do NOT select onboard Realtek audio.',
    installMode: 'Install as LFX/GFX (Win 10) or SFX/EFX (Win 11)',
    softwareRecommendation: 'Equalizer APO + Peace GUI OR SteelSeries Sonar',
    steps: [
      'Plug your 2.4GHz USB wireless dongle directly into a rear motherboard USB port (avoid USB hubs).',
      'Open Equalizer APO Configurator -> Check the wireless headset dongle entry.',
      'Reboot your PC.',
      'Import the <code>.peace</code> or <code>.txt</code> game profile.',
      'Ensure the headset firmware is updated to the latest revision.',
    ],
    windowsSettings: [
      'Open Windows Sound Panel (<code>mmsys.cpl</code>) -> Set default device to your wireless headset.',
      'Under the Properties -> Advanced tab: Set Default Format to <strong>16-bit or 24-bit, 48000 Hz</strong>.',
      'Under Spatial sound: Turn Spatial sound OFF.',
    ],
    pitfalls: 'Do not unplug and replug the wireless USB dongle into a different USB port after installing Equalizer APO; Windows assigns a new device GUID to different ports which requires re-running Configurator.exe.',
  },
  {
    id: 'bluetooth',
    title: 'Bluetooth Headphones / Earbuds (AirPods, Sony, Bose)',
    shortTitle: 'Bluetooth Headphones / AirPods',
    category: 'Bluetooth A2DP Profile',
    icon: '🔵',
    badge: '⚠️ Mic Handling Required (Hands-Free Bug)',
    examples: 'Apple AirPods / Pro / Max, Sony WH-1000XM4 / XM5, Bose QuietComfort, Samsung Galaxy Buds',
    windowsDeviceName: 'Two devices appear: "[Model] Stereo" AND "[Model] Hands-Free AG Audio"',
    configuratorCheck: 'Check ONLY the device ending in "Stereo". NEVER check "Hands-Free AG Audio".',
    installMode: 'Install as LFX/GFX',
    softwareRecommendation: 'Equalizer APO + Peace GUI (Stereo Profile only)',
    steps: [
      '<strong>THE CRITICAL BLUETOOTH TRAP:</strong> When Windows uses your Bluetooth headset microphone (in Discord or in-game voice), Bluetooth bandwidth forces audio into <em>8kHz telephone-quality mono</em>, destroying footsteps!',
      'Press <code>Win + R</code>, type <code>mmsys.cpl</code>, and press Enter.',
      'Go to the <strong>Recording</strong> tab -> Right-click <code>[Your Headset] Hands-Free AG Audio</code> and click <strong>DISABLE</strong>. (Use a standalone desk mic or laptop mic instead).',
      'In the <strong>Playback</strong> tab -> Ensure <code>[Your Headset] Stereo</code> is set as the Default Device.',
      'Open Equalizer APO Configurator -> Check ONLY the <code>Stereo</code> entry.',
      'Reboot PC and load your <code>.peace</code> game profile.',
    ],
    windowsSettings: [
      'Open Windows Settings -> Bluetooth & devices -> Devices -> More devices and printer settings.',
      'Double-click your Bluetooth headphones -> Services tab -> UNCHECK <strong>Handsfree Telephony</strong> and click Apply.',
      'This guarantees Windows will never downgrade your audio to telephone mono quality!',
    ],
    pitfalls: 'Never select your Bluetooth headphones as your input microphone in Discord or in game voice chat. Always use a dedicated USB microphone or webcam mic to keep your Bluetooth headphones in high-fidelity stereo mode.',
  },
];

