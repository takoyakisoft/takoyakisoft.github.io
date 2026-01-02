extends Node

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
var boss_timer := 0.0

var relic_choice_ids: Array[String] = []
var pending_levelups := 0

var currency := 0

const SPAWN_OFFSET := 50.0
const ITEM_DROP_CHANCE := 0.08

@onready var player := $Player
@onready var timer_label := $HUD/TimerLabel
@onready var levelup_layer := $HUD/LevelUpLayer
@onready var option_buttons := [
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option1,
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option2,
	$HUD/LevelUpLayer/Panel/VBoxContainer/Options/Option3,
]
@onready var damage_numbers := $DamageNumbers
@onready var pickup_container := $PickupContainer

func _ready() -> void:
	add_to_group("gameplay")
	load_currency()
	var scene_data = GGT.get_current_scene_data()
	var character_id = scene_data.params.get("character_id", "striker")
	var character = GameData.CHARACTERS.get(character_id, GameData.CHARACTERS["striker"])
	player.initialize(character)
	player.leveled_up.connect(_on_player_leveled)
	for button in option_buttons:
		button.pressed.connect(_on_relic_option_pressed.bind(button))
	levelup_layer.visible = false
	wave_settings = GameData.get_wave_settings(wave_index)
	spawn_rate = wave_settings.spawn_rate
	update_timer_label()

func _process(delta: float) -> void:
	if get_tree().paused:
		return

	time_elapsed += delta
	update_timer_label()
	update_wave_state(delta)
	spawn_enemies(delta)

func update_wave_state(delta: float) -> void:
	var new_wave = GameData.get_wave_index(time_elapsed)
	if new_wave != wave_index:
		wave_index = new_wave
		wave_settings = GameData.get_wave_settings(wave_index)
		spawn_rate = wave_settings.spawn_rate
		boss_spawned = false
		boss_timer = 0.0

	if wave_index == 11:
		if not boss_spawned:
			spawn_boss()
			boss_spawned = true
		boss_timer += delta
		if boss_timer >= 60.0:
			on_player_defeated()

func spawn_enemies(delta: float) -> void:
	if not wave_settings.get("spawn_enabled", true):
		return
	if wave_settings.get("boss", false):
		return

	spawn_timer += delta
	if spawn_timer >= spawn_rate:
		spawn_timer = 0.0
		spawn_enemy(false)

