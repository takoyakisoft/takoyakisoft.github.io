extends Node

var Enemy = preload("res://scenes/enemy/enemy.tscn")
var spawn_timer = 0.0
var spawn_rate = 1.0

const SPAWN_RATE_DECREASE = 0.01
const MIN_SPAWN_RATE = 0.2
const SPAWN_OFFSET = 50.0

@onready var player = $Player

func _process(delta):
	spawn_timer += delta
	if spawn_timer >= spawn_rate:
		spawn_timer = 0
		spawn_enemy()
		# Increase difficulty over time
		if spawn_rate > MIN_SPAWN_RATE:
			spawn_rate -= SPAWN_RATE_DECREASE

func spawn_enemy():
	if not is_instance_valid(player):
		return

	var enemy = Enemy.instantiate()
	var viewport_size = get_viewport().get_visible_rect().size
	var spawn_pos = Vector2.ZERO
	var center_pos = player.global_position

	# Spawn at random edge relative to player/camera
	# Calculate relative to camera top-left
	var top_left = center_pos - viewport_size / 2

	var side = randi() % 4
	match side:
		0: # Top
			spawn_pos = Vector2(randf_range(0, viewport_size.x), -SPAWN_OFFSET) + top_left
		1: # Bottom
			spawn_pos = Vector2(randf_range(0, viewport_size.x), viewport_size.y + SPAWN_OFFSET) + top_left
		2: # Left
			spawn_pos = Vector2(-SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left
		3: # Right
			spawn_pos = Vector2(viewport_size.x + SPAWN_OFFSET, randf_range(0, viewport_size.y)) + top_left

	enemy.position = spawn_pos
	add_child(enemy)
