export interface Participant {
  id: string; // usually employee ID or generated UUID
  name: string;
  department?: string;
  avatar?: string;
}

export interface Prize {
  id: string;
  name: string;
  count: number; // Total number of winners for this prize
  image?: string;
  level: number; // 1 being highest (Grand Prize), etc.
}

export interface Winner {
  id: string; // Winner record ID
  participant: Participant;
  prizeId: string;
  timestamp: number;
}

export interface RiggedRule {
  prizeId: string;
  participantId: string; // The specific person who MUST win this prize
}

export interface LotteryState {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  riggedRules: RiggedRule[];
  currentPrizeId: string | null;
  isLotteryRunning: boolean;
}

export type Action =
  | { type: 'IMPORT_PARTICIPANTS'; payload: Participant[] }
  | { type: 'ADD_PRIZE'; payload: Prize }
  | { type: 'UPDATE_PRIZE'; payload: Prize }
  | { type: 'DELETE_PRIZE'; payload: string }
  | { type: 'SET_CURRENT_PRIZE'; payload: string }
  | { type: 'ADD_WINNERS'; payload: Winner[] }
  | { type: 'ADD_RIGGED_RULE'; payload: RiggedRule }
  | { type: 'REMOVE_RIGGED_RULE'; payload: { prizeId: string; participantId: string } }
  | { type: 'RESET_WINNERS' }
  | { type: 'RESET_ALL' };