func spawn_enemy(is_boss: bool) -> void:
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
			spawn_pos = Vector2(randf_range(0, viewport_size.x), viewport_size.y + SPAWN_OFFSET) + top_left
		2:
			spawn_pos = Vector2(-SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left
		3:
			spawn_pos = Vector2(viewport_size.x + SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left

	var stats = {
		"max_hp": 20.0 * wave_settings.enemy_hp_multiplier,
		"damage": 8.0 * wave_settings.enemy_damage_multiplier,
		"speed": 100.0 * wave_settings.enemy_speed_multiplier,
		"is_boss": is_boss,
	}
	enemy.setup(stats)
	enemy.position = spawn_pos
	add_child(enemy)

func spawn_boss() -> void:
	var boss_settings = GameData.get_wave_settings(11)
	wave_settings = boss_settings
	spawn_rate = boss_settings.spawn_rate
	spawn_enemy(true)

func on_enemy_defeated(position: Vector2, was_boss: bool) -> void:
	spawn_xp_gem(position)
	if not was_boss and randf() < ITEM_DROP_CHANCE:
		spawn_item_drop(position)
	if was_boss:
		boss_timer = 0.0

func spawn_xp_gem(position: Vector2) -> void:
	var gem_data = GameData.get_random_gem_type()
	var gem = XpGem.instantiate()
	gem.global_position = position
	gem.setup(gem_data.value, gem_data.color)
	pickup_container.add_child(gem)

func spawn_item_drop(position: Vector2) -> void:
	var keys = GameData.ITEM_TYPES.keys()
	var item_key = keys[randi() % keys.size()]
	var data = GameData.ITEM_TYPES[item_key]
	var item = ItemPickup.instantiate()
	item.global_position = position
	item.setup(item_key, data.name, data.color)
	pickup_container.add_child(item)

func apply_item_effect(item_type: String) -> void:
		match item_type:
			"wipe_enemies":
				for enemy in get_tree().get_nodes_in_group("enemy"):
					if enemy and not enemy.is_boss:
						enemy.apply_damage(9999)
			"collect_xp":
				for gem in get_tree().get_nodes_in_group("xp_gem"):
					if is_instance_valid(gem):
						player.gain_xp(gem.value)
						gem.queue_free()
			"currency":
				currency += 50
				save_currency()

func spawn_damage_number(world_position: Vector2, amount: float, is_player: bool) -> void:
	var dmg = DamageNumber.instantiate()
	dmg.global_position = world_position
	dmg.setup(amount, is_player)
	damage_numbers.add_child(dmg)

func _on_player_leveled() -> void:
	pending_levelups += 1
	if not get_tree().paused:
		show_levelup_choices()

func show_levelup_choices() -> void:
	if pending_levelups <= 0:
		return
	pending_levelups -= 1
	get_tree().paused = true
	levelup_layer.visible = true
	relic_choice_ids = build_relic_choices()
	for i in range(option_buttons.size()):
		var button = option_buttons[i]
		if i < relic_choice_ids.size():
			button.visible = true
			button.text = format_relic_choice(relic_choice_ids[i])
		else:
			button.visible = false

func build_relic_choices() -> Array[String]:
	var options: Array[String] = []
	var candidates: Array[String] = []
	for relic_id in GameData.RELICS.keys():
		var level = player.relics.get(relic_id, 0)
		if level < GameData.MAX_RELIC_LEVEL:
			if player.relics.has(relic_id) or player.relics.size() < GameData.MAX_RELIC_SLOTS:
				candidates.append(relic_id)

	candidates.shuffle()
	for relic_id in candidates:
		options.append(relic_id)
		if options.size() >= 3:
			break

	if options.is_empty():
		options = ["heal_full", "currency_bonus", "heal_full"]
	return options

func format_relic_choice(relic_id: String) -> String:
	if relic_id == "heal_full":
		return "HP全回復"
	if relic_id == "currency_bonus":
		return "ゲーム内通貨 +50"

	var relic = GameData.RELICS[relic_id]
	var current_level = player.relics.get(relic_id, 0)
	var next_level = min(current_level + 1, GameData.MAX_RELIC_LEVEL)
	var name = relic.name
	var desc = relic.description
	var per_level = relic.per_level
	var lines = ["%s Lv%d→Lv%d" % [name, current_level, next_level], desc]
	var stats_line := []
	for key in per_level.keys():
		stats_line.append("%s %s" % [format_stat_key(key), format_stat_value(key, per_level[key])])
	if not stats_line.is_empty():
		lines.append("+" + ", ".join(stats_line))
	return "\n".join(lines)

func format_stat_key(key: String) -> String:
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
	}
	return labels.get(key, key)

func format_stat_value(key: String, value: float) -> String:
	if key in ["cooldown"]:
		return "%.2fs" % value
	if key in ["crit"]:
		var percent = int(value * 100)
		return "%d%%" % percent
	return "%s" % str(value)

func _on_relic_option_pressed(button: Button) -> void:
	var index = option_buttons.find(button)
	if index == -1:
		return
	if index >= relic_choice_ids.size():
		return
	var relic_id = relic_choice_ids[index]
	apply_relic_choice(relic_id)
	levelup_layer.visible = false
	get_tree().paused = false
	if pending_levelups > 0:
		show_levelup_choices()

func apply_relic_choice(relic_id: String) -> void:
	match relic_id:
		"heal_full":
			player.heal_full()
		"currency_bonus":
			currency += 50
			save_currency()
		_:
			player.add_relic(relic_id)

func update_timer_label() -> void:
	var total_seconds = int(time_elapsed)
	var minutes = total_seconds / 60
	var seconds = total_seconds % 60
	timer_label.text = "%02d:%02d" % [minutes, seconds]

func on_player_defeated() -> void:
	GGT.restart_scene()

func load_currency() -> void:
	var config = ConfigFile.new()
	if config.load("user://save.cfg") == OK:
		currency = int(config.get_value("player", "currency", 0))

func save_currency() -> void:
	var config = ConfigFile.new()
	config.set_value("player", "currency", currency)
	config.save("user://save.cfg")
