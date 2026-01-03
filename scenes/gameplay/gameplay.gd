extends Node

const SPAWN_OFFSET := 50.0
const ITEM_DROP_CHANCE := 0.08
const MAX_ITEM_DROP_CHANCE := 0.8

var Enemy = preload("res://scenes/enemy/enemy.tscn")
var XpGem = preload("res://scenes/pickups/xp_gem.tscn")
var ItemPickup = preload("res://scenes/pickups/item_pickup.tscn")
var DamageNumber = preload("res://scenes/ui/damage_number.tscn")

var spawn_timer := 0.0
var spawn_rate := 1.0
var time_elapsed := 0.0
var wave_index := 1
var wave_settings := {}
var boss_spawned := false
var boss_active := false
var boss_timer := 0.0
var stage_id := "forest"
var stage_data := {}

var relic_choice_ids: Array[String] = []
var pending_levelups := 0

var currency := 0
var minion_queue: Array = []

@onready var player := $Player
@onready var timer_label := $HUD/TimerLabel
@onready var stage_label := $HUD/StageLabel
@onready var boss_label := $HUD/BossLabel
@onready var levelup_layer := $HUD/LevelUpLayer
@onready var attack_relic_label := $HUD/RelicPanel/RelicScroll/RelicVBox/AttackRelicLabel
@onready var stat_relic_label := $HUD/RelicPanel/RelicScroll/RelicVBox/StatRelicLabel
@onready var option_buttons := [
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option1,
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option2,
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option3,
]
@onready var damage_numbers := $DamageNumbers
@onready var pickup_container := $PickupContainer


func _ready() -> void:
	$HUD.process_mode = Node.PROCESS_MODE_ALWAYS
	add_to_group("gameplay")
	_load_currency()
	var scene_data = GGT.get_current_scene_data()
	var character_id = scene_data.params.get("character_id", "gravecaller")
	stage_id = scene_data.params.get("stage_id", "forest")
	stage_data = GameData.get_stage_data(stage_id)
	var character = GameData.CHARACTERS.get(character_id, GameData.CHARACTERS["gravecaller"])
	player.initialize(character)
	player.leveled_up.connect(_on_player_leveled)
	for button in option_buttons:
		button.pressed.connect(_on_relic_option_pressed.bind(button))
	levelup_layer.visible = false
	wave_settings = GameData.get_wave_settings(wave_index)
	spawn_rate = wave_settings.spawn_rate
	_update_timer_label()
	_update_relic_hud()
	_update_stage_label()


func _process(delta: float) -> void:
	if get_tree().paused:
		return

	time_elapsed += delta
	_update_timer_label()
	_update_wave_state(delta)
	_spawn_enemies(delta)


func _update_wave_state(delta: float) -> void:
	if boss_active:
		boss_timer += delta
		if boss_timer >= 60.0:
			on_player_defeated()
		return

	var new_wave = GameData.get_wave_index(time_elapsed)
	if new_wave != wave_index:
		wave_index = new_wave
		wave_settings = GameData.get_wave_settings(wave_index)
		spawn_rate = wave_settings.spawn_rate
		boss_spawned = false
		boss_timer = 0.0

	if wave_index == 11 and not boss_spawned:
		_spawn_boss()
		boss_spawned = true
		boss_active = true


func _spawn_enemies(delta: float) -> void:
	if not wave_settings.get("spawn_enabled", true):
		return

	spawn_timer += delta
	if spawn_timer >= spawn_rate:
		spawn_timer = 0.0
		_spawn_enemy(false)


