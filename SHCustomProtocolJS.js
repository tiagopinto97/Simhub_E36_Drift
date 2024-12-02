// Variables to send to arduino
var reportSpeed = 0;
var reportRpm = 0;

// Speed Processing
const handbrakeOn = $prop('JoystickPlugin.handbrake_Slider0') > 0;
const speed = $prop('SpeedKmh');

// ForzaHorizon5, Assetto Corsa, EA SPORTS WRC
const flspeed = Math.max($prop('GameRawData.WheelRotationSpeedFrontLeft'), $prop('GameRawData.Physics.WheelAngularSpeed01'), $prop('GameRawData.SessionUpdate.vehicle_cp_forward_speed_fl'), 0);
const frspeed = Math.max($prop('GameRawData.WheelRotationSpeedFrontRight'), $prop('GameRawData.Physics.WheelAngularSpeed02'), $prop('GameRawData.SessionUpdate.vehicle_cp_forward_speed_fr'), 0);
const rlspeed = Math.max($prop('GameRawData.WheelRotationSpeedRearLeft'), $prop('GameRawData.Physics.WheelAngularSpeed03'), $prop('GameRawData.SessionUpdate.vehicle_cp_forward_speed_bl'), 0);
const rrspeed = Math.max($prop('GameRawData.WheelRotationSpeedRearRight'), $prop('GameRawData.Physics.WheelAngularSpeed04'), $prop('GameRawData.SessionUpdate.vehicle_cp_forward_speed_br'), 0);

// Validate if car is RWD only if it's moving and handbrake is not on
if (speed > 5 && !handbrakeOn) {
  IS_CAR_RWD = Math.max(rlspeed, rrspeed) > Math.max(flspeed, frspeed);
}

// Generate the report speed (If RWD and handbrake on, use only rear wheels, else)
if (IS_CAR_RWD && handbrakeOn) {
  reportSpeed = Math.max(rlspeed, rrspeed);
} else {
  const wheelSpeed = Math.max(flspeed, frspeed, rlspeed, rrspeed);
  reportSpeed = (wheelSpeed > 0) ? wheelSpeed : speed; // speed is a falback for unsupported games  
}


// RPM Processing
const maxrpms = $prop('MaxRpm');
const rpms = $prop('Rpms');

const ratio = (maxrpms > 10000) ? 10000 / maxrpms : 1;

reportRpm = rpms * ratio;

return `${reportSpeed};${reportRpm};`; 
