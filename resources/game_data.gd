extends Node
class_name GameData

const MAX_RELIC_SLOTS := 6
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
	"wipe_enemies": {
		"name": "殲滅コア",
		"description": "ボス以外の敵をすべて撃破",
		"color": Color("ffcf4a"),
	},
	"collect_xp": {
		"name": "収集ドローン",
		"description": "全ての経験値を取得",
		"color": Color("4ad9ff"),
	},
	"currency": {
		"name": "クレジット拾得",
		"description": "ゲーム内通貨 +50",
		"color": Color("9cff73"),
	},
}

const RELICS := {
	"pistol": {
		"name": "ピストル",
		"type": "weapon",
		"description": "近い敵へ自動射撃。威力と連射が伸びる。",
		"stats": {
			"damage": 6.0,
			"cooldown": 0.55,
			"bullets": 1,
			"crit": 0.05,
		},
		"per_level": {
			"damage": 1.6,
			"cooldown": -0.02,
			"crit": 0.01,
		},
	},
	"sword": {
		"name": "剣",
		"type": "weapon",
		"description": "周囲に斬撃を発生。範囲と威力が成長。",
		"stats": {
			"damage": 10.0,
			"cooldown": 1.4,
			"radius": 70.0,
			"duration": 0.25,
			"crit": 0.05,
		},
		"per_level": {
			"damage": 2.2,
			"cooldown": -0.03,
			"radius": 4.0,
			"duration": 0.01,
			"crit": 0.01,
		},
	},
	"magnet": {
		"name": "マグネットコア",
		"type": "utility",
		"description": "経験値の回収半径が広がる。",
		"stats": {
			"pickup_bonus": 0.25,
		},
		"per_level": {
			"pickup_bonus": 0.15,
		},
	},
	"vitality": {
		"name": "バイタリティ",
		"type": "passive",
		"description": "最大HPとシールドを増加。",
		"stats": {
			"max_hp_bonus": 10.0,
		},
		"per_level": {
			"max_hp_bonus": 6.0,
		},
	},
	"momentum": {
		"name": "モメンタム",
		"type": "passive",
		"description": "移動速度が上昇。",
		"stats": {
			"move_speed_bonus": 12.0,
		},
		"per_level": {
			"move_speed_bonus": 6.0,
		},
	},
	"shield_core": {
		"name": "シールドコア",
		"type": "passive",
		"description": "シールド回復速度が上昇。",
		"stats": {
			"shield_regen": 2.0,
		},
		"per_level": {
			"shield_regen": 1.0,
		},
	},
	"aegis": {
		"name": "エギスフィールド",
		"type": "active",
		"description": "一定間隔で数秒間無敵化。",
		"stats": {
			"cooldown": 18.0,
			"invincibility_duration": 2.5,
		},
		"per_level": {
			"cooldown": -0.4,
			"invincibility_duration": 0.25,
		},
	},
}

const CHARACTERS := {
	"striker": {
		"name": "ストライカー",
		"description": "バランス型。剣+ピストルを装備。",
		"base_hp": 100.0,
		"base_speed": 220.0,
		"starting_relics": ["pistol", "sword"],
	},
	"gunner": {
		"name": "ガンナー",
		"description": "射撃特化。ピストル性能が高め。",
		"base_hp": 90.0,
		"base_speed": 230.0,
		"starting_relics": ["pistol", "pistol", "sword"],
	},
	"blade": {
		"name": "ブレード",
		"description": "近接強化。剣が強い。",
		"base_hp": 110.0,
		"base_speed": 210.0,
		"starting_relics": ["sword", "sword", "pistol"],
	},
}

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
		settings.spawn_rate = 999.0
		settings.enemy_hp_multiplier = 6.0
		settings.enemy_damage_multiplier = 3.0
		settings.enemy_speed_multiplier = 1.3
		settings.boss = true
		return settings
	if wave == 12:
		settings.spawn_enabled = false
		return settings
	if wave >= 13:
		settings.spawn_enabled = true
		settings.spawn_rate = 0.35
		settings.enemy_hp_multiplier = 4.0 + (wave - 13) * 0.4
		settings.enemy_damage_multiplier = 3.0 + (wave - 13) * 0.3
		settings.enemy_speed_multiplier = 1.4 + (wave - 13) * 0.05
		return settings

	settings.spawn_rate = max(0.8 - (wave - 1) * 0.05, 0.35)
	settings.enemy_hp_multiplier = 1.0 + (wave - 1) * 0.25
	settings.enemy_damage_multiplier = 1.0 + (wave - 1) * 0.15
	settings.enemy_speed_multiplier = 1.0 + (wave - 1) * 0.02
	return settings

static func get_xp_required(level: int) -> int:
	return int(10 + level * 6 + pow(level, 1.2) * 3)
