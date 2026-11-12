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
  {
    id: 'battlefield-6',
    title: 'Battlefield 6 (Next-Gen Tactical Warfare)',
    shortName: 'Battlefield 6',
    genre: 'All-Out Warfare / Large Scale Tactical FPS',
    engine: 'Frostbite Engine 4.0',
    badge: '💥 High Impact • EA / DICE',
    icon: '🎖️',
    bannerGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Frostbite Wartapes sub-bass suppressor to isolate infantry footstep gravel and reload clicks through artillery fire, plus low-latency user.cfg tweaks.',
    audioProfile: {
      profileName: 'Frostbite Vehicle Rumble Dampener & Soldier Tracking',
      targetMix: '3D Headphones / Wartapes Overhaul',
      description: 'The Frostbite engine creates intense atmospheric bass that drowns out approaching flankers. This profile cuts sub-bass under 80Hz (tank rumbles, mortar reverb, jet flyovers) while boosting 125Hz and 3.4kHz to pinpoint sprint steps, fence cuts, and parachute deployments.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Tank Diesel & Jet Rumble' },
        { freq: '64Hz', gain: -3, type: 'Cut', label: 'Mortar Mud & Collapse' },
        { freq: '125Hz', gain: 5, type: 'Boost', label: 'Infantry Boot Strikes' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Artillery Echo Mud' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'Squad Comms & Defib' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Foliage & Wire Clatter' },
        { freq: '2.5kHz', gain: 5, type: 'Peak', label: 'Parachute & Weapon Switch' },
        { freq: '3.4kHz', gain: 7, type: 'Peak', label: 'Gravel Steps & Shell Drops' },
        { freq: '8kHz', gain: -5, type: 'Cut', label: 'Supersonic Crack Tamer' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Air Turbulence Hiss' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -3.5 dB, Q: 1.0',
        'Band 2 (125 Hz): +5.0 dB, Q: 1.41',
        'Band 3 (250 Hz): -3.0 dB, Q: 1.2',
        'Band 4 (3400 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8000 Hz): -5.0 dB, Q: 1.1',
      ],
      dolbyValues: 'Surround: OFF | Leveler: OFF | EQ: 32Hz(-6), 64Hz(-3), 125Hz(+5), 250Hz(-3), 500Hz(+1), 1k(+3), 2.5k(+5), 3.4k(+7), 8k(-5), 16k(-3)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -6; 64 -3; 125 5; 250 -3; 500 1; 1000 3; 2500 5; 3400 7; 8000 -5; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'Frostbite Uniform Soldier Aiming (USA) Calibration',
      curveType: 'Linear (Uniform Soldier Aiming: 133% Coefficient)',
      leftStickDeadzoneMin: '0.05 (5% Inner)',
      rightStickDeadzoneMin: '0.03 (3% Micro-Aim for Long Range)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Instant Digital Hair-Trigger)',
      rightTriggerDeadzone: '0.00 (Instant Digital Hair-Trigger)',
      horizontalSens: '48 (Uniform Soldier Aiming: ON)',
      verticalSens: '48 (133% Coefficient for 16:9 Muscle Memory)',
      aimAssistType: 'Snap Zoom: OFF (Avoids Target Switching) | Slowdown: ON (100%)',
      steamConfigCode: 'steam://controllerconfig/1517290/battlefield_frostbite_linear_usa_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'user.cfg',
      targetPath: 'Battlefield 6 Install Directory / user.cfg',
      fileContent: `// Dangling Dice Gaming Lab™ — Battlefield 6 Frostbite Low Latency & High FPS
Thread.ProcessorCount 8 // Match your physical CPU cores (not hyperthreads)
Thread.MaxProcessorCount 8
Thread.MinFreeProcessorCount 0
Thread.JobThreadPriority 0
RenderDevice.RenderAheadLimit 1 // Reduces input queue delay to absolute minimum
RenderDevice.TripleBufferingEnable 0
RenderDevice.VSyncEnable 0
GstRender.Dx12Enabled 1
GstRender.NvidiaReflex 2 // On + Boost
GstRender.WeaponDOF 0
GstRender.MotionBlur 0.000000
GstRender.MotionBlurEnabled 0
GstRender.ScreenSpaceAO 0
GstRender.UndergrowthQuality 0 // Strips dense grass concealment`,
      fpsTips: [
        'Place this user.cfg file directly into your Battlefield 6 root game installation directory (where the game .exe is located).',
        'Set Thread.ProcessorCount to your physical CPU core count to eliminate Frostbite core stuttering and frame drops during 64/128-player firefights.',
        'Set RenderDevice.RenderAheadLimit 1 to force the GPU to render immediately without queuing frames in a buffer, cutting mouse click-to-fire latency down to minimum.',
        'Turn GstRender.UndergrowthQuality 0 to eliminate ground grass clutter and easily spot proned snipers.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'kb-wooting'],
  },
  {
    id: 'squad',
    title: 'Squad',
    shortName: 'Squad',
    genre: 'Tactical Milsim / Combined Arms',
    engine: 'Unreal Engine 4.27',
    badge: '🎖️ Milsim Standard',
    icon: '🪖',
    bannerGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Acoustic profile for multi-channel audio (MaxChannels=128), suppression volume limiter, and distance scaling in Engine.ini.',
    audioProfile: {
      profileName: 'Distant Vehicle Acoustics & Weapon Crack Balancer',
      targetMix: 'Epic / Low Latency',
      description: 'Squad firefights feature deafening 50-cal and artillery suppression. This EQ curbs low-end vehicle rumblings and suppresses ear-shattering concussions while lifting 125Hz (mud steps) and 3.5kHz (distant rifle snaps and radio squelch).',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'BTR / Tank Engine Mud' },
        { freq: '64Hz', gain: -3, type: 'Cut', label: 'Mortar Concussion' },
        { freq: '125Hz', gain: 5, type: 'Boost', label: 'Infantry Steps on Dirt' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Vehicle Idle Wash' },
        { freq: '500Hz', gain: 2, type: 'Boost', label: 'Squad Comms Radio' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Foliage & Tree Brush' },
        { freq: '2.5kHz', gain: 5, type: 'Peak', label: 'Bolt Cycling & Reload' },
        { freq: '3.5kHz', gain: 7, type: 'Peak', label: 'Distant Rifle Direction' },
        { freq: '8kHz', gain: -5, type: 'Cut', label: 'Supersonic Crack Tamer' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Wind Turbulence' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -3.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +5.0 dB, Q: 1.4',
        'Band 3 (500 Hz): +2.0 dB, Q: 1.0',
        'Band 4 (3500 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8000 Hz): -5.0 dB, Q: 1.2',
      ],
      dolbyValues: 'Surround: OFF | EQ: 32Hz(-6), 64Hz(-3), 125Hz(+5), 250Hz(-3), 500Hz(+2), 1k(+3), 2.5k(+5), 3.5k(+7), 8k(-5), 16k(-3)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -6; 64 -3; 125 5; 250 -3; 500 2; 1000 3; 2500 5; 3500 7; 8000 -5; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'Tactical Milsim Stability Curve',
      curveType: 'Linear with Low Acceleration',
      leftStickDeadzoneMin: '0.05 (5% Movement)',
      rightStickDeadzoneMin: '0.03 (3% Micro-Aim)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 Digital Instant',
      rightTriggerDeadzone: '0.00 Digital Instant',
      horizontalSens: '0.35 (Long-Range Stability)',
      verticalSens: '0.30',
      aimAssistType: 'None (Simulation Standards)',
      steamConfigCode: 'steam://controllerconfig/393380/squad_tactical_stability_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'Engine.ini',
      targetPath: 'AppData/Local/SquadGame/Saved/Config/WindowsNoEditor/Engine.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — Squad Engine.ini Multi-Channel Audio & Visibility
[/Script/Engine.AudioSettings]
bDisableMasterEQ=True
MaxChannels=128 // Expands audio channels from default 32 to 128 so footsteps never drop

[SystemSettings]
r.ViewDistanceScale=1.5 // Maximizes soldier render distance
r.ShadowQuality=0 // Removes dense tree shadows to reveal proned snipers
r.DistanceFieldShadowing=0
r.MotionBlurQuality=0
r.DepthOfFieldQuality=0
r.SceneColorFringeQuality=0
r.BloomQuality=0
r.Tonemapper.GrainQuantization=0
r.EyeAdaptationQuality=0 // Eliminates blinding exposure delay when exiting dark bunkers`,
      fpsTips: [
        'Set MaxChannels=128 under [/Script/Engine.AudioSettings] to stop footsteps from disappearing during massive 50v50 artillery bombardments.',
        'Disable r.EyeAdaptationQuality=0 to eliminate the blinding brightness delay when stepping outside buildings.',
        'Drop r.ShadowQuality=0 to clear dense tree shadows and spot enemies through long foliage lines.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'tf2',
    title: 'Team Fortress 2',
    shortName: 'TF 2',
    genre: 'Class-Based Arena Shooter',
    engine: 'Source Engine',
    badge: '⚡ Source Engine Classic',
    icon: '🎩',
    bannerGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(15, 23, 42, 0.95))',
    summary: 'Ultra-low-latency Source sound buffer (snd_mixahead 0.04), 66-tick network interp, and null-cancelling movement script in autoexec.cfg.',
    audioProfile: {
      profileName: 'Source Engine Spy Uncloak & Footstep Snapper',
      targetMix: 'Headphones Stereo / dsp_enhance_stereo',
      description: 'Source engine spatial audio responds exceptionally to sound pan exponent calibration. This preset boosts 2.5kHz and 4kHz to catch the high-pitched hum of enemy Spies uncloaking and rocket jumper aerial trajectories.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Explosion Sub-Bass' },
        { freq: '64Hz', gain: -2, type: 'Cut', label: 'Rocket Mud' },
        { freq: '125Hz', gain: 3, type: 'Boost', label: 'Heavy/Scout Footsteps' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Flame Thrower Wash' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'Medic Voice Calls' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Metal Step Clatter' },
        { freq: '2.5kHz', gain: 7, type: 'Peak', label: 'Spy Cloak & Sentry Beep' },
        { freq: '4kHz', gain: 6, type: 'Peak', label: 'Headshot Crit Ding' },
        { freq: '8kHz', gain: -4, type: 'Cut', label: 'Minigun Ring Tamer' },
        { freq: '16kHz', gain: 0, type: 'Flat', label: 'Air Rush' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -4.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +3.0 dB, Q: 1.2',
        'Band 3 (2500 Hz): +7.0 dB, Q: 1.5',
        'Band 4 (4000 Hz): +6.0 dB, Q: 1.4',
        'Band 5 (8000 Hz): -4.0 dB, Q: 1.0',
      ],
      dolbyValues: 'Surround: OFF | EQ: 32Hz(-6), 64Hz(-2), 125Hz(+3), 250Hz(-3), 500Hz(+1), 1k(+3), 2.5k(+7), 4k(+6), 8k(-4), 16k(0)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -6; 64 -2; 125 3; 250 -3; 500 1; 1000 3; 2500 7; 4000 6; 8000 -4; 16000 0`,
    },
    controllerProfile: {
      profileName: 'Source Engine eDPI & Raw Input',
      curveType: '1:1 Raw Mouse Input (m_rawinput 1)',
      leftStickDeadzoneMin: 'eDPI: 800 - 1200 (Consensus Pro Range)',
      rightStickDeadzoneMin: 'm_rawinput: 1 (Bypasses Windows Cursor Acceleration)',
      stickDeadzoneMax: 'm_filter: 0 (Zero Interpolation Delay)',
      leftTriggerDeadzone: 'Digital Instant',
      rightTriggerDeadzone: 'Digital Instant',
      horizontalSens: 'Sensitivity: 2.0 @ 400 DPI (or 1.0 @ 800 DPI)',
      verticalSens: '1:1 Yaw/Pitch Ratio (m_yaw 0.022 / m_pitch 0.022)',
      aimAssistType: 'None (Pure Physics)',
      steamConfigCode: 'steam://controllerconfig/440/tf2_competitive_raw_input',
      ds4xmlSnippet: ``,
    },
    configProfile: {
      fileName: 'autoexec.cfg',
      targetPath: 'steamapps/common/Team Fortress 2/tf/cfg/autoexec.cfg',
      fileContent: `// Dangling Dice Gaming Lab™ — Team Fortress 2 Master Competitive Autoexec
// Network Interpolation (Lowest Hitreg Delay on 66-tick servers)
cl_cmdrate 66
cl_updaterate 66
rate 196608
cl_interp 0.030303
cl_interp_ratio 2
cl_smooth 0
cl_smoothtime 0.01

// Low-Latency Source Audio Engine (Zero Sound Lag)
snd_mixahead "0.04" // Lowers audio buffer from default 100ms down to 40ms
snd_headphone_pan_exponent "2.0" // Sharpens left/right separation
snd_spatialize_roundoff "1"
dsp_enhance_stereo "1"
snd_async_fullyloaded "1"

// Null-Cancelling Movement Script (Perfect A-D Counter-Strafing)
alias +mfwd "-back;+forward;alias checkfwd +forward"
alias +mback "-forward;+back;alias checkback +back"
alias +mleft "-moveright;+moveleft;alias checkleft +moveleft"
alias +mright "-moveleft;+moveright;alias checkright +moveright"
alias -mfwd "-forward;checkback;alias checkfwd none"
alias -mback "-back;checkfwd;alias checkback none"
alias -mleft "-moveleft;checkright;alias checkleft none"
alias -mright "-moveright;checkleft;alias checkright none"
alias checkfwd none
alias checkback none
alias checkleft none
alias checkright none
alias none ""
bind w +mfwd
bind s +mback
bind a +mleft
bind d +mright`,
      fpsTips: [
        'Set snd_mixahead 0.04 to cut audio buffer latency down to 40ms so Spy uncloaks and Scout footsteps register instantly.',
        'The included Null-Cancelling script prevents movement locking when pressing A and D at the same time.',
        'Place this file in: steamapps/common/Team Fortress 2/tf/cfg/ and add +exec autoexec.cfg to Steam launch options.',
      ],
    },
    recommendedGear: ['kb-wooting', 'mouse-viper-v3', 'iem-waner'],
  },
  {
    id: 'steam-deck-cyberpunk',
    title: 'Cyberpunk 2077 & Steam Deck / Steam Input',
    shortName: 'Steam Deck .VDF',
    genre: 'Open-World RPG / Valve Data Format (.vdf)',
    engine: 'REDengine / Valve Steam Input API',
    badge: '🌌 Valve .vdf Master Layout',
    icon: '🎮',
    bannerGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Universal Valve Data Format (.vdf) layout with Right-Stick Touch Gyro Aiming, 10-slot Left Trackpad Quick-Hack Radial Menu, and REDengine audio.',
    audioProfile: {
      profileName: 'Cyberpunk Night City Combat & Cyberware Acoustics',
      targetMix: 'Night City Dynamic / 3D Headphone',
      description: 'Isolates approaching Arasaka footsteps and Sandevistan activation chimes from dense ambient city traffic and nightclub sub-bass.',
      bands: [
        { freq: '32Hz', gain: -5, type: 'Cut', label: 'AV Engine Sub-Rumble' },
        { freq: '64Hz', gain: -2, type: 'Cut', label: 'Nightclub Bass Muffle' },
        { freq: '125Hz', gain: 4, type: 'Boost', label: 'Footsteps on Asphalt' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Vehicle Traffic Hum' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'NCPD Radio Chime' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Shattered Glass & Scuff' },
        { freq: '2.5kHz', gain: 5, type: 'Peak', label: 'Cyberware Charge Hum' },
        { freq: '4kHz', gain: 6, type: 'Peak', label: 'Footstep Tile & Concrete' },
        { freq: '8kHz', gain: -3, type: 'Cut', label: 'Smart Gun Laser Sibilance' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Neon Buzz' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -3.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +4.0 dB, Q: 1.4',
        'Band 3 (2500 Hz): +5.0 dB, Q: 1.5',
        'Band 4 (4000 Hz): +6.0 dB, Q: 1.5',
        'Band 5 (8000 Hz): -3.0 dB, Q: 1.0',
      ],
      dolbyValues: 'Surround: OFF | EQ: 32Hz(-5), 64Hz(-2), 125Hz(+4), 250Hz(-3), 500Hz(+1), 1k(+3), 2.5k(+5), 4k(+6), 8k(-3), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -5; 32 -5; 64 -2; 125 4; 250 -3; 500 1; 1000 3; 2500 5; 4000 6; 8000 -3; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Steam Deck Gyro Aim & Dual-Stage Triggers',
      curveType: 'Linear with Gyro Right-Stick Capacitive Touch',
      leftStickDeadzoneMin: '0.04 (4% Inner Deadzone)',
      rightStickDeadzoneMin: '0.02 (Gyro Activated upon Touching Right Stick)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: 'Soft-Pull: Aim Down Sight | Full-Pull: Sandevistan Time Dilation',
      rightTriggerDeadzone: 'Hair-Trigger (0.00 Digital Snap)',
      horizontalSens: 'Gyro Sensitivity: 2.4 (Mouse Emulation)',
      verticalSens: 'Gyro Vertical Scale: 1.0',
      aimAssistType: 'Gyro-As-Mouse (Bypasses controller aim-assist for 1:1 precision)',
      steamConfigCode: 'steam://controllerconfig/1091500/cyberpunk_steamdeck_gyro_radial_v2',
      ds4xmlSnippet: ``,
    },
    configProfile: {
      fileName: 'controller_cyberpunk_danglingdice.vdf',
      targetPath: 'Steam/controller_base/templates/controller_cyberpunk_danglingdice.vdf',
      fileContent: `"controller_mappings"
{
  "version" "3"
  "game" "Cyberpunk 2077"
  "creator" "Dangling Dice Gaming Lab"
  "title" "Dangling Dice Gyro & Radial Quick-Hack Layout"
  "description" "Steam Deck & Universal Steam Input layout. Enables 1:1 Gyro Aiming on Right-Thumbstick Touch, Left Trackpad 8-Item Radial Wheel, and dual-stage hair triggers."
  
  "group"
  {
    "id" "0"
    "mode" "four_buttons"
    "bindings"
    {
      "button_a" "jump"
      "button_b" "crouch_slide"
      "button_x" "reload_interact"
      "button_y" "switch_weapon"
    }
  }

  "group"
  {
    "id" "1"
    "mode" "gyro"
    "settings"
    {
      "gyro_source" "right_stick_touch" // Activates gyro only when thumb touches the right stick
      "gyro_mode" "mouse" // Emulates raw optical mouse for 1:1 pixel aiming
      "sensitivity" "240"
      "smoothing" "2"
      "gyro_deadzone" "0"
    }
  }

  "group"
  {
    "id" "2"
    "mode" "touch_radial_menu"
    "settings"
    {
      "input_source" "left_trackpad"
      "radial_menu_slots" "8"
      "haptic_intensity" "medium"
    }
  }
}`,
      fpsTips: [
        'Valve Data Format (.vdf) files can be dropped into your Steam controller templates folder: Steam/controller_base/templates/',
        'On the Steam Deck, you can also place it in: /home/deck/.steam/steam/controller_base/templates/',
        'This profile binds Gyro to Mouse mode on Right-Stick touch, giving you sub-pixel sniper precision without losing stick turning.',
      ],
    },
    recommendedGear: ['ctrl-vader-4', 'iem-truthear-zero', 'grip-kontrolfreek'],
  },
  {
    id: 'tarkov',
    title: 'Escape from Tarkov & Arena',
    shortName: 'Tarkov',
    genre: 'Hardcore Extraction Shooter',
    engine: 'Custom Unity Engine',
    badge: '🎒 #1 Extraction',
    icon: '🪖',
    bannerGradient: 'linear-gradient(135deg, rgba(180, 83, 9, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Hardcore ambient wind and rain cut, broken glass and crouch-sneak isolation, and stutter-free local.ini settings.',
    audioProfile: {
      profileName: 'Wind & Rain Floor Tamer + Glass/Wood Isolation',
      targetMix: 'Binaural Audio (Headset Stereo)',
      description: 'Cuts heavy wind howl, generator drones, and unsuppressed gunshot tinnitus while boosting wood creaks, glass crunch, and slow-walk creeping.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Air Drop Rumble' },
        { freq: '64Hz', gain: -4, type: 'Cut', label: 'Generator Drone' },
        { freq: '125Hz', gain: -5, type: 'Cut', label: 'Rain & Wind Mask' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Heavy Breathing Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Scav / PMC Voice' },
        { freq: '1.2kHz', gain: 2, type: 'Boost', label: 'ADS Gun Rattle' },
        { freq: '2.8kHz', gain: 7, type: 'Peak', label: 'Grass Creep & Bush Rustle' },
        { freq: '4.2kHz', gain: 8, type: 'Peak', label: 'Broken Glass & Wood Footsteps' },
        { freq: '8kHz', gain: -5, type: 'Cut', label: 'Unsuppressed Gunshot Protection' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Air Whistle' },
      ],
      sonarValues: [
        'Band 1 (50 Hz): -5.0 dB, Q: 1.2',
        'Band 2 (120 Hz): -5.5 dB, Q: 1.4',
        'Band 3 (1200 Hz): +2.5 dB, Q: 1.0',
        'Band 4 (4200 Hz): +8.0 dB, Q: 1.8',
        'Band 5 (8500 Hz): -5.0 dB, Q: 1.3',
      ],
      dolbyValues: 'Surround Virtualizer: OFF (Conflicts with Binaural Audio) | Volume Leveler: OFF | EQ: 32Hz(-5), 64Hz(-3), 125Hz(-4), 250Hz(-2), 500Hz(0), 1k(+1), 2k(+3), 4k(+7), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -7; 32 -6; 64 -4; 125 -5; 250 -3; 500 0; 1200 2; 2800 7; 4200 8; 8000 -5; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'Steam Input Radial Quick-Meds & Precision Gyro',
      curveType: 'Linear (M&K Emulation via Steam Input)',
      leftStickDeadzoneMin: '0.04 (4%)',
      rightStickDeadzoneMin: '0.02 (2% Gyro Assisted)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Instant ADS)',
      rightTriggerDeadzone: '0.00 (Hair Trigger)',
      horizontalSens: 'Mouse 800 DPI / 0.32 In-Game (1:1 Muscle Memory)',
      verticalSens: '0.32 (0.28 Aiming Multiplier)',
      aimAssistType: 'Zero Aim Assist (Pure Organic Crosshair Control)',
      steamConfigCode: 'steam://controllerconfig/escape_from_tarkov_steamdeck_gyro_v1',
      ds4xmlSnippet: `<LeftDeadzone>4</LeftDeadzone><RightDeadzone>2</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'local.ini',
      targetPath: '%appdata%/Battlestate Games/Escape from Tarkov/Settings/local.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — Escape from Tarkov Max FPS & Latency Tweak
{
  "Graphics": {
    "AutoCleanRAM": true,
    "PhysicalCoresOnly": true,
    "MipStreaming": false, // Eliminates texture load hitching during scope-in
    "TextureQuality": 1,
    "ShadowsQuality": 0,
    "LODBias": 2,
    "OverallVisibility": 1000,
    "AntiAliasing": "TAA_High",
    "NvidiaReflex": "OnAndBoost",
    "HighQualityColor": false,
    "ZBlur": false,
    "ChromAberr": false,
    "Noise": false
  },
  "Sound": {
    "BinauralSound": true, // Essential for 360-degree elevation cues
    "MusicVolume": 0,
    "HideoutVolume": 5
  }
}`,
      fpsTips: [
        'Enable "Physical Cores Only" in EFT settings: Tarkov performs drastically better on physical CPU cores rather than hyperthreaded virtual threads.',
        'Always set Binaural Sound to ON for 3D elevation cues, but turn off Windows Sonic / Dolby surround so sound passes uncolored.',
        'Set Mip Streaming to false unless you have under 6GB VRAM, as texture mip swapping causes severe frame drops during optics scope-in.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'kb-wooting', 'mouse-viper-v3'],
  },
  {
    id: 'rust',
    title: 'Rust',
    shortName: 'Rust',
    genre: 'Survival / Base Raiding',
    engine: 'Unity Engine',
    badge: '☢️ Survival Titan',
    icon: '🪓',
    bannerGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Furnace & minicopter drone dampening, sheet metal vs wood footstep clarity, and the essential gc.buffer client.cfg fix.',
    audioProfile: {
      profileName: 'Airlock Footstep Isolation & Furnace Drone Tamer',
      targetMix: 'Pure Stereo (Hi-Fi)',
      description: 'Silences massive furnace humming, diesel quarry rumble, and patrol chopper blades so you can instantly detect someone sneaking at your airlock door.',
      bands: [
        { freq: '32Hz', gain: -5, type: 'Cut', label: 'Chopper Blade Boom' },
        { freq: '64Hz', gain: -4, type: 'Cut', label: 'Large Furnace Drone' },
        { freq: '125Hz', gain: -3, type: 'Cut', label: 'Campfire Mud' },
        { freq: '250Hz', gain: 0, type: 'Flat', label: 'Footstep Bass Thud' },
        { freq: '500Hz', gain: 1, type: 'Flat', label: 'Reloading Clicks' },
        { freq: '1.5kHz', gain: 3, type: 'Boost', label: 'Sheet Metal Clang' },
        { freq: '3.2kHz', gain: 7, type: 'Peak', label: 'Footstep Sprint & Ladder Mount' },
        { freq: '4.5kHz', gain: 7, type: 'Peak', label: 'Code Lock Chirps & Syringes' },
        { freq: '8kHz', gain: -4, type: 'Cut', label: 'AK-47 Spray Tamer' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Wind Whistle' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -4.0 dB, Q: 1.0',
        'Band 2 (140 Hz): -3.0 dB, Q: 1.2',
        'Band 3 (1500 Hz): +3.0 dB, Q: 1.1',
        'Band 4 (3400 Hz): +7.0 dB, Q: 1.6',
        'Band 5 (8000 Hz): -4.0 dB, Q: 1.2',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-4), 64Hz(-3), 125Hz(-2), 250Hz(0), 500Hz(+1), 1k(+2), 2k(+4), 4k(+6), 8k(-3), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -5; 64 -4; 125 -3; 250 0; 500 1; 1500 3; 3200 7; 4500 7; 8000 -4; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Linear Recoil Control & Analog Aiming',
      curveType: 'Linear (1:1 Stick Rate)',
      leftStickDeadzoneMin: '0.05 (5%)',
      rightStickDeadzoneMin: '0.03 (3%)',
      stickDeadzoneMax: '0.97',
      leftTriggerDeadzone: '0.00 (Zero Deadzone ADS)',
      rightTriggerDeadzone: '0.00 (Instant Fire)',
      horizontalSens: '1.0 (Standard) / 0.4 ADS Multiplier',
      verticalSens: '1.0 (Recoil Pulldown Equalized)',
      aimAssistType: 'No Aim Assist on PC Servers',
      steamConfigCode: 'steam://controllerconfig/252490/rust_competitive_recoil_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'client.cfg',
      targetPath: 'Steam/steamapps/common/Rust/cfg/client.cfg',
      fileContent: `// Dangling Dice Gaming Lab™ — Rust Pro PvP & Anti-Stutter Config
gc.buffer 2048 // Prevents garbage collector memory freezes mid-fight
steps 60 // Maximizes client tick synchronization
audio.game 1.0
audio.voices 1.0
audio.instruments 0.1 // Quiets guitar trolls
graphics.shadowdistance 50
effects.maxgibs 0 // Disables building debris ragdolls for instant sightlines
graphics.branding false
input.holdtime 0.2
input.sensitivity 0.35`,
      fpsTips: [
        'Place "gc.buffer 2048" in your client.cfg or press F1 in-game: this stops Unity from freezing your screen when allocating memory during gunfights.',
        'Set "effects.maxgibs 0" so when walls or doors break, they instantly disappear rather than creating smoking rubble that blocks your bullets.',
        'Use audio.instruments 0.1 so teammates or proximity raiders playing pianos cannot mask stealth footsteps.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'kb-wooting', 'mouse-viper-v3'],
  },
  {
    id: 'hunt-showdown',
    title: 'Hunt: Showdown 1896',
    shortName: 'Hunt 1896',
    genre: 'PvPvE Extraction Shooter',
    engine: 'CryEngine 5.11',
    badge: '🤠 Master Soundscape',
    icon: '🎯',
    bannerGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'CryEngine binaural audio tuning: twig snaps, dog kennel traps, water splashes, and zero-virtualization stereo fidelity.',
    audioProfile: {
      profileName: 'Sound-Trap & Twig Snap Acoustic Isolation',
      targetMix: '100% Stereo Only (CryEngine Native Binaural)',
      description: 'The golden rule for Hunt: NEVER enable virtual surround. This curve cuts environmental swamp drone while magnifying animal sound-traps and pistol hammers.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Dark Sight Sub-Drone' },
        { freq: '64Hz', gain: -3, type: 'Cut', label: 'Swamp Water Murk' },
        { freq: '125Hz', gain: 1, type: 'Flat', label: 'Heavy Boot Water Splash' },
        { freq: '250Hz', gain: -2, type: 'Cut', label: 'Dynamite Smoke Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Zombie Aggro Hiss' },
        { freq: '1kHz', gain: 2, type: 'Boost', label: 'Hanging Chain Jingle' },
        { freq: '2.4kHz', gain: 6, type: 'Peak', label: 'Crow Flap & Broken Glass' },
        { freq: '3.8kHz', gain: 7, type: 'Peak', label: 'Twig Snap & Revolver Hammer Cock' },
        { freq: '7.5kHz', gain: -4, type: 'Cut', label: 'Romero Shotgun Ear Blast' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Night Fog Ambient Hiss' },
      ],
      sonarValues: [
        'Band 1 (65 Hz): -4.0 dB, Q: 1.1',
        'Band 2 (1000 Hz): +2.0 dB, Q: 1.0',
        'Band 3 (2400 Hz): +6.0 dB, Q: 1.5',
        'Band 4 (3800 Hz): +7.0 dB, Q: 1.7',
        'Band 5 (7500 Hz): -4.0 dB, Q: 1.2',
      ],
      dolbyValues: 'Surround Virtualizer: MUST BE OFF | Volume Leveler: OFF | EQ: 32Hz(-5), 64Hz(-2), 125Hz(+1), 250Hz(-1), 500Hz(0), 1k(+2), 2k(+4), 4k(+6), 8k(-3), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -7; 32 -6; 64 -3; 125 1; 250 -2; 500 0; 1000 2; 2400 6; 3800 7; 7500 -4; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Precision Lever-Action Curve & Micro-Adjustment',
      curveType: 'Dual-Stage Exponential with Low Deadzone',
      leftStickDeadzoneMin: '0.05 (5%)',
      rightStickDeadzoneMin: '0.03 (3%)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Shoulder Aim)',
      rightTriggerDeadzone: '0.00 (Instant Hammer Release)',
      horizontalSens: 'Default 1.20 / ADS 0.65',
      verticalSens: 'Default 1.00 / ADS 0.55',
      aimAssistType: 'Standard Controller Assist (Tuned for Gunslinger mode)',
      steamConfigCode: 'steam://controllerconfig/594650/hunt_showdown_gunslinger_precision_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Exponential</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'attributes.xml',
      targetPath: 'Steam/steamapps/common/Hunt Showdown/user/profiles/default/attributes.xml',
      fileContent: `// Dangling Dice Gaming Lab™ — Hunt: Showdown 1896 Max Competitive Config
<Attributes Version="34">
  <Attr name="AudioOutputMode" value="2"/> <!-- Pure 2-Channel Stereo Output -->
  <Attr name="MotionBlur" value="0"/>
  <Attr name="FieldOfView" value="110"/>
  <Attr name="ResolutionScale" value="100"/>
  <Attr name="ObjectQuality" value="3"/> <!-- High: Keeps sound-traps and crows rendered at distance -->
  <Attr name="TextureQuality" value="2"/>
  <Attr name="LightingQuality" value="1"/>
  <Attr name="ShadowQuality" value="1"/>
  <Attr name="EffectQuality" value="1"/>
  <Attr name="PostProcessQuality" value="1"/>
</Attributes>`,
      fpsTips: [
        'DO NOT lower Object Quality below Medium or High: low object quality stops crows and kennels from rendering at 75m+, causing you to trigger invisible sound traps.',
        'Keep AudioOutputMode strictly on Stereo: CryEngine has its own head-related transfer function (HRTF) calibrated for dual-ear delivery.',
        'Disable Depth of Field and Motion Blur to keep iron sights razor-sharp during fast flicks.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'hell-let-loose',
    title: 'Hell Let Loose',
    shortName: 'HLL',
    genre: 'WW2 Tactical MilSim',
    engine: 'Unreal Engine 4',
    badge: '🎖️ 50v50 Hardcore',
    icon: '🪖',
    bannerGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Artillery & bombing run tinnitus suppressor, trench boot clarity, and MaxChannels=128 Engine.ini tuning.',
    audioProfile: {
      profileName: 'Artillery Shock Tamer & Trench Step Isolation',
      targetMix: 'Crisp Footsteps & Radio Clarity',
      description: 'Surgically dampens 150mm artillery and bombing run sub-bass explosions so your ears do not fatigue while amplifying enemy trench boots and garrison radios.',
      bands: [
        { freq: '32Hz', gain: -7, type: 'Cut', label: 'Artillery & Katyusha Boom' },
        { freq: '64Hz', gain: -5, type: 'Cut', label: 'Tiger Tank Diesel Drone' },
        { freq: '125Hz', gain: -2, type: 'Cut', label: 'Distant Mortar Mud' },
        { freq: '250Hz', gain: 0, type: 'Flat', label: 'Trench Mud Splash' },
        { freq: '500Hz', gain: 1, type: 'Boost', label: 'Officer VOIP Command Clarity' },
        { freq: '1kHz', gain: 3, type: 'Boost', label: 'Bolt-Action Chamber & Clip Ping' },
        { freq: '2.2kHz', gain: 6, type: 'Peak', label: 'Grass Crawl & Hedgerow Rustle' },
        { freq: '3.5kHz', gain: 7, type: 'Peak', label: 'Trench Boot Heel Strikes' },
        { freq: '8kHz', gain: -6, type: 'Cut', label: 'MG42 Ear Ringer Softener' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Artillery Whistle Cut' },
      ],
      sonarValues: [
        'Band 1 (50 Hz): -6.0 dB, Q: 1.1',
        'Band 2 (500 Hz): +1.5 dB, Q: 1.0',
        'Band 3 (1000 Hz): +3.0 dB, Q: 1.2',
        'Band 4 (3500 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8000 Hz): -6.0 dB, Q: 1.4',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-6), 64Hz(-4), 125Hz(-1), 250Hz(0), 500Hz(+1), 1k(+2), 2k(+5), 4k(+6), 8k(-5), 16k(-3)',
      peaceConfig: `GraphicEQ: 20 -8; 32 -7; 64 -5; 125 -2; 250 0; 500 1; 1000 3; 2200 6; 3500 7; 8000 -6; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'MilSim Long-Range Stability & Steady Aim',
      curveType: 'Standard / Smooth Linear',
      leftStickDeadzoneMin: '0.06 (6%)',
      rightStickDeadzoneMin: '0.04 (4%)',
      stickDeadzoneMax: '0.96',
      leftTriggerDeadzone: '0.05 (Prevents accidental weapon raise)',
      rightTriggerDeadzone: '0.00 (Instant Single Fire)',
      horizontalSens: '38% (Look) / 22% (ADS Multiplier)',
      verticalSens: '34% (Look) / 20% (ADS Multiplier)',
      aimAssistType: 'Friction Only (No rotational pull in MilSim)',
      steamConfigCode: 'steam://controllerconfig/686810/hell_let_loose_milsim_steady_v1',
      ds4xmlSnippet: `<LeftDeadzone>6</LeftDeadzone><RightDeadzone>4</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'Engine.ini',
      targetPath: '%LOCALAPPDATA%/HLL/Saved/Config/WindowsNoEditor/Engine.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — Hell Let Loose Pro MilSim Audio & Performance
[/script/engine.audiosettings]
bDisableMasterEQ=True
MaxChannels=128 // Prevents voice chat and footstep audio cutouts during massive 50v50 artillery battles

[SystemSettings]
r.DefaultFeature.MotionBlur=0
r.DefaultFeature.Bloom=0
r.DefaultFeature.AntiAliasing=2
r.FoliageDensityScale=0.60
r.ShadowQuality=1
r.ViewDistanceScale=1.4`,
      fpsTips: [
        'Setting MaxChannels=128 in Engine.ini prevents the famous UE4 audio drop bug during heavy 50-player engagements.',
        'Keep ViewDistanceScale at 1.4+ so enemy infantry silhouettes render across hedgerows before they shoot you.',
        'Disable Bloom and Motion Blur to eliminate scope-in blinding effects when peering out of dark bunkers.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'r6-siege',
    title: "Tom Clancy's Rainbow Six Siege",
    shortName: 'R6 Siege',
    genre: 'Tactical CQC Shooter',
    engine: 'Ubisoft Anvil Engine',
    badge: '🛡️ Esports Tactical',
    icon: '🧱',
    bannerGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Night Mode dynamic range compression tuning, drywall punch and drone scuff isolation, and 1:1 ADS sensitivity.',
    audioProfile: {
      profileName: 'Night Mode Sound-Scuff & Defuser Isolation',
      targetMix: 'Night Mode (Dynamic Range Compression)',
      description: 'Pairs perfectly with Siege Night Mode setting: dampens deafening breach charges and grenade booms while pulling quiet crouch-walk footsteps and plant sounds to the front.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Breach Charge Sub-Boom' },
        { freq: '64Hz', gain: -2, type: 'Flat', label: '3-Armor Step Base' },
        { freq: '125Hz', gain: 4, type: 'Boost', label: 'Crouch Walk Footsteps' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Concrete Debris Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Drone Motor Whir' },
        { freq: '1.5kHz', gain: 4, type: 'Boost', label: 'Barbed Wire Rustle & Defuser Plant' },
        { freq: '3.2kHz', gain: 7, type: 'Peak', label: 'Drywall Punch & Wood Splinter' },
        { freq: '5kHz', gain: 5, type: 'Peak', label: 'C4 Velcro Rip & Nitro Beep' },
        { freq: '9kHz', gain: -5, type: 'Cut', label: 'Flashbang Tinnitus Protection' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'High Air Hiss' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -3.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +4.0 dB, Q: 1.4',
        'Band 3 (1500 Hz): +4.0 dB, Q: 1.2',
        'Band 4 (3200 Hz): +7.0 dB, Q: 1.6',
        'Band 5 (8500 Hz): -5.0 dB, Q: 1.3',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-5), 64Hz(-1), 125Hz(+3), 250Hz(-2), 500Hz(0), 1k(+2), 2k(+4), 4k(+6), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -7; 32 -6; 64 -2; 125 4; 250 -3; 500 0; 1500 4; 3200 7; 5000 5; 9000 -5; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Updated (Raw Linear) ADS Micro-Adjustment',
      curveType: 'Updated Controller Curve (Pure Linear 1:1)',
      leftStickDeadzoneMin: '0.04 (4%)',
      rightStickDeadzoneMin: '0.03 (3%)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Instant ADS)',
      rightTriggerDeadzone: '0.00 (Hair Trigger)',
      horizontalSens: '55 - 75 (High Turn Speed)',
      verticalSens: '30 - 45 (Recoil Compensation)',
      aimAssistType: 'No Aim Assist in Multiplayer (Raw Crosshair Physics)',
      steamConfigCode: 'steam://controllerconfig/359550/rainbow_six_siege_pro_linear_v1',
      ds4xmlSnippet: `<LeftDeadzone>4</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'GameSettings.ini',
      targetPath: 'Documents/My Games/Rainbow Six - Siege/[Account_UUID]/GameSettings.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — Rainbow Six Siege Pro Settings
[AUDIO]
AudioProfile=1 // 1 = Night Mode (Maximizes quiet sound clarity over explosions)
VoiceChatCaptureMode=1
MuteOnUnfocused=0

[INPUT]
RawInputMouseKeyboard=1
AimAssist=0

[DISPLAY]
VSync=0
FPSLimit=0

[HARDWARE_INFO]
GPUAdapter=0`,
      fpsTips: [
        'Always set AudioProfile=1 (Night Mode) in Siege: Night mode automatically compresses the dynamic range, making distant footsteps just as loud as nearby shotgun blasts.',
        'Enable RawInputMouseKeyboard=1 to bypass Windows desktop pointer scaling for pure sub-millisecond precision.',
        'Never enable VSync as it introduces 2-3 frames of input buffering delay.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'dayz',
    title: 'DayZ',
    shortName: 'DayZ',
    genre: 'Hardcore Survival',
    engine: 'Enfusion / Real Virtuality',
    badge: '🧟 Survival Legend',
    icon: '🧭',
    bannerGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Wind noise reduction, infected agro growls, long-range supersonic bullet crack directional pinpointing, and DayZ.cfg.',
    audioProfile: {
      profileName: 'Chernarus Wind Dampener & Sniper Crack Isolation',
      targetMix: 'Pure Stereo (Hi-Fi)',
      description: 'Removes the exhausting 100Hz wind drone on coastal and mountainous terrain while highlighting distant sniper shots, infected footsteps, and pine needle rustling.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Rain Storm Rumble' },
        { freq: '64Hz', gain: -4, type: 'Cut', label: 'Coastal Wind Roar' },
        { freq: '125Hz', gain: 1, type: 'Flat', label: 'Player Asphalt Sprint' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Heavy Breathing Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Hunger & Thirst Audio Cues' },
        { freq: '1.2kHz', gain: 3, type: 'Boost', label: 'Infected Agro Snarl & Steps' },
        { freq: '2.8kHz', gain: 6, type: 'Peak', label: 'Pine Needle & Stick Snaps' },
        { freq: '4.8kHz', gain: 8, type: 'Peak', label: 'Long-Range Supersonic Bullet Crack' },
        { freq: '8kHz', gain: -4, type: 'Cut', label: 'Point-Blank Shotgun Tamer' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'High Ambient Hiss' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -4.5 dB, Q: 1.1',
        'Band 2 (1200 Hz): +3.0 dB, Q: 1.2',
        'Band 3 (2800 Hz): +6.0 dB, Q: 1.5',
        'Band 4 (4800 Hz): +8.0 dB, Q: 1.8',
        'Band 5 (8000 Hz): -4.0 dB, Q: 1.2',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-5), 64Hz(-3), 125Hz(0), 250Hz(-2), 500Hz(0), 1k(+2), 2k(+4), 4k(+7), 8k(-3), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -7; 32 -6; 64 -4; 125 1; 250 -3; 500 0; 1200 3; 2800 6; 4800 8; 8000 -4; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'DayZ Steam Deck & Controller Layout',
      curveType: 'Standard Linear with ADS Damping',
      leftStickDeadzoneMin: '0.05 (5%)',
      rightStickDeadzoneMin: '0.03 (3%)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Raise Weapon)',
      rightTriggerDeadzone: '0.00 (Fire / Heavy Melee)',
      horizontalSens: '0.85 (Smooth Tracking)',
      verticalSens: '0.75 (Consistent Level)',
      aimAssistType: 'No Aim Assist',
      steamConfigCode: 'steam://controllerconfig/221100/dayz_standalone_survival_precision_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'DayZ.cfg',
      targetPath: 'Documents/DayZ/DayZ.cfg',
      fileContent: `// Dangling Dice Gaming Lab™ — DayZ Max View Distance & Stutter Tweak
language="English";
Windowed=0;
Render_W=1920;
Render_H=1080;
FSAASamples=0;
postFX=0; // Removes blur and depth-of-field masking
shadingQuality=1;
shadowZDistance=40;
viewDistance=2200; // Balances player spotting with high frame rate
preferredObjectViewDistance=1400;`,
      fpsTips: [
        'Set postFX=0 in DayZ.cfg to remove motion blur and peripheral visual darkening when running.',
        'Setting shadowZDistance=40 prevents unnecessary shadow rendering on distant trees, giving a massive 20-30 FPS boost in heavy forests.',
        'Use stereo headphones with flat low-end to identify supersonic bullet cracks (4.8kHz) before the subsonic sound wave reaches you.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'kb-wooting', 'mouse-viper-v3'],
  },
  {
    id: 'pubg',
    title: 'PUBG: BATTLEGROUNDS',
    shortName: 'PUBG',
    genre: 'Tactical Battle Royale',
    engine: 'Unreal Engine 4',
    badge: '🍗 BR Pioneer',
    icon: '🍳',
    bannerGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Red zone blast dampening, grass crawl & barefoot step isolation, and Engine.ini audio limiter.',
    audioProfile: {
      profileName: 'Red Zone Blast Tamer & Grass Crawl Isolation',
      targetMix: 'Stereo with Dynamic Range Safety',
      description: 'PUBG has dangerously loud explosions and vehicle audio. This preset protects your hearing during red zones and drive-bys while boosting prone grass movement and scope unpinning.',
      bands: [
        { freq: '32Hz', gain: -8, type: 'Cut', label: 'Red Zone Artillery Boom' },
        { freq: '64Hz', gain: -6, type: 'Cut', label: 'UAZ & Dacia Vehicle Drone' },
        { freq: '125Hz', gain: 3, type: 'Boost', label: 'Barefoot & Wood Floor Slap' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Grenade Concussion Mud' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Door Opening Creak' },
        { freq: '1.4kHz', gain: 4, type: 'Boost', label: 'Grass Prone Crawl & Reload Clink' },
        { freq: '3.4kHz', gain: 7, type: 'Peak', label: 'Footstep Heel Impact (30-50m)' },
        { freq: '5.5kHz', gain: 5, type: 'Peak', label: 'Scope Unzoom & First-Aid Rip' },
        { freq: '8.5kHz', gain: -6, type: 'Cut', label: 'Close Beryl / M4 Spray Tamer' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Plane Flyover Whistle' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -6.0 dB, Q: 1.2',
        'Band 2 (125 Hz): +3.0 dB, Q: 1.4',
        'Band 3 (1400 Hz): +4.0 dB, Q: 1.1',
        'Band 4 (3400 Hz): +7.0 dB, Q: 1.6',
        'Band 5 (8500 Hz): -6.0 dB, Q: 1.5',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-7), 64Hz(-5), 125Hz(+2), 250Hz(-2), 500Hz(0), 1k(+2), 2k(+4), 4k(+6), 8k(-5), 16k(-3)',
      peaceConfig: `GraphicEQ: 20 -9; 32 -8; 64 -6; 125 3; 250 -3; 500 0; 1400 4; 3400 7; 5500 5; 8500 -6; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'Type B (Pro ADS) Curve with Zero Acceleration',
      curveType: 'Type B Controller Layout (Left Trigger ADS)',
      leftStickDeadzoneMin: '0.05 (5%)',
      rightStickDeadzoneMin: '0.03 (3%)',
      stickDeadzoneMax: '0.98',
      leftTriggerDeadzone: '0.00 (Instant Hold-to-ADS)',
      rightTriggerDeadzone: '0.00 (Hair Trigger)',
      horizontalSens: 'Sensitivity 8 (General) / 5 (1x Optics)',
      verticalSens: 'Vertical Sensitivity Multiplier 1.10 (Recoil Aid)',
      aimAssistType: 'No Aim Assist on PC',
      steamConfigCode: 'steam://controllerconfig/578080/pubg_battlegrounds_type_b_linear_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>3</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'GameUserSettings.ini',
      targetPath: '%LOCALAPPDATA%/TslGame/Saved/Config/WindowsNoEditor/GameUserSettings.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — PUBG Pro Competitive Settings
[/Script/TslGame.TslGameUserSettings]
bUseVSync=False
FrameRateLimit=0.000000
ScreenScale=100.000000
sg.ResolutionQuality=100.000000
sg.ViewDistanceQuality=3 // High: Renders enemy parachute drops at distance
sg.AntiAliasingQuality=2 // Medium: Smooths edges without blur
sg.ShadowQuality=0 // Very Low: Spots enemies hiding under trees
sg.PostProcessQuality=0
sg.TextureQuality=2
sg.EffectsQuality=0
sg.FoliageQuality=0 // Very Low: Removes decorative bush density`,
      fpsTips: [
        'Set sg.FoliageQuality=0: this strips non-essential grass and bush meshes, making prone enemies immediately visible.',
        'Set sg.ShadowQuality=0 to eliminate dark canopy shadows where campers blend into terrain.',
        'Use a vertical sensitivity multiplier of 1.10 to make pulling down high-recoil guns (Beryl 762, SLR) effortless.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'the-finals',
    title: 'THE FINALS',
    shortName: 'THE FINALS',
    genre: 'Destruction Movement Shooter',
    engine: 'Unreal Engine 5 (Chaos Physics)',
    badge: '💥 Fast-Paced Chaos',
    icon: '🪙',
    bannerGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Building collapse rubble dampener, stealth Light footsteps & cloaking audio cue isolation, and high-FPS UE5 config.',
    audioProfile: {
      profileName: 'Debris Shock Tamer & Light Class Stealth Audio',
      targetMix: 'Enhanced Stereo Footstep Focus',
      description: 'Chaos physics destructions create massive 30-80Hz rubble rumble. This profile cuts structural boom while amplifying Light class cloaking buzz, dash sounds, and defibrillators.',
      bands: [
        { freq: '32Hz', gain: -7, type: 'Cut', label: 'Rubble Collapse Sub-Bass' },
        { freq: '64Hz', gain: -4, type: 'Cut', label: 'Cashout Siren Drone' },
        { freq: '125Hz', gain: 2, type: 'Boost', label: 'Heavy Class Stomp Footsteps' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Falling Concrete Clutter' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Announcer Crowd Tamer' },
        { freq: '1.5kHz', gain: 3, type: 'Boost', label: 'Grappling Hook & Jump Pad Spring' },
        { freq: '3.2kHz', gain: 7, type: 'Peak', label: 'Light Class Cloak Hum & Dash' },
        { freq: '4.2kHz', gain: 7, type: 'Peak', label: 'Medium Defib Charge & Coin Clatter' },
        { freq: '8kHz', gain: -5, type: 'Cut', label: 'RPG-7 Blast Softener' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Laser Glint Hiss' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -4.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +2.0 dB, Q: 1.2',
        'Band 3 (1500 Hz): +3.0 dB, Q: 1.1',
        'Band 4 (3200 Hz): +7.0 dB, Q: 1.6',
        'Band 5 (8000 Hz): -5.0 dB, Q: 1.3',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-6), 64Hz(-3), 125Hz(+1), 250Hz(-2), 500Hz(0), 1k(+2), 2k(+4), 4k(+7), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -8; 32 -7; 64 -4; 125 2; 250 -3; 500 0; 1500 3; 3200 7; 4200 7; 8000 -5; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Linear Hipfire & Rapid Micro-Flick Curve',
      curveType: 'Linear with Zero Inner Deadzone',
      leftStickDeadzoneMin: '0.03 (3%)',
      rightStickDeadzoneMin: '0.02 (2%)',
      stickDeadzoneMax: '0.99',
      leftTriggerDeadzone: '0.00 (Instant Aim)',
      rightTriggerDeadzone: '0.00 (Hair Trigger)',
      horizontalSens: '350 (Horizontal Look) / 280 (Vertical Look)',
      verticalSens: 'Zoom Sens Multiplier: 55%',
      aimAssistType: 'Crosshair Magnetism & Snap Assist',
      steamConfigCode: 'steam://controllerconfig/2073850/the_finals_linear_hipfire_v1',
      ds4xmlSnippet: `<LeftDeadzone>3</LeftDeadzone><RightDeadzone>2</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'GameUserSettings.ini',
      targetPath: '%LOCALAPPDATA%/Discovery/Saved/Config/WindowsNoEditor/GameUserSettings.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — THE FINALS Unreal 5 High-FPS Config
[/Script/Discovery.DiscoveryGameUserSettings]
ResolutionQuality=100.000000
GlobalIlluminationQuality=0 // Disables Lumen compute overhead
ShadowQuality=0
PostProcessQuality=0
TextureQuality=2
EffectsQuality=0
FoliageQuality=0
NvidiaReflex=2 // On + Boost for sub-frame latency
RayTracing=0`,
      fpsTips: [
        'Set GlobalIlluminationQuality=0 to turn off software Lumen: this grants a massive 30-40% boost in frame consistency during skyscraper collapses.',
        'Use Nvidia Reflex On + Boost to prevent frame queues when Chaos destruction physics spike CPU utilization.',
        'Listen for the 3.2kHz peak in our EQ: this gives away the electrical buzz of cloaked Light shotgunners sneaking behind your team.',
      ],
    },
    recommendedGear: ['iem-truthear-zero', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'fortnite',
    title: 'Fortnite: Battle Royale',
    shortName: 'Fortnite',
    genre: 'Battle Royale / Build & Zero Build',
    engine: 'Unreal Engine 5.4 (Nanite/Lumen)',
    badge: '👑 Global Sensation',
    icon: '⛏️',
    bannerGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'Wood/brick/metal edit sound isolation, glider deploy whoosh dampener, and pro Linear 43% response curve.',
    audioProfile: {
      profileName: 'Building Piece Audio & Glider Whoosh Tamer',
      targetMix: 'Visualize Sound Effects + Crisp Stereo',
      description: 'Fortnite audio features loud storm roars and shockwave grenade blasts. This curve clears audio clutter to help you hear wall replacements, edit resets, and enemy glide drops.',
      bands: [
        { freq: '32Hz', gain: -5, type: 'Cut', label: 'Storm Eye Rumble Cut' },
        { freq: '64Hz', gain: -3, type: 'Cut', label: 'Vehicle Nitro Hum' },
        { freq: '125Hz', gain: 3, type: 'Boost', label: 'Enemy Sprint Footstep Base' },
        { freq: '250Hz', gain: -2, type: 'Cut', label: 'Explosion Clutter' },
        { freq: '500Hz', gain: 0, type: 'Flat', label: 'Chest Hum Vibrato' },
        { freq: '1.5kHz', gain: 4, type: 'Boost', label: 'Pickaxe Swing & Wall Damage Clang' },
        { freq: '3kHz', gain: 7, type: 'Peak', label: 'Building Placement & Edit Reset Click' },
        { freq: '4.5kHz', gain: 6, type: 'Peak', label: 'Glider Deploy & Shockwave Grenade' },
        { freq: '8.5kHz', gain: -5, type: 'Cut', label: 'Pump Shotgun Ear Piercing Cut' },
        { freq: '16kHz', gain: -2, type: 'Cut', label: 'Air Drop Whistle' },
      ],
      sonarValues: [
        'Band 1 (65 Hz): -3.0 dB, Q: 1.0',
        'Band 2 (125 Hz): +3.0 dB, Q: 1.3',
        'Band 3 (1500 Hz): +4.0 dB, Q: 1.2',
        'Band 4 (3000 Hz): +7.0 dB, Q: 1.5',
        'Band 5 (8500 Hz): -5.0 dB, Q: 1.4',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-4), 64Hz(-2), 125Hz(+2), 250Hz(-1), 500Hz(0), 1k(+2), 2k(+4), 4k(+6), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -6; 32 -5; 64 -3; 125 3; 250 -2; 500 0; 1500 4; 3000 7; 4500 6; 8500 -5; 16000 -2`,
    },
    controllerProfile: {
      profileName: 'Pro Linear 43% Speed with 5% Deadzones',
      curveType: 'Linear (Consistent Muscle Memory)',
      leftStickDeadzoneMin: '0.05 (5%)',
      rightStickDeadzoneMin: '0.05 (5%)',
      stickDeadzoneMax: '0.99',
      leftTriggerDeadzone: '0.00 (Instant Aim)',
      rightTriggerDeadzone: '0.00 (Hair Trigger)',
      horizontalSens: 'Look Speed: 43% / ADS Speed: 8%',
      verticalSens: 'Look Speed: 43% / ADS Speed: 8%',
      aimAssistType: '100% Aim Assist Strength (Linear Pull)',
      steamConfigCode: 'steam://controllerconfig/fortnite_linear_pro_43_v1',
      ds4xmlSnippet: `<LeftDeadzone>5</LeftDeadzone><RightDeadzone>5</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'GameUserSettings.ini',
      targetPath: '%LOCALAPPDATA%/FortniteGame/Saved/Config/WindowsClient/GameUserSettings.ini',
      fileContent: `// Dangling Dice Gaming Lab™ — Fortnite Performance Mode Config
[/Script/FortniteGame.FortGameUserSettings]
bShowGrass=False
bMotionBlur=False
bShowFPS=True
RenderingAPI=1 // Performance Mode (D3D11 Low-Memory)
bUseVSync=False
FrameRateLimit=240.000000
sg.ResolutionQuality=100.000000
sg.ViewDistanceQuality=2 // Epic or High for player models
sg.AntiAliasingQuality=0
sg.ShadowQuality=0
sg.PostProcessQuality=0
sg.TextureQuality=1
sg.EffectsQuality=0`,
      fpsTips: [
        'Always turn ON "Visualize Sound Effects" in Fortnite Audio Settings: it gives a 360-degree HUD radar for footsteps and gliders while keeping our EQ active.',
        'Use Performance Mode (RenderingAPI=1) to eliminate background rendering clutter and lower input delay by up to 15ms.',
        'Linear 43% Look speed is the undisputed standard used by over 80% of top competitive controller pros.',
      ],
    },
    recommendedGear: ['ctrl-dualsense-edge', 'ctrl-vader-4', 'grip-kontrolfreek'],
  },
  {
    id: 'arma-reforger',
    title: 'Arma Reforger',
    shortName: 'Arma Reforger',
    genre: 'Tactical MilSim Sandbox',
    engine: 'Bohemia Enfusion Engine',
    badge: '🎖️ Next-Gen MilSim',
    icon: '🪖',
    bannerGradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(15, 23, 42, 0.95))',
    summary: 'BTR diesel engine cut, supersonic bullet crack distance isolation, radio frequency clarity, and Enfusion config.',
    audioProfile: {
      profileName: 'Supersonic Crack Pinpointer & Diesel Engine Cut',
      targetMix: 'Tactical Stereo (48kHz Hi-Fi)',
      description: 'Enfusion engine audio models realistic speed-of-sound propagation. This curve silences BTR/LAV engine rumble while isolating supersonic bullet snaps and platoon radio clicks.',
      bands: [
        { freq: '32Hz', gain: -6, type: 'Cut', label: 'Mortar Blast Sub-Boom' },
        { freq: '64Hz', gain: -5, type: 'Cut', label: 'BTR / Supply Truck Diesel Drone' },
        { freq: '125Hz', gain: 0, type: 'Flat', label: 'Gravel Footstep Thud' },
        { freq: '250Hz', gain: -3, type: 'Cut', label: 'Exhaust Mud' },
        { freq: '500Hz', gain: 2, type: 'Boost', label: 'Von Platoon Radio Static' },
        { freq: '1.2kHz', gain: 4, type: 'Boost', label: 'Magazine Reload & Bolt Lock' },
        { freq: '2.8kHz', gain: 6, type: 'Peak', label: 'Tree Branch & Bush Movement' },
        { freq: '4.8kHz', gain: 8, type: 'Peak', label: 'Supersonic Bullet Snaps' },
        { freq: '8.5kHz', gain: -5, type: 'Cut', label: 'Unsuppressed PKM / M16 Ear Blast' },
        { freq: '16kHz', gain: -3, type: 'Cut', label: 'Island Wind Mask' },
      ],
      sonarValues: [
        'Band 1 (60 Hz): -5.0 dB, Q: 1.1',
        'Band 2 (500 Hz): +2.0 dB, Q: 1.0',
        'Band 3 (1200 Hz): +4.0 dB, Q: 1.2',
        'Band 4 (4800 Hz): +8.0 dB, Q: 1.8',
        'Band 5 (8500 Hz): -5.0 dB, Q: 1.3',
      ],
      dolbyValues: 'Surround Virtualizer: OFF | Volume Leveler: OFF | EQ: 32Hz(-5), 64Hz(-4), 125Hz(0), 250Hz(-2), 500Hz(+1), 1k(+3), 2k(+5), 4k(+7), 8k(-4), 16k(-2)',
      peaceConfig: `GraphicEQ: 20 -7; 32 -6; 64 -5; 125 0; 250 -3; 500 2; 1200 4; 2800 6; 4800 8; 8500 -5; 16000 -3`,
    },
    controllerProfile: {
      profileName: 'Enfusion Steady Aim & Vehicle Analog Steering',
      curveType: 'Linear with High-Center Precision',
      leftStickDeadzoneMin: '0.06 (6%)',
      rightStickDeadzoneMin: '0.04 (4%)',
      stickDeadzoneMax: '0.96',
      leftTriggerDeadzone: '0.02 (Focus View)',
      rightTriggerDeadzone: '0.00 (Hair Trigger Fire)',
      horizontalSens: '32% Sensitivity / ADS 18%',
      verticalSens: '28% Sensitivity / ADS 16%',
      aimAssistType: 'Zero Aim Assist (Full Ballistic Trajectory)',
      steamConfigCode: 'steam://controllerconfig/1874880/arma_reforger_steady_milsim_v1',
      ds4xmlSnippet: `<LeftDeadzone>6</LeftDeadzone><RightDeadzone>4</RightDeadzone><SensitivityCurve>Linear</SensitivityCurve>`,
    },
    configProfile: {
      fileName: 'ArmaReforger.json',
      targetPath: 'Documents/My Games/ArmaReforger/profile/ArmaReforger.json',
      fileContent: `// Dangling Dice Gaming Lab™ — Arma Reforger Enfusion Performance Preset
{
  "Audio": {
    "OutputMode": "HeadphonesStereo",
    "SampleRate": 48000,
    "MaxAudioChannels": 128,
    "RadioVolume": 1.0,
    "EnvironmentVolume": 0.85
  },
  "Video": {
    "Resolution": "1920x1080",
    "WindowMode": "Borderless",
    "VSync": false,
    "GrassDistance": 50, // Prevents foliage lag in deep forests
    "VolumetricClouds": "Low",
    "ShadowQuality": "Low",
    "PostProcessQuality": "Low"
  }
}`,
      fpsTips: [
        'Enfusion engine calculates realistic bullet crack propagation: listen for the 4.8kHz crack to know a round flew past your head, then turn toward the dull muzzle thud.',
        'Set GrassDistance to 50 in heavy Everon forest zones to recover 15-20 FPS without losing enemy visibility.',
        'Always set MaxAudioChannels to 128 to ensure proximity radio and vehicle engine audio don’t drop out in 64-player server battles.',
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
    id: 'omnisound-suite',
    name: 'OmniSound Suite™',
    category: '360° Spatial Audio Radar & Hearing Protection',
    price: '100% Free • Standalone Windows App',
    license: 'Dangling Dice Studios™',
    icon: '🎯',
    badge: '👑 Official In-House Flagship',
    downloadUrl: 'https://github.com/jacobyancey-bit/dangling-dice-website/releases/download/v1.0.0-omnisound/AudioRadarSuite.exe',
    officialSite: 'https://games.dangling-dice-studios.com/#omniSoundSection',
    version: 'v1.0.0 (Windows 10/11 x64)',
    description: 'Our all-in-one in-house desktop application that replaces Equalizer APO, Peace GUI, and SoundSight ($12) with a unified, lightweight HUD overlay. Delivers real-time 360° spatial directional audio radar, color-coded sound classification, and an intelligent hearing protection compressor.',
    whyNeedIt: 'Skip the 50 cryptic sliders and broken config files of legacy software. OmniSound Suite captures game audio directly via zero-latency Windows WASAPI loopback with 100% anti-cheat safety (no DLL injection, zero game memory reads).',
    steps: [
      'Download <strong>AudioRadarSuite.exe</strong> directly from our verified GitHub Release.',
      'No complicated installer or driver patching required: launch the standalone executable.',
      'Select your active gaming playback audio device from the top dropdown.',
      'Choose your preferred HUD Radar Overlay style (360° Circular Radar, Compass Ribbon, Threat Edge Arcs, or Minimalist Dots).',
      'Toggle <strong>Hearing Protection</strong> to tame deafening muzzle blasts while boosting subtle enemy footstep transients.',
    ],
    troubleshooting: [
      'OmniSound runs as an ultra-light transparent HUD overlay (`WS_EX_TRANSPARENT`), allowing full mouse click-through in borderless windowed games.',
      'Ensure your game audio output is configured to 5.1/7.1 surround or 48kHz stereo for maximum directional accuracy.',
    ],
  },
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

