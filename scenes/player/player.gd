extends CharacterBody2D

const SPEED = 200.0
var Bullet = preload("res://scenes/weapon/bullet.tscn")
var timer = 0.0
const FIRE_RATE = 0.5

func _physics_process(delta):
	var direction = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if direction:
		velocity = direction * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.y = move_toward(velocity.y, 0, SPEED)

	move_and_slide()

	# Auto fire
	timer += delta
	if timer >= FIRE_RATE:
		timer = 0
		fire_at_nearest_enemy()

func fire_at_nearest_enemy():
	var enemies = get_tree().get_nodes_in_group("enemy")
	var nearest_enemy = null
	var min_dist = INF

	for enemy in enemies:
		var dist = global_position.distance_to(enemy.global_position)
		if dist < min_dist:
			min_dist = dist
			nearest_enemy = enemy

	if nearest_enemy:
		var bullet = Bullet.instantiate()
		bullet.global_position = global_position
		bullet.direction = (nearest_enemy.global_position - global_position).normalized()
		get_parent().add_child(bullet)
