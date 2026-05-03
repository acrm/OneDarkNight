# Game Logic — One Dark Night

## Objective
Survive 5 days without breaking the rules.

## World Rules
1. Never approach scientist neighbor < 15 meters
2. Do not look through the peephole at night
3. Around 02:30 do not look in the bathroom mirror
4. If TV starts horror flicker, do not turn it off
5. At 01:00 knock event: salt is the safest response
6. 02:00–03:00 front door is blocked

## Threat and Consequences
- Mixed consequence model is active:
	- instant fatal
	- deferred fatal
	- escalation (threat increase)
	- reversible branch (mitigation action)
- Runtime state tracks:
	- `threatLevel` (0..3)
	- `threatStage` (`calm`/`uneasy`/`hostile`/`breach`)
	- `doomCounter` for delayed lethal chains
	- `consequenceLog` (recent consequence journal)

## TV System
- Day/early scenes: mostly normal signal with foreshadowing
- Night scenes: TV can activate by itself
- Horror and entity-breach events are represented in scenes via `tvEvent`
- Breaking the TV rule can escalate threat or kill instantly in breach scenes

## Entities
- Entities can breach through TV scenes in late-night sequences
- Player survival requires waiting/hiding rather than forcing power-off

## Items and Resources
- Daytime gathering loop is expanded:
	- useful: salt, food, milk
	- atmospheric: old book, living-gun hint
	- experimental: bracelet
- Day resources unlock/alter night options and outcomes

## Rulebook
- Player starts with the item: тетрадь с правилами
- Rulebook opens from inventory via a dedicated Open button
- The reader supports page-by-page navigation (Back/Forward)
- Current page indicator is shown in the modal
- The modal closes by close button or backdrop click

## House Navigation
- Scene metadata includes room context:
	- `roomId`
	- `nearbyRooms`
- UI now displays current room and nearby rooms as navigation context

## Win/Lose
- **Win**: Survive Day 5 by correct hiding and rule compliance
- **Lose** examples:
	- peephole violation at night
	- father opens the door
	- scientist distance violation
	- bracelet misuse
	- TV power-off during entity breach
	- deferred mirror payoff