func _spawn_enemy(is_boss: bool, stats_override: Dictionary = {}) -> void:
	if not is_instance_valid(player):
		return
	var enemy = Enemy.instantiate()
	var viewport_size = get_viewport().get_visible_rect().size
	var center_pos = player.global_position
	var top_left = center_pos - viewport_size / 2
	var side = randi() % 4
	var spawn_pos := Vector2.ZERO
	match side:
		0:
			spawn_pos = Vector2(randf_range(0, viewport_size.x), -SPAWN_OFFSET) + top_left
		1:
			spawn_pos = (
				Vector2(randf_range(0, viewport_size.x), viewport_size.y + SPAWN_OFFSET) + top_left
			)
		2:
			spawn_pos = Vector2(-SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left
		3:
			spawn_pos = (
				Vector2(viewport_size.x + SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left
			)

	var stats = stats_override
	if stats.is_empty():
		stats = {
			"max_hp": 20.0 * wave_settings.enemy_hp_multiplier,
			"damage": 8.0 * wave_settings.enemy_damage_multiplier,
			"speed": 100.0 * wave_settings.enemy_speed_multiplier,
			"is_boss": is_boss,
		}
	else:
		# Ensure is_boss flag is set correctly even if override provided
		stats["is_boss"] = is_boss
	if not is_boss:
		var stage_hp = stage_data.get("enemy_hp_multiplier", 1.0)
		var stage_damage = stage_data.get("enemy_damage_multiplier", 1.0)
		var stage_speed = stage_data.get("enemy_speed_multiplier", 1.0)
		stats["max_hp"] *= stage_hp
		stats["damage"] *= stage_damage
		stats["speed"] *= stage_speed
		if stage_data.has("enemy_tint") and not stats.has("tint"):
			stats["tint"] = stage_data["enemy_tint"]

	enemy.setup(stats)
	enemy.position = spawn_pos
	add_child(enemy)


func _spawn_boss() -> void:
	# Define Boss specifically
	var boss_stats = {
		"max_hp": 20.0 * 50.0,
		"damage": 8.0 * 6.0,
		"speed": 100.0 * 1.3,
	}
	boss_stats["max_hp"] *= stage_data.get("boss_hp_multiplier", 1.0)
	boss_stats["damage"] *= stage_data.get("boss_damage_multiplier", 1.0)
	boss_stats["speed"] *= stage_data.get("boss_speed_multiplier", 1.0)
	if stage_data.has("boss_tint"):
		boss_stats["tint"] = stage_data["boss_tint"]
	_spawn_enemy(true, boss_stats)


func on_enemy_defeated(position: Vector2, was_boss: bool, enemy: Node = null) -> void:
	_spawn_xp_gem(position)
	if not was_boss:
		var drop_chance = ITEM_DROP_CHANCE
		if is_instance_valid(player):
			drop_chance += player.item_drop_bonus
			if enemy and enemy.has_method("is_tentacle_marked") and enemy.is_tentacle_marked():
				if not player.tentacle_stats.is_empty():
					drop_chance += player.tentacle_stats.get("tentacle_drop_bonus", 0.0)
		drop_chance = min(drop_chance, MAX_ITEM_DROP_CHANCE)
		if randf() < drop_chance:
			_spawn_item_drop(position)
		if is_instance_valid(player) and not player.minion_stats.is_empty():
			_spawn_minion(position, player.minion_stats)
	if was_boss:
		boss_timer = 0.0
		boss_active = false


func _spawn_xp_gem(position: Vector2) -> void:
	var gem_data = GameData.get_random_gem_type()
	var gem = XpGem.instantiate()
	gem.global_position = position
	gem.setup(gem_data.value, gem_data.color)
	pickup_container.call_deferred("add_child", gem)


func _spawn_item_drop(position: Vector2) -> void:
	var keys = GameData.ITEM_TYPES.keys()
	var item_key = keys[randi() % keys.size()]
	var data = GameData.ITEM_TYPES[item_key]
	var item = ItemPickup.instantiate()
	item.global_position = position
	item.setup(item_key, data.name, data.color)
	pickup_container.call_deferred("add_child", item)


func _spawn_minion(position: Vector2, stats: Dictionary) -> void:
	var cap = int(round(stats.get("minion_cap", 3.0)))
	cap = max(cap, 1)
	while minion_queue.size() >= cap:
		var oldest = minion_queue.pop_front()
		if is_instance_valid(oldest):
			oldest.queue_free()
	var minion = Enemy.instantiate()
	minion.global_position = position
	if minion.has_method("setup_minion"):
		minion.setup_minion(stats)
	call_deferred("add_child", minion)
	minion_queue.append(minion)


func apply_item_effect(item_type: String) -> void:
	match item_type:
		"wipe_enemies":
			for enemy in get_tree().get_nodes_in_group("enemy"):
				if is_instance_valid(enemy) and not enemy.get("is_boss"):
					if enemy.has_method("apply_damage"):
						enemy.apply_damage(9999)
		"collect_xp":
			for gem in get_tree().get_nodes_in_group("xp_gem"):
				if is_instance_valid(gem):
					player.gain_xp(gem.value)
					gem.queue_free()
		"currency":
			currency += 50
			_save_currency()


func spawn_damage_number(world_position: Vector2, amount: float, is_player: bool) -> void:
	var dmg = DamageNumber.instantiate()
	dmg.global_position = world_position
	dmg.setup(amount, is_player)
	damage_numbers.add_child(dmg)


func _on_player_leveled() -> void:
	pending_levelups += 1
	if not get_tree().paused:
		_show_levelup_choices()


func _show_levelup_choices() -> void:
	if pending_levelups <= 0:
		return
	pending_levelups -= 1
	get_tree().paused = true
	levelup_layer.visible = true
	relic_choice_ids = _build_relic_choices()
	for i in range(option_buttons.size()):
		var button = option_buttons[i]
		if i < relic_choice_ids.size():
			button.visible = true
			button.text = _format_relic_choice(relic_choice_ids[i])
		else:
			button.visible = false


func _build_relic_choices() -> Array[String]:
	var options: Array[String] = []
	var candidates: Array[String] = []
	for relic_id in GameData.RELICS.keys():
		var level = player.relics.get(relic_id, 0)
		if level < GameData.MAX_RELIC_LEVEL:
			if player.relics.has(relic_id) or player.can_add_relic(relic_id):
				candidates.append(relic_id)

	candidates.shuffle()
	for relic_id in candidates:
		options.append(relic_id)
		if options.size() >= 3:
			break

	if options.is_empty():
		options = ["heal_full", "currency_bonus"]
	return options


func _format_relic_choice(relic_id: String) -> String:
	if relic_id == "heal_full":
		return "HP全回復"
	if relic_id == "currency_bonus":
		return "ゲーム内通貨 +50"

	var relic = GameData.RELICS[relic_id]
	var current_level = player.relics.get(relic_id, 0)
	var next_level = min(current_level + 1, GameData.MAX_RELIC_LEVEL)
	var relic_name = relic.name
	var desc = relic.description
	var per_level = relic.per_level
	var lines = ["%s Lv%d→Lv%d" % [relic_name, current_level, next_level], desc]
	var stats_line := []
	for key in per_level.keys():
		stats_line.append(
			"%s %s" % [_format_stat_key(key), _format_stat_value(key, per_level[key])]
		)
	if not stats_line.is_empty():
		lines.append("+" + ", ".join(stats_line))
	return "\n".join(lines)


func _format_stat_key(key: String) -> String:
	var labels = {
		"damage": "威力",
		"cooldown": "CD",
		"radius": "範囲",
		"duration": "効果時間",
		"bullets": "弾数",
		"crit": "クリ率",
		"pickup_bonus": "回収範囲",
		"move_speed_bonus": "移動速度",
		"max_hp_bonus": "最大HP",
		"shield_regen": "シールド再生",
		"invincibility_duration": "無敵時間",
		"gravity_radius": "引力範囲",
		"orbit_radius": "軌道半径",
		"orbit_duration": "軌道時間",
		"orbit_speed": "軌道速度",
		"fling_speed": "吹き飛ばし",
		"fling_damage": "衝突威力",
		"virus_chance": "感染率",
		"virus_damage": "感染威力",
		"virus_radius": "感染範囲",
		"virus_chain": "連鎖",
		"virus_tick": "感染間隔",
		"virus_duration": "感染時間",
		"minion_chance": "使役率",
		"minion_damage": "使役威力",
		"minion_speed": "使役速度",
		"minion_duration": "使役時間",
		"minion_hp": "使役HP",
		"minion_cap": "使役上限",
		"item_drop_bonus": "ドロ率",
		"tentacle_stun": "停止時間",
		"tentacle_mark_duration": "印時間",
		"tentacle_drop_bonus": "撃破ドロ率",
	}
	return labels.get(key, key)


func _format_stat_value(key: String, value: float) -> String:
	if key in ["cooldown"]:
		return "%.2fs" % value
	if (
		key
		in [
			"virus_tick",
			"virus_duration",
			"minion_duration",
			"tentacle_stun",
			"tentacle_mark_duration",
			"orbit_duration"
		]
	):
		return "%.2fs" % value
	if key in ["crit"]:
		var percent = int(value * 100)
		return "%d%%" % percent
	if key in ["virus_chance", "minion_chance", "item_drop_bonus", "tentacle_drop_bonus"]:
		var percent = int(value * 100)
		return "%d%%" % percent
	if key in ["minion_cap"]:
		return "%d" % int(round(value))
	return "%s" % str(value)


func _on_relic_option_pressed(button: Button) -> void:
	var index = option_buttons.find(button)
	if index == -1:
		return
	if index >= relic_choice_ids.size():
		return
	var relic_id = relic_choice_ids[index]
	_apply_relic_choice(relic_id)
	levelup_layer.visible = false
	get_tree().paused = false
	_update_relic_hud()
	if pending_levelups > 0:
		_show_levelup_choices()


func _apply_relic_choice(relic_id: String) -> void:
	match relic_id:
		"heal_full":
			player.heal_full()
		"currency_bonus":
			currency += 50
			_save_currency()
		_:
			player.add_relic(relic_id)
	_update_relic_hud()


func _update_timer_label() -> void:
	var total_seconds = int(time_elapsed)
	var minutes = int(total_seconds / 60.0)
	var seconds = total_seconds % 60
	timer_label.text = "%02d:%02d" % [minutes, seconds]
	_update_boss_label()


func _update_stage_label() -> void:
	if stage_data.is_empty():
		stage_label.text = "ステージ: -"
		return
	stage_label.text = "ステージ: %s" % stage_data.get("name", stage_id)


func _update_boss_label() -> void:
	var boss_time = 300.0
	if time_elapsed < boss_time:
		var remaining = int(boss_time - time_elapsed)
		var minutes = int(remaining / 60.0)
		var seconds = remaining % 60
		boss_label.text = "ボス出現まで %02d:%02d" % [minutes, seconds]
	elif boss_active:
		boss_label.text = "ボス出現中"
	else:
		boss_label.text = ""


func _update_relic_hud() -> void:
	if not is_instance_valid(player):
		return
	attack_relic_label.text = _build_relic_label("attack", "攻撃レリック", GameData.MAX_ATTACK_RELICS)
	stat_relic_label.text = _build_relic_label("stat", "ステータスレリック", GameData.MAX_STAT_RELICS)


func _build_relic_label(category: String, title: String, cap: int) -> String:
	var entries: Array[String] = []
	for relic_id in player.relics.keys():
		var relic = GameData.RELICS.get(relic_id, {})
		if relic.get("category", "stat") != category:
			continue
		var relic_name = relic.get("name", relic_id)
		var level = player.relics[relic_id]
		entries.append("%s Lv%d" % [relic_name, level])
	entries.sort()
	var header = "%s %d/%d" % [title, entries.size(), cap]
	if entries.is_empty():
		return header + "\n-"
	return header + "\n" + "\n".join(entries)


func on_player_defeated() -> void:
	GGT.restart_scene()


func _load_currency() -> void:
	var config = ConfigFile.new()
	if config.load("user://save.cfg") == OK:
		currency = int(config.get_value("player", "currency", 0))


func _save_currency() -> void:
	var config = ConfigFile.new()
	config.load("user://save.cfg")
	config.set_value("player", "currency", currency)
	config.save("user://save.cfg")
