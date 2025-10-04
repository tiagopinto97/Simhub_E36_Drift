// ------------------------------ Run Once Javascript

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


const RPM_SAMPLE_COUNT = 11;
const RPM_VALUES = [1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const RPM_FREQS = [31, 31, 45, 79, 110, 141, 178, 206, 224, 255, 283];

const SPEED_SAMPLE_COUNT = 30;
const SPEED_VALUES = [17, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300];
const SPEED_FREQS = [
  17, // 10
  23, // 20
  35, // 30
  46,// 40
  60,// 50
  71,// 60
  84,// 70
  96,// 80
  110,// 90
  123, // 100
  136, // 110
  150,// 120
  163,// 130
  174,// 140
  185, //150
  200,// 160
  212,// 170
  226,// 180
  238,// 190
  250, // 200
  265,// 210
  278,// 220
  290,// 230
  304,// 240 
  318,// 250
  331,// 260
  344,// 270
  356,// 280
  368,// 290
  380,// 300
];


function generateFrequency(value, VALUES, FREQS, SAMPLE_COUNT) {
  if (value <= 0) {
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


// ------------------------------ Javascript

const SPEED = $prop('SpeedKmh');
const RPMS = $prop('Rpms');
const CURRENT_CAR_ID = $prop('CarId');
const BRAKE = $prop('Brake');
let reportRpm = 0;

// RPM Processing
reportRpm = RPMS * RPM_RATIO;

// Reset every "Constant" if CarId changes
if (CAR_ID != CURRENT_CAR_ID) {
  CAR_ID = CURRENT_CAR_ID;
  IS_CAR_RWD = null;
  RPM_RATIO = 1;
  GAME_CODE_ID = -1;
  MAX_RPM = 10000;
  SPEED_RATIO = 1;
}


if (GAME_CODE_ID === -1) {
  // Detect wich game is playing
  let gameIndex = 0;
  while (GAME_CODE_ID === -1 && gameIndex < Object.keys(GAME_CODE_PROPS).length) {
    if ($prop(GAME_CODE_PROPS[gameIndex].fl) != null) {
      GAME_CODE_ID = gameIndex;
    }
    gameIndex++;
  }
  // On this check just send the speedKmh to avoid multiple if's
  return `${SPEED};${reportRpm};`;
} else {
  // Calculate based on selected game
  
  let frontSpeed = 0;
  let rearSpeed = 0;
  let reportSpeed = 0;
  if (!IS_CAR_RWD || IS_CAR_RWD === null) {
    frontSpeed = Math.max(
      Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].fl)),
      Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].fr)),
    );
  }
  if (IS_CAR_RWD || IS_CAR_RWD === null) {
    rearSpeed = Math.max(
      Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].rl)),
      Math.abs($prop(GAME_CODE_PROPS[GAME_CODE_ID].rr)),
    );
  }

  // Validate if car is RWD only if it's moving and handbrake is not on
  if (IS_CAR_RWD == null && SPEED > 2 && !($prop('JoystickPlugin.handbrake_Slider0') > 0) &&  BRAKE < 0.1) {
    MAX_RPM = $prop('MaxRpm');
    RPM_RATIO = (MAX_RPM > 10000) ? 10000 / MAX_RPM : (MAX_RPM < 3000 /*Euro Truck Simulator 2 */) ? 7500 / MAX_RPM  : 1;
    IS_CAR_RWD = rearSpeed > frontSpeed;
  }

	// Generate the report speed based on driven wheels
	const angularSpeed = ((IS_CAR_RWD) ? rearSpeed : frontSpeed);
	reportSpeed = angularSpeed * SPEED_RATIO;
	const diff = SPEED - reportSpeed;
	
	// Calculate speed ratio (IF SPEED is above rearSpeed)
	if ( BRAKE < 0.1 && SPEED > 50 && angularSpeed > 30 && SPEED_RATIO < 1.2 && diff > 2 && diff < 5 ) {
		const NEW_SPD_RATIO = SPEED / angularSpeed;
		if (NEW_SPD_RATIO < 1.3 && NEW_SPD_RATIO - SPEED_RATIO < 0.05) {
			SPEED_RATIO = NEW_SPD_RATIO;
			reportSpeed =  angularSpeed * SPEED_RATIO
		}
	}  


const speedFreq = generateFrequency((reportSpeed % SPEED_SPLIT).toFixed(0), SPEED_VALUES, SPEED_FREQS, SPEED_SAMPLE_COUNT);
const rpmFreq = generateFrequency(reportRpm, RPM_VALUES, RPM_FREQS, RPM_SAMPLE_COUNT);


 return `${speedFreq};${rpmFreq};`;
}
