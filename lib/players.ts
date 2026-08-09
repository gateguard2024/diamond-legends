import { Player, PlayerId } from './types';

export const PLAYERS: Record<PlayerId, Player> = {
  carl: {
    id: 'carl',
    name: 'Carl',
    nickname: "CARL 'THE ROCKET'",
    number: 7,
    age: 9,
    division: '9U',
    accent: {
      from: 'from-orange-500',
      to: 'to-amber-300',
      text: 'text-orange-300',
      border: 'border-orange-600/50',
      ring: 'ring-orange-500/40',
    },
  },
  austin: {
    id: 'austin',
    name: 'Austin',
    nickname: "AUSTIN 'THE SLUGGER'",
    number: 3,
    age: 10,
    division: '10U',
    accent: {
      from: 'from-cyan-500',
      to: 'to-sky-300',
      text: 'text-cyan-300',
      border: 'border-cyan-600/50',
      ring: 'ring-cyan-500/40',
    },
  },
};

export const PLAYER_ORDER: PlayerId[] = ['carl', 'austin'];
