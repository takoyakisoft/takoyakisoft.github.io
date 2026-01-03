class_name GameData
extends Node

const MAX_RELIC_SLOTS := 6
const MAX_ATTACK_RELICS := 6
const MAX_STAT_RELICS := 6
const MAX_RELIC_LEVEL := 15

const GEM_TYPES := [
	{
		"id": "green",
		"value": 1,
		"color": Color("4ddc5b"),
		"weight": 50,
	},
	{
		"id": "blue",
		"value": 5,
		"color": Color("4aa3ff"),
		"weight": 30,
	},
	{
		"id": "red",
		"value": 20,
		"color": Color("ff4a4a"),
		"weight": 12,
	},
	{
		"id": "purple",
		"value": 50,
		"color": Color("b44aff"),
		"weight": 6,
	},
	{
		"id": "silver",
		"value": 100,
		"color": Color("d6e2f2"),
		"weight": 1,
	},
	{
		"id": "gold",
		"value": 300,
		"color": Color("ffd24a"),
		"weight": 1,
	},
]

const ITEM_TYPES := {
	"wipe_enemies":
	{
		"name": "殲滅コア",
		"description": "ボス以外の敵をすべて撃破",
		"color": Color("ffcf4a"),
	},
	"collect_xp":
	{
		"name": "収集ドローン",
		"description": "全ての経験値を取得",
		"color": Color("4ad9ff"),
	},
	"currency":
	{
		"name": "クレジット拾得",
		"description": "ゲーム内通貨 +50",
		"color": Color("9cff73"),
	},
}

const RELICS := {
	"pistol":
	{
		"name": "ピストル",
		"type": "weapon",
		"category": "attack",
		"description": "近い敵へ自動射撃。威力と連射が伸びる。",
		"stats":
		{
			"damage": 6.0,
			"cooldown": 0.55,
			"bullets": 1,
			"crit": 0.05,
		},
		"per_level":
		{
			"damage": 1.6,
			"cooldown": - 0.03,
			"bullets": 0.3,
			"crit": 0.01,
		},
	},
	"sword":
	{
		"name": "剣",
		"type": "weapon",
		"category": "attack",
		"description": "周囲に斬撃を発生。範囲と威力が成長。",
		"stats":
		{
			"damage": 10.0,
			"cooldown": 1.4,
			"radius": 70.0,
			"duration": 0.25,
			"crit": 0.05,
		},
		"per_level":
		{
			"damage": 5.0,
			"cooldown": - 0.05,
			"radius": 4.0,
			"duration": 0.01,
			"crit": 0.01,
		},
	},
	"magnet":
	{
		"name": "マグネットコア",
		"type": "utility",
		"category": "stat",
		"description": "経験値の回収半径が広がる。",
		"stats":
		{
			"pickup_bonus": 0.25,
		},
		"per_level":
		{
			"pickup_bonus": 0.15,
		},
	},
	"vitality":
	{
		"name": "バイタリティ",
		"type": "passive",
		"category": "stat",
		"description": "最大HPとシールドを増加。",
		"stats":
		{
			"max_hp_bonus": 10.0,
		},
		"per_level":
		{
			"max_hp_bonus": 6.0,
		},
	},
	"momentum":
	{
		"name": "モメンタム",
		"type": "passive",
		"category": "stat",
		"description": "移動速度が上昇。",
		"stats":
		{
			"move_speed_bonus": 12.0,
		},
		"per_level":
		{
			"move_speed_bonus": 6.0,
		},
	},
	"shield_core":
	{
		"name": "シールドコア",
		"type": "passive",
		"category": "stat",
		"description": "シールド回復速度が上昇。",
		"stats":
		{
			"shield_regen": 2.0,
		},
		"per_level":
		{
			"shield_regen": 1.0,
		},
	},
	"aegis":
	{
		"name": "エギスフィールド",
		"type": "active",
		"category": "stat",
		"description": "一定間隔で数秒間無敵化。",
		"stats":
		{
			"cooldown": 18.0,
			"invincibility_duration": 2.5,
		},
		"per_level":
		{
			"cooldown": - 0.4,
			"invincibility_duration": 0.25,
		},
	},
	"gravity_well":
	{
		"name": "グラビティコア",
		"type": "active",
		"category": "attack",
		"description": "敵を衛星軌道に引き寄せて吹き飛ばす。",
		"stats":
		{
			"cooldown": 9.0,
			"gravity_radius": 240.0,
			"orbit_radius": 120.0,
			"orbit_duration": 2.4,
			"orbit_speed": 260.0,
			"fling_speed": 420.0,
			"fling_damage": 10.0,
		},
		"per_level":
		{
			"cooldown": - 0.35,
			"gravity_radius": 12.0,
			"orbit_radius": 4.0,
			"orbit_duration": 0.12,
			"orbit_speed": 10.0,
			"fling_speed": 14.0,
			"fling_damage": 1.4,
		},
	},
	"viral_chain":
	{
		"name": "ウィルス連鎖",
		"type": "passive",
		"category": "attack",
		"description": "攻撃がウィルス感染し、周囲へ連鎖する。",
		"stats":
		{
			"virus_chance": 0.2,
			"virus_damage": 4.0,
			"virus_radius": 90.0,
			"virus_chain": 1.0,
			"virus_tick": 0.7,
			"virus_duration": 5.0,
		},
		"per_level":
		{
			"virus_chance": 0.03,
			"virus_damage": 1.2,
			"virus_radius": 6.0,
			"virus_chain": 0.2,
			"virus_tick": - 0.02,
			"virus_duration": 0.3,
		},
	},
	"berserker":
	{
		"name": "バーサーク",
		"type": "active",
		"category": "attack",
		"description": "周期的に無敵化して殴り掛かる。",
		"stats":
		{
			"cooldown": 12.0,
			"invincibility_duration": 1.4,
			"damage": 16.0,
			"radius": 75.0,
			"duration": 0.25,
		},
		"per_level":
		{
			"cooldown": - 0.45,
			"invincibility_duration": 0.1,
			"damage": 3.5,
			"radius": 4.0,
			"duration": 0.01,
		},
	},
	"necromancer":
	{
		"name": "ネクロマンサー",
		"type": "passive",
		"category": "attack",
		"description": "敵撃破時に使役する。",
		"stats":
		{
			"minion_chance": 1.0,
			"minion_damage": 7.0,
			"minion_speed": 140.0,
			"minion_duration": 8.0,
			"minion_hp": 30.0,
			"minion_cap": 3.0,
		},
		"per_level":
		{
			"minion_chance": 0.0,
			"minion_damage": 1.6,
			"minion_speed": 6.0,
			"minion_duration": 0.4,
			"minion_hp": 3.0,
			"minion_cap": 0.2,
		},
	},
	"tentacle_drop":
	{
		"name": "タコ足コア",
		"type": "active",
		"category": "attack",
		"description": "触腕で敵を止めて攻撃。倒すとドロップ率が上がる。",
		"stats":
		{
			"cooldown": 7.5,
			"damage": 7.0,
			"radius": 95.0,
			"duration": 0.2,
			"tentacle_stun": 0.9,
			"tentacle_mark_duration": 3.0,
			"tentacle_drop_bonus": 0.18,
			"item_drop_bonus": 0.04,
		},
		"per_level":
		{
			"cooldown": - 0.25,
			"damage": 1.3,
			"radius": 4.0,
			"duration": 0.01,
			"tentacle_stun": 0.05,
			"tentacle_mark_duration": 0.2,
			"tentacle_drop_bonus": 0.02,
			"item_drop_bonus": 0.01,
		},
	},
}

