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
