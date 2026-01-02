extends Node

var Enemy = preload("res://scenes/enemy/enemy.tscn")
var timer = 0.0
var spawn_rate = 1.0

func _process(delta):
	timer += delta
	if timer >= spawn_rate:
		timer = 0
		spawn_enemy()
		# Increase difficulty over time
		if spawn_rate > 0.2:
			spawn_rate -= 0.01

func spawn_enemy():
	var enemy = Enemy.instantiate()
	var screen_size = get_viewport().get_visible_rect().size
	var spawn_pos = Vector2.ZERO

	# Spawn at random edge
	var side = randi() % 4
	match side:
		0: # Top
			spawn_pos = Vector2(randf_range(0, screen_size.x), -50)
		1: # Bottom
			spawn_pos = Vector2(randf_range(0, screen_size.x), screen_size.y + 50)
		2: # Left
			spawn_pos = Vector2(-50, randf_range(0, screen_size.y))
		3: # Right
			spawn_pos = Vector2(screen_size.x + 50, randf_range(0, screen_size.y))

	enemy.position = spawn_pos
	add_child(enemy)