const CHARACTERS := {
	"gravecaller":
	{
		"name": "グレイヴコーラー",
		"description": "屍を従える。ピストル/剣/ネクロマンサー装備。",
		"base_hp": 100.0,
		"base_speed": 215.0,
		"starting_relics": ["pistol", "sword", "necromancer"],
		"menu_order": 0,
	},
	"graviton":
	{
		"name": "グラビトン",
		"description": "重力制御。ピストル/剣/グラビティコア装備。",
		"base_hp": 105.0,
		"base_speed": 210.0,
		"starting_relics": ["pistol", "sword", "gravity_well"],
		"menu_order": 1,
	},
	"viralist":
	{
		"name": "ヴァイラリスト",
		"description": "感染拡散。ピストル/剣/ウィルス連鎖装備。",
		"base_hp": 95.0,
		"base_speed": 220.0,
		"starting_relics": ["pistol", "sword", "viral_chain"],
		"menu_order": 2,
	},
	"kraken":
	{
		"name": "クラーケン",
		"description": "触腕の加護。ピストル/剣/タコ足コア装備。",
		"base_hp": 110.0,
		"base_speed": 205.0,
		"starting_relics": ["pistol", "sword", "tentacle_drop"],
		"menu_order": 3,
	},
	"ironfist":
	{
		"name": "アイアンフィスト",
		"description": "無敵殴打。ピストル/剣/バーサーク装備。",
		"base_hp": 115.0,
		"base_speed": 205.0,
		"starting_relics": ["pistol", "sword", "berserker"],
		"menu_order": 4,
	},
}

