import { Player, PlayerId, PlayerProfile } from './types';

/**
 * Baseline player cards. Jersey number and slogan can be edited in the app —
 * those overrides live in the `player_profiles` table and are applied by
 * `applyProfiles` below.
 */
export const PLAYERS: Record<PlayerId, Player> = {
  carl: {
    id: 'carl',
    name: 'Carl',
    slogan: 'The Rocket',
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
    slogan: 'The Slugger',
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

/** "CARL 'THE ROCKET'" — falls back to just the name when there's no slogan. */
export function displayName(player: Player): string {
  const slogan = player.slogan.trim();
  return slogan ? `${player.name.toUpperCase()} '${slogan.toUpperCase()}'` : player.name.toUpperCase();
}

/** Overlay saved profile edits on top of the baseline players. */
export function applyProfiles(profiles: PlayerProfile[]): Record<PlayerId, Player> {
  const out = {} as Record<PlayerId, Player>;
  for (const id of PLAYER_ORDER) {
    const base = PLAYERS[id];
    const profile = profiles.find((p) => p.playerId === id);
    out[id] = profile
      ? { ...base, number: profile.number ?? base.number, slogan: profile.slogan ?? base.slogan }
      : base;
  }
  return out;
}
