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


// JAVASCRIPT
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

  return `${(reportSpeed % SPEED_SPLIT).toFixed(0)};${reportRpm};`;
}