const STAGES := {
	"forest":
	{
		"name": "翠森域",
		"description": "静かな森。敵はやや柔らかい。",
		"enemy_hp_multiplier": 0.95,
		"enemy_damage_multiplier": 0.9,
		"enemy_speed_multiplier": 0.95,
		"enemy_tint": Color("4fbf7a"),
		"boss_tint": Color("6fe6a0"),
		"boss_hp_multiplier": 1.0,
		"boss_damage_multiplier": 1.0,
		"boss_speed_multiplier": 1.0,
		"menu_order": 0,
	},
	"volcano":
	{
		"name": "灼熱火口",
		"description": "火山地帯。敵の攻撃が重い。",
		"enemy_hp_multiplier": 1.1,
		"enemy_damage_multiplier": 1.25,
		"enemy_speed_multiplier": 1.0,
		"enemy_tint": Color("ff6b4a"),
		"boss_tint": Color("ff8d4a"),
		"boss_hp_multiplier": 1.2,
		"boss_damage_multiplier": 1.3,
		"boss_speed_multiplier": 1.05,
		"menu_order": 1,
	},
	"water":
	{
		"name": "深淵水界",
		"description": "水域。敵の数が多く速い。",
		"enemy_hp_multiplier": 0.9,
		"enemy_damage_multiplier": 1.0,
		"enemy_speed_multiplier": 1.2,
		"enemy_tint": Color("4aa3ff"),
		"boss_tint": Color("6fc0ff"),
		"boss_hp_multiplier": 0.95,
		"boss_damage_multiplier": 1.05,
		"boss_speed_multiplier": 1.15,
		"menu_order": 2,
	},
}


static func get_stage_data(stage_id: String) -> Dictionary:
	return STAGES.get(stage_id, STAGES["forest"])

static func get_relic_stats(relic_id: String, level: int) -> Dictionary:
	var relic = RELICS.get(relic_id, {})
	var stats = relic.get("stats", {}).duplicate(true)
	var per_level = relic.get("per_level", {})
	var scaled_level = max(level - 1, 0)
	for key in per_level.keys():
		stats[key] = stats.get(key, 0.0) + per_level[key] * scaled_level
	if stats.has("cooldown"):
		stats["cooldown"] = max(stats["cooldown"], 0.1)
	if stats.has("duration"):
		stats["duration"] = max(stats["duration"], 0.05)
	return stats


static func get_random_gem_type() -> Dictionary:
	var total_weight = 0
	for gem in GEM_TYPES:
		total_weight += gem.weight
	var roll = randi() % total_weight
	var current = 0
	for gem in GEM_TYPES:
		current += gem.weight
		if roll < current:
			return gem
	return GEM_TYPES[0]


static func get_wave_index(time_elapsed: float) -> int:
	return int(floor(time_elapsed / 30.0)) + 1


static func get_wave_settings(wave: int) -> Dictionary:
	var settings := {
		"spawn_enabled": true,
		"spawn_rate": 1.0,
		"enemy_hp_multiplier": 1.0,
		"enemy_damage_multiplier": 1.0,
		"enemy_speed_multiplier": 1.0,
		"boss": false,
	}

	if wave == 11:
		settings.spawn_enabled = true
		settings.spawn_rate = 1.0
		settings.enemy_hp_multiplier = 5.0
		settings.enemy_damage_multiplier = 5.0
		settings.enemy_speed_multiplier = 1.3
		settings.boss = true
		return settings
	if wave == 12:
		settings.spawn_enabled = false
		return settings
	if wave >= 13:
		settings.spawn_enabled = true
		settings.spawn_rate = 0.35
		settings.enemy_hp_multiplier = 8.0 + (wave - 13) * 0.8
		settings.enemy_damage_multiplier = 6.0 + (wave - 13) * 0.6
		settings.enemy_speed_multiplier = 1.4 + (wave - 13) * 0.05
		return settings

	if wave < 6:
		settings.spawn_rate = max(0.8 - (wave - 1) * 0.05, 0.5)
		settings.enemy_hp_multiplier = 1.0 + (wave - 1) * 0.25
	else:
		# Exponential ramp up from wave 6
		# spawn_rate decreases (more enemies), HP increases aggressively
		var expo = float(wave - 5)
		settings.spawn_rate = max(0.5 * pow(0.85, expo), 0.05)
		settings.enemy_hp_multiplier = 2.25 + pow(1.2, expo)

	settings.enemy_damage_multiplier = 1.0 + (wave - 1) * 0.15
	settings.enemy_speed_multiplier = 1.0 + (wave - 1) * 0.02
	return settings


static func get_xp_required(level: int) -> int:
	return int(10 + level * 6 + pow(level, 1.2) * 3)
