export type RideInput = {
  throttle: number;
  brakeReverse: number;
  steer: number;
  reset: boolean;
};

export const EMPTY_RIDE_INPUT: RideInput = {
  throttle: 0,
  brakeReverse: 0,
  steer: 0,
  reset: false,
};
