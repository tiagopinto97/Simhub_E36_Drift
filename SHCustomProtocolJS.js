// RUN ONCE JAVASCRIPT CODE
var IS_CAR_RWD = null;
var RPM_RATIO = 1;
var MAX_RPM = 10000;
var CAR_ID = '';
var GAME_CODE_ID = -1;
var SPEED_RATIO = 1;
const SPEED_SPLIT = 300;

const GAME_CODE_PROPS = [
  { //Forza Horizon 5
    fl: 'GameRawData.WheelRotationSpeedFrontLeft',
    fr: 'GameRawData.WheelRotationSpeedFrontRight',
    rl: 'GameRawData.WheelRotationSpeedRearLeft',
    rr: 'GameRawData.WheelRotationSpeedRearRight'
  },
  { // Assetto Corsa
    fl: 'GameRawData.Physics.WheelAngularSpeed01',
    fr: 'GameRawData.Physics.WheelAngularSpeed02',
    rl: 'GameRawData.Physics.WheelAngularSpeed03',
    rr: 'GameRawData.Physics.WheelAngularSpeed04'
  },
  { // EA SPORTS WRC
    fl: 'GameRawData.SessionUpdate.vehicle_cp_forward_speed_fl',
    fr: 'GameRawData.SessionUpdate.vehicle_cp_forward_speed_fr',
    rl: 'GameRawData.SessionUpdate.vehicle_cp_forward_speed_bl',
    rr: 'GameRawData.SessionUpdate.vehicle_cp_forward_speed_br',
    fl: 'SpeedKmh', // Override FL, because forward speed is bad here
  }
];


const RPM_SAMPLE_COUNT = 12;
const RPM_VALUES = [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const RPM_FREQS = [
  31,  // 0.5
  32,  // 1 
  46,  // 1.5
  58,  // 2
  85,  // 3
  114, // 4
  141, // 5
  166, // 6
  194, // 7
  221, // 8
  250, // 9
  277 //10
];

const SPEED_SAMPLE_COUNT = 6;
const SPEED_VALUES = [10, 50, 100, 200, 220, 300];
const SPEED_FREQS = [22,85,158,314,340,420 ];


function generateFrequency(value, VALUES, FREQS, SAMPLE_COUNT) {
  if (value <= VALUES[0]) {
    return 0; // Equivalent to pinTone.stop()
  } else if (value >= VALUES[SAMPLE_COUNT - 1]) {
    return FREQS[SAMPLE_COUNT - 1];
  } else {
    for (let i = 0; i < SAMPLE_COUNT - 1; i++) {
      if (value < VALUES[i + 1]) {
        const diffValue = value - VALUES[i];
        const diffFreq = FREQS[i + 1] - FREQS[i];
        const valueGap = VALUES[i + 1] - VALUES[i];
        return FREQS[i] + (diffFreq * diffValue) / valueGap;
      }
    }
  }

  return 0; // Fallback, should never reach here
}


function makeReturn(speed, rpm) {
	const speedFreq = generateFrequency(speed, SPEED_VALUES, SPEED_FREQS, SPEED_SAMPLE_COUNT);
const rpmFreq = generateFrequency(rpm, RPM_VALUES, RPM_FREQS, RPM_SAMPLE_COUNT);

	  //return `${speed};${rpmFreq};`; 
  return `${speedFreq};${rpmFreq};`;
}

// JAVASCRIPT
const SPEED = $prop('SpeedKmh');
const RPMS = $prop('Rpms');
const CURRENT_CAR_ID = $prop('CarId');
const BRAKE = $prop('Brake');
var reportRpm = 0;

// RPM Processing
reportRpm = RPMS * RPM_RATIO;

// Reset every "Constant" if CarId changes
if (CAR_ID != CURRENT_CAR_ID) {
  CAR_ID = CURRENT_CAR_ID;
  IS_CAR_RWD = null;
  GAME_CODE_ID = -1;
  SPEED_RATIO = 1;
  MAX_RPM = $prop('MaxRpm') ?? $prop('CarSettings_MaxRPM');
  RPM_RATIO = (MAX_RPM > 10000) ? 10000 / MAX_RPM : (MAX_RPM < 3000 /*Euro Truck Simulator 2 */) ? 7500 / MAX_RPM  : 1;

}


if (GAME_CODE_ID === -1) {
  // Detect wich game is playing
  var gameIndex = 0;
  while (GAME_CODE_ID === -1 && gameIndex < Object.keys(GAME_CODE_PROPS).length) {
    if ($prop(GAME_CODE_PROPS[gameIndex].fl) != null) {
      GAME_CODE_ID = gameIndex;
    }
    gameIndex++;
  }
  // On this check just send the speedKmh to avoid multiple if's
  return makeReturn(SPEED, reportRpm);
} else {
  // Calculate based on selected game
  var reportSpeed = 0;
  var frontSpeed = Math.max(
    Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].fl)),
    Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].fr)),
  );
  var rearSpeed = Math.max(
    Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].rl)),
    Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].rr)),
  );
  
  // Validate if car is RWD only if it's moving and handbrake is not on
  if (SPEED > 2 && $prop('JoystickPlugin.handbrake_Slider0') < 1 &&  BRAKE < 0.1) {
    IS_CAR_RWD = rearSpeed > frontSpeed;
  }

	
	// Calculate speed ratio (IF SPEED is diff from report speed and wheels are not spinning (rearSpeed near frontSpeed))
	const diff = Math.abs(rearSpeed - frontSpeed);
	const angularSpeed = ((IS_CAR_RWD) ? rearSpeed : frontSpeed);
	if ( BRAKE < 0.1 && SPEED > 30 &&  diff < 2 ) {
		const NEW_SPD_RATIO = SPEED / angularSpeed;
		if (Math.abs(NEW_SPD_RATIO - SPEED_RATIO) > 0.02) {
			SPEED_RATIO = NEW_SPD_RATIO;
		}
	}  

	// Generate the report speed based on driven wheels
	reportSpeed = angularSpeed * SPEED_RATIO;
	return makeReturn((reportSpeed % SPEED_SPLIT).toFixed(0), reportRpm);

}
